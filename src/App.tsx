import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AppShell, type WorkspaceOrganization } from "./components/layout/app-shell";
import { Icon } from "./components/layout/icon";
import {
  assessCandidateCv,
  deleteRow,
  passwordRecoveryPending,
  insertRow,
  restoreProfile,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
  signedCandidateFileUrl,
  selectRows,
  demoMode,
  supabaseConfigured,
  updateRow,
  updatePassword,
  uploadCandidateFile,
  type AppProfile,
  type CvAssessment,
} from "./lib/supabase";

type Stage = "new" | "screening" | "interview" | "offer" | "rejected";
type JobStatus = "active" | "closed";

interface Candidate {
  id: string;
  organizationId: string;
  applicationId?: string;
  cvPath?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string;
  jobId: string;
  stage: Stage;
  addedAt: string;
  cvName: string;
}

interface Job {
  id: string;
  organizationId: string;
  title: string;
  city: string;
  workArrangement: string;
  employmentType: string;
  department: string;
  description: string;
  status: JobStatus;
  createdAt: string;
}

interface Account {
  id: string;
  name: string;
  email: string;
  role: "Kund" | "Administratör";
  organizationId: string | null;
  active: boolean;
  isInvitation?: boolean;
}

interface SignedInUser {
  id: string;
  email: string;
  name: string;
  role: "Kund" | "Administratör";
  organizationId: string | null;
}

const stageOrder: Stage[] = ["new", "screening", "interview", "offer", "rejected"];
const stageLabels: Record<Stage, string> = {
  new: "Ny",
  screening: "Granskning",
  interview: "Intervju",
  offer: "Erbjudande",
  rejected: "Avböjd",
};

const initialJobs: Job[] = [
  {
    id: "frontend",
    organizationId: "nexora",
    title: "Frontendutvecklare",
    city: "Stockholm",
    workArrangement: "Hybrid",
    employmentType: "Heltid",
    department: "Produkt & utveckling",
    description: "Vi söker en nyfiken frontendutvecklare som vill skapa användarvänliga digitala produkter. Du arbetar nära vårt produktteam med React, TypeScript och tillgänglighet.",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "ux",
    organizationId: "nexora",
    title: "UX-designer",
    city: "Stockholm",
    workArrangement: "Hybrid",
    employmentType: "Heltid",
    department: "Design",
    description: "Forma nästa generations digitala upplevelser. Vi söker dig som kombinerar användarinsikter med genomtänkt design och vill utveckla vårt designsystem.",
    status: "active",
    createdAt: "2026-10-03",
  },
  {
    id: "account",
    organizationId: "nexora",
    title: "Kundansvarig",
    city: "Göteborg",
    workArrangement: "På plats",
    employmentType: "Heltid",
    department: "Försäljning",
    description: "Bygg långsiktiga kundrelationer och hjälp svenska företag att växa med våra produkter. Du får ett engagerat team och stort eget ansvar.",
    status: "active",
    createdAt: "2026-10-04",
  },
  {
    id: "product",
    organizationId: "nexora",
    title: "Produktdesigner",
    city: "Malmö",
    workArrangement: "Hybrid",
    employmentType: "Heltid",
    department: "Produkt & utveckling",
    description: "Hjälp oss att skapa tydliga och tillgängliga produktupplevelser.",
    status: "closed",
    createdAt: "2026-09-19",
  },
];

function makeCandidate(
  id: string,
  name: string,
  role: string,
  city: string,
  stage: Stage,
  addedAt: string,
  jobId: string,
  cvName = "",
  organizationId = "nexora",
): Candidate {
  const slug = id.replace(/-/g, ".");
  return {
    id,
    organizationId,
    name,
    role,
    email: slug + "@exempel.se",
    phone: "070-234 10 42",
    city,
    linkedin: "https://www.linkedin.com/in/" + id,
    summary: name + " är engagerad och lösningsorienterad med erfarenhet av att utveckla användarvänliga digitala produkter. Trivs i tvärfunktionella team och brinner för kvalitet, samarbete och kontinuerligt lärande.",
    skills: role === "Frontendutvecklare"
      ? ["React", "TypeScript", "CSS", "Tillgänglighet"]
      : role === "UX-designer"
        ? ["UX research", "Figma", "Prototyping", "Designsystem"]
        : ["Kundrelationer", "Kommunikation", "Försäljning"],
    experience: [
      "2022–2026 · " + role + " i ett tvärfunktionellt produktteam",
      "2019–2022 · Produktutveckling i ett mindre digitalteam",
    ],
    education: "Kandidatexamen · Göteborgs universitet",
    jobId,
    stage,
    addedAt,
    cvName,
  };
}

const initialCandidates: Candidate[] = [
  makeCandidate("elin-andersson", "Elin Andersson", "Frontendutvecklare", "Göteborg", "new", "2026-10-04", "frontend", "Elin_Andersson_CV.pdf"),
  makeCandidate("hugo-berg", "Hugo Berg", "Frontendutvecklare", "Stockholm", "new", "2026-10-09", "frontend", "Hugo_Berg_CV.pdf"),
  makeCandidate("sofia-ek", "Sofia Ek", "UX-designer", "Göteborg", "new", "2026-10-10", "ux", ""),
  makeCandidate("noah-holm", "Noah Holm", "Kundansvarig", "Stockholm", "new", "2026-10-11", "account", ""),
  makeCandidate("maja-borg", "Maja Borg", "UX-designer", "Stockholm", "new", "2026-10-12", "ux", ""),
  makeCandidate("erik-johansson", "Erik Johansson", "Frontendutvecklare", "Stockholm", "screening", "2026-10-05", "frontend", "Erik_Johansson_CV.pdf"),
  makeCandidate("sara-lind", "Sara Lind", "UX-designer", "Stockholm", "screening", "2026-10-10", "ux", ""),
  makeCandidate("johan-karlsson", "Johan Karlsson", "Frontendutvecklare", "Göteborg", "screening", "2026-10-11", "frontend", ""),
  makeCandidate("nora-hall", "Nora Hall", "Kundansvarig", "Stockholm", "screening", "2026-10-12", "account", ""),
  makeCandidate("oscar-nilsson", "Oscar Nilsson", "UX-designer", "Stockholm", "interview", "2026-10-06", "ux", "Oscar_Nilsson_CV.pdf"),
  makeCandidate("mikael-sjoberg", "Mikael Sjöberg", "Frontendutvecklare", "Stockholm", "interview", "2026-10-11", "frontend", ""),
  makeCandidate("viktor-dahl", "Viktor Dahl", "Kundansvarig", "Stockholm", "interview", "2026-10-12", "account", ""),
  makeCandidate("amanda-berg", "Amanda Berg", "Frontendutvecklare", "Stockholm", "offer", "2026-10-07", "frontend", "Amanda_Berg_CV.pdf"),
  makeCandidate("emma-lindqvist", "Emma Lindqvist", "Kundansvarig", "Göteborg", "offer", "2026-10-08", "account", ""),
  makeCandidate("lisa-west", "Lisa West", "Kundansvarig", "Göteborg", "rejected", "2026-10-08", "account", ""),
];

const initialOrganizations: WorkspaceOrganization[] = [
  { id: "nexora", name: "Nexora", industry: "Rekrytering & talent", city: "Stockholm", active: true },
];

const initialAccounts: Account[] = [
  { id: "admin-demo", name: "Admin Nexora", email: "admin", role: "Administratör", organizationId: null, active: true },
  { id: "customer-demo", name: "Kund Nexora", email: "kund", role: "Kund", organizationId: "nexora", active: true },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readDemoUser(): SignedInUser | null {
  try {
    const saved = window.localStorage.getItem("nexora.demo-user.v2")
      ?? window.sessionStorage.getItem("nexora.demo-user.v2");
    if (!saved) return null;
    const stored = JSON.parse(saved) as Partial<SignedInUser>;
    const account = initialAccounts.find((item) => item.id === stored.id);
    if (!account) return null;
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      organizationId: account.organizationId,
    };
  } catch {
    return null;
  }
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => demoMode ? readStored(key, fallback) : fallback);
  useEffect(() => {
    if (!demoMode) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The app remains usable when browser storage is unavailable.
    }
  }, [key, value]);
  return [value, setValue] as const;
}

