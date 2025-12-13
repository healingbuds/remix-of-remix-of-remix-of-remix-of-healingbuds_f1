import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { ClientOnboarding } from '@/components/shop/ClientOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ShopRegister() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Patient Registration | Dr. Green Medical Cannabis"
        description="Register as a medical cannabis patient. Complete our secure verification process to access pharmaceutical-grade cannabis products."
        keywords="medical cannabis registration, patient verification, KYC, medical marijuana"
      />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 pb-12">
          {isAuthenticated ? (
            <ClientOnboarding />
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-4">
              <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in or create an account to register as a medical cannabis patient.
              </p>
              <Button asChild>
                <Link to="/auth?redirect=/shop/register">
                  Sign In / Create Account
                </Link>
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
