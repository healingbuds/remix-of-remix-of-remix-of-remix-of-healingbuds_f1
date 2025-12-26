import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  midX: number;
  midY: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  blur: number;
}

interface Wisp {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

interface SmokeParticlesProps {
  isActive: boolean;
  particleCount?: number;
  color?: string;
}

export const SmokeParticles = ({ 
  isActive, 
  particleCount = 18,
  color = "hsl(var(--primary))"
}: SmokeParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wisps, setWisps] = useState<Wisp[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const wispIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wispIdRef = useRef(0);

  // Generate burst particles on activation
  useEffect(() => {
    if (isActive) {
      setIsFadingOut(false);
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const distance = Math.random() * 120 + 60;
        const swirl = (Math.random() - 0.5) * 80;
        
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          midX: Math.cos(angle + 0.5) * (distance * 0.5) + swirl,
          midY: Math.sin(angle + 0.5) * (distance * 0.5) - 20,
          size: Math.random() * 28 + 12,
          duration: Math.random() * 1.2 + 1.0,
          delay: Math.random() * 0.3,
          rotation: (Math.random() - 0.5) * 360,
          blur: Math.random() * 2 + 1,
        };
      });
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, particleCount]);

  // Continuous wisps while active
  useEffect(() => {
    if (isActive) {
      // Generate initial wisps
      const initialWisps: Wisp[] = Array.from({ length: 4 }, () => createWisp());
      setWisps(initialWisps);

      // Continuously spawn new wisps
      wispIntervalRef.current = setInterval(() => {
        setWisps(prev => {
          // Remove old wisps (keep last 8)
          const trimmed = prev.slice(-8);
          return [...trimmed, createWisp()];
        });
      }, 400);
    } else {
      // Fade out - stop spawning but let existing wisps finish
      if (wispIntervalRef.current) {
        clearInterval(wispIntervalRef.current);
        wispIntervalRef.current = null;
      }
      setIsFadingOut(true);
      // Clear wisps after fade animation
      const fadeTimer = setTimeout(() => {
        setWisps([]);
        setIsFadingOut(false);
      }, 1500);
      return () => clearTimeout(fadeTimer);
    }

    return () => {
      if (wispIntervalRef.current) {
        clearInterval(wispIntervalRef.current);
      }
    };
  }, [isActive]);

  const createWisp = (): Wisp => {
    wispIdRef.current += 1;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 30;
    return {
      id: wispIdRef.current,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 30,
      size: Math.random() * 18 + 10,
      duration: Math.random() * 1.5 + 1.5,
      delay: 0,
      rotation: (Math.random() - 0.5) * 180,
    };
  };

  return (
    <>
      {/* Continuous subtle wisps */}
      <AnimatePresence>
        {(isActive || isFadingOut) && wisps.map((wisp) => (
          <motion.div
            key={`wisp-${wisp.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: wisp.size,
              height: wisp.size,
              background: `radial-gradient(ellipse at 40% 40%, ${color}40 0%, ${color}20 40%, transparent 70%)`,
              filter: "blur(2px)",
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0, 
              scale: 0.5,
              rotate: 0,
            }}
            animate={{ 
              x: wisp.x,
              y: wisp.y,
              opacity: isFadingOut ? [0.3, 0] : [0, 0.4, 0.3, 0],
              scale: [0.5, 1.2, 1.8],
              rotate: wisp.rotation,
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5 }
            }}
            transition={{ 
              duration: wisp.duration,
              ease: "easeOut",
              times: [0, 0.3, 0.7, 1],
            }}
          />
        ))}
      </AnimatePresence>

      {/* Burst particles on hover start */}
      <AnimatePresence>
        {isActive && particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: particle.size,
              height: particle.size,
              background: `radial-gradient(ellipse at 30% 30%, ${color} 0%, ${color}66 30%, transparent 70%)`,
              filter: `blur(${particle.blur}px)`,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0.7, 
              scale: 0.3,
              rotate: 0,
            }}
            animate={{ 
              x: [0, particle.midX, particle.x],
              y: [0, particle.midY, particle.y],
              opacity: [0.7, 0.5, 0], 
              scale: [0.3, 1.5, 2.5],
              rotate: particle.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: particle.duration, 
              delay: particle.delay,
              ease: [0.25, 0.1, 0.25, 1],
              times: [0, 0.4, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
};
