import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin-only actions that require admin role
const ADMIN_ACTIONS = [
  'dashboard-summary', 'dashboard-analytics', 'sales-summary',
  'dapp-clients', 'dapp-client-details', 'dapp-verify-client',
  'dapp-orders', 'dapp-order-details', 'dapp-update-order',
  'dapp-carts', 'dapp-nfts', 'dapp-strains', 'dapp-clients-list',
  'update-order', 'update-client'
];

// Actions that require ownership verification (user must own the resource)
const OWNERSHIP_ACTIONS = [
  'get-client', 'get-cart-legacy', 'get-cart',
  'add-to-cart', 'remove-from-cart', 'empty-cart',
  'place-order', 'get-order', 'get-orders'
];

// Public actions that don't require authentication (minimal - only webhooks/health)
const PUBLIC_ACTIONS: string[] = [];

// Country-gated actions: open countries (ZA, TH) don't require auth, restricted (GB, PT) do
const COUNTRY_GATED_ACTIONS = [
  'get-strains', 'get-all-strains', 'get-strains-legacy', 'get-strain'
];

// Open countries where unauthenticated users can browse products
const OPEN_COUNTRIES = ['ZAF', 'THA'];

// Authenticated but no ownership check needed
const AUTH_ONLY_ACTIONS: string[] = [];

/**
 * Verify user authentication and return user data
 */
async function verifyAuthentication(req: Request): Promise<{ user: any; supabaseClient: any } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return null;
  }

  return { user, supabaseClient };
}

/**
 * Check if user has admin role
 */
async function isAdmin(supabaseClient: any, userId: string): Promise<boolean> {
  const { data } = await supabaseClient
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  return !!data;
}

/**
 * Verify user owns the client resource
 */
async function verifyClientOwnership(
  supabaseClient: any, 
  userId: string, 
  clientId: string
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('drgreen_clients')
    .select('user_id')
    .eq('drgreen_client_id', clientId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.user_id === userId;
}

// Use production API
const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";

// API timeout in milliseconds (20 seconds)
const API_TIMEOUT_MS = 20000;

/**
 * Sign payload using HMAC-SHA256 (matching WordPress legacy)
 * Uses native Web Crypto API
 * This is used for POST requests and singular GET requests (Method A)
 */
async function signPayload(payload: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import the secret key for HMAC
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Sign the payload
  const payloadData = encoder.encode(payload);
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
  
  // Convert ArrayBuffer to base64 string
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  return btoa(binary);
}

/**
 * Sign query string using HMAC-SHA256 (matching WordPress legacy)
 * This is used for GET list endpoints (Method B)
 */
async function signQueryString(queryString: string, secretKey: string): Promise<string> {
  return signPayload(queryString, secretKey);
}

/**
 * Make authenticated request to Dr Green API with body signing (Method A)
 * Used for: POST, DELETE, and singular GET endpoints
 */
async function drGreenRequestBody(
  endpoint: string,
  method: string,
  body?: object
): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const secretKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  
  if (!apiKey || !secretKey) {
    throw new Error("Dr Green API credentials not configured");
  }
  
  const payload = body ? JSON.stringify(body) : "";
  const signature = await signPayload(payload, secretKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  };
  
  const url = `${DRGREEN_API_URL}${endpoint}`;
  console.log(`[DrGreen API - Body Sign] ${method} ${url}`);
  console.log(`[DrGreen API] Payload for signing: ${payload}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? payload : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timed out. Please try again.');
    }
    throw error;
  }
}

/**
 * Make authenticated request to Dr Green API with query string signing (Method B)
 * Used for: GET list endpoints (strains list, carts list, etc.)
 */
async function drGreenRequestQuery(
  endpoint: string,
  queryParams: Record<string, string | number>
): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const secretKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  
  if (!apiKey || !secretKey) {
    throw new Error("Dr Green API credentials not configured");
  }
  
  // Build query string exactly like WordPress: http_build_query
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    params.append(key, String(value));
  }
  const queryString = params.toString();
  
  // Sign the query string (not the body)
  const signature = await signQueryString(queryString, secretKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  };
  
  const url = `${DRGREEN_API_URL}${endpoint}?${queryString}`;
  console.log(`[DrGreen API - Query Sign] GET ${url}`);
  console.log(`[DrGreen API] Query for signing: ${queryString}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timed out. Please try again.');
    }
    throw error;
  }
}

