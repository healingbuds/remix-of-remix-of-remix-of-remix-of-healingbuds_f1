import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { formatPrice } from "@/lib/currency";
import { 
  FileText, 
  Leaf, 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  DollarSign,
  RefreshCw,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface DashboardStats {
  pendingPrescriptions: number;
  approvedPrescriptions: number;
  totalStrains: number;
  availableStrains: number;
  totalOrders: number;
  totalClients: number;
  verifiedClients: number;
  // Dr Green Dapp live stats
  dappTotalClients?: number;
  dappTotalOrders?: number;
  dappTotalSales?: number;
  dappPendingClients?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getDashboardSummary, getSalesSummary } = useDrGreenApi();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

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
      await fetchStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const fetchStats = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    
    try {
      // Fetch prescription stats from Supabase
      const { data: prescriptions } = await supabase
        .from('prescription_documents')
        .select('status');

      const pendingPrescriptions = prescriptions?.filter(p => p.status === 'pending').length || 0;
      const approvedPrescriptions = prescriptions?.filter(p => p.status === 'approved').length || 0;

      // Fetch strain stats from Supabase
      const { data: strains } = await supabase
        .from('strains')
        .select('availability, is_archived');

      const totalStrains = strains?.length || 0;
      const availableStrains = strains?.filter(s => s.availability && !s.is_archived).length || 0;

      // Fetch order stats from Supabase
      const { data: orders } = await supabase
        .from('drgreen_orders')
        .select('status');

      const totalOrders = orders?.length || 0;

      // Fetch client stats from Supabase
      const { data: clients } = await supabase
        .from('drgreen_clients')
        .select('is_kyc_verified, admin_approval');

      const totalClients = clients?.length || 0;
      const verifiedClients = clients?.filter(c => c.is_kyc_verified && c.admin_approval === 'VERIFIED').length || 0;

      // Fetch LIVE stats from Dr Green Dapp API
      let dappTotalClients = 0;
      let dappTotalOrders = 0;
      let dappTotalSales = 0;
      let dappPendingClients = 0;

      try {
        const { data: dappSummary, error: dappError } = await getDashboardSummary();
        if (!dappError && dappSummary) {
          dappTotalClients = dappSummary.totalClients || 0;
          dappTotalOrders = dappSummary.totalOrders || 0;
          dappPendingClients = dappSummary.pendingClients || 0;
        }
        
        const { data: salesSummary, error: salesError } = await getSalesSummary();
        if (!salesError && salesSummary) {
          dappTotalSales = salesSummary.totalSales || 0;
        }
      } catch (dappErr) {
        console.log('Dr Green Dapp API stats not available:', dappErr);
      }

      setStats({
        pendingPrescriptions,
        approvedPrescriptions,
        totalStrains,
        availableStrains,
        totalOrders,
        totalClients,
        verifiedClients,
        dappTotalClients,
        dappTotalOrders,
        dappTotalSales,
        dappPendingClients,
      });

      if (showRefreshToast) {
        toast({
          title: "Data Refreshed",
          description: "Dashboard statistics updated from live API.",
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" description="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
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

  const statCards = [
    // Dr Green Dapp Live Stats (from API)
    {
      title: "Total Clients (Live)",
      value: stats?.dappTotalClients || 0,
      icon: Users,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      live: true
    },
    {
      title: "Pending Clients (Live)",
      value: stats?.dappPendingClients || 0,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      live: true
    },
    {
      title: "Total Orders (Live)",
      value: stats?.dappTotalOrders || 0,
      icon: ShoppingCart,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      live: true
    },
    {
      title: "Total Sales (Live)",
      value: formatPrice(stats?.dappTotalSales || 0, 'ZA'),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      live: true
    },
    // Local Stats
    {
      title: "Pending Prescriptions",
      value: stats?.pendingPrescriptions || 0,
      icon: FileText,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      link: "/admin/prescriptions"
    },
    {
      title: "Approved Prescriptions",
      value: stats?.approvedPrescriptions || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/admin/prescriptions"
    },
    {
      title: "Total Strains",
      value: stats?.totalStrains || 0,
      icon: Leaf,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/strains"
    },
    {
      title: "Available Strains",
      value: stats?.availableStrains || 0,
      icon: Leaf,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      link: "/admin/strains"
    },
  ];

  const quickLinks = [
    {
      title: "View Customers",
      description: "View customer KYC verification status",
      icon: Users,
      link: "/admin/customers",
      badge: stats?.dappPendingClients ? `${stats.dappPendingClients} pending` : null
    },
    {
      title: "Review Prescriptions",
      description: "Manage patient prescription documents",
      icon: FileText,
      link: "/admin/prescriptions",
      badge: stats?.pendingPrescriptions ? `${stats.pendingPrescriptions} pending` : null
    },
    {
      title: "Manage Strains",
      description: "View and sync strain catalog",
      icon: Leaf,
      link: "/admin/strains",
      badge: null
    },
  ];

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Live store data"
    >
      {/* Refresh Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className={stat.link ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                {stat.live && (
                  <span className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    {link.badge && (
                      <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{link.description}</CardDescription>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={link.link}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-8 bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
        <strong>Note:</strong> Client verification is managed automatically.
        This admin portal provides read-only access to customer verification status.
        Status updates occur after KYC completion.
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