function todayIso() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const value = new Date(date + "T12:00:00");
  return new Intl.DateTimeFormat("sv-SE", options).format(value).replace(".", "");
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function makeId(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

type DbOrganization = { id: string; name: string; industry: string; city: string; active: boolean };
type DbJob = { id: string; organization_id: string; title: string; city: string; work_arrangement: string; employment_type: string; department: string; description: string; status: JobStatus; created_at: string };
type DbCandidate = { id: string; organization_id: string; name: string; email: string; phone: string; city: string; role_title: string; linkedin: string; summary: string; skills: string[]; experience: string[]; education: string; cv_name: string | null; cv_path: string | null; created_at: string };
type DbApplication = { id: string; candidate_id: string; job_id: string; status: Stage; created_at: string };
type DbInvitation = { id: string; email: string; full_name: string; role: "admin" | "customer"; organization_id: string | null; created_at: string };

function signedInUser(profile: AppProfile): SignedInUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name || profile.email,
    role: displayRole(profile.role),
    organizationId: profile.organization_id,
  };
}

function displayRole(role: AppProfile["role"]): "Kund" | "Administratör" {
  return role === "admin" ? "Administratör" : "Kund";
}

function applicationPathFromLocation() {
  const githubPagesPath = new URLSearchParams(window.location.search).get("p");
  if (githubPagesPath) {
    const route = githubPagesPath.split(/[?#]/, 1)[0] || "/";
    const safeRoute = route.startsWith("/") ? route : `/${route}`;
    const base = import.meta.env.BASE_URL;
    const url = base === "/" ? safeRoute : `${base}${safeRoute.replace(/^\/+/, "")}`;
    window.history.replaceState({}, "", url);
    return safeRoute;
  }

  const base = import.meta.env.BASE_URL;
  if (base !== "/" && window.location.pathname.startsWith(base)) {
    return `/${window.location.pathname.slice(base.length)}` || "/";
  }
  return window.location.pathname || "/";
}

function applicationPathUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return base === "/" ? path : `${base}${path.replace(/^\/+/, "")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Något gick fel. Försök igen.";
}

function App() {
  const [path, setPath] = useState(applicationPathFromLocation);
  const [candidates, setCandidates] = useStoredState("nexora.candidates.v2", initialCandidates);
  const [jobs, setJobs] = useStoredState("nexora.jobs.v2", initialJobs);
  const [organizations, setOrganizations] = useStoredState("nexora.organizations.v2", initialOrganizations);
  const [accounts, setAccounts] = useStoredState("nexora.accounts.v3", initialAccounts);
  const [organizationId, setOrganizationId] = useStoredState("nexora.active-organization.v2", "nexora");
  const [currentUser, setCurrentUser] = useState<SignedInUser | null>(() => demoMode ? readDemoUser() : null);
  const [authReady, setAuthReady] = useState(demoMode || !supabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    function syncPath() {
      setPath(applicationPathFromLocation());
    }
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (demoMode || !supabaseConfigured) return;
    let active = true;
    restoreProfile()
      .then(async (restored) => {
        if (!active) return;
        if (passwordRecoveryPending() || !restored) return;
        setCurrentUser(signedInUser(restored.profile));
        await hydrateWorkspace(restored.profile);
      })
      .catch((error: unknown) => {
        if (active) setAuthError(errorMessage(error));
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function navigate(nextPath: string) {
    const url = applicationPathUrl(nextPath);
    if (window.location.pathname !== url) window.history.pushState({}, "", url);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function hydrateWorkspace(profile: AppProfile) {
    const admin = profile.role === "admin";
    const [orgRows, jobRows, candidateRows, applicationRows, profileRows, invitationRows] = await Promise.all([
      selectRows<DbOrganization>("organizations"),
      selectRows<DbJob>("jobs"),
      selectRows<DbCandidate>("candidates"),
      selectRows<DbApplication>("applications"),
      selectRows<AppProfile>("profiles", admin ? "select=*&order=full_name.asc" : `select=*&id=eq.${encodeURIComponent(profile.id)}`),
      admin ? selectRows<DbInvitation>("user_invitations", "select=*&accepted_at=is.null&order=created_at.desc") : Promise.resolve([] as DbInvitation[]),
    ]);

    const nextOrganizations: WorkspaceOrganization[] = orgRows.map((organization) => ({
      id: organization.id,
      name: organization.name,
      industry: organization.industry,
      city: organization.city,
      active: organization.active,
    }));
    const nextJobs: Job[] = jobRows.map((job) => ({
      id: job.id,
      organizationId: job.organization_id,
      title: job.title,
      city: job.city,
      workArrangement: job.work_arrangement,
      employmentType: job.employment_type,
      department: job.department,
      description: job.description,
      status: job.status,
      createdAt: job.created_at,
    }));
    const nextCandidates: Candidate[] = candidateRows.map((candidate) => {
      const application = applicationRows.find((row) => row.candidate_id === candidate.id);
      return {
        id: candidate.id,
        organizationId: candidate.organization_id,
        applicationId: application?.id,
        cvPath: candidate.cv_path ?? undefined,
        name: candidate.name,
        role: candidate.role_title,
        email: candidate.email,
        phone: candidate.phone,
        city: candidate.city,
        linkedin: candidate.linkedin,
        summary: candidate.summary,
        skills: candidate.skills ?? [],
        experience: candidate.experience ?? [],
        education: candidate.education,
        jobId: application?.job_id ?? "",
        stage: application?.status ?? "new",
        addedAt: candidate.created_at.slice(0, 10),
        cvName: candidate.cv_name ?? "",
      };
    });
    const nextAccounts: Account[] = [
      ...profileRows.map((account) => ({
        id: account.id,
        name: account.full_name,
        email: account.email,
        role: displayRole(account.role),
        organizationId: account.organization_id,
        active: account.active,
      })),
      ...invitationRows.map((invitation) => ({
        id: invitation.id,
        name: invitation.full_name,
        email: invitation.email,
        role: displayRole(invitation.role),
        organizationId: invitation.organization_id,
        active: true,
        isInvitation: true,
      })),
    ];

    setOrganizations(nextOrganizations);
    setJobs(nextJobs);
    setCandidates(nextCandidates);
    setAccounts(nextAccounts);
    if (profile.role === "customer") setOrganizationId(profile.organization_id ?? "");
    else if (!nextOrganizations.some((organization) => organization.id === organizationId && organization.active)) {
      setOrganizationId(nextOrganizations.find((organization) => organization.active)?.id ?? "");
    }
  }

  function handleDemoLogin(role: "admin" | "customer") {
    if (!demoMode) return;
    const account = initialAccounts.find((item) => item.id === (role === "admin" ? "admin-demo" : "customer-demo"));
    if (!account) return;
    const user: SignedInUser = { id: account.id, email: account.email, name: account.name, role: account.role, organizationId: account.organizationId };
    setAuthError("");
    setAuthNotice("");
    setCurrentUser(user);
    window.localStorage.setItem("nexora.demo-user.v2", JSON.stringify(user));
    window.sessionStorage.removeItem("nexora.demo-user.v2");
    if (user.role === "Kund" && user.organizationId) setOrganizationId(user.organizationId);
    navigate("/");
  }

  async function handleLogin(email: string, password: string, remember = true) {
    setAuthError("");
    setAuthNotice("");
    if (demoMode) {
      const username = email.trim().toLowerCase();
      if (password !== "demo" || (username !== "admin" && username !== "kund")) {
        const message = "Ange admin eller kund och lösenordet demo, eller välj en av demoknapparna.";
        setAuthError(message);
        throw new Error(message);
      }
      handleDemoLogin(username === "admin" ? "admin" : "customer");
      return;
    }
    if (!supabaseConfigured) throw new Error("Supabase måste konfigureras innan inloggning kan användas.");

    try {
      await signIn(email, password, remember);
      const restored = await restoreProfile();
      if (!restored) throw new Error("Kontot kunde inte öppna någon Nexora-arbetsyta.");
      const user = signedInUser(restored.profile);
      setCurrentUser(user);
      await hydrateWorkspace(restored.profile);
      navigate("/");
    } catch (error) {
      setAuthError(errorMessage(error));
      throw error;
    }
  }

  async function handleSignup(fullName: string, email: string, password: string) {
    setAuthError("");
    setAuthNotice("");
    if (!supabaseConfigured) throw new Error("Kontoregistrering är inte tillgänglig i demoläget.");

    try {
      const result = await signUp(fullName.trim(), email.trim(), password);
      if (!result.session) {
        setAuthNotice("Kontot är registrerat. Bekräfta din e-postadress via länken vi skickade till dig.");
        return;
      }
      const restored = await restoreProfile();
      if (!restored) throw new Error("Kontot skapades, men profilen kunde inte läsas. Kontrollera att Supabase-migreringen är installerad.");
      setCurrentUser(signedInUser(restored.profile));
      await hydrateWorkspace(restored.profile);
      navigate("/");
    } catch (error) {
      setAuthError(errorMessage(error));
      throw error;
    }
  }

  async function handleForgotPassword(email: string) {
    setAuthError("");
    if (!supabaseConfigured) {
      const message = "Lösenordsåterställning är inte tillgänglig i demoläget.";
      setAuthError(message);
      throw new Error(message);
    }
    try {
      await sendPasswordReset(email.trim());
      setAuthNotice("Om e-postadressen finns registrerad skickas en länk för att återställa lösenordet.");
    } catch (error) {
      setAuthError(errorMessage(error));
      throw error;
    }
  }

  async function handlePasswordUpdate(password: string) {
    setAuthError("");
    setAuthNotice("");
    try {
      await updatePassword(password);
      const restored = await restoreProfile();
      if (!restored) throw new Error("Lösenordet uppdaterades, men sessionen kunde inte öppna arbetsytan. Logga in igen.");
      setCurrentUser(signedInUser(restored.profile));
      await hydrateWorkspace(restored.profile);
      navigate("/");
    } catch (error) {
      setAuthError(errorMessage(error));
      throw error;
    }
  }

  async function handleSignOut() {
    try {
      if (supabaseConfigured) await signOut();
      else {
        window.localStorage.removeItem("nexora.demo-user.v2");
        window.sessionStorage.removeItem("nexora.demo-user.v2");
      }
    } catch (error) {
      setToast(`Utloggningen kunde inte synkas med Supabase: ${errorMessage(error)}`);
    } finally {
      setCurrentUser(null);
      setAuthError("");
      setAuthNotice("");
      navigate("/inloggning");
    }
  }

  async function addCandidate(candidate: Candidate, cvFile?: File) {
    const scopedOrganization = currentUser?.role === "Administratör" ? organizationId : currentUser?.organizationId ?? "";
    try {
      if (supabaseConfigured) {
        const row = await insertRow<DbCandidate>("candidates", {
          organization_id: scopedOrganization,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          city: candidate.city,
          role_title: candidate.role,
          linkedin: candidate.linkedin,
          summary: candidate.summary,
          skills: candidate.skills,
          experience: candidate.experience,
          education: candidate.education,
          cv_name: cvFile?.name ?? null,
          created_by: currentUser?.id,
        });
        const application = await insertRow<DbApplication>("applications", {
          organization_id: scopedOrganization,
          candidate_id: row.id,
          job_id: candidate.jobId,
          status: "new",
          created_by: currentUser?.id,
        });
        let cvPath = "";
        if (cvFile) {
          cvPath = await uploadCandidateFile(scopedOrganization, row.id, cvFile);
          await updateRow<DbCandidate>("candidates", row.id, { cv_name: cvFile.name, cv_path: cvPath });
        }
        setCandidates((current) => [{ ...candidate, id: row.id, organizationId: scopedOrganization, applicationId: application.id, cvPath: cvPath || undefined, addedAt: row.created_at.slice(0, 10) }, ...current]);
      } else {
        setCandidates((current) => [{ ...candidate, organizationId: scopedOrganization }, ...current]);
      }
      setToast("Kandidaten har lagts till.");
      navigate("/");
    } catch (error) {
      setToast(`Kandidaten kunde inte sparas: ${errorMessage(error)}`);
    }
  }

  function updateCandidate(id: string, update: Partial<Candidate>) {
    setCandidates((current) => current.map((candidate) => candidate.id === id ? { ...candidate, ...update } : candidate));
    const candidate = candidates.find((item) => item.id === id);
    if (supabaseConfigured && candidate?.applicationId && update.stage) {
      updateRow("applications", candidate.applicationId, { status: update.stage })
        .catch((error: unknown) => setToast(`Status kunde inte sparas: ${errorMessage(error)}`));
    }
  }

  async function addJob(job: Job) {
    const scopedOrganization = currentUser?.role === "Administratör" ? organizationId : currentUser?.organizationId ?? "";
    try {
      if (supabaseConfigured) {
        const row = await insertRow<DbJob>("jobs", {
          organization_id: scopedOrganization,
          title: job.title,
          city: job.city,
          work_arrangement: job.workArrangement,
          employment_type: job.employmentType,
          department: job.department,
          description: job.description,
          status: "active",
          created_by: currentUser?.id,
        });
        setJobs((current) => [{ ...job, id: row.id, organizationId: scopedOrganization, createdAt: row.created_at }, ...current]);
      } else setJobs((current) => [{ ...job, organizationId: scopedOrganization }, ...current]);
      setToast("Jobbet har skapats.");
    } catch (error) {
      setToast(`Jobbet kunde inte sparas: ${errorMessage(error)}`);
    }
  }

  async function changeJobStatus(id: string, status: JobStatus) {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, status } : job));
    if (supabaseConfigured) {
      updateRow("jobs", id, { status }).catch((error: unknown) => setToast(`Jobbets status kunde inte sparas: ${errorMessage(error)}`));
    }
  }

  async function addOrganization(organization: WorkspaceOrganization) {
    try {
      if (supabaseConfigured) {
        const row = await insertRow<DbOrganization>("organizations", { name: organization.name, industry: organization.industry, city: organization.city, active: true });
        organization = { ...organization, id: row.id };
      }
      setOrganizations((current) => [...current, organization]);
      setOrganizationId(organization.id);
      setToast("Kundorganisationen har skapats.");
    } catch (error) {
      setToast(`Kundorganisationen kunde inte sparas: ${errorMessage(error)}`);
    }
  }

  async function addAccount(account: Account) {
    try {
      if (supabaseConfigured) {
        const row = await insertRow<DbInvitation>("user_invitations", {
          email: account.email.trim().toLowerCase(),
          full_name: account.name.trim(),
          role: account.role === "Administratör" ? "admin" : "customer",
          organization_id: account.role === "Administratör" ? null : account.organizationId,
          created_by: currentUser?.id,
        });
        account = { ...account, id: row.id, organizationId: row.organization_id, isInvitation: true };
      }
      setAccounts((current) => [...current, account]);
      setToast("Inbjudan har skapats. Personen kan nu registrera sig med sin e-postadress.");
    } catch (error) {
      setToast(`Kontot kunde inte skapas: ${errorMessage(error)}`);
    }
  }

  async function reviewCv(candidate: Candidate, cvText: string): Promise<CvAssessment> {
    if (demoMode || !supabaseConfigured) throw new Error("AI-bedömning kräver en separat Supabase-anslutning och är avstängd i publik demo.");
    return assessCandidateCv(candidate.id, cvText);
  }

  function toggleAccount(account: Account) {
    if (account.isInvitation) {
      if (supabaseConfigured) {
        deleteRow("user_invitations", account.id).catch((error: unknown) => setToast(`Inbjudan kunde inte återkallas: ${errorMessage(error)}`));
      }
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      setToast("Inbjudan har återkallats.");
      return;
    }
    const active = !account.active;
    if (supabaseConfigured) {
      updateRow("profiles", account.id, { active }).catch((error: unknown) => setToast(`Kontots status kunde inte ändras: ${errorMessage(error)}`));
    }
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, active } : item));
  }

  if (!demoMode && !supabaseConfigured) {
    return <main className="auth-loading"><section role="alert"><h1>Supabase-konfiguration saknas</h1><p>Den här byggversionen kan inte logga in. Konfigurera Supabase, eller bygg den avsiktliga publikdemo-versionen med <code>npm run build:demo</code>.</p></section></main>;
  }
  if (!authReady) {
    return <main className="auth-loading" aria-live="polite">Laddar din arbetsyta…</main>;
  }
  if (!currentUser) {
    return <LoginPage
      onLogin={handleLogin}
      onSignUp={handleSignup}
      onForgotPassword={handleForgotPassword}
      onSetPassword={handlePasswordUpdate}
      demoMode={demoMode}
      onDemoLogin={handleDemoLogin}
      recoveryMode={supabaseConfigured && passwordRecoveryPending()}
      error={authError}
      notice={authNotice}
    />;
  }

  const isAdmin = currentUser.role === "Administratör";
  const visibleOrganizationId = isAdmin ? organizationId : currentUser.organizationId ?? "";
  const visibleCandidates = candidates.filter((candidate) => candidate.organizationId === visibleOrganizationId);
  const visibleJobs = jobs.filter((job) => job.organizationId === visibleOrganizationId);
  const activePath = path === "/inloggning" ? "/" : path;
  const candidateCreate = activePath === "/kandidater/ny";
  const candidateMatch = activePath.match(/^\/kandidater\/([^/]+)$/);
  const profileCandidate = candidateMatch ? visibleCandidates.find((candidate) => candidate.id === decodeURIComponent(candidateMatch[1])) : undefined;
  const section = activePath === "/jobb"
    ? "Jobb"
    : activePath === "/administration" && isAdmin
      ? "Administration"
      : "Kandidater";

  let page: ReactNode;
  if (candidateCreate) {
    page = <AddCandidatePage jobs={visibleJobs} organizationId={visibleOrganizationId} onSave={addCandidate} onCancel={() => navigate("/")} />;
  } else if (candidateMatch) {
    page = profileCandidate
      ? <CandidateProfilePage candidate={profileCandidate} job={visibleJobs.find((job) => job.id === profileCandidate.jobId)} onBack={() => navigate("/")} onStageChange={(stage) => updateCandidate(profileCandidate.id, { stage })} onAssess={reviewCv} />
      : <NotFoundPage onBack={() => navigate("/")} />;
  } else if (activePath === "/jobb") {
    page = <JobsPage jobs={visibleJobs} candidates={visibleCandidates} organizationId={visibleOrganizationId} onCreate={addJob} onStatusChange={changeJobStatus} />;
  } else if (activePath === "/administration" && isAdmin) {
    page = <AdministrationPage organizations={organizations} organizationId={organizationId} accounts={accounts} onSelectOrganization={setOrganizationId} onOpenWorkspace={() => navigate("/")} onCreateOrganization={addOrganization} onCreateAccount={addAccount} onToggleAccount={toggleAccount} />;
  } else {
    page = <CandidatesPage candidates={visibleCandidates} jobs={visibleJobs} onNavigate={navigate} onStageChange={updateCandidate} />;
  }

  return (
    <AppShell
      section={section}
      organizationId={visibleOrganizationId}
      organizations={organizations}
      onOrganizationChange={setOrganizationId}
      onNavigate={navigate}
      onSignOut={handleSignOut}
      isAdmin={isAdmin}
      user={currentUser}
    >
      {page}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </AppShell>
  );
}

function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function CandidatesPage({
  candidates,
  jobs,
  onNavigate,
  onStageChange,
}: {
  candidates: Candidate[];
  jobs: Job[];
  onNavigate: (path: string) => void;
  onStageChange: (id: string, update: Partial<Candidate>) => void;
}) {
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  const visibleCandidates = candidates.filter((candidate) => {
    const matchesSearch = (candidate.name + " " + candidate.role + " " + candidate.city).toLowerCase().includes(search.toLowerCase());
    const matchesJob = jobId === "all" || candidate.jobId === jobId;
    const matchesRecent = !recentOnly || candidate.addedAt >= "2026-10-10";
    return matchesSearch && matchesJob && matchesRecent;
  });

  return (
    <section>
      <PageHeading
        title="Kandidater"
        subtitle="Håll koll på dina kandidater och hitta rätt person för nästa steg."
        action={<button className="button button-primary" type="button" onClick={() => onNavigate("/kandidater/ny")}><Icon name="plus" />Lägg till kandidat</button>}
      />

      <div className="candidate-toolbar">
        <label className="field toolbar-job">
          <span>Jobb</span>
          <select className="input-control" value={jobId} onChange={(event) => setJobId(event.target.value)}>
            <option value="all">Alla jobb</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
        </label>
        <label className="field toolbar-search">
          <span>Kandidatnamn</span>
          <span className="input-with-icon">
            <Icon name="search" size={20} />
            <input className="input-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sök bland kandidater..." />
          </span>
        </label>
        <div className="filter-anchor">
          <button className={"button button-secondary" + (filtersOpen ? " is-selected" : "")} type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><Icon name="filter" />Filter</button>
          {filtersOpen && (
            <div className="popover filter-popover">
              <div className="popover-heading">
                <h2>Filter</h2>
                <button className="icon-button" type="button" onClick={() => setFiltersOpen(false)} aria-label="Stäng filter"><Icon name="close" /></button>
              </div>
              <label className="checkbox-row"><input type="checkbox" checked={recentOnly} onChange={(event) => setRecentOnly(event.target.checked)} /><span>Endast tillagda sedan 10 oktober</span></label>
              <button className="text-button reset-button" type="button" onClick={() => setRecentOnly(false)}><Icon name="reset" size={16} />Återställ filter</button>
            </div>
          )}
        </div>
        <div className="toolbar-spacer" />
        <span className="result-count">{visibleCandidates.length} kandidater</span>
        <div className="view-switch" role="group" aria-label="Visningsläge">
          <button className={view === "board" ? "is-active" : ""} type="button" onClick={() => setView("board")} aria-label="Kanbanvy"><Icon name="grid" /></button>
          <button className={view === "list" ? "is-active" : ""} type="button" onClick={() => setView("list")} aria-label="Listvy"><Icon name="list" /></button>
        </div>
      </div>

      {view === "board" ? (
        <div className="kanban-board">
          {stageOrder.map((stage) => {
            const items = visibleCandidates.filter((candidate) => candidate.stage === stage);
            return (
              <section className={"kanban-column stage-" + stage} key={stage} aria-label={stageLabels[stage]}>
                <div className="kanban-column-heading">
                  <span className={"stage-dot dot-" + stage} />
                  <h2>{stageLabels[stage]}</h2>
                  <span className="count-badge">{items.length}</span>
                  <button className="icon-button column-add" type="button" onClick={() => onNavigate("/kandidater/ny")} aria-label={"Lägg till kandidat i " + stageLabels[stage]}><Icon name="plus" size={20} /></button>
                </div>
                <div className="candidate-card-list">
                  {items.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} onOpen={() => onNavigate("/kandidater/" + encodeURIComponent(candidate.id))} onStageChange={(nextStage) => onStageChange(candidate.id, { stage: nextStage })} />
                  ))}
                  {items.length === 0 && <p className="empty-column">Inga kandidater här ännu.</p>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <CandidateList candidates={visibleCandidates} onOpen={(candidate) => onNavigate("/kandidater/" + encodeURIComponent(candidate.id))} onStageChange={onStageChange} />
      )}
    </section>
  );
}

function CandidateCard({ candidate, onOpen, onStageChange }: { candidate: Candidate; onOpen: () => void; onStageChange: (stage: Stage) => void }) {
  return (
    <article className="candidate-card">
      <button className="candidate-card-heading" type="button" onClick={onOpen}>
        <span className="avatar">{initials(candidate.name)}</span>
        <span className="candidate-card-name">{candidate.name}</span>
        <Icon name="external" size={16} />
      </button>
      <p className="candidate-role">{candidate.role}</p>
      <p className="candidate-location"><Icon name="pin" size={16} />{candidate.city}</p>
      <div className="candidate-card-meta">
        <time dateTime={candidate.addedAt}>{formatDate(candidate.addedAt)}</time>
        {candidate.linkedin && <a href={candidate.linkedin} target="_blank" rel="noreferrer">LinkedIn <Icon name="external" size={14} /></a>}
      </div>
      <label className="visually-hidden" htmlFor={"stage-" + candidate.id}>Status för {candidate.name}</label>
      <select id={"stage-" + candidate.id} className="stage-select" value={candidate.stage} onChange={(event) => onStageChange(event.target.value as Stage)}>
        {stageOrder.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}
      </select>
    </article>
  );
}

function CandidateList({ candidates, onOpen, onStageChange }: { candidates: Candidate[]; onOpen: (candidate: Candidate) => void; onStageChange: (id: string, update: Partial<Candidate>) => void }) {
  return (
    <div className="table-wrap candidate-table-wrap">
      <table className="data-table candidate-table">
        <thead><tr><th>Kandidat</th><th>Jobb</th><th>Plats</th><th>Status</th><th>Tillagd</th></tr></thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td><button className="table-person" type="button" onClick={() => onOpen(candidate)}><span className="avatar">{initials(candidate.name)}</span><strong>{candidate.name}</strong></button></td>
              <td>{candidate.role}</td>
              <td>{candidate.city}</td>
              <td><label className="visually-hidden" htmlFor={"list-stage-" + candidate.id}>Status för {candidate.name}</label><select id={"list-stage-" + candidate.id} className="stage-select" value={candidate.stage} onChange={(event) => onStageChange(candidate.id, { stage: event.target.value as Stage })}>{stageOrder.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}</select></td>
              <td>{formatDate(candidate.addedAt, { day: "numeric", month: "short", year: "numeric" })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {candidates.length === 0 && <div className="empty-state">Inga kandidater matchar din sökning.</div>}
    </div>
  );
}

function AddCandidatePage({ jobs, organizationId, onSave, onCancel }: { jobs: Job[]; organizationId: string; onSave: (candidate: Candidate, file?: File) => void; onCancel: () => void }) {
  const [fileName, setFileName] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const jobId = String(form.get("jobId") ?? "");
    const job = jobs.find((item) => item.id === jobId);
    if (!name || !job) return;
    const newCandidate = makeCandidate(
      makeId(name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      name,
      String(form.get("role") || job.title),
      String(form.get("city") || job.city),
      "new",
      todayIso(),
      job.id,
      fileName,
      organizationId,
    );
    newCandidate.email = String(form.get("email") ?? "");
    newCandidate.phone = String(form.get("phone") ?? "");
    newCandidate.linkedin = String(form.get("linkedin") ?? "");
    newCandidate.summary = String(form.get("summary") ?? "");
    onSave(newCandidate, cvFile ?? undefined);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setCvFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Filen är större än 5 MB. Välj en mindre fil.");
      event.target.value = "";
      setFileName("");
      setCvFile(null);
      return;
    }
    setFileName(file.name);
    setCvFile(file);
  }

  return (
    <section>
      <button className="back-link" type="button" onClick={onCancel}><Icon name="arrow-left" size={18} />Tillbaka till kandidater</button>
      <PageHeading title="Lägg till kandidat" subtitle="En ny möjlighet börjar här. Lägg till en kandidat i din rekryteringsprocess." />
      <form className="candidate-form-layout" onSubmit={submit}>
        <div className="panel form-panel">
          <h2>Profilinformation</h2>
          <div className="form-grid">
            <label className="field"><span>Fullständigt namn *</span><input className="input-control" name="name" placeholder="Elin Andersson" required /></label>
            <label className="field"><span>Nuvarande yrkesroll</span><input className="input-control" name="role" placeholder="Frontendutvecklare" /></label>
            <label className="field"><span>E-post *</span><input className="input-control" name="email" type="email" placeholder="elin@exempel.se" required /></label>
            <label className="field"><span>Telefonnummer</span><input className="input-control" name="phone" type="tel" placeholder="070-123 45 67" /></label>
            <label className="field"><span>Plats</span><input className="input-control" name="city" placeholder="Stockholm" /></label>
            <label className="field"><span>LinkedIn-profil</span><input className="input-control" name="linkedin" type="url" placeholder="https://www.linkedin.com/in/" /></label>
            <label className="field field-full"><span>Kort presentation</span><textarea className="input-control textarea-control" name="summary" placeholder="Erfarenhet, styrkor och vad kandidaten söker..." rows={5} /></label>
          </div>
          <div className="form-section">
            <h2>Jobbkoppling</h2>
            <label className="field"><span>Koppla till jobb *</span><select className="input-control" name="jobId" required defaultValue=""><option value="" disabled>Välj ett jobb</option>{jobs.filter((job) => job.status === "active").map((job) => <option key={job.id} value={job.id}>{job.title} · {job.city}</option>)}</select></label>
            <p className="muted">Kandidaten läggs till med status Ny. Du kan ändra status i kandidatöversikten.</p>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit"><Icon name="check" />Spara kandidat</button><button className="button button-plain" type="button" onClick={onCancel}>Avbryt</button></div>
        </div>
        <aside className="candidate-form-aside">
          <h2>CV</h2>
          <p className="muted">Kandidatens erfarenhet, samlad på ett ställe.</p>
          <label className="upload-box">
            <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFile} />
            <span className="upload-icon"><Icon name="upload" size={24} /></span>
            <strong>{fileName || "Välj eller dra in ett CV"}</strong>
            <span>PDF eller Word · Högst 5 MB</span>
          </label>
          {fileError && <p className="field-error" role="alert">{fileError}</p>}
          <div className="privacy-note"><Icon name="shield" /><div><strong>Med kandidaten i fokus</strong><p>Säkerställ att du har kandidatens samtycke innan du lägger till kontaktuppgifter och CV.</p></div></div>
          <p className="muted small-note">Med Supabase sparas CV:t privat för organisationen. I demoläge sparas endast filnamnet.</p>
        </aside>
      </form>
    </section>
  );
}

function CandidateProfilePage({ candidate, job, onBack, onStageChange, onAssess }: {
  candidate: Candidate;
  job?: Job;
  onBack: () => void;
  onStageChange: (stage: Stage) => void;
  onAssess: (candidate: Candidate, cvText: string) => Promise<CvAssessment>;
}) {
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cvText, setCvText] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [review, setReview] = useState<CvAssessment | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  function downloadOverview() {
    const content = [
      candidate.name,
      candidate.role + " · " + candidate.city,
      candidate.email,
      "",
      candidate.summary,
      "",
      "Kompetenser: " + candidate.skills.join(", "),
      "",
      "Kopplat jobb: " + (job?.title ?? "Inget jobb"),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = candidate.name.replace(/\s+/g, "_") + "_profiloversikt.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCv() {
    if (!candidate.cvPath) return;
    try {
      const link = await signedCandidateFileUrl(candidate.cvPath);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (error) {
      setReviewError(errorMessage(error));
    }
  }

  async function submitCvReview() {
    setReviewError("");
    if (!hasConsent) {
      setReviewError("Bekräfta att du har samtycke innan CV-texten skickas för AI-analys.");
      return;
    }
    if (cvText.trim().length < 40) {
      setReviewError("Klistra in minst 40 tecken från CV:t så att assistenten har underlag.");
      return;
    }
    setReviewBusy(true);
    try {
      setReview(await onAssess(candidate, cvText.trim()));
    } catch (error) {
      setReviewError(errorMessage(error));
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <section>
      <button className="back-link" type="button" onClick={onBack}><Icon name="arrow-left" size={18} />Tillbaka till kandidater</button>
      <div className="profile-heading">
        <div className="profile-identity"><span className="avatar avatar-large">{initials(candidate.name)}</span><div><h1>{candidate.name}</h1><p>{candidate.role} · {candidate.city}</p></div></div>
        <div className="profile-actions"><a className="button button-secondary" href={"mailto:" + candidate.email}><Icon name="send" />Kontakta kandidat</a><label className="visually-hidden" htmlFor="profile-stage">Kandidatens status</label><select id="profile-stage" className="input-control profile-stage" value={candidate.stage} onChange={(event) => onStageChange(event.target.value as Stage)}>{stageOrder.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div>
      </div>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <section className="profile-section"><h2>Kontaktinformation</h2><a className="contact-item" href={"mailto:" + candidate.email}><Icon name="mail" />{candidate.email}</a>{candidate.phone && <a className="contact-item" href={"tel:" + candidate.phone}><Icon name="phone" />{candidate.phone}</a>}<p className="contact-item"><Icon name="pin" />{candidate.city}</p>{candidate.linkedin && <a className="contact-item link" href={candidate.linkedin} target="_blank" rel="noreferrer"><Icon name="external" />Visa LinkedIn-profil</a>}</section>
          <section className="profile-section"><h2>Kopplade jobb</h2>{job ? <div className="linked-job"><strong>{job.title}</strong><span className={"status-tag stage-tag-" + candidate.stage}><span className={"stage-dot dot-" + candidate.stage} />{stageLabels[candidate.stage]}</span><small>Tillagd {formatDate(candidate.addedAt, { day: "numeric", month: "short", year: "numeric" })}</small></div> : <p className="muted">Inget kopplat jobb.</p>}</section>
          <section className="profile-section"><h2>CV</h2><div className="cv-card"><div><Icon name="file" /><div><strong>{candidate.cvName || "CV saknas"}</strong><span>{candidate.cvName ? "Privat kandidatfil" : "Du kan lägga till ett CV när kandidaten skapas."}</span></div></div>{candidate.cvPath ? <button className="button button-secondary button-wide" type="button" onClick={downloadCv}><Icon name="download" />Hämta CV</button> : <button className="button button-secondary button-wide" type="button" onClick={downloadOverview}><Icon name="download" />Hämta profilöversikt</button>}<button className="button button-quiet button-wide" type="button" onClick={() => setReviewOpen((open) => !open)}><Icon name="sparkles" />AI-granska CV-text</button></div>
            {reviewOpen && <div className="cv-review-panel">
              <p className="muted">Klistra in CV-text för en neutral sammanfattning mot {job?.title ?? "jobbets"} krav. Bedömningen är rådgivande och fattar inga urvalsbeslut.</p>
              <label className="field"><span>CV-text</span><textarea className="input-control textarea-control" value={cvText} maxLength={40000} rows={6} onChange={(event) => setCvText(event.target.value)} placeholder="Klistra in CV-text här…" /></label>
              <label className="checkbox-row ai-consent"><input type="checkbox" checked={hasConsent} onChange={(event) => setHasConsent(event.target.checked)} /><span>Jag har samtycke att skicka CV-texten till OpenAI för denna assistans.</span></label>
              <p className="small-note muted">Texten skickas endast när du väljer att analysera. AI-resultatet ska granskas av en människa.</p>
              {reviewError && <p className="field-error" role="alert">{reviewError}</p>}
              <button className="button button-primary" type="button" disabled={reviewBusy || !hasConsent} onClick={submitCvReview}><Icon name="sparkles" />{reviewBusy ? "Analyserar…" : "Skapa neutral sammanfattning"}</button>
              {review && <div className="cv-review-result" aria-live="polite"><h3>Sammanfattning</h3><p>{review.summary}</p><h3>Belägg i CV:t</h3><ul>{review.relevant_evidence.map((item, index) => <li key={index}>{item}</li>)}</ul><h3>Att följa upp</h3><ul>{review.information_to_clarify.map((item, index) => <li key={index}>{item}</li>)}</ul><h3>Förslag på intervjufrågor</h3><ul>{review.interview_questions.map((item, index) => <li key={index}>{item}</li>)}</ul><p className="small-note muted">{review.disclaimer}</p></div>}
            </div>}
          </section>
        </aside>
        <div className="profile-main">
          <div className="tabs" role="tablist" aria-label="Kandidatprofil">
            <button className={tab === "overview" ? "is-active" : ""} role="tab" aria-selected={tab === "overview"} type="button" onClick={() => setTab("overview")}>Profilöversikt</button>
            <button className={tab === "history" ? "is-active" : ""} role="tab" aria-selected={tab === "history"} type="button" onClick={() => setTab("history")}>Historik <span className="count-badge">1</span></button>
          </div>
          {tab === "overview" ? (
            <div className="overview-content">
              <section className="profile-content-section"><h2>Om {candidate.name.split(" ")[0]}</h2><p className="profile-summary">{candidate.summary}</p></section>
              <section className="profile-content-section"><h2>Kompetenser</h2><div className="skill-list">{candidate.skills.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div></section>
              <section className="profile-content-section"><h2>Arbetslivserfarenhet</h2><div className="timeline-list">{candidate.experience.map((item) => <p key={item}><span className="timeline-icon"><Icon name="briefcase" /></span>{item}</p>)}</div></section>
              <section className="profile-content-section"><h2>Utbildning</h2><p>{candidate.education}</p></section>
            </div>
          ) : (
            <section className="history-content"><h2>Kandidatens historik</h2><div className="history-event"><span className="history-check"><Icon name="check" size={15} /></span><div><strong>Kandidaten lades till</strong><p>{job?.title ?? candidate.role} · {formatDate(candidate.addedAt, { day: "numeric", month: "short", year: "numeric" })}</p></div></div></section>
          )}
        </div>
      </div>
    </section>
  );
}

function JobsPage({ jobs, candidates, organizationId, onCreate, onStatusChange }: { jobs: Job[]; candidates: Candidate[]; organizationId: string; onCreate: (job: Job) => void; onStatusChange: (id: string, status: JobStatus) => void }) {
  const [tab, setTab] = useState<"active" | "closed" | "all">("active");
  const [search, setSearch] = useState("");
  const visibleJobs = jobs.filter((job) => (tab === "all" || job.status === tab) && (job.title + " " + job.city + " " + job.department).toLowerCase().includes(search.toLowerCase()));

  return (
    <section>
      <PageHeading title="Jobb" subtitle="Skapa möjligheter. Hitta talangerna som tar ditt team framåt." action={<button className="button button-primary" type="button" onClick={() => document.getElementById("job-title")?.focus()}><Icon name="plus" />Skapa jobb</button>} />
      <div className="jobs-layout">
        <div className="jobs-main">
          <div className="job-tabs" role="tablist" aria-label="Visa jobb">
            <button className={tab === "active" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "active"} onClick={() => setTab("active")}>Aktiva jobb <span className="count-badge">{jobs.filter((job) => job.status === "active").length}</span></button>
            <button className={tab === "closed" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "closed"} onClick={() => setTab("closed")}>Stängda jobb <span className="count-badge">{jobs.filter((job) => job.status === "closed").length}</span></button>
            <button className={tab === "all" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")}>Alla jobb <span className="count-badge">{jobs.length}</span></button>
          </div>
          <label className="search-job"><Icon name="search" /><span className="visually-hidden">Sök bland jobb</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sök bland jobb..." /></label>
          <div className="job-list">
            {visibleJobs.map((job) => {
              const count = candidates.filter((candidate) => candidate.jobId === job.id).length;
              return (
                <article className="job-card" key={job.id}>
                  <div className="job-card-top"><h2>{job.title}</h2><span className={"job-status " + (job.status === "active" ? "is-active" : "is-closed")}>{job.status === "active" ? "Aktivt" : "Stängt"}</span></div>
                  <div className="job-meta"><span><Icon name="pin" />{job.city} · {job.workArrangement}</span><span>{job.employmentType}</span><span>{job.department}</span></div>
                  <p className="job-description">{job.description}</p>
                  <div className="job-card-bottom"><span><Icon name="people" />{count} kandidater</span><span>Skapat {formatDate(job.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span><button className="icon-button" type="button" onClick={() => onStatusChange(job.id, job.status === "active" ? "closed" : "active")} aria-label={job.status === "active" ? "Stäng jobb" : "Återöppna jobb"} title={job.status === "active" ? "Stäng jobb" : "Återöppna jobb"}><Icon name={job.status === "active" ? "close" : "check"} /></button></div>
                </article>
              );
            })}
            {visibleJobs.length === 0 && <div className="empty-state">Inga jobb matchar din sökning.</div>}
          </div>
        </div>
        <JobForm organizationId={organizationId} onCreate={onCreate} />
      </div>
    </section>
  );
}

function JobForm({ organizationId, onCreate }: { organizationId: string; onCreate: (job: Job) => void }) {
  const [notice, setNotice] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    if (!title) return;
    onCreate({
      id: makeId(title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      organizationId,
      title,
      city: String(form.get("city") ?? ""),
      workArrangement: String(form.get("workArrangement") ?? "Hybrid"),
      employmentType: String(form.get("employmentType") ?? "Heltid"),
      department: String(form.get("department") ?? ""),
      description: String(form.get("description") ?? ""),
      status: "active",
      createdAt: todayIso(),
    });
    event.currentTarget.reset();
    setNotice("Jobbet har lagts till i listan.");
    window.setTimeout(() => setNotice(""), 3000);
  }

  return (
    <aside className="job-form-panel">
      <div className="job-form-heading"><h2>Skapa jobb</h2><button className="button button-quiet" type="reset" form="create-job-form">Nytt jobb</button></div>
      <p className="muted">Nästa kapitel börjar med rätt person.</p>
      <form id="create-job-form" className="stacked-form" onSubmit={submit}>
        <label className="field"><span>Jobbtitel *</span><input id="job-title" className="input-control" name="title" placeholder="Exempelvis frontendutvecklare" required /></label>
        <div className="form-grid two-columns">
          <label className="field"><span>Plats *</span><input className="input-control" name="city" placeholder="Stockholm" required /></label>
          <label className="field"><span>Anställningsform</span><select className="input-control" name="employmentType" defaultValue="Heltid"><option>Heltid</option><option>Deltid</option><option>Konsult</option><option>Praktik</option></select></label>
        </div>
        <label className="field"><span>Arbetssätt</span><select className="input-control" name="workArrangement" defaultValue="Hybrid"><option>Hybrid</option><option>På plats</option><option>Distans</option></select></label>
        <label className="field"><span>Avdelning</span><input className="input-control" name="department" placeholder="Produkt & utveckling" /></label>
        <label className="field"><span>Beskrivning</span><textarea className="input-control textarea-control" name="description" rows={5} placeholder="Berätta om rollen, teamet och vad ni söker..." /></label>
        <div className="helper-copy"><strong>En bra start för rätt matchning</strong><p>Beskriv arbetsuppgifter, erfarenhet och vad ni erbjuder kandidaten.</p></div>
        {notice && <p className="success-message" role="status">{notice}</p>}
        <div className="form-actions"><button className="button button-primary" type="submit"><Icon name="plus" />Skapa jobb</button><button className="button button-plain" type="reset">Avbryt</button></div>
        <p className="small-note muted">Jobbet kopplas till den aktiva arbetsytan och sparas i Supabase.</p>
      </form>
    </aside>
  );
}

function AdministrationPage({
  organizations,
  organizationId,
  accounts,
  onSelectOrganization,
  onOpenWorkspace,
  onCreateOrganization,
  onCreateAccount,
  onToggleAccount,
}: {
  organizations: WorkspaceOrganization[];
  organizationId: string;
  accounts: Account[];
  onSelectOrganization: (id: string) => void;
  onOpenWorkspace: () => void;
  onCreateOrganization: (organization: WorkspaceOrganization) => void;
  onCreateAccount: (account: Account) => void;
  onToggleAccount: (account: Account) => void;
}) {
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [accountNotice, setAccountNotice] = useState("");
  const [newAccountRole, setNewAccountRole] = useState<Account["role"]>("Kund");
  const activeOrganization = organizations.find((organization) => organization.id === organizationId) ?? organizations[0];
  const visibleAccounts = accounts.filter((account) => account.organizationId === organizationId || account.role === "Administratör");

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    if (!name || !email) return;
    const role = String(form.get("role")) as Account["role"];
    onCreateAccount({
      id: makeId("account"),
      name,
      email,
      role,
      organizationId: role === "Administratör" ? null : String(form.get("organizationId")),
      active: true,
    });
    event.currentTarget.reset();
    setNewAccountRole("Kund");
    setAccountNotice("Kontot har skapats.");
    window.setTimeout(() => setAccountNotice(""), 3000);
  }

  function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("company") ?? "").trim();
    const industry = String(form.get("industry") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    if (!name) return;
    const organization = {
      id: makeId("organization"),
      name,
      industry,
      city,
      active: true,
    };
    onCreateOrganization(organization);
    setShowOrganizationModal(false);
  }

  return (
    <section>
      <PageHeading title="Kunder & konton" subtitle="En samlad plats för dina kundorganisationer, användare och behörigheter." action={<button className="button button-primary" type="button" onClick={() => setShowOrganizationModal(true)}><Icon name="plus" />Lägg till kund</button>} />
      <div className="organization-banner">
        <span className="organization-icon"><Icon name="building" size={27} /></span>
        <div className="active-organization-select"><span className="muted">Aktiv kundorganisation</span><label className="visually-hidden" htmlFor="admin-org-select">Välj aktiv kundorganisation</label><select id="admin-org-select" value={activeOrganization?.id ?? ""} onChange={(event) => onSelectOrganization(event.target.value)}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>
        <div className="organization-context"><strong>Du arbetar i {activeOrganization?.name}</strong><span>Jobb och kandidater visas för den valda organisationen.</span></div>
        <button className="button button-secondary" type="button" onClick={onOpenWorkspace}><Icon name="external" />Öppna kundens arbetsyta</button>
      </div>
      <div className="admin-layout">
        <div className="admin-data">
          <section className="admin-section">
            <div className="section-heading"><h2>Kunder</h2><span className="muted">{organizations.length} organisationer</span></div>
            <div className="table-wrap">
              <table className="data-table org-table">
                <thead><tr><th>Organisation</th><th>Användare</th><th>Status</th><th aria-label="Åtgärd" /></tr></thead>
                <tbody>{organizations.map((organization) => {
                  const count = accounts.filter((account) => account.organizationId === organization.id).length;
                  return <tr key={organization.id} className={organization.id === organizationId ? "selected-row" : ""}><td><button className="organization-row-button" type="button" onClick={() => onSelectOrganization(organization.id)}><Icon name="building" /><span><strong>{organization.name}</strong><small>{organization.industry} · {organization.city}</small></span></button></td><td>{count} användare</td><td><span className="job-status is-active">{organization.active ? "Aktiv" : "Inaktiv"}</span></td><td><button className="icon-button" type="button" title={"Vald organisation: " + organization.name} aria-label={"Vald organisation: " + organization.name}><Icon name="more" /></button></td></tr>;
                })}</tbody>
              </table>
            </div>
          </section>
          <section className="admin-section">
            <div className="section-heading"><h2>Användare i {activeOrganization?.name ?? "Nexora"}</h2><span className="muted">{visibleAccounts.length} användare</span></div>
            <div className="table-wrap">
              <table className="data-table user-table">
                <thead><tr><th>Användare</th><th>Roll</th><th>Status</th><th>Åtgärd</th></tr></thead>
                <tbody>{visibleAccounts.map((account) => <tr key={account.id}><td><span className="user-table-person"><span className="avatar">{initials(account.name)}</span><span><strong>{account.name}</strong><small>{account.email}</small></span></span></td><td><span className="role-pill">{account.role}</span></td><td>{account.isInvitation ? "Inbjuden" : account.active ? "Aktiv" : "Inaktiv"}</td><td><button className="text-button" type="button" onClick={() => onToggleAccount(account)}>{account.isInvitation ? "Återkalla" : account.active ? "Inaktivera" : "Aktivera"}</button></td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="account-form-panel">
          <h2>Skapa konto</h2>
          <p className="muted">Välkomna en ny kollega eller kund.</p>
          <form className="stacked-form" onSubmit={submitAccount}>
            <label className="field"><span>Fullständigt namn *</span><input className="input-control" name="name" placeholder="För- och efternamn" required /></label>
            <label className="field"><span>E-post *</span><input className="input-control" type="email" name="email" placeholder="namn@foretag.se" required /></label>
            <label className="field"><span>Roll</span><select className="input-control" name="role" value={newAccountRole} onChange={(event) => setNewAccountRole(event.target.value as Account["role"])}><option>Kund</option><option>Administratör</option></select></label>
            {newAccountRole === "Kund" && <label className="field"><span>Kundorganisation</span><select className="input-control" name="organizationId" defaultValue={organizationId} required>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>}
            <div className="privacy-note"><Icon name="shield" /><div><strong>Rätt åtkomst för rätt person</strong><p>Kunder arbetar i sin organisation. Administratörskonton får åtkomst till alla kundarbetsytor.</p></div></div>
            {accountNotice && <p className="success-message" role="status">{accountNotice}</p>}
            <button className="button button-primary button-wide" type="submit"><Icon name="plus" />Skapa konto</button>
          </form>
        </aside>
      </div>
      {showOrganizationModal && (
        <Modal title="Lägg till kund" description="Skapa en ny kundorganisation i Nexora." onClose={() => setShowOrganizationModal(false)}>
          <form className="stacked-form" onSubmit={submitOrganization}>
            <label className="field"><span>Företagsnamn *</span><input className="input-control" name="company" autoFocus required /></label>
            <label className="field"><span>Bransch *</span><input className="input-control" name="industry" required /></label>
            <label className="field"><span>Ort *</span><input className="input-control" name="city" required /></label>
            <div className="form-actions"><button className="button button-primary" type="submit"><Icon name="check" />Skapa kund</button><button className="button button-plain" type="button" onClick={() => setShowOrganizationModal(false)}>Avbryt</button></div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="Stäng"><Icon name="close" /></button></div>
        {children}
      </section>
    </div>
  );
}

function LoginPage({
  onLogin,
  onSignUp,
  onForgotPassword,
  onSetPassword,
  demoMode,
  onDemoLogin,
  recoveryMode,
  error,
  notice,
}: {
  onLogin: (email: string, password: string, remember?: boolean) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onSetPassword: (password: string) => Promise<void>;
  demoMode: boolean;
  onDemoLogin: (role: "admin" | "customer") => void;
  recoveryMode: boolean;
  error: string;
  notice: string;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "update">(recoveryMode ? "update" : "login");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const submittedEmail = String(form.get("email") ?? "").trim();
      setEmail(submittedEmail);
      const password = String(form.get("password") ?? "");
      if (mode === "reset") await onForgotPassword(submittedEmail);
      else if (mode === "update") await onSetPassword(password);
      else if (mode === "signup") await onSignUp(String(form.get("name") ?? "").trim(), submittedEmail, password);
      else await onLogin(submittedEmail, password, rememberMe);
    } catch {
      // The parent displays the authentication error beside the form.
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Skapa konto" : mode === "reset" ? "Återställ lösenord" : mode === "update" ? "Välj nytt lösenord" : "Logga in";
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand"><img src={`${import.meta.env.BASE_URL}brand/nexora-favicon.svg`} alt="" /><span>NEXORA</span><small>BÄTTRE TALANGER. STARKARE TEAM.</small></div>
        <div className="login-pitch"><span className="eyebrow">Nexora · Ditt rekryteringsverktyg</span><h1>Rätt kandidat.<br /><span>Nästa steg.</span></h1><p>Alla kandidater och jobb på en plats. Mer tid för människor, mindre tid för administration.</p><div className="login-mini-board"><div className="mini-board-top"><strong>Kandidater</strong><span>15 totalt</span></div><div className="mini-board-cards"><div><span>Ny</span><strong>Elin Andersson</strong><small>Frontendutvecklare</small></div><div><span>Granskning</span><strong>Erik Johansson</strong><small>Frontendutvecklare</small></div><div><span>Intervju</span><strong>Oscar Nilsson</strong><small>UX-designer</small></div></div></div><span className="login-tagline">BETTER TALENT. FASTER.</span></div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-content">
          <span className="eyebrow">Nexora · Ditt rekryteringsverktyg</span>
          <h2>{title}</h2>
          <p>{demoMode && mode === "login" ? "Utforska båda rollerna i den interaktiva Nexora-demonstrationen." : mode === "signup" ? "Skapa ditt konto med den e-postadress din administratör har bjudit in." : mode === "reset" ? "Ange e-postadressen till ditt Nexora-konto så skickar vi en återställningslänk." : mode === "update" ? "Välj ett nytt lösenord för ditt Nexora-konto." : "Välkommen tillbaka. Fortsätt hitta människorna som gör skillnad i ditt team."}</p>
          {demoMode && mode === "login" && <div className="demo-role-actions" aria-label="Välj demovy">
            <button className="button button-primary" type="button" onClick={() => onDemoLogin("admin")}>Admin <Icon name="arrow-right" size={18} /></button>
            <button className="button button-secondary" type="button" onClick={() => onDemoLogin("customer")}>Kund <Icon name="arrow-right" size={18} /></button>
          </div>}
          <form className="stacked-form" onSubmit={submit}>
            {mode === "signup" && <label className="field"><span>Namn</span><input className="input-control" type="text" name="name" placeholder="För- och efternamn" autoComplete="name" required /></label>}
            {mode !== "update" && <label className="field"><span>{demoMode && mode === "login" ? "Demoanvändare" : "E-post"}</span><input className="input-control" type={demoMode && mode === "login" ? "text" : "email"} name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={demoMode && mode === "login" ? "admin eller kund" : "namn@foretag.se"} autoComplete={demoMode && mode === "login" ? "username" : "email"} required /></label>}
            {mode !== "reset" && <label className="field"><span>Lösenord</span><span className="login-password-wrap"><input className="input-control" type={showPassword ? "text" : "password"} name="password" placeholder={mode === "update" ? "Nytt lösenord" : "Ange ditt lösenord"} autoComplete={mode === "signup" || mode === "update" ? "new-password" : "current-password"} minLength={mode === "signup" || mode === "update" ? 8 : undefined} required /><button type="button" className="login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}><Icon name={showPassword ? "eye-off" : "eye"} size={18} /></button></span></label>}
            {mode === "login" && !demoMode && <div className="login-options"><label><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Kom ihåg mig</span></label><button className="text-button" type="button" onClick={() => setMode("reset")}>Glömt lösenord?</button></div>}
            {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-message-success" role="status">{notice}</p>}
            <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? "Vänta…" : mode === "reset" ? "Skicka återställningslänk" : mode === "update" ? "Spara nytt lösenord" : demoMode ? "Logga in" : title}<Icon name="arrow-right" size={18} /></button>
          </form>
          {demoMode && mode === "login" && <p className="login-demo-note"><Icon name="shield" size={16} /><span>Granskar inloggning: <strong>admin</strong> eller <strong>kund</strong> via knapparna ovan. <br />Bara fiktiva data används; ändringar sparas i din webbläsare.</span></p>}
          {!demoMode && <div className="login-account-prompt">
            {mode === "login" ? <><p>Ny på Nexora? Din administratör lägger till din e-postadress i Administration. Skapa sedan ditt konto här.</p><button className="button button-secondary button-wide" type="button" onClick={() => setMode("signup")}>Skapa konto <Icon name="arrow-right" size={18} /></button></> : mode === "update" ? <p className="muted">Efter sparat lösenord öppnas din arbetsyta.</p> : <><p>{mode === "signup" ? "Har du redan ett konto? Logga in med din e-postadress och ditt lösenord." : "Kom du på ditt lösenord?"}</p><button className="text-button" type="button" onClick={() => setMode("login")}>Till inloggningen</button></>}
          </div>}
        </div>
        <footer>© {new Date().getFullYear()} Nexora <span>Rekrytering med omtanke</span></footer>
      </section>
    </main>
  );
}

function NotFoundPage({ onBack }: { onBack: () => void }) {
  return <div className="empty-state page-not-found"><h1>Sidan kunde inte hittas</h1><p className="muted">Kandidaten kan ha tagits bort eller flyttats.</p><button className="button button-primary" type="button" onClick={onBack}>Till kandidater</button></div>;
}

export default App;
