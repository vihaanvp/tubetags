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
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a YouTube SEO expert specializing in generating optimized tags. 
Generate 10-15 relevant, SEO-friendly YouTube tags based on the user's video title or description.

Rules:
1. Tags should be relevant and specific to the content
2. Include a mix of broad and niche tags
3. Use trending keywords when appropriate
4. Keep individual tags concise (1-3 words each)
5. Total combined length must not exceed 500 characters
6. Return ONLY the tags as a comma-separated list, nothing else
7. Do not use hashtags (#) or special characters
8. Focus on searchable terms people actually use

Example format: 
tech review, smartphone 2024, budget phone, android, camera quality, gaming performance, battery life, unboxing, tech tutorial, mobile technology`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate tags" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    // Parse the comma-separated tags
    let tags = generatedText
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    // Ensure we don't exceed 500 characters
    let totalLength = tags.join(", ").length;
    while (totalLength > 500 && tags.length > 0) {
      tags.pop();
      totalLength = tags.join(", ").length;
    }

    console.log(`Generated ${tags.length} tags with total length: ${totalLength}`);

    return new Response(
      JSON.stringify({ tags, totalLength }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-tags function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
