import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthBackground from "../components/AuthBackground";
import { toast, Toaster } from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
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
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid) {
      signup(formData);
    }
  };

  return (
    <div className="parent-container">
      <AuthBackground>
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-xl bg-pink-400/20 flex items-center justify-center transition-colors hover:bg-pink-500/30">
              <MessageSquare className="size-6 text-pink-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 text-sm sm:text-base">Get started with your free account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base placeholder-gray-400"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
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
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <Toaster />
      </AuthBackground>
    </div>
  );
};

export default SignUpPage;
