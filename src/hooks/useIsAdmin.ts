import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if the current user has admin role
 * Uses the secure `has_role` RPC function
 */
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (isMounted) {
          setIsAdmin(error ? false : !!data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    checkAdminRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading };
};
