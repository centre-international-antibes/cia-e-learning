import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "*").split(",").map(s => s.trim());

function buildCorsHeaders(origin: string | null): Record<string, string> {
  let allow = "*";
  if (!ALLOWED_ORIGINS.includes("*")) {
    allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

async function logUsage(userId: string | null, textLength: number, voiceId: string | null, status: "success"|"error"|"rate_limited", errorMsg?: string) {
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    await admin.from("tts_usage_log").insert({ user_id: userId, text_length: textLength, voice_id: voiceId, status, error_msg: errorMsg ?? null });
  } catch (e) { console.error("[elevenlabs-tts] log insert failed", e); }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("Origin"));
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!ELEVENLABS_API_KEY) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), { status: 500, headers: jsonHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: missing Bearer token" }), { status: 401, headers: jsonHeaders });
  }

  const jwt = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), { status: 401, headers: jsonHeaders });
  }

  let body: { text?: string; voiceId?: string; voiceSettings?: Record<string, unknown> };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: jsonHeaders }); }

  const { text, voiceId: requestedVoiceId, voiceSettings } = body;
  if (!text || typeof text !== "string" || text.length === 0 || text.length > 5000) {
    await logUsage(user.id, text?.length ?? 0, requestedVoiceId ?? null, "error", "invalid_text");
    return new Response(JSON.stringify({ error: "Invalid text parameter" }), { status: 400, headers: jsonHeaders });
  }

  // Default Marie voice (CIA pedagogical voice)
  const voiceId = requestedVoiceId || "Y54PWsHC8udAjARe8URQ";
  const defaultSettings = { stability: 0.6, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true, speed: 0.9 };
  const mergedSettings = voiceSettings ? { ...defaultSettings, ...voiceSettings, use_speaker_boost: true } : defaultSettings;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: mergedSettings }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[elevenlabs-tts] API error [${response.status}]: ${errorBody}`);
      await logUsage(user.id, text.length, voiceId, "error", `eleven_${response.status}`);
      return new Response(JSON.stringify({ error: "TTS generation failed" }), { status: response.status, headers: jsonHeaders });
    }
    const audioBuffer = await response.arrayBuffer();
    await logUsage(user.id, text.length, voiceId, "success");
    return new Response(audioBuffer, { headers: { ...corsHeaders, "Content-Type": "audio/mpeg" } });
  } catch (error) {
    console.error("[elevenlabs-tts] error", error);
    await logUsage(user.id, text.length, voiceId, "error", String(error).slice(0, 200));
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: jsonHeaders });
  }
});
