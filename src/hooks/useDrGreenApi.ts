import { supabase } from '@/integrations/supabase/client';

interface DrGreenResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

// Country code conversion map (Alpha-2 to Alpha-3)
const countryCodeMap: Record<string, string> = {
  PT: 'PRT',
  GB: 'GBR',
  ZA: 'ZAF',
  TH: 'THA',
  US: 'USA',
};

export function useDrGreenApi() {
  const callProxy = async <T = unknown>(
    action: string,
    data?: Record<string, unknown>
  ): Promise<DrGreenResponse<T>> => {
    try {
      console.log(`[DrGreen API] Calling action: ${action}`);
      
      const { data: response, error } = await supabase.functions.invoke('drgreen-proxy', {
        body: { action, ...data },
      });

      if (error) {
        console.error(`[DrGreen API] Edge function error for ${action}:`, error);
        return { data: null, error: error.message };
      }

      // Check for error in response body (API returned error)
      if (response?.error || response?.success === false) {
        console.error(`[DrGreen API] API error in response for ${action}:`, response);
        return { data: null, error: response.error || response.message || 'API request failed' };
      }

      // Check for empty response
      if (!response) {
        console.error(`[DrGreen API] Empty response for ${action}`);
        return { data: null, error: 'Empty response from API' };
      }

      console.log(`[DrGreen API] Success for ${action}:`, response);
      return { data: response as T, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[DrGreen API] Exception for ${action}:`, err);
      return { data: null, error: message };
    }
  };

  // Create an order with the Dr Green API
  const createOrder = async (orderData: {
    clientId: string;
    items: Array<{
      strainId: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      countryCode: string;
    };
  }) => {
    return callProxy<{
      orderId: string;
      status: string;
      totalAmount: number;
    }>('create-order', { data: orderData });
  };

  // Create a payment for an order
  const createPayment = async (paymentData: {
    orderId: string;
    amount: number;
    currency: string;
    clientId: string;
  }) => {
    return callProxy<{
      paymentId: string;
      status: string;
      paymentUrl?: string;
    }>('create-payment', { data: paymentData });
  };

  // Get payment status
  const getPayment = async (paymentId: string) => {
    return callProxy<{
      paymentId: string;
      status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
      amount: number;
      orderId: string;
    }>('get-payment', { paymentId });
  };

  // Get order details
  const getOrder = async (orderId: string) => {
    return callProxy<{
      orderId: string;
      status: string;
      items: Array<{
        strainId: string;
        quantity: number;
        unitPrice: number;
      }>;
      totalAmount: number;
      paymentStatus: string;
    }>('get-order', { orderId });
  };

  // Update order status (after payment confirmation)
  const updateOrder = async (orderId: string, data: {
    status?: string;
    paymentStatus?: string;
  }) => {
    return callProxy<{
      orderId: string;
      status: string;
      paymentStatus: string;
    }>('update-order', { orderId, data });
  };

  // Get user's orders
  const getOrders = async (clientId: string) => {
    return callProxy<Array<{
      orderId: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      paymentStatus: string;
    }>>('get-orders', { clientId });
  };

  // Get strains by country (client-facing)
  const getStrains = async (countryCode: string) => {
    const alpha3Code = countryCodeMap[countryCode] || countryCode;
    return callProxy<Array<{
      id: string;
      name: string;
      description: string;
      thcContent: number;
      cbdContent: number;
      retailPrice: number;
      availability: boolean;
      images: string[];
    }>>('get-strains', { countryCode: alpha3Code });
  };

  // ==========================================
  // ADMIN / DASHBOARD ENDPOINTS
  // ==========================================
  
  // Get dashboard summary (total clients, orders, sales, etc.)
  const getDashboardSummary = async () => {
    return callProxy<{
      totalClients: number;
      totalOrders: number;
      totalSales: number;
      pendingOrders: number;
      verifiedClients: number;
      pendingClients: number;
    }>('dashboard-summary');
  };

  // Get dashboard analytics
  const getDashboardAnalytics = async (params?: {
    startDate?: string;
    endDate?: string;
    filterBy?: string;
    orderBy?: 'asc' | 'desc';
  }) => {
    return callProxy<{
      salesData: Array<{ date: string; amount: number }>;
      ordersData: Array<{ date: string; count: number }>;
    }>('dashboard-analytics', params);
  };

  // Get sales summary
  const getSalesSummary = async () => {
    return callProxy<{
      totalSales: number;
      monthlySales: number;
      weeklySales: number;
      dailySales: number;
    }>('sales-summary');
  };

  // Get all Dapp clients (paginated)
  const getDappClients = async (params?: {
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
    status?: string;
    kyc?: boolean;
    adminApproval?: string;
  }) => {
    return callProxy<{
      clients: Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isKYCVerified: boolean;
        adminApproval: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      take: number;
    }>('dapp-clients', params);
  };

  // Get client details
  const getDappClientDetails = async (clientId: string) => {
    return callProxy<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      address: object;
      isKYCVerified: boolean;
      adminApproval: string;
      createdAt: string;
      orders: Array<object>;
    }>('dapp-client-details', { clientId });
  };

  // Note: Client verification is managed by the backend automatically.
  // Admin cannot manually verify/reject clients - this is handled by the KYC system.

  // Get all Dapp orders (paginated)
  const getDappOrders = async (params?: {
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
    adminApproval?: string;
    clientIds?: string[];
  }) => {
    return callProxy<{
      orders: Array<{
        id: string;
        clientId: string;
        status: string;
        paymentStatus: string;
        totalAmount: number;
        createdAt: string;
        items: Array<object>;
      }>;
      total: number;
      page: number;
      take: number;
    }>('dapp-orders', params);
  };

  // Get order details
  const getDappOrderDetails = async (orderId: string) => {
    return callProxy<{
      id: string;
      clientId: string;
      status: string;
      paymentStatus: string;
      totalAmount: number;
      items: Array<object>;
      shippingAddress: object;
      createdAt: string;
    }>('dapp-order-details', { orderId });
  };

  // Update order status
  const updateDappOrder = async (orderId: string, data: {
    orderStatus?: string;
    paymentStatus?: string;
  }) => {
    return callProxy<{ success: boolean; message: string }>('dapp-update-order', { orderId, ...data });
  };

  // Get Dapp strains by country
  const getDappStrains = async (params?: {
    countryCode?: string;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
  }) => {
    return callProxy<{
      strains: Array<{
        id: string;
        name: string;
        thcContent: number;
        cbdContent: number;
        retailPrice: number;
        availability: boolean;
      }>;
    }>('dapp-strains', params);
  };

  // ==========================================
  // NEW ENDPOINTS FROM POSTMAN COLLECTION
  // ==========================================
  
  // Get current authenticated user details from Dr Green
  const getUserMe = async () => {
    return callProxy<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      walletAddress?: string;
      nfts?: Array<{ id: string; tokenId: string; type: string }>;
    }>('get-user-me');
  };

  // Delete a client (admin only)
  const deleteClient = async (clientId: string) => {
    return callProxy<{ success: boolean; message: string }>('delete-client', { clientId });
  };

  // Partial update client details (admin only)
  const patchClient = async (clientId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
  }) => {
    return callProxy<{ success: boolean; client: object }>('patch-client', { clientId, data });
  };

  // Note: activateClient and deactivateClient removed - admin portal is read-only
  // Client activation/deactivation is managed by the backend automatically.

  // Bulk delete clients (admin only, max 50)
  const bulkDeleteClients = async (clientIds: string[]) => {
    return callProxy<{ success: boolean; deleted: number; failed: number }>('bulk-delete-clients', { clientIds });
  };

  return {
    // Existing methods
    createOrder,
    createPayment,
    getPayment,
    getOrder,
    updateOrder,
    getOrders,
    getStrains,
    callProxy,
    // Admin methods (read-only)
    getDashboardSummary,
    getDashboardAnalytics,
    getSalesSummary,
    getDappClients,
    getDappClientDetails,
    getDappOrders,
    getDappOrderDetails,
    updateDappOrder,
    getDappStrains,
    // New endpoints from Postman collection
    getUserMe,
    deleteClient,
    patchClient,
    bulkDeleteClients,
  };
}
