import React from "react";
import { useState } from "react";
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

  // Form state management
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    description: "",
    status: "Draft",
    country: "",
    state: "",
    city: "",
    baselineEmissions: "",
    projectEmissions: "",
    documents: [],
    images: [],
  });

  const [errors, setErrors] = useState({});

  // Calculate CO2 Reduction
  const co2Reduction =
    formData.baselineEmissions && formData.projectEmissions
      ? Math.max(
          0,
          parseFloat(formData.baselineEmissions) -
            parseFloat(formData.projectEmissions)
        ).toFixed(2)
      : "0.00";

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        ...files.map((file) => ({
          name: file.name,
          size: (file.size / 1024).toFixed(2),
          file,
        })),
      ],
    }));

    // IMPORTANT: reset input so same file can be reselected
    e.target.value = "";
  };

  // Remove uploaded file
  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const requiredFields = [
    "projectName",
    "projectType",
    "description",
    "country",
    "baselineEmissions",
    "projectEmissions",
  ];

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save as draft
  const handleSaveDraft = () => {
    console.log("Saving as draft...", formData);
    alert("Project saved as draft!");
  };

  // Handle submit
  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Submitting project...", formData);
      alert("Project submitted successfully!");
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
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.projectName
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., Amazon Rainforest Conservation Project"
                    />
                    {errors.projectName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.projectName}
                      </p>
                    )}
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.projectType
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                    >
                      <option value="">Select project type</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                      <option value="Afforestation">Afforestation</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Energy Efficiency">
                        Energy Efficiency
                      </option>
                      <option value="Carbon Capture">Carbon Capture</option>
                    </select>
                    {errors.projectType && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.projectType}
                      </p>
                    )}
                  </div>

                  {/* Project Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Description{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className={`w-full px-4 py-2.5 border ${
                        errors.description
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none`}
                      placeholder="Provide a detailed description of your carbon credit project..."
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.description}
                      </p>
                    )}
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
                      Specify where your project is located
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.country ? "border-red-500" : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., Brazil"
                    />
                    {errors.country && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.country}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., Amazonas"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City / Region
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., Manaus"
                    />
                  </div>
                </div>

                {/* PHASE 2 PLACEHOLDER: GIS/Map Integration */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 italic">
                    📍 Future Enhancement: Interactive map for precise location
                    selection (GIS integration)
                  </p>
                </div>
              </div>

              {/* ========== SECTION C: EMISSION & IMPACT DETAILS ========== */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Emission & Impact Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      Calculate the carbon reduction impact
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Baseline Emissions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Baseline Emissions (tCO₂){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="baselineEmissions"
                      value={formData.baselineEmissions}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.baselineEmissions
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., 50000"
                    />
                    {errors.baselineEmissions && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{" "}
                        {errors.baselineEmissions}
                      </p>
                    )}
                  </div>

                  {/* Project Emissions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Emissions (tCO₂){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="projectEmissions"
                      value={formData.projectEmissions}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.projectEmissions
                          ? "border-red-500"
                          : "border-slate-300"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition`}
                      placeholder="e.g., 10000"
                    />
                    {errors.projectEmissions && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{" "}
                        {errors.projectEmissions}
                      </p>
                    )}
                  </div>

                  {/* CO2 Reduction (Auto-calculated) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CO₂ Reduction (tCO₂)
                    </label>
                    <div className="w-full px-4 py-2.5 border border-emerald-300 bg-emerald-50 rounded-lg text-emerald-700 font-semibold">
                      {co2Reduction}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Auto-calculated
                    </p>
                  </div>
                </div>

                {/* PHASE 2 PLACEHOLDER: Automated Emission Factor Selection */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 italic">
                    🔬 Future Enhancement: Automated emission factor database
                    integration (IPCC/EPA standards)
                  </p>
                </div>
              </div>

              {/* ========== SECTION D: DOCUMENT UPLOAD ========== */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Document Upload
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload supporting documents and images
                    </p>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald-500 transition">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    <label
                      htmlFor="fileUpload"
                      className="text-emerald-600 font-medium cursor-pointer hover:underline"
                    >
                      Click to upload
                    </label>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, Excel, Images (Max 10MB each)
                  </p>
                  <input
                    id="fileUpload"
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.jpg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files List */}
                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Uploaded Files:
                    </p>

                    {formData.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {file.size} KB
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                
              {/* PHASE 2 PLACEHOLDER SECTION */}
              <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 p-6">
                <h3 className="text-md font-semibold text-slate-800 mb-3">
                  🚀 Phase 2 Enhancements (Coming Soon)
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>
                      Verification standards selection (Verra, Gold Standard,
                      ISO 14064)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>
                      Marketplace pricing configuration per carbon credit
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>
                      Advanced GIS/map-based project boundary definition
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>
                      AI-powered emission factor recommendation system
                    </span>
                  </li>
                </ul>
              </div>

              {/* ========== ACTION BUTTONS ========== */}
              <div className="flex items-center justify-end gap-4 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition flex items-center gap-2 font-medium shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Submit Project
                </button>
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
