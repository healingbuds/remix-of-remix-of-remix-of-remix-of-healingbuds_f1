import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatPrice } from "@/lib/currency";
import {
  ShoppingCart,
  RefreshCw,
  Loader2,
  Search,
  Package,
  Eye,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Order {
  id: string;
  clientId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: Array<object>;
}

interface OrderDetails {
  id: string;
  clientId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: Array<{
    strainId?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  shippingAddress: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode?: string;
  };
  createdAt: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getDappOrders, getDappOrderDetails } = useDrGreenApi();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, page, paymentFilter, statusFilter]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const fetchOrders = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    
    try {
      const params: Record<string, unknown> = {
        page,
        take: 20,
        orderBy: 'desc',
      };

      if (searchQuery) {
        params.search = searchQuery;
        params.searchBy = 'id';
      }

      const { data, error } = await getDappOrders(params as Parameters<typeof getDappOrders>[0]);

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders from API",
          variant: "destructive",
        });
        return;
      }

      let filteredOrders = data?.orders || [];
      
      // Client-side filtering for payment status
      if (paymentFilter !== "all") {
        filteredOrders = filteredOrders.filter(o => 
          o.paymentStatus?.toLowerCase() === paymentFilter.toLowerCase()
        );
      }
      
      // Client-side filtering for order status
      if (statusFilter !== "all") {
        filteredOrders = filteredOrders.filter(o => 
          o.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      setOrders(filteredOrders);
      setTotalOrders(data?.total || 0);

      if (showRefreshToast) {
        toast({
          title: "Data Refreshed",
          description: `Loaded ${filteredOrders.length} orders from API`,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    setDetailsLoading(true);
    
    try {
      const { data, error } = await getDappOrderDetails(orderId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch order details",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedOrder(data as OrderDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Cancelled</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'completed':
      case 'delivered':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">{status}</Badge>;
      case 'processing':
      case 'confirmed':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">{status}</Badge>;
      case 'shipped':
        return <Badge className="bg-cyan-500/20 text-cyan-600 border-cyan-500/30">{status}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">{status}</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Orders" description="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have administrator privileges.
          </p>
          <Button onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Orders" 
      description="View and manage orders from Dr Green API"
    >
      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Payment Status Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            {/* Order Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders
              </CardTitle>
              <CardDescription>
                {totalOrders} total orders from Dr Green API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.totalAmount || 0, 'ZA')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalOrders > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {Math.ceil(totalOrders / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(totalOrders / 20)}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Order Status</span>
                  <div className="mt-1">{getOrderStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <div className="mt-1 font-semibold">
                    {formatPrice(selectedOrder.totalAmount || 0, 'ZA')}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between">
                      <span>{item.name || item.strainId || `Item ${idx + 1}`}</span>
                      <span className="text-muted-foreground">
                        {item.quantity || 1} × {formatPrice(item.unitPrice || 0, 'ZA')}
                      </span>
                    </div>
                  )) || (
                    <div className="p-3 text-muted-foreground">No items data</div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <div className="text-sm text-muted-foreground border rounded-lg p-3">
                    {selectedOrder.shippingAddress.street && <p>{selectedOrder.shippingAddress.street}</p>}
                    {selectedOrder.shippingAddress.city && <p>{selectedOrder.shippingAddress.city}</p>}
                    {selectedOrder.shippingAddress.postalCode && <p>{selectedOrder.shippingAddress.postalCode}</p>}
                    {selectedOrder.shippingAddress.countryCode && <p>{selectedOrder.shippingAddress.countryCode}</p>}
                    {!selectedOrder.shippingAddress.street && !selectedOrder.shippingAddress.city && (
                      <p>No shipping address provided</p>
                    )}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="text-sm text-muted-foreground">
                Created: {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), 'PPpp') : '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
