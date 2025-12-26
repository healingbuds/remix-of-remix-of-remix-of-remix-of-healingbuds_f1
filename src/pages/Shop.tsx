import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShoppingCart } from 'lucide-react';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Cart } from '@/components/shop/Cart';
import { RestrictedRegionGate } from '@/components/shop/RestrictedRegionGate';
import { VerificationProgress } from '@/components/shop/VerificationProgress';

import { useShop } from '@/context/ShopContext';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useTranslation } from 'react-i18next';

const countries = [
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export default function Shop() {
  const { countryCode, setCountryCode, drGreenClient, isEligible, syncVerificationFromDrGreen } = useShop();
  const geoLocation = useGeoLocation();
  const { t } = useTranslation('shop');

  // Auto-detect country on mount
  useEffect(() => {
    const supportedCountries = ['PT', 'ZA', 'TH', 'GB'];
    if (supportedCountries.includes(geoLocation.countryCode) && !drGreenClient) {
      setCountryCode(geoLocation.countryCode);
    }
  }, [geoLocation.countryCode, setCountryCode, drGreenClient]);

  // Background polling for verification status (every 3 minutes)
  useEffect(() => {
    // Only poll if user has a client record but is not yet eligible
    if (!drGreenClient || isEligible) return;

    // Initial sync
    syncVerificationFromDrGreen();

    // Set up interval for polling every 3 minutes
    const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes
    const intervalId = setInterval(() => {
      console.log('Background sync: checking verification status...');
      syncVerificationFromDrGreen();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [drGreenClient, isEligible, syncVerificationFromDrGreen]);

  return (
    <>
      <SEOHead
        title={`${t('title')} | Dr. Green - Premium Cultivars`}
        description="Browse our selection of pharmaceutical-grade medical cannabis cultivars. Lab-tested, doctor-approved products for qualified patients."
        keywords="medical cannabis, CBD, THC, cultivars, pharmaceutical grade, Portugal, medical marijuana, dispensary"
      />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                Strains
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
                {t('subtitle')}
              </p>

              {/* Eligibility status - Verified badge with subtle indicator */}
              {drGreenClient && isEligible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium bg-primary/10 border border-primary/25 text-primary"
                >
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="tracking-wide text-xs font-semibold uppercase">
                    Verified Medical Patient
                  </span>
                </motion.div>
              )}

              {/* Pending verification status */}
              {drGreenClient && !isEligible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium bg-highlight/10 border border-highlight/30 text-highlight"
                >
                  <div className="p-1.5 rounded-lg bg-highlight/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="tracking-wide text-xs font-semibold">Verification Pending</span>
                </motion.div>
              )}

              {/* Verification Progress Tracker */}
              {drGreenClient && <VerificationProgress />}
            </motion.div>
          </div>
        </section>

        {/* Products - gated by region restrictions */}

        {/* Products - gated by region restrictions */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <RestrictedRegionGate countryCode={countryCode}>
              <ProductGrid />
            </RestrictedRegionGate>
          </div>
        </section>

        {/* Floating Cart Button */}
        <FloatingCartButton />

        {/* Cart drawer */}
        <Cart />

        <Footer />
      </div>
    </>
  );
}

// Floating cart button component
function FloatingCartButton() {
  const { cartCount, setIsCartOpen } = useShop();
  
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="font-semibold">Cart</span>
      {cartCount > 0 && (
        <motion.span
          key={cartCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-primary text-sm font-bold"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.span>
      )}
    </motion.button>
  );
}
