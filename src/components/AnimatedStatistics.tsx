import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Leaf, Users, Globe, Award } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Statistic {
  value: number;
  suffix: string;
  label: string;
  icon: LucideIcon;
}

const statistics: Statistic[] = [
  { value: 18000, suffix: "m²", label: "Cultivation Space", icon: Leaf },
  { value: 50, suffix: "+", label: "Research Partners", icon: Users },
  { value: 15, suffix: "+", label: "Countries Served", icon: Globe },
  { value: 100, suffix: "%", label: "EU GMP Certified", icon: Award },
];

interface StatCardProps {
  stat: Statistic;
  index: number;
}

const StatCard = ({ stat, index }: StatCardProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = stat.value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(stepValue * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, stat.value]);

  const Icon = stat.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative group"
    >
      <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 text-center">
        {/* Animated glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)'
          }}
        />
        
        {/* Icon */}
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        {/* Counter */}
        <div className="relative">
          <motion.span
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
            initial={{ scale: 0.5 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
          >
            {count.toLocaleString()}
          </motion.span>
          <span className="text-2xl md:text-3xl font-semibold text-primary ml-1">
            {stat.suffix}
          </span>
        </div>
        
        {/* Label */}
        <p className="text-white/70 mt-3 text-sm md:text-base font-medium">
          {stat.label}
        </p>
      </div>
    </motion.div>
  );
};

interface AnimatedStatisticsProps {
  className?: string;
}

const AnimatedStatistics = ({ className = "" }: AnimatedStatisticsProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <section 
      ref={sectionRef}
      className={`py-16 md:py-24 ${className}`}
      style={{ backgroundColor: 'hsl(var(--section-color))' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Our Impact in Numbers
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {statistics.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimatedStatistics;
