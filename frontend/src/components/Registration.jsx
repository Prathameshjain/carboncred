import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import GradientBg from '../assets/GradientBg.png';
import { Eye, EyeOff, Lock, Mail, Leaf, TrendingUp, Shield, AlertCircle, CheckCircle } from "lucide-react";

export default function CarbonRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "", email: "", password: "", password2: "",
    name: "", registration_no: "", registration_year: new Date().getFullYear(),
    owner_name: "", phone: "", pan_id: "", metamask_wallet_address: "",
  });

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    const score = [pwd.length >= 8, hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "w-1/4" };
    if (score === 2) return { label: "Fair", color: "bg-yellow-400", width: "w-2/4" };
    if (score === 3) return { label: "Good", color: "bg-blue-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-green-500", width: "w-full" };
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "pan_id") value = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    const year = new Date().getFullYear();

    if (!formData.username || formData.username.length < 3 || formData.username.length > 30)
      errs.username = "Username must be 3–30 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      errs.username = "Letters, numbers and underscores only";

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "Enter a valid email address";

    if (!formData.password || formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) ||
      !/[^a-zA-Z0-9]/.test(formData.password))
      errs.password = "Min 8 chars, one uppercase, one number, one special character";

    if (formData.password !== formData.password2)
      errs.password2 = "Passwords do not match";

    if (!formData.name || formData.name.length < 2)
      errs.name = "Company name must be at least 2 characters";

    if (!formData.registration_no || formData.registration_no.length < 3)
      errs.registration_no = "Enter a valid registration number (min 3 chars)";

    const regYear = parseInt(formData.registration_year);
    if (!regYear || regYear < 1800 || regYear > year)
      errs.registration_year = `Year must be between 1800 and ${year}`;

    if (!formData.owner_name || formData.owner_name.length < 2 || !/^[a-zA-Z\s]+$/.test(formData.owner_name))
      errs.owner_name = "Owner name must contain only letters (min 2 chars)";

    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone))
      errs.phone = "Enter a valid 10-digit Indian mobile number";

    if (!formData.pan_id || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_id))
      errs.pan_id = "PAN must be in format ABCDE1234F";

    if (!formData.metamask_wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(formData.metamask_wallet_address))
      errs.metamask_wallet_address = "Enter a valid Ethereum wallet address (0x + 40 hex chars)";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/accounts/register/", formData);
      navigate("/Login");
    } catch (error) {
      if (error.response?.data) {
        const apiErrors = error.response.data;
        if (typeof apiErrors === "object") {
          const fieldMap = {};
          Object.entries(apiErrors).forEach(([field, msgs]) => {
            fieldMap[field] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setErrors(fieldMap);
        } else {
          setServerError(String(apiErrors));
        }
      } else {
        setServerError("Server not reachable. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{errors[name]}</p>
    : null;

  const inputCls = (name) =>
    `block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${errors[name] ? "border-red-400" : "border-gray-300"}`;

  const strength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password2 && formData.password === formData.password2;

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="lg:w-3/5 flex items-center justify-center px-8 py-12"
        style={{ backgroundImage: `url(${GradientBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Carbon<span className="text-green-600">Cred</span></span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Sign up to your carbon trading account</p>
          </div>

          {serverError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="username" type="text" value={formData.username} onChange={handleInputChange}
                placeholder="Username" className={inputCls("username")} />
              <FieldError name="username" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <input name="email" type="email" value={formData.email} onChange={handleInputChange}
                  placeholder="Email" className={inputCls("email")} />
              </div>
              <FieldError name="email" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={handleInputChange} placeholder="Password" className={`${inputCls("password")} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{strength.label}</p>
                </div>
              )}
              <FieldError name="password" />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input name="password2" type="password" value={formData.password2}
                  onChange={handleInputChange} placeholder="Confirm password" className={inputCls("password2")} />
                {passwordsMatch && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              <FieldError name="password2" />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input name="name" type="text" value={formData.name} onChange={handleInputChange}
                placeholder="Company name" className={inputCls("name")} />
              <FieldError name="name" />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input name="registration_no" type="text" value={formData.registration_no} onChange={handleInputChange}
                placeholder="e.g. U74999MH2020PTC123456" className={inputCls("registration_no")} />
              <FieldError name="registration_no" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                placeholder="10-digit Indian mobile" maxLength={10} className={inputCls("phone")} />
              <FieldError name="phone" />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input name="owner_name" type="text" value={formData.owner_name} onChange={handleInputChange}
                placeholder="Owner full name" className={inputCls("owner_name")} />
              <FieldError name="owner_name" />
            </div>

            {/* PAN ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN ID</label>
              <input name="pan_id" type="text" value={formData.pan_id} onChange={handleInputChange}
                placeholder="ABCDE1234F" maxLength={10} className={inputCls("pan_id")} />
              <FieldError name="pan_id" />
            </div>

            {/* Registration Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Year</label>
              <input name="registration_year" type="number" value={formData.registration_year} onChange={handleInputChange}
                min="1800" max={new Date().getFullYear()} className={inputCls("registration_year")} />
              <FieldError name="registration_year" />
            </div>

            {/* MetaMask Wallet (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">MetaMask Wallet Address</label>
              <input name="metamask_wallet_address" type="text" value={formData.metamask_wallet_address}
                onChange={handleInputChange} placeholder="0x..." className={inputCls("metamask_wallet_address")} />
              <FieldError name="metamask_wallet_address" />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button type="submit" disabled={loading}
                className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
                {loading ? "Registering…" : "Create Account"}
              </button>
              <p className="text-center text-sm text-gray-600 mt-3">
                Already have an account? <Link to="/Login" className="text-green-600 font-medium !no-underline">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 opacity-0" />
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
            <div className="space-y-3">
              {["Real-time emission monitoring", "Transparent credit trading", "Compliance reporting tools"].map(f => (
                <div key={f} className="flex items-center space-x-3 text-green-100">
                  <div className="w-2 h-2 bg-green-300 rounded-full flex-shrink-0"></div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-green-500/30">
              <div className="text-center">
                <div className="text-2xl font-bold">2.5M+</div>
                <div className="text-green-200 text-sm">Tons CO₂ Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">1,200+</div>
                <div className="text-green-200 text-sm">Active Traders</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
