import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import Footer from "./ui/Footer";
import VerificationReport from "./VerificationReport";
import GradientBg from "../assets/GradientBg.png";
import {
  FolderOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  PlusCircle,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";

const ViewProjects = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch projects from API
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/Login");
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/api/projects/projects/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/Login");
      } else {
        setError("Failed to load projects. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (decision) => {
    switch (decision) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      case "REVIEW_REQUIRED":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Review Required
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case "SOLAR":
        return "bg-yellow-100 text-yellow-700";
      case "VEGETATION":
        return "bg-green-100 text-green-700";
      case "PLANTATION":
        return "bg-emerald-100 text-emerald-700";
      case "METHANE":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar sidebarOpen={sidebarOpen} />

      <div
        className={`transition-all duration-300 pt-24 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="px-6 max-w-7xl mx-auto space-y-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-emerald-600" />
                My Projects
              </h1>
              <p className="text-slate-600 mt-1">
                View and manage your carbon credit projects
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchProjects}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => navigate("/AddProject")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Projects Yet
              </h3>
              <p className="text-slate-500 mb-4">
                Create your first carbon credit project to get started
              </p>
              <button
                onClick={() => navigate("/AddProject")}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Create Project
              </button>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  {/* Header - Project Name */}
                  <h3 className="font-bold text-slate-900 text-xl mb-1 text-center">
                    {project.project_name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 text-center">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  {/* Status and Type Badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {getStatusBadge(project.final_decision)}
                    <Badge className={getClassificationColor(project.classification)}>
                      {project.classification}
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1">Confidence</p>
                      <p className="font-semibold text-slate-800">
                        {project.confidence_score
                          ? `${(parseFloat(project.confidence_score) * 100).toFixed(1)}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1">Est. CO₂</p>
                      <p className="font-semibold text-slate-800">
                        {project.estimated_co2_tco2_year || "N/A"} tCO₂/yr
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1">Credits Issued</p>
                      <p className="font-semibold text-emerald-600">
                        {project.credits_issued || 0}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1">Report ID</p>
                      <p className="font-semibold text-slate-700 text-sm truncate" title={project.report_id || "Pending"}>
                        {project.report_id || "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Verification Report Modal */}
          {selectedProject && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-slate-100 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Verification Report
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedProject.project_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* PDF Report Container */}
                <div className="flex-1 overflow-y-auto p-6">
                  <VerificationReport project={selectedProject} />
                </div>

                {/* Modal Footer */}
                <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ViewProjects;