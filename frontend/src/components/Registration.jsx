import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    company_name: "",
    location: "",
    phone: "",
    role: "buyer", // default
    active_since: "",
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Password validation
    if (name === "password" || name === "password2") {
      const updatedPassword = name === "password" ? value : formData.password;
      const updatedConfirm =
        name === "password2" ? value : formData.password2;

      if (
        updatedPassword &&
        updatedConfirm &&
        updatedPassword !== updatedConfirm
      ) {
        setErrorMessage("Passwords do not match!");
      } else {
        setErrorMessage("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Registration attempt:", formData);

    // Clear previous errors
    setErrorMessage("");

    try {
      // Replace this URL with Prathamesh's backend registration API
      const response = await axios.post(
        "http://127.0.0.1:8000/api/accounts/register/",
        formData
      );

      if (response.status === 201 || response.status === 200) {
        alert("Registration successful!");
        // Optionally redirect to login page
        navigate("/Dashboard");
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        // Backend returned an error
        setErrorMessage(error.response.data.message || "Registration failed");
      } else {
        setErrorMessage("Server not reachable");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                CarbonCred
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Register</h2>
            <p className="text-gray-600">
              Sign up to your carbon trading account
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password2"
                  value={formData.password2}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  required
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Company name"
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              >
                <option value="Credit Issuer">Credit Issuer</option>
                <option value="Carbon Credit Buyer">Carbon Credit Buyer</option>
              </select>
            </div>

            {/* Active Since */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Since
              </label>
              <input
                type="date"
                name="active_since"
                value={formData.active_since}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Register
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="justify-center space-x-2">
              <div className=" position top z-0 items-center">
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
