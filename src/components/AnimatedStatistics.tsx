import { useState, useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Leaf, Users, Globe, Award } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Statistic {
  value: number;
  suffix: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
}

const statistics: Statistic[] = [
  { 
    value: 18000, 
    suffix: "m²", 
    label: "Cultivation Space", 
    icon: Leaf,
    gradient: "from-[#4DBFA1] via-[#2C7D7A] to-[#1C4F4D]",
    glowColor: "rgba(77, 191, 161, 0.4)"
  },
  { 
    value: 50, 
    suffix: "+", 
    label: "Research Partners", 
    icon: Users,
    gradient: "from-[#0D9488] via-[#2C7D7A] to-[#1C4F4D]",
    glowColor: "rgba(13, 148, 136, 0.4)"
  },
  { 
    value: 15, 
    suffix: "+", 
    label: "Countries Served", 
    icon: Globe,
    gradient: "from-[#4DBFA1] via-[#0D9488] to-[#2C7D7A]",
    glowColor: "rgba(44, 125, 122, 0.4)"
  },
  { 
    value: 100, 
    suffix: "%", 
    label: "EU GMP Certified", 
    icon: Award,
    gradient: "from-[#84CC16] via-[#4DBFA1] to-[#2C7D7A]",
    glowColor: "rgba(132, 204, 22, 0.4)"
  },
];

interface StatCardProps {
  stat: Statistic;
  index: number;
}

const StatCard = ({ stat, index }: StatCardProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15, 
        ease: [0.25, 0.4, 0.25, 1],
        scale: { type: "spring", stiffness: 200, damping: 20 }
      }}
      className="relative group perspective-1000"
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="relative h-full"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Animated glow background */}
        <motion.div
          className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"
          style={{ background: `linear-gradient(135deg, ${stat.glowColor}, transparent)` }}
          animate={isInView ? { 
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Card */}
        <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 hover:border-white/30 transition-all duration-500 overflow-hidden group-hover:shadow-2xl">
          {/* Animated gradient border on hover */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${stat.gradient}`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          {/* Shine sweep effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
          </motion.div>
          
          {/* Icon with animated ring */}
          <div className="relative mb-6">
            <motion.div
              className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-20 blur-lg`}
              animate={isInView ? {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
            />
            <motion.div 
              className={`relative w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={2} />
            </motion.div>
          </div>
          
          {/* Counter with gradient text */}
          <div className="relative z-10 mb-3">
            <motion.div
              className="flex items-baseline justify-start"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15 + 0.3, 
                type: "spring", 
                stiffness: 150 
              }}
            >
              <span 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent tracking-tighter`}
              >
                {count.toLocaleString()}
              </span>
              <span className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent ml-1`}>
                {stat.suffix}
              </span>
            </motion.div>
          </div>
          
          {/* Label with animated underline */}
          <div className="relative">
            <p className="text-white/80 text-base md:text-lg font-medium tracking-wide">
              {stat.label}
            </p>
            <motion.div
              className={`h-0.5 bg-gradient-to-r ${stat.gradient} mt-2 rounded-full`}
              initial={{ width: 0 }}
              animate={isInView ? { width: "60%" } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 + 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
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
      className={`py-20 md:py-32 relative overflow-hidden ${className}`}
      style={{ backgroundColor: 'hsl(var(--section-color))' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large gradient orbs - brand-aligned */}
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-[#4DBFA1]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#2C7D7A]/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1C4F4D]/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          {/* Decorative badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#4DBFA1] animate-pulse" />
            <span className="text-sm text-white/70 font-medium tracking-wide uppercase">Global Impact</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-tight mb-4">
            Our Impact in{" "}
            <span className="bg-gradient-to-r from-[#4DBFA1] via-[#2C7D7A] to-[#0D9488] bg-clip-text text-transparent">
              Numbers
            </span>
          </h2>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Building the future of medical cannabis with precision, scale, and global reach
          </p>
        </motion.div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          {statistics.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
        
        {/* Bottom decorative line */}
        <motion.div
          className="mt-16 md:mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="h-px w-32 md:w-48 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedStatistics;
