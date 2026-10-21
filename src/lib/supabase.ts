export type AppRole = "admin" | "customer";

export interface AppProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  organization_id: string | null;
  active: boolean;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email: string; user_metadata?: Record<string, unknown> };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const sessionKey = "nexora.supabase.session.v1";
const recoveryKey = "nexora.supabase.password-recovery.v1";

export const supabaseConfigured = Boolean(supabaseUrl && publishableKey);

function requireConfiguration() {
  if (!supabaseConfigured) {
    throw new Error("Supabase är inte konfigurerat. Lägg till URL och anon-nyckel i .env.local.");
  }
}

async function responseData<T>(response: Response): Promise<T> {
  const body = await response.text();
  const data = body ? (JSON.parse(body) as Record<string, unknown>) : {};
  if (!response.ok) {
    const message = String(data.message ?? data.msg ?? data.error_description ?? data.error ?? "Begäran misslyckades.");
    throw new Error(message);
  }
  return data as T;
}

function storeSession(value: Record<string, unknown>, remember = true) {
  const user = value.user as SupabaseSession["user"] | undefined;
  const accessToken = String(value.access_token ?? "");
  const refreshToken = String(value.refresh_token ?? "");
  if (!accessToken || !refreshToken || !user?.id) return null;
  const session: SupabaseSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Number(value.expires_at ?? Math.floor(Date.now() / 1000) + Number(value.expires_in ?? 3600)),
    user,
  };
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  storage.setItem(sessionKey, JSON.stringify(session));
  otherStorage.removeItem(sessionKey);
  return session;
}

function readSession(): SupabaseSession | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hashAccessToken = hash.get("access_token");
  const hashRefreshToken = hash.get("refresh_token");
  if (hashAccessToken && hashRefreshToken) {
    const isRecovery = hash.get("type") === "recovery";
    if (isRecovery) window.sessionStorage.setItem(recoveryKey, "1");
    const session = storeSession({
      access_token: hashAccessToken,
      refresh_token: hashRefreshToken,
      expires_in: Number(hash.get("expires_in") ?? 3600),
      user: { id: "pending", email: "" },
    }, !isRecovery);
    if (session) window.history.replaceState({}, "", window.location.pathname + window.location.search);
  }
  try {
    const value = window.localStorage.getItem(sessionKey) ?? window.sessionStorage.getItem(sessionKey);
    return value ? (JSON.parse(value) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  window.localStorage.removeItem(sessionKey);
  window.sessionStorage.removeItem(sessionKey);
  window.sessionStorage.removeItem(recoveryKey);
}

export function passwordRecoveryPending() {
  return window.sessionStorage.getItem(recoveryKey) === "1" || new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "recovery";
}

async function authRequest<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  requireConfiguration();
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return responseData<T>(response);
}

async function freshSession() {
  requireConfiguration();
  const current = readSession();
  if (!current) throw new Error("Din session har gått ut. Logga in igen.");
  if (current.expires_at > Math.floor(Date.now() / 1000) + 60) return current;

  const refreshed = await authRequest<Record<string, unknown>>("token?grant_type=refresh_token", {
    refresh_token: current.refresh_token,
  });
  const session = storeSession(refreshed, window.localStorage.getItem(sessionKey) !== null);
  if (!session) {
    clearSession();
    throw new Error("Sessionen kunde inte förnyas. Logga in igen.");
  }
  return session;
}

export async function signIn(email: string, password: string, remember = true) {
  const data = await authRequest<Record<string, unknown>>("token?grant_type=password", { email, password });
  const session = storeSession(data, remember);
  if (!session) throw new Error("Inloggningen gav ingen giltig session.");
  return session;
}

export async function signUp(fullName: string, email: string, password: string) {
  const data = await authRequest<Record<string, unknown>>("signup", {
    email,
    password,
    data: { full_name: fullName },
  });
  const session = storeSession(data);
  return { session, user: data.user as SupabaseSession["user"] | undefined };
}

export async function sendPasswordReset(email: string) {
  await authRequest("recover", { email, redirect_to: `${window.location.origin}/inloggning` });
}

export async function updatePassword(password: string) {
  const session = await freshSession();
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  await responseData(response);
  window.sessionStorage.removeItem(recoveryKey);
}

export async function signOut() {
  const current = readSession();
  try {
    if (current?.access_token) await authRequest("logout", {}, current.access_token);
  } finally {
    clearSession();
  }
}

export async function restoreProfile(): Promise<{ session: SupabaseSession; profile: AppProfile } | null> {
  const session = readSession();
  if (!session) return null;
  try {
    const fresh = await freshSession();
    const user = await authRequest<{ id: string; email: string }>("user", undefined, fresh.access_token);
    const profiles = await restRequest<AppProfile[]>(`profiles?id=eq.${encodeURIComponent(user.id)}&select=*`, fresh);
    const profile = profiles[0];
    if (!profile?.active) {
      clearSession();
      return null;
    }
    const latest = { ...fresh, user: { ...fresh.user, id: user.id, email: user.email } };
    const remember = window.localStorage.getItem(sessionKey) !== null;
    storeSession(latest, remember);
    return { session: latest, profile };
  } catch {
    clearSession();
    return null;
  }
}

async function restRequest<T>(path: string, session: SupabaseSession, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return responseData<T>(response);
}

export async function selectRows<T>(table: string, query = "select=*&order=created_at.desc") {
  const session = await freshSession();
  return restRequest<T[]>(`${table}?${query}`, session);
}

export async function insertRow<T>(table: string, value: unknown) {
  const session = await freshSession();
  const rows = await restRequest<T[]>(table, session, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });
  if (!rows[0]) throw new Error("Posten sparades inte.");
  return rows[0];
}

export async function updateRow<T>(table: string, id: string, value: unknown, idColumn = "id") {
  const session = await freshSession();
  const rows = await restRequest<T[]>(`${table}?${idColumn}=eq.${encodeURIComponent(id)}`, session, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });
  return rows[0];
}

export async function deleteRow(table: string, id: string, idColumn = "id") {
  const session = await freshSession();
  await restRequest(`${table}?${idColumn}=eq.${encodeURIComponent(id)}`, session, { method: "DELETE" });
}

export async function uploadCandidateFile(organizationId: string, candidateId: string, file: File) {
  const session = await freshSession();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${organizationId}/${candidateId}/${safeName}`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/candidate-cvs/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  });
  await responseData<Record<string, unknown>>(response);
  return path;
}

export async function signedCandidateFileUrl(path: string) {
  const session = await freshSession();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/candidate-cvs/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  const result = await responseData<{ signedURL: string }>(response);
  return result.signedURL.startsWith("http") ? result.signedURL : `${supabaseUrl}/storage/v1${result.signedURL}`;
}

export async function assessCandidateCv(candidateId: string, cvText: string) {
  const session = await freshSession();
  const response = await fetch(`${supabaseUrl}/functions/v1/assess-cv`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ candidate_id: candidateId, cv_text: cvText }),
  });
  return responseData<CvAssessment>(response);
}

export interface CvAssessment {
  summary: string;
  relevant_evidence: string[];
  information_to_clarify: string[];
  interview_questions: string[];
  disclaimer: string;
}
