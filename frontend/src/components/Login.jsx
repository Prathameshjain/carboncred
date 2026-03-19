import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Leaf, TrendingUp, Shield, AlertCircle } from "lucide-react";
import GradientBg from '../assets/GradientBg.png';

export default function CarbonLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Please enter your username";
    if (!formData.password) errs.password = "Please enter your password";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccess("");
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/accounts/login/", {
        username: formData.username,
        password: formData.password,
      });
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/Dashboard"), 1200);
    } catch (err) {
      setServerError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{errors[name]}</p>
    : null;

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="lg:w-3/5 flex items-center justify-center px-8 py-12"
        style={{ backgroundImage: `url(${GradientBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Carbon<span className="text-green-600">Cred</span></span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to your carbon trading account</p>
          </div>

          {/* Server messages */}
          {serverError && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{serverError}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded-md text-sm">{success}</div>}

          {/* Form */}
          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                name="username" type="text" value={formData.username}
                onChange={handleInputChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${errors.username ? "border-red-400" : "border-gray-300"}`}
                placeholder="Enter your username"
              />
              <FieldError name="username" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password" type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${errors.password ? "border-red-400" : "border-gray-300"}`}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
              <FieldError name="password" />
            </div>

            {/* Remember me / Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleInputChange}
                  className="h-4 w-4 border-gray-300 rounded" />
                <label className="ml-2 text-sm text-gray-700">Remember me</label>
              </div>
              <Link to="#" className="text-sm text-green-600 hover:text-green-500 font-medium !no-underline">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={loading}
              className={`w-full rounded py-3 px-4 text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:scale-[1.01]"}`}>
              {loading ? "Signing in…" : "Sign in to your account"}
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/Registration" className="text-green-600 hover:text-green-500 font-medium !no-underline">Start your carbon journey</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden min-h-screen">

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="max-w-md text-center space-y-8">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
              <TrendingUp className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight">Track, Trade & Transform</h2>
              <p className="text-green-100 text-lg leading-relaxed">
                Monitor your carbon footprint, trade emission credits, and contribute to a sustainable future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
