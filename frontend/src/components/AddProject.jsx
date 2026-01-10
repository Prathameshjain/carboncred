import React from "react";
import { useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Upload, X, AlertCircle, CheckCircle, Save, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import Footer from "./ui/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import GradientBg from "../assets/GradientBg.png";

const AddProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Form state management - aligned with backend API
  const [formData, setFormData] = useState({
    project_name: "",
    classification: "",
    project_area_hectares: "",
    project_cost_lakh_inr: "",
    claimed_improvement_pct: "",
    project_latitude: "",
    project_longitude: "",
    before_image: null,
    after_image: null,
    before_image_date: "",
    after_image_date: "",
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [imageType]: file,
      }));
    }
    e.target.value = "";
  };

  // Remove uploaded image
  const removeImage = (imageType) => {
    setFormData((prev) => ({
      ...prev,
      [imageType]: null,
    }));
  };

  // Validate form
  const requiredFields = [
    "project_name",
    "classification",
    "project_area_hectares",
    "project_cost_lakh_inr",
    "claimed_improvement_pct",
  ];

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });
    
    // At least one image required
    if (!formData.before_image && !formData.after_image) {
      newErrors.before_image = "At least one image is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit - send to backend API
  const handleSubmit = async () => {
    if (!validateForm()) {
      setToastMessage("Please fill all required fields");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setToastMessage("Please login first");
        setTimeout(() => navigate("/Login"), 1500);
        return;
      }

      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append("project_name", formData.project_name);
      submitData.append("classification", formData.classification);
      submitData.append("project_area_hectares", formData.project_area_hectares);
      submitData.append("project_cost_lakh_inr", formData.project_cost_lakh_inr);
      submitData.append("claimed_improvement_pct", formData.claimed_improvement_pct);
      
      if (formData.project_latitude) {
        submitData.append("project_latitude", formData.project_latitude);
      }
      if (formData.project_longitude) {
        submitData.append("project_longitude", formData.project_longitude);
      }
      if (formData.before_image) {
        submitData.append("before_image", formData.before_image);
      }
      if (formData.after_image) {
        submitData.append("after_image", formData.after_image);
      }
      if (formData.before_image_date) {
        submitData.append("before_image_date", formData.before_image_date);
      }
      if (formData.after_image_date) {
        submitData.append("after_image_date", formData.after_image_date);
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/projects/projects/",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setVerificationResult(response.data);
      setToastMessage(
        response.data.final_decision === "VERIFIED"
          ? "Project verified successfully! Credits issued."
          : `Project ${response.data.final_decision}. Check details below.`
      );
      setTimeout(() => setToastMessage(null), 5000);

    } catch (error) {
      console.error("Project submission error:", error.response?.data || error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.before_image?.[0] ||
                       "Failed to submit project";
      setToastMessage(errorMsg);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* Header */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex relative pt-24">
        <aside
          className={`pt-24 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          {/* Sidebar */}
          <div className="sticky top-24 h-[calc(100vh-6rem)]">
            <Sidebar sidebarOpen={sidebarOpen} />
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top">
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          )}
          {/* Page Header */}
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-3 text-left">
              <h2 className="text-4xl text-slate-900 tracking-tight">
                Add New Project
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Create a new carbon credit project for verification and marketplace listing
              </p>
            </div>
          </div>

          <main className="px-6 py-4 max-w-7xl mx-auto space-y-8">
            <div className="space-y-6">
              {/* ========== SECTION A: BASIC PROJECT INFORMATION ========== */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Basic Project Information
                    </h2>
                    <p className="text-xs text-slate-500">
                      Provide essential details about your project
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.project_name
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., Amazon Rainforest Conservation Project"
                    />
                    {errors.project_name && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.project_name}
                      </p>
                    )}
                  </div>

                  {/* Classification (Project Type) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Classification <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="classification"
                      value={formData.classification}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.classification
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                    >
                      <option value="">Select classification</option>
                      <option value="SOLAR">Solar</option>
                      <option value="VEGETATION">Vegetation</option>
                      <option value="PLANTATION">Plantation</option>
                      <option value="METHANE">Methane</option>
                    </select>
                    {errors.classification && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.classification}
                      </p>
                    )}
                  </div>

                  {/* Project Area */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Area (Hectares) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="project_area_hectares"
                      value={formData.project_area_hectares}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2.5 border ${
                        errors.project_area_hectares
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., 50.00"
                    />
                    {errors.project_area_hectares && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.project_area_hectares}
                      </p>
                    )}
                  </div>

                  {/* Project Cost */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Cost (Lakh INR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="project_cost_lakh_inr"
                      value={formData.project_cost_lakh_inr}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2.5 border ${
                        errors.project_cost_lakh_inr
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., 25.00"
                    />
                    {errors.project_cost_lakh_inr && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.project_cost_lakh_inr}
                      </p>
                    )}
                  </div>

                  {/* Claimed Improvement */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Claimed Improvement (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="claimed_improvement_pct"
                      value={formData.claimed_improvement_pct}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className={`w-full px-4 py-2.5 border ${
                        errors.claimed_improvement_pct
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., 15.00"
                    />
                    {errors.claimed_improvement_pct && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.claimed_improvement_pct}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Your claimed vegetation/solar improvement percentage
                    </p>
                  </div>
                </div>
              </div>

              {/* ========== SECTION B: LOCATION DETAILS ========== */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Location Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      Specify project coordinates (optional)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Latitude */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="project_latitude"
                      value={formData.project_latitude}
                      onChange={handleChange}
                      step="0.000001"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., 19.076"
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="project_longitude"
                      value={formData.project_longitude}
                      onChange={handleChange}
                      step="0.000001"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., 72.877"
                    />
                  </div>
                </div>
              </div>

              {/* ========== SECTION C: IMAGE UPLOAD ========== */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Project Images
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload before and after satellite/drone images for ML verification
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Image */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Before Image <span className="text-red-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed ${errors.before_image ? 'border-red-500' : 'border-slate-300'} rounded-lg p-4 text-center hover:border-emerald-500 transition`}>
                      {formData.before_image ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm text-slate-700">{formData.before_image.name}</span>
                          </div>
                          <button onClick={() => removeImage('before_image')} className="text-red-500 hover:text-red-700">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <label htmlFor="beforeImage" className="text-emerald-600 font-medium cursor-pointer hover:underline text-sm">
                            Click to upload before image
                          </label>
                          <input
                            id="beforeImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'before_image')}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                    {errors.before_image && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.before_image}
                      </p>
                    )}
                    <div className="mt-2">
                      <label className="block text-xs text-slate-500 mb-1">Capture Date</label>
                      <input
                        type="date"
                        name="before_image_date"
                        value={formData.before_image_date}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* After Image */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      After Image
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-emerald-500 transition">
                      {formData.after_image ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm text-slate-700">{formData.after_image.name}</span>
                          </div>
                          <button onClick={() => removeImage('after_image')} className="text-red-500 hover:text-red-700">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <label htmlFor="afterImage" className="text-emerald-600 font-medium cursor-pointer hover:underline text-sm">
                            Click to upload after image
                          </label>
                          <input
                            id="afterImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'after_image')}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-slate-500 mb-1">Capture Date</label>
                      <input
                        type="date"
                        name="after_image_date"
                        value={formData.after_image_date}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    📷 Upload satellite or drone imagery of your project area. The ML system will analyze vegetation coverage, solar panels, or other project features to verify your carbon credit claim.
                  </p>
                </div>
              </div>

              {/* ========== VERIFICATION RESULT ========== */}
              {verificationResult && (
                <div className={`bg-white rounded-lg shadow-sm border ${verificationResult.final_decision === 'VERIFIED' ? 'border-emerald-300' : 'border-amber-300'} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${verificationResult.final_decision === 'VERIFIED' ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center`}>
                      {verificationResult.final_decision === 'VERIFIED' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Verification Result: {verificationResult.final_decision}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Report ID: {verificationResult.report_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Confidence Score</p>
                      <p className="text-lg font-semibold text-slate-800">{(parseFloat(verificationResult.confidence_score) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Claim Alignment</p>
                      <p className="text-lg font-semibold text-slate-800">{verificationResult.claim_alignment}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Est. CO₂ (tCO₂/year)</p>
                      <p className="text-lg font-semibold text-slate-800">{verificationResult.estimated_co2_tco2_year || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Credits Issued</p>
                      <p className="text-lg font-semibold text-emerald-600">{verificationResult.credits_issued}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-line">{verificationResult.explanation}</p>
                  </div>
                </div>
              )}

              {/* ========== ACTION BUTTONS ========== */}
              <div className="flex items-center justify-end gap-4 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 font-medium"
                >
                  Cancel
                </button>
                
                {/* Show different buttons based on verification status */}
                {verificationResult ? (
                  <button
                    onClick={() => navigate('/ViewProjects')}
                    className="px-6 py-2.5 rounded-lg text-white transition flex items-center gap-2 font-medium shadow-md bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Go to My Projects
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-lg text-white transition flex items-center gap-2 font-medium shadow-md ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit for Verification
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </main>
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AddProject;
