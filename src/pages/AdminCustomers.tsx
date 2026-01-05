import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerManagement } from "@/components/admin/CustomerManagement";

const AdminCustomers = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Back navigation */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer KYC verification status
          </p>
        </div>

        {/* Customer management component */}
        <CustomerManagement />
      </div>
    </div>
  );
};

export default AdminCustomers;
