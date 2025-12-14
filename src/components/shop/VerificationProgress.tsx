import { motion } from 'framer-motion';
import { FileCheck, ShieldCheck, UserCheck, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

export function VerificationProgress() {
  const { drGreenClient, isEligible } = useShop();

  if (!drGreenClient) return null;

  const steps = [
    {
      icon: FileCheck,
      label: 'Registered',
      completed: true,
    },
    {
      icon: ShieldCheck,
      label: 'KYC Verified',
      completed: drGreenClient.is_kyc_verified ?? false,
    },
    {
      icon: UserCheck,
      label: 'Approved',
      completed: drGreenClient.admin_approval === 'VERIFIED',
    },
    {
      icon: ShoppingBag,
      label: 'Shop Access',
      completed: isEligible,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mt-6"
    >
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.completed
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                {step.completed && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center ${
                  step.completed ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Status message */}
        {!isEligible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border/50"
          >
            {!drGreenClient.is_kyc_verified
              ? 'Complete KYC verification to continue'
              : drGreenClient.admin_approval === 'PENDING'
              ? 'Awaiting medical team review (1-2 business days)'
              : drGreenClient.admin_approval === 'REJECTED'
              ? 'Application requires additional information'
              : 'Processing your verification...'}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
