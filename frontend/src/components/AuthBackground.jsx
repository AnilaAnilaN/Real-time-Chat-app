import { MessageCircle } from "lucide-react";

const AuthBackground = ({ children }) => {
  const particles = [
    { size: "w-12 h-12", position: "top-[10%] left-[15%]", delay: "delay-0" },
    { size: "w-16 h-16", position: "top-[20%] right-[20%]", delay: "delay-200" },
    { size: "w-10 h-10", position: "bottom-[15%] left-[25%]", delay: "delay-400" },
    { size: "w-14 h-14", position: "bottom-[10%] right-[15%]", delay: "delay-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <div
            key={i}
            className={`absolute ${particle.size} ${particle.position} ${particle.delay} bg-white/10 rounded-full animate-float`}
          />
        ))}
      </div>
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthBackground;
