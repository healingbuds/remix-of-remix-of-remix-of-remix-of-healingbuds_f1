interface WaveDividerProps {
  position?: 'top' | 'bottom';
  flip?: boolean;
}

const WaveDivider = ({ position = 'top', flip = false }: WaveDividerProps) => {
  return (
    <div 
      className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`}
      style={{ height: '80px' }}
    >
      <svg 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none" 
        className="relative block w-full h-full"
        style={{ transform: flip ? 'scaleY(-1)' : 'none' }}
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--background))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path 
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          fill="url(#waveGradient)"
          opacity="0.85"
        />
        <path 
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          fill="url(#waveGradient)"
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
