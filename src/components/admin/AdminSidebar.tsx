import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Leaf, 
  RefreshCw, 
  BookOpen,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import hbIcon from '@/assets/hb-icon-white.png';
import { useTenant } from '@/hooks/useTenant';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending client count for badge
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from('drgreen_clients')
        .select('*', { count: 'exact', head: true })
        .eq('admin_approval', 'PENDING');
      
      setPendingCount(count || 0);
    };

    fetchPendingCount();
  }, []);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Customers', href: '/admin/customers', icon: Users, badge: pendingCount },
    { label: 'Prescriptions', href: '/admin/prescriptions', icon: FileText },
    { label: 'Strains', href: '/admin/strains', icon: Leaf },
    { label: 'Strain Sync', href: '/admin/strain-sync', icon: RefreshCw },
    { label: 'Knowledge Base', href: '/admin/strain-knowledge', icon: BookOpen },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-[#1A2E2A] min-h-screen flex flex-col">
      {/* Logo / Brand */}
      <div className="py-6 px-4 border-b border-[#EAB308]/30">
        <Link to="/admin" className="flex flex-col items-center gap-3">
          <img src={hbIcon} alt="Healing Buds" className="h-12 w-12" />
          <span className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">
            Admin Portal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      active 
                        ? 'bg-white/20 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#EAB308]/30 space-y-1">
        <a
          href={tenant.siteUrl || '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>View Site</span>
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
