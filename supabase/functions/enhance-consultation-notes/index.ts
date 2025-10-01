import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!notes || notes.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Notes cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a medical assistant for doctors in Malaysia. Your role is to enhance consultation notes by:

GRAMMAR & SPELLING ONLY:
- Fix grammatical errors and typos
- Correct medical terminology spelling
- Maintain original medical context exactly
- Preserve all medical facts and observations

LANGUAGE REQUIREMENTS:
- Use proper Malaysian English medical terminology
- Include appropriate Malay medical terms when contextually correct
- NEVER use Indonesian language or terminology
- Maintain professional medical tone

STRICT CONSTRAINTS:
- DO NOT add new medical information
- DO NOT expand content beyond original scope  
- DO NOT change medical meanings or diagnoses
- DO NOT add symptoms or findings not mentioned
- ONLY improve language clarity and correctness

OUTPUT: Return only the corrected text, maintaining original structure and length.`
          },
          {
            role: "user",
            content: notes
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const enhancedNotes = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ enhancedNotes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enhancing notes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
