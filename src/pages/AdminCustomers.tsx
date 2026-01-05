import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminCustomers = () => {
  return (
    <AdminLayout 
      title="Customer Management" 
      description="View customer KYC verification status (read-only)"
    >
      <CustomerManagement />
    </AdminLayout>
  );
};

export default AdminCustomers;
