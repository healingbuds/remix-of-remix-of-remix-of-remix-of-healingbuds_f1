/**
 * NavigationMenu Component
 * 
 * Desktop navigation for country dispensary site.
 * Simplified, store-focused navigation.
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface NavigationMenuProps {
  scrolled: boolean;
  onCloseAllDropdowns?: () => void;
}

const NavigationMenu = ({ scrolled, onCloseAllDropdowns }: NavigationMenuProps) => {
  const location = useLocation();
  const { t } = useTranslation('common');

  // Active state detection
  const isActive = (path: string) => location.pathname === path;
  const isShopActive = location.pathname === '/shop' || location.pathname.startsWith('/shop/');

  // Navigation item styles - WCAG AA compliant with underline animation
  const navItemBase = cn(
    "font-body font-semibold transition-all duration-200 ease-out rounded-lg relative",
    "whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    // Underline animation pseudo-element
    "after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0.5",
    "after:w-0 after:h-0.5 after:bg-current after:rounded-full",
    "after:transition-all after:duration-300 after:ease-out",
    "hover:after:w-3/4"
  );
  
  const navItemSize = scrolled ? "text-xs xl:text-sm px-3 py-2" : "text-sm xl:text-base px-4 py-2.5";
  
  const getNavItemStyles = (isItemActive: boolean) => cn(
    navItemBase,
    navItemSize,
    isItemActive
      ? "text-primary-foreground bg-primary/90 font-bold shadow-md after:w-3/4 after:bg-white/80" 
      : "text-white/90 hover:text-white hover:bg-white/12"
  );

  return (
    <nav className={cn(
      "hidden xl:flex items-center justify-center",
      "transition-all duration-500 ease-out mx-4",
      scrolled ? "gap-1" : "gap-2"
    )}>
      <Link to="/" className={getNavItemStyles(isActive("/"))}>
        Home
      </Link>
      
      <Link to="/eligibility" className={getNavItemStyles(isActive("/eligibility"))}>
        Eligibility
      </Link>
      
      <Link 
        to="/shop" 
        className={getNavItemStyles(isShopActive)}
      >
        Dispensary
      </Link>
      
      <Link to="/support" className={getNavItemStyles(isActive("/support"))}>
        Support
      </Link>
    </nav>
  );
};

export default NavigationMenu;
