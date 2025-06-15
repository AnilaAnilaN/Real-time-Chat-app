// src/components/AuthImagePattern.jsx
import { MessageCircle } from 'lucide-react';

const AuthImagePattern = ({ title, subtitle }) => {
  // Bubble positions and sizes with DaisyUI color classes
  const bubbles = [
    { size: 'w-16 h-16', position: 'top-[15%] left-[20%]', color: 'bg-primary/10', delay: 'delay-0' },
    { size: 'w-24 h-24', position: 'top-[25%] left-[70%]', color: 'bg-secondary/10', delay: 'delay-200' },
    { size: 'w-20 h-20', position: 'top-[55%] left-[15%]', color: 'bg-accent/10', delay: 'delay-400' },
    { size: 'w-28 h-28', position: 'top-[60%] left-[65%]', color: 'bg-primary/15', delay: 'delay-600' },
    { size: 'w-12 h-12', position: 'top-[80%] left-[30%]', color: 'bg-secondary/15', delay: 'delay-800' },
  ];

  return (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 p-12">
      <div className="w-full max-w-md h-[450px] flex flex-col items-center justify-center bg-base-100 rounded-box shadow-xl relative overflow-hidden border border-base-200">
        {/* Floating chat bubbles */}
        <div className="absolute inset-0">
          {bubbles.map((bubble, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${bubble.color} ${bubble.size} ${bubble.position} ${bubble.delay} animate-float`}
            />
          ))}
        </div>
        
        {/* Animated chat icon */}
        <div className="relative z-10 mb-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-full animate-ping-slow opacity-30"></div>
            <div className="relative bg-primary/10 p-6 rounded-xl transform rotate-6 transition-all duration-500 hover:rotate-0 hover:bg-primary/20 hover:shadow-md">
              <MessageCircle 
                className="text-primary" 
                size={64} 
                strokeWidth={1.5} 
              />
            </div>
          </div>
        </div>
        
        {/* Text Content */}
        <div className="text-center space-y-4 relative z-10 px-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-neutral/80 text-md leading-relaxed max-w-xs">
            {subtitle}
          </p>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-primary/30 rounded-tr-box"></div>
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-secondary/30 rounded-bl-box"></div>
        
        {/* Decorative dots */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 pb-4">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-neutral/20"></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;