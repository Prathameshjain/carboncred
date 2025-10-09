import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ import navigate
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Leaf,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function CarbonLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); // ✅ hook

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/accounts/login/",
        {
          username: formData.email, // Django expects "username"
          password: formData.password,
        }
      );

      console.log("Login response:", response.data);

      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);

      setSuccess("Login successful! Redirecting...");

      // ✅ Use navigate instead of window.location.href
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                CarbonCred
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your carbon trading account
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-2 rounded-md">
              {success}
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 border-gray-800 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Sign in to your account
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Start your carbon journey
              </a>
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="justify-center space-x-2">
              <div className="position top z-0 items-center">
                <p className="text-sm text-gray-700 font-medium">
                  Secure Login
                </p>
                <p className="text-xs text-gray-600">
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual/Info Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-white rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 border border-white rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border-2 border-white rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center space-y-8">
            {/* Main Illustration */}
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
                <TrendingUp className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-tight">
                Track, Trade & Transform
              </h2>
              <p className="text-green-100 text-lg leading-relaxed">
                Monitor your carbon footprint, trade emission credits, and
                contribute to a sustainable future with our advanced platform.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Real-time emission monitoring</span>
              </div>
              <div className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Transparent credit trading</span>
              </div>
              <div className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Compliance reporting tools</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-green-500/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2.5M+</div>
                <div className="text-green-200 text-sm">Tons CO₂ Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1,200+</div>
                <div className="text-green-200 text-sm">Active Traders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full transform translate-x-32 translate-y-32"></div>
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full transform -translate-x-24 -translate-y-24"></div>
      </div>
    </div>
  );
}
