import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";
const S3_BASE = 'https://prod-profiles-backend.s3.amazonaws.com/';

// Sign payload using the private key
async function signPayload(payload: string, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return base64Encode(hashBuffer);
}

// Make authenticated request to Dr Green API
async function drGreenRequest(endpoint: string, method: string, body?: object): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const privateKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  
  if (!apiKey || !privateKey) {
    throw new Error("Dr Green API credentials not configured");
  }
  
  const payload = body ? JSON.stringify(body) : "";
  const signature = await signPayload(payload, privateKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  };
  
  const url = `${DRGREEN_API_URL}${endpoint}`;
  console.log(`Dr Green API request: ${method} ${url}`);
  
  return fetch(url, {
    method,
    headers,
    body: payload || undefined,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting strain sync from Dr Green API...");
    
    // Fetch all strains from Dr Green API
    const response = await drGreenRequest("/strains", "GET");
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dr Green API error:", response.status, errorText);
      throw new Error(`Dr Green API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data?.data?.strains?.length || 0} strains from Dr Green API`);
    
    if (!data?.success || !data?.data?.strains?.length) {
      return new Response(
        JSON.stringify({ success: false, message: "No strains returned from API", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const strains = data.data.strains;
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const strain of strains) {
      try {
        // Build full image URL
        let imageUrl = null;
        if (strain.imageUrl) {
          imageUrl = strain.imageUrl.startsWith('http') 
            ? strain.imageUrl 
            : `${S3_BASE}${strain.imageUrl}`;
        }
        
        // Parse effects/feelings
        const feelings = strain.feelings 
          ? strain.feelings.split(',').map((s: string) => s.trim())
          : [];
        
        const flavors = strain.flavour
          ? strain.flavour.split(',').map((s: string) => s.trim())
          : [];
        
        const helpsWith = strain.helpsWith
          ? strain.helpsWith.split(',').map((s: string) => s.trim())
          : [];
        
        // Get availability from strainLocations
        const location = strain.strainLocations?.[0];
        const isAvailable = location?.isAvailable ?? true;
        const stock = location?.stockQuantity ?? 0;
        
        // Upsert strain into local database
        const { error: upsertError } = await supabase
          .from('strains')
          .upsert({
            id: strain.id,
            sku: strain.batchNumber || strain.id,
            name: strain.name,
            description: strain.description || '',
            type: strain.type || 'Hybrid',
            thc_content: strain.thc || strain.thcContent || 0,
            cbd_content: strain.cbd || strain.cbdContent || 0,
            cbg_content: strain.cbg || strain.cbgContent || 0,
            retail_price: strain.retailPrice || 0,
            availability: isAvailable,
            stock: stock,
            image_url: imageUrl,
            feelings: feelings,
            flavors: flavors,
            helps_with: helpsWith,
            brand_name: 'Dr. Green',
            is_archived: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        if (upsertError) {
          console.error(`Error upserting strain ${strain.name}:`, upsertError);
          errorCount++;
        } else {
          console.log(`Synced strain: ${strain.name}`);
          syncedCount++;
        }
      } catch (strainError) {
        console.error(`Error processing strain ${strain.name}:`, strainError);
        errorCount++;
      }
    }
    
    console.log(`Sync complete: ${syncedCount} synced, ${errorCount} errors`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${syncedCount} strains from Dr Green API`,
        synced: syncedCount,
        errors: errorCount,
        total: strains.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Sync strains error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
