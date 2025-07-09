import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthBackground from "../components/AuthBackground";
import { toast } from "react-hot-toast";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid) {
      login(formData);
    }
  };

  return (
    <AuthBackground>
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-xl bg-pink-400/20 flex items-center justify-center transition-colors hover:bg-pink-500/30">
            <MessageSquare className="size-6 text-pink-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 text-sm sm:text-base">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="size-5 text-gray-400" />
            </div>
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base placeholder-gray-400"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="size-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base placeholder-gray-400"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-5 text-gray-400" />
              ) : (
                <Eye className="size-5 text-gray-400" />
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-lg hover:bg-gradient-to-l transition-colors text-sm sm:text-base disabled:opacity-50"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <p className="text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-pink-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
};

export default LoginPage;
