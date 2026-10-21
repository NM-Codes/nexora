import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "relevant_evidence", "information_to_clarify", "interview_questions", "disclaimer"],
  properties: {
    summary: { type: "string" },
    relevant_evidence: { type: "array", items: { type: "string" } },
    information_to_clarify: { type: "array", items: { type: "string" } },
    interview_questions: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
};

function json(status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { message: "Endast POST stöds." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !anonKey || !openAiKey) {
    return json(503, { message: "CV-assistenten är inte konfigurerad ännu." });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { message: "Logga in för att använda CV-assistenten." });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: authError } = await supabase.auth.getUser();
  if (authError || !userResult.user) return json(401, { message: "Din session har gått ut. Logga in igen." });

  let payload: { candidate_id?: string; cv_text?: string };
  try {
    payload = await request.json();
  } catch {
    return json(400, { message: "Begäran kunde inte läsas." });
  }
  const candidateId = payload.candidate_id;
  const cvText = payload.cv_text?.trim();
  if (!candidateId || !cvText || cvText.length > 40000) {
    return json(400, { message: "Ange CV-text på högst 40 000 tecken." });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, organization_id, name, role_title, applications(id, status, job:jobs(title, description))")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) return json(404, { message: "Kandidaten hittades inte i din arbetsyta." });
  const application = Array.isArray(candidate.applications) ? candidate.applications[0] : null;
  const job = application?.job;
  if (!application || !job) return json(400, { message: "Koppla kandidaten till ett jobb innan CV-texten bedöms." });

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "Du hjälper ett rekryteringsteam att läsa ett CV. Skriv på svenska. Ge en neutral sammanfattning av belägg i CV-texten som relaterar till jobbets krav och lista saknad information att följa upp. Ge intervjufrågor som verifierar erfarenheter. Dra aldrig slutsatser om personlighet, ålder, kön, etnicitet, hälsa eller andra skyddade egenskaper. Poängsätt, rangordna eller rekommendera aldrig anställning, avslag eller urval. Skilj tydligt på vad CV:t säger och vad som behöver verifieras. Spara inte CV-texten i resultatet.",
          }],
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: `Jobb: ${job.title}\nJobbeskrivning: ${job.description || "Ingen beskrivning angiven."}\n\nKandidatens nuvarande roll: ${candidate.role_title || "Inte angiven"}\nNamn: ${candidate.name}\n\nCV-text:\n${cvText}`,
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cv_review",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });
  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("CV review provider error", aiResponse.status, errorText.slice(0, 500));
    return json(502, { message: "CV-assistenten kunde inte skapa en bedömning. Försök igen senare." });
  }

  const aiResult = await aiResponse.json();
  const outputText = aiResult.output
    ?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? [])
    .find((item: { type: string }) => item.type === "output_text")?.text;
  if (!outputText) return json(502, { message: "AI-tjänsten returnerade inget läsbart resultat." });

  let result;
  try {
    result = JSON.parse(outputText);
  } catch {
    return json(502, { message: "AI-tjänsten returnerade ett ogiltigt resultat." });
  }

  const { error: saveError } = await supabase.from("cv_reviews").insert({
    organization_id: candidate.organization_id,
    application_id: application.id,
    result,
    reviewed_by: userResult.user.id,
  });
  if (saveError) {
    console.error("CV review could not be saved", saveError.message);
    return json(500, { message: "Bedömningen skapades men kunde inte sparas i kandidatens historik." });
  }

  return json(200, result);
});
