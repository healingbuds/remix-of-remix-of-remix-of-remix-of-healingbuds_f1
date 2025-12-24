import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrainData {
  name: string;
  category: string;
  thcContent: number;
  cbdContent: number;
  effects: string[];
  terpenes: string[];
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strain } = await req.json() as { strain: StrainData };

    if (!strain?.name) {
      return new Response(
        JSON.stringify({ error: 'Strain name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching medical info for strain: ${strain.name}`);

    const systemPrompt = `You are a medical cannabis expert providing accurate, evidence-based information about cannabis strains for a licensed medical cannabis platform. Your responses must be:
- Clinically accurate and based on current medical research
- Professional in tone, suitable for healthcare contexts
- Clear about the therapeutic applications and potential side effects
- Compliant with medical regulations

Always include proper medical disclaimers and emphasize that patients should consult with their healthcare provider.`;

    const userPrompt = `Provide detailed medical information for the cannabis strain "${strain.name}" with these characteristics:
- Type: ${strain.category}
- THC: ${strain.thcContent}%
- CBD: ${strain.cbdContent}%
- Known effects: ${strain.effects?.join(', ') || 'Not specified'}
- Terpene profile: ${strain.terpenes?.join(', ') || 'Not specified'}
${strain.description ? `- Description: ${strain.description}` : ''}

Please provide a JSON response with the following structure:
{
  "medicalConditions": ["array of medical conditions this strain may help with"],
  "therapeuticEffects": ["array of therapeutic effects"],
  "potentialSideEffects": ["array of potential side effects"],
  "recommendedFor": ["patient profiles this strain is best suited for"],
  "dosageGuidance": "general dosage guidance for medical use",
  "timeOfUse": "recommended time of day for use",
  "onsetDuration": "onset time and duration of effects",
  "interactionWarnings": ["potential drug interactions or contraindications"],
  "researchNotes": "brief summary of relevant medical research",
  "patientTestimonialSummary": "summary of common patient experiences"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch medical information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    let medicalInfo;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      medicalInfo = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a structured response with the raw content
      medicalInfo = {
        medicalConditions: [],
        therapeuticEffects: strain.effects || [],
        potentialSideEffects: ['Dry mouth', 'Dry eyes', 'Dizziness'],
        recommendedFor: [],
        dosageGuidance: 'Start with a low dose and increase gradually as needed.',
        timeOfUse: strain.category === 'Sativa' ? 'Daytime' : strain.category === 'Indica' ? 'Evening' : 'Any time',
        onsetDuration: 'Effects typically begin within 5-15 minutes when inhaled.',
        interactionWarnings: ['Consult your doctor if taking other medications'],
        researchNotes: content,
        patientTestimonialSummary: 'Patient experiences vary. Consult your healthcare provider.',
      };
    }

    console.log(`Successfully fetched medical info for ${strain.name}`);

    return new Response(
      JSON.stringify({ success: true, data: medicalInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in strain-medical-info:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
