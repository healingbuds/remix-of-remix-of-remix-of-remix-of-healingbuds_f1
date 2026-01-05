import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Users,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  clientId?: string;
  fullName?: string;
  email?: string;
  countryCode?: string;
  isKYCVerified?: boolean;
  adminApproval?: string;
  createdAt?: string;
  kycLink?: string;
}

export function CustomerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getDappClients, verifyDappClient } = useDrGreenApi();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch clients from Dr. Green API
  const { data: clientsData, isLoading, error, refetch } = useQuery({
    queryKey: ["dapp-clients", page, statusFilter],
    queryFn: async () => {
      const response = await getDappClients({ 
        page, 
        take: pageSize,
        ...(statusFilter !== "all" && { adminApproval: statusFilter })
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });

  // Verify/Reject mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ clientId, action }: { clientId: string; action: "verify" | "reject" }) => {
      const response = await verifyDappClient(clientId, action);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === "verify" ? "Client Approved" : "Client Rejected",
        description: `KYC status updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["dapp-clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status",
        variant: "destructive",
      });
    },
  });

  const handleVerify = (clientId: string) => {
    verifyMutation.mutate({ clientId, action: "verify" });
  };

  const handleReject = (clientId: string) => {
    verifyMutation.mutate({ clientId, action: "reject" });
  };

  // Filter clients by search query - handle both array and paginated response
  const rawClients = Array.isArray(clientsData) 
    ? clientsData 
    : (clientsData?.clients || []);
  const clients: Client[] = rawClients.map((c: Record<string, unknown>) => ({
    id: c.id as string || c.clientId as string || "",
    clientId: c.clientId as string,
    fullName: c.fullName as string || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
    email: c.email as string,
    countryCode: c.countryCode as string,
    isKYCVerified: c.isKYCVerified as boolean,
    adminApproval: c.adminApproval as string,
    createdAt: c.createdAt as string,
    kycLink: c.kycLink as string,
  }));
  
  const filteredClients = clients.filter((client: Client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.fullName?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.clientId?.toLowerCase().includes(query)
    );
  });

  const getApprovalBadge = (approval?: string) => {
    switch (approval) {
      case "VERIFIED":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Verified</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
    }
  };

  const getKycBadge = (isVerified?: boolean) => {
    if (isVerified) {
      return <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">KYC Done</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Failed to load customers</h3>
        <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Customer Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage customer KYC verification via Dr. Green API
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or client ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Admin Approval</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>No customers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client: Client) => (
                <TableRow key={client.id || client.clientId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.fullName || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{client.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {client.clientId || client.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.countryCode || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{getKycBadge(client.isKYCVerified)}</TableCell>
                  <TableCell>{getApprovalBadge(client.adminApproval)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.createdAt 
                      ? new Date(client.createdAt).toLocaleDateString()
                      : "N/A"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={verifyMutation.isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleVerify(client.clientId || client.id)}
                          disabled={client.adminApproval === "VERIFIED"}
                          className="text-emerald-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve KYC
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReject(client.clientId || client.id)}
                          disabled={client.adminApproval === "REJECTED"}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject KYC
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && filteredClients.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredClients.length} customer(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={filteredClients.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