/**
 * Legacy request handler for backwards compatibility
 * Uses body signing for all requests
 */
async function drGreenRequest(
  endpoint: string,
  method: string,
  body?: object
): Promise<Response> {
  return drGreenRequestBody(endpoint, method, body);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Remove "drgreen-proxy" from path
    const apiPath = pathParts.slice(1).join("/");
    
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.json();
      } catch {
        body = undefined;
      }
    }
    
    // Route handling
    const action = body?.action || apiPath;
    
    console.log(`[DrGreen Proxy] Processing action: ${action}`, { method: req.method });

    // ==========================================
    // AUTHENTICATION & AUTHORIZATION CHECK
    // ==========================================
    
    // Check if action is public (no auth required)
    const isPublicAction = PUBLIC_ACTIONS.includes(action);
    
    // Check if action is country-gated (open countries don't require auth)
    const isCountryGatedAction = COUNTRY_GATED_ACTIONS.includes(action);
    
    // Check if action only requires authentication (no ownership check)
    const isAuthOnlyAction = AUTH_ONLY_ACTIONS.includes(action);
    
    // Handle country-gated actions (strains)
    if (isCountryGatedAction) {
      const countryCode = body?.countryCode;
      const isOpenCountry = countryCode && OPEN_COUNTRIES.includes(countryCode);
      
      if (isOpenCountry) {
        // Open countries (ZA, TH) can access without auth
        console.log(`[Audit] Unauthenticated access to ${action} for open country: ${countryCode}`);
      } else {
        // Restricted countries (GB, PT) or no country specified require auth
        const authResult = await verifyAuthentication(req);
        
        if (!authResult) {
          console.warn(`[Security] Unauthenticated request to ${action} for country: ${countryCode || 'unspecified'}`);
          return new Response(
            JSON.stringify({ error: 'Authentication required. Please sign in to view products.' }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`[Audit] Authenticated user ${authResult.user.id} accessing ${action} for country: ${countryCode}`);
      }
    } else if (!isPublicAction) {
      // Non-country-gated, non-public actions require authentication
      const authResult = await verifyAuthentication(req);
      
      if (!authResult) {
        console.warn(`[Security] Unauthenticated request to ${action}`);
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { user, supabaseClient } = authResult;

      // Check admin role for admin-only endpoints
      if (ADMIN_ACTIONS.includes(action)) {
        const hasAdminRole = await isAdmin(supabaseClient, user.id);
        
        if (!hasAdminRole) {
          console.warn(`[Security] Non-admin user ${user.id} attempted to access ${action}`);
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`[Audit] Admin ${user.id} (${user.email}) accessed ${action}`);
      }

      // Verify resource ownership for client-specific operations
      if (OWNERSHIP_ACTIONS.includes(action)) {
        const clientId = body?.clientId || body?.data?.clientId;
        
        if (clientId) {
          // Check ownership or admin status
          const ownsResource = await verifyClientOwnership(supabaseClient, user.id, clientId);
          
          if (!ownsResource) {
            const hasAdminRole = await isAdmin(supabaseClient, user.id);
            
            if (!hasAdminRole) {
              console.warn(`[Security] User ${user.id} attempted to access client ${clientId}`);
              return new Response(
                JSON.stringify({ error: 'Access denied' }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      }

      // Special case: create-client-legacy and create-client don't require ownership 
      // (new client creation) but do require authentication
      if (action === 'create-client-legacy' || action === 'create-client') {
        console.log(`[Audit] User ${user.id} (${user.email}) creating new client`);
      }
    }

    // ==========================================
    // ROUTE PROCESSING
    // ==========================================
    
    let response: Response;
    
    switch (action) {
      // ==========================================
      // LEGACY WORDPRESS-COMPATIBLE ENDPOINTS
      // ==========================================
      
      // Create client with legacy payload format (Method A - Body Sign)
      case "create-client-legacy": {
        const payload = body?.payload;
        if (!payload) throw new Error("Payload is required for client creation");
        
        console.log("[DrGreen Proxy] Creating client with legacy payload:", JSON.stringify(payload, null, 2));
        response = await drGreenRequestBody("/clients/", "POST", payload);
        break;
      }
      
      // Get strains list with query signing (Method B - Query Sign)
      case "get-strains-legacy": {
        const { countryCode, orderBy, take, page } = body || {};
        const queryParams: Record<string, string | number> = {
          orderBy: orderBy || 'desc',
          take: take || 10,
          page: page || 1,
        };
        if (countryCode) queryParams.countryCode = countryCode;
        
        response = await drGreenRequestQuery("/strains", queryParams);
        break;
      }
      
      // Get cart with query signing (Method B - Query Sign)
      case "get-cart-legacy": {
        const { clientId, orderBy, take, page } = body || {};
        if (!clientId) throw new Error("clientId is required");
        
        const queryParams: Record<string, string | number> = {
          orderBy: orderBy || 'desc',
          take: take || 10,
          page: page || 1,
          clientId: clientId,
        };
        
        response = await drGreenRequestQuery("/carts", queryParams);
        break;
      }
      
      // Add to cart (Method A - Body Sign)
      case "add-to-cart": {
        const cartData = body?.data;
        if (!cartData) throw new Error("Cart data is required");
        
        response = await drGreenRequestBody("/carts", "POST", cartData);
        break;
      }
      
      // Remove from cart (Method A - Body Sign for signature, query for strainId)
      case "remove-from-cart": {
        const { cartId, strainId } = body || {};
        if (!cartId || !strainId) throw new Error("cartId and strainId are required");
        
        // WordPress signs {"cartId": basketId} but passes strainId as query param
        const signPayloadData = { cartId };
        const signature = await signPayload(JSON.stringify(signPayloadData), Deno.env.get("DRGREEN_PRIVATE_KEY")!);
        
        const apiKey = Deno.env.get("DRGREEN_API_KEY")!;
        const apiUrl = `${DRGREEN_API_URL}/carts/${cartId}?strainId=${strainId}`;
        
        console.log(`[DrGreen API - Remove Cart] DELETE ${apiUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        
        response = await fetch(apiUrl, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-auth-apikey": apiKey,
            "x-auth-signature": signature,
          },
          body: JSON.stringify(signPayloadData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        break;
      }
      
      // Empty cart (Method A - Body Sign)
      case "empty-cart": {
        const { cartId } = body || {};
        if (!cartId) throw new Error("cartId is required");
        
        response = await drGreenRequestBody(`/carts/${cartId}`, "DELETE", { cartId });
        break;
      }
      
      // Place order (Method A - Body Sign)
      case "place-order": {
        const orderData = body?.data;
        if (!orderData) throw new Error("Order data is required");
        
        response = await drGreenRequestBody("/orders", "POST", orderData);
        break;
      }
      
      // ==========================================
      // DAPP ADMIN ENDPOINTS
      // ==========================================
      
      case "dashboard-summary": {
        response = await drGreenRequest("/dapp/dashboard/summary", "GET");
        break;
      }
      
      case "dashboard-analytics": {
        const { startDate, endDate, filterBy, orderBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'asc'}`;
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;
        if (filterBy) queryParams += `&filterBy=${filterBy}`;
        response = await drGreenRequest(`/dapp/dashboard/analytics${queryParams}`, "GET");
        break;
      }
      
      case "sales-summary": {
        response = await drGreenRequest("/dapp/sales/summary", "GET");
        break;
      }
      
      case "dapp-clients": {
        const { page, take, orderBy, search, searchBy, status, kyc, adminApproval } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        if (status) queryParams += `&status=${status}`;
        if (kyc) queryParams += `&kyc=${kyc}`;
        if (adminApproval) queryParams += `&adminApproval=${adminApproval}`;
        response = await drGreenRequest(`/dapp/clients${queryParams}`, "GET");
        break;
      }
      
      case "dapp-client-details": {
        const { clientId } = body || {};
        if (!clientId) throw new Error("clientId is required");
        response = await drGreenRequest(`/dapp/clients/${clientId}`, "GET");
        break;
      }
      
      case "dapp-verify-client": {
        const { clientId, action: verifyAction } = body || {};
        if (!clientId || !verifyAction) throw new Error("clientId and action are required");
        response = await drGreenRequest(`/dapp/clients/${clientId}/${verifyAction}`, "PATCH");
        break;
      }
      
      case "dapp-orders": {
        const { page, take, orderBy, search, searchBy, adminApproval, clientIds } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        if (adminApproval) queryParams += `&adminApproval=${adminApproval}`;
        if (clientIds) queryParams += `&clientIds=${JSON.stringify(clientIds)}`;
        response = await drGreenRequest(`/dapp/orders${queryParams}`, "GET");
        break;
      }
      
      case "dapp-order-details": {
        const { orderId } = body || {};
        if (!orderId) throw new Error("orderId is required");
        response = await drGreenRequest(`/dapp/orders/${orderId}`, "GET");
        break;
      }
      
      case "dapp-update-order": {
        const { orderId, orderStatus, paymentStatus } = body || {};
        if (!orderId) throw new Error("orderId is required");
        response = await drGreenRequest(`/dapp/orders/${orderId}`, "PATCH", { orderStatus, paymentStatus });
        break;
      }
      
      case "dapp-carts": {
        const { page, take, orderBy, search, searchBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        response = await drGreenRequest(`/dapp/carts${queryParams}`, "GET");
        break;
      }
      
      case "dapp-nfts": {
        response = await drGreenRequest("/dapp/users/nfts", "GET");
        break;
      }
      
      case "dapp-strains": {
        const { countryCode, orderBy, search, searchBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}`;
        if (countryCode) queryParams += `&countryCode=${countryCode}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        response = await drGreenRequest(`/dapp/strains${queryParams}`, "GET");
        break;
      }
      
      case "dapp-clients-list": {
        const { orderBy, status, kyc } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}`;
        if (status) queryParams += `&status=${status}`;
        if (kyc) queryParams += `&kyc=${kyc}`;
        response = await drGreenRequest(`/dapp/clients/list${queryParams}`, "GET");
        break;
      }
      
      // ==========================================
      // EXISTING CLIENT/SHOP ENDPOINTS (BACKWARDS COMPAT)
      // ==========================================
      
      case "create-client": {
        const { personal, address, medicalRecord } = body.data || {};
        
        // Build schema-compliant payload for KYC API
        const kycPayload = {
          transaction_metadata: {
            source: "Healingbuds_Web_Store",
            timestamp: new Date().toISOString(),
            flow_type: "Onboarding_KYC_v1"
          },
          user_identity: {
            first_name: personal?.firstName || "",
            last_name: personal?.lastName || "",
            dob: personal?.dateOfBirth || "",
            email: personal?.email || "",
            phone_number: personal?.phone || ""
          },
          eligibility_results: {
            age_verified: true,
            region_eligible: true,
            postal_code: address?.postalCode || "",
            country_code: address?.country || "PT",
            declared_medical_patient: medicalRecord?.doctorApproval || false
          },
          shipping_address: {
            street: address?.street || "",
            city: address?.city || "",
            postal_code: address?.postalCode || "",
            country: address?.country || "PT"
          },
          medical_record: {
            conditions: medicalRecord?.conditions || "",
            current_medications: medicalRecord?.currentMedications || "",
            allergies: medicalRecord?.allergies || "",
            previous_cannabis_use: medicalRecord?.previousCannabisUse || false
          },
          kyc_requirements: {
            document_type: "Government_ID",
            id_country: address?.country || "PT",
            selfie_required: true,
            liveness_check: "active"
          }
        };
        
        console.log("Creating client with KYC payload:", JSON.stringify(kycPayload, null, 2));
        response = await drGreenRequest("/dapp/clients", "POST", kycPayload);
        break;
      }
      
      case "request-kyc-link": {
        const { clientId, personal, address } = body.data || {};
        
        if (!clientId) {
          throw new Error("clientId is required for KYC link request");
        }
        
        const kycLinkPayload = {
          transaction_metadata: {
            source: "Healingbuds_Web_Store",
            timestamp: new Date().toISOString(),
            flow_type: "KYC_Link_Retry_v1"
          },
          client_id: clientId,
          user_identity: {
            first_name: personal?.firstName || "",
            last_name: personal?.lastName || "",
            email: personal?.email || ""
          },
          kyc_requirements: {
            document_type: "Government_ID",
            id_country: address?.country || "PT",
            selfie_required: true,
            liveness_check: "active"
          }
        };
        
        console.log("Requesting KYC link with payload:", JSON.stringify(kycLinkPayload, null, 2));
        response = await drGreenRequest(`/dapp/clients/${clientId}/kyc-link`, "POST", kycLinkPayload);
        break;
      }
      
      case "get-client": {
        // Method A - Body Sign: signs {"clientId": "..."}
        const signBody = { clientId: body.clientId };
        response = await drGreenRequestBody(`/clients/${body.clientId}`, "GET", signBody);
        break;
      }
      
      case "update-client": {
        response = await drGreenRequest(`/dapp/clients/${body.clientId}`, "PUT", body.data);
        break;
      }
      
      case "get-strains": {
        const countryCode = body?.countryCode || "PRT";
        console.log(`Fetching strains for country: ${countryCode}`);
        response = await drGreenRequest(`/dapp/strains?countryCode=${countryCode}`, "GET");
        break;
      }
      
      case "get-all-strains": {
        console.log("Fetching all strains (no country filter)");
        response = await drGreenRequest("/dapp/strains", "GET");
        break;
      }
      
      case "get-strain": {
        // Method A - Body Sign: signs {"strainId": "..."}
        const signBody = { strainId: body.strainId };
        response = await drGreenRequestBody(`/strains/${body.strainId}`, "GET", signBody);
        break;
      }
      
      case "create-cart": {
        response = await drGreenRequest("/dapp/carts", "POST", body.data);
        break;
      }
      
      case "update-cart": {
        response = await drGreenRequest(`/dapp/carts/${body.cartId}`, "PUT", body.data);
        break;
      }
      
      case "get-cart": {
        response = await drGreenRequest(`/dapp/carts/${body.cartId}`, "GET");
        break;
      }
      
      case "create-order": {
        response = await drGreenRequest("/dapp/orders", "POST", body.data);
        break;
      }
      
      case "get-order": {
        // Method A - Body Sign: signs {"orderId": "..."}
        const signBody = { orderId: body.orderId };
        response = await drGreenRequestBody(`/orders/${body.orderId}`, "GET", signBody);
        break;
      }
      
      case "update-order": {
        response = await drGreenRequest(`/dapp/orders/${body.orderId}`, "PATCH", body.data);
        break;
      }
      
      case "get-orders": {
        // Method A - Body Sign: signs {"clientId": "..."}
        const signBody = { clientId: body.clientId };
        response = await drGreenRequestBody(`/client/${body.clientId}/orders`, "GET", signBody);
        break;
      }
      
      case "create-payment": {
        response = await drGreenRequest("/dapp/payments", "POST", body.data);
        break;
      }
      
      case "get-payment": {
        response = await drGreenRequest(`/dapp/payments/${body.paymentId}`, "GET");
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", action }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    const data = await response.json();
    console.log(`[DrGreen API] Response status: ${response.status}`);
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("[DrGreen Proxy] Error:", error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (message.includes('timed out')) {
      statusCode = 504; // Gateway Timeout
    } else if (message.includes('required')) {
      statusCode = 400; // Bad Request
    } else if (message.includes('Unprocessable') || message.includes('422')) {
      statusCode = 422; // Unprocessable Entity (e.g., blurry ID)
    }
    
    return new Response(
      JSON.stringify({ 
        error: message,
        errorCode: statusCode === 422 ? 'DOCUMENT_QUALITY' : statusCode === 504 ? 'TIMEOUT' : 'SERVER_ERROR',
        retryable: statusCode !== 400,
        success: false
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
