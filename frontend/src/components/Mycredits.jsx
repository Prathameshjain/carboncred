import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import Footer from "./ui/Footer";
import VerificationReport from "./VerificationReport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import GradientBg from "../assets/GradientBg.png";
import {
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  Eye,
  ArrowUpRight,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";

function Mycredits() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [creditsForSale, setCreditsForSale] = useState("");
  const [pricePerCredit, setPricePerCredit] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);
  
  // API data states
  const [issuedCredits, setIssuedCredits] = useState([]);
  const [purchasedCredits, setPurchasedCredits] = useState([]);
  const [creditSummary, setCreditSummary] = useState({
    total_available: 0,
    total_used: 0,
    issued_available: 0,
    purchased_available: 0,
  });

  // Fetch credits from API
  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/Login");
      return;
    }

    setLoading(true);
    try {
      // Fetch credit summary
      const summaryResponse = await axios.get(
        "http://127.0.0.1:8000/api/credits/summary/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreditSummary(summaryResponse.data);

      // Fetch issued credits
      const issuedResponse = await axios.get(
        "http://127.0.0.1:8000/api/credits/issued/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIssuedCredits(issuedResponse.data);

      // Fetch purchased credits
      const purchasedResponse = await axios.get(
        "http://127.0.0.1:8000/api/credits/purchased/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPurchasedCredits(purchasedResponse.data);
    } catch (error) {
      console.error("Error fetching credits:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/Login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Combine issued and purchased credits for display
  const credits = [
    ...issuedCredits.map(c => ({
      id: c.id,
      project_id: c.project_id,
      projectName: c.project_id ? `Project #${c.project_id}` : "Direct Issuance",
      location: "N/A",
      amount: c.available_credits,
      purchaseDate: c.created_at,
      status: c.available_credits > 0 ? "Active" : "Used",
      type: c.credit_type,
      value: c.available_credits * 18.5, // Example price per credit
      retired: c.used_credits,
      creditType: "ISSUED",
    })),
    ...purchasedCredits.map(c => ({
      id: c.id,
      project_id: c.project_id,
      projectName: c.project_id ? `Project #${c.project_id}` : "Marketplace Purchase",
      location: "N/A", 
      amount: c.available_credits,
      purchaseDate: c.created_at,
      status: c.available_credits > 0 ? "Active" : "Used",
      type: c.credit_type,
      value: c.available_credits * 18.5,
      retired: c.used_credits,
      creditType: "PURCHASED",
    })),
  ];

  const totalCredits = creditSummary.total_available;
  const totalValue = credits.reduce((sum, credit) => sum + credit.value, 0);
  const totalRetired = creditSummary.total_used;
  const activeCredits = creditSummary.total_available;

  const showDetails = (credit) => {
    setSelectedCredit(credit);
    setOpenDetailsDialog(true);
  };

  // Fetch full project details and open report dialog
  const openProjectReport = async (credit) => {
    if (!credit.project_id) {
      // No project associated, show basic details instead
      setSelectedCredit(credit);
      setOpenDetailsDialog(true);
      return;
    }

    setLoadingProject(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://127.0.0.1:8000/api/projects/projects/${credit.project_id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedProjectData(response.data);
      setOpenReportDialog(true);
    } catch (error) {
      console.error("Error fetching project details:", error);
      // Fall back to basic details
      setSelectedCredit(credit);
      setOpenDetailsDialog(true);
    } finally {
      setLoadingProject(false);
    }
  };

  const handleSellCredits = async () => {
    setError("");

    if (!creditsForSale || creditsForSale <= 0) {
      setError("Please enter a valid number of credits.");
      return;
    }

    if (!pricePerCredit || pricePerCredit <= 0) {
      setError("Please enter a valid price per credit.");
      return;
    }

    if (creditsForSale > selectedProject.amount) {
      setError("You cannot sell more credits than you own.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://127.0.0.1:8000/api/credits/sell/",
        {
          project_id: selectedProject.id,
          credits_to_sell: parseInt(creditsForSale),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOpenConfirmDialog(true);
    } catch (error) {
      console.error("Error selling credits:", error);
      setError(error.response?.data?.error || "Failed to sell credits");
    }
  };

  const confirmSellCredits = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://127.0.0.1:8000/api/credits/sell/",
        {
          project_id: selectedProject.id,
          credits_to_sell: parseInt(creditsForSale),
          price_per_credit: parseFloat(pricePerCredit),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh credits data
      await fetchCredits();

      // Reset everything
      setOpenConfirmDialog(false);
      setOpenDialog(false);
      setCreditsForSale("");
      setPricePerCredit("");
      setSelectedProject(null);
    } catch (error) {
      console.error("Error confirming sell:", error);
      setError(error.response?.data?.error || "Failed to sell credits");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* Top Navigation */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* MAIN LAYOUT */}
      <div className="flex pt-24 relative">
        <aside
          className={`transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          {/* SIDEBAR */}
          <div className="sticky top-24 h-[calc(100vh-6rem)]">
            <Sidebar sidebarOpen={sidebarOpen} />
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-6 max-w-7xl mx-auto space-y-8 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-card border-border/50 shadow-md bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200 text-muted-foreground mb-1">
                        Total Credits
                      </p>
                      <p className="text-3xl text-amber-400 font-bold">
                        {totalCredits.toLocaleString()}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50 shadow-md bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200 text-muted-foreground mb-1">
                        Active Credits
                      </p>
                      <p className="text-3xl font-bold text-success">
                        {activeCredits.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50 shadow-md bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200 text-muted-foreground mb-1">
                        Retired Credits
                      </p>
                      <p className="text-3xl text-red-500 font-bold text-muted-foreground">
                        {totalRetired.toLocaleString()}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50 shadow-md bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200 text-muted-foreground mb-1">
                        Portfolio Value
                      </p>
                      <p className="text-3xl font-bold text-blue-500">
                        ${totalValue.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credits List */}
            <Card className="bg-gradient-card bg-white border-border/50 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-start ">
                      Projects Portfolio
                    </CardTitle>
                    <CardDescription>
                      Your Carbon credit breakdown
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 rounded bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-2 pb-6">
                <div className="space-y-4">
                  {credits.map((credit) => (
                    <Card
                      key={credit.id}
                      className="bg-muted/30 border-border/50 hover:shadow-xl transition-all shadow-md cursor-pointer hover:bg-muted/50"
                      onClick={() => openProjectReport(credit)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {credit.projectName}
                              </h3>

                              <Badge
                                className={
                                  credit.status === "Active"
                                    ? "bg-green-200 text-success border-green-700"
                                    : "bg-amber-300 text-amber-700 border-red-700"
                                }
                              >
                                {credit.status}
                              </Badge>

                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                {credit.type}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {credit.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Purchased: {credit.purchaseDate}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">
                                Total
                              </p>
                              <p className="text-2xl font-bold text-slate-800">
                                {credit.amount.toLocaleString()}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">
                                Active
                              </p>
                              <p className="text-2xl font-bold text-success">
                                {(
                                  credit.amount - credit.retired
                                ).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">
                                Value
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                ${credit.value.toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                className="gap-2 rounded bg-linear-to-r bg-blue-100 border-slate-600 text-slate-800 hover:bg-slate-800 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDetails(credit);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                className="gap-2 rounded bg-linear-to-r from-red-500 to bg-red-900 text-white hover:bg-red-700 shadow-md shadow-red-500/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject({
                                    id: credit.id,
                                    name: credit.projectName,
                                    activeCredits:
                                      credit.amount - credit.retired,
                                  });
                                  setCreditsForSale("");
                                  setPricePerCredit("");
                                  setError("");
                                  setOpenDialog(true);
                                }}
                              >
                                <ArrowUpRight className="w-4 h-4" />
                                Sell Credits
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Details Dialog */}
          <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
            <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl text-slate-900 font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Credit Details
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  View detailed information about this credit.
                </DialogDescription>
              </DialogHeader>

              {selectedCredit && (
                <div className="space-y-4 mt-4">
                  {/* Project Name */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Project Name</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedCredit.projectName}
                    </p>
                  </div>

                  {/* Credit Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm text-emerald-600 mb-1">Total Credits</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {selectedCredit.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Active Credits</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(selectedCredit.amount - selectedCredit.retired).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-600 mb-1">Retired Credits</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {selectedCredit.retired.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">Portfolio Value</p>
                      <p className="text-2xl font-bold text-purple-700">
                        ${selectedCredit.value.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Credit Type</span>
                      <Badge className={
                        selectedCredit.creditType === "ISSUED" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-blue-100 text-blue-700"
                      }>
                        {selectedCredit.creditType}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Status</span>
                      <Badge className={
                        selectedCredit.status === "Active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      }>
                        {selectedCredit.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Type</span>
                      <span className="font-medium text-slate-900">{selectedCredit.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Location</span>
                      <span className="font-medium text-slate-900">{selectedCredit.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Purchase Date</span>
                      <span className="font-medium text-slate-900">
                        {new Date(selectedCredit.purchaseDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full rounded bg-slate-800 text-white hover:bg-slate-700"
                    onClick={() => setOpenDetailsDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Project Verification Report Modal */}
          {openReportDialog && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-slate-100 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Verification Report
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedProjectData?.project_name || "Project Details"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOpenReportDialog(false);
                      setSelectedProjectData(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* PDF Report Container */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedProjectData && (
                    <VerificationReport project={selectedProjectData} />
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setOpenReportDialog(false);
                      setSelectedProjectData(null);
                    }}
                    className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl text-slate-900 font-bold">
                  Sell Carbon Credits
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  List your credits on the marketplace for sale.
                </DialogDescription>
              </DialogHeader>

              {selectedProject && (
                <div className="space-y-4 mt-4">
                  {/* User ID */}
                  <div className="flex justify-between">
                    <span className="text-slate-700">User ID</span>
                    <span className="font-semibold text-slate-900">
                      {userId}
                    </span>
                  </div>

                  {/* Project */}
                  <div className="flex justify-between">
                    <span className="text-slate-700">Project</span>
                    <span className="font-semibold text-slate-900">
                      {selectedProject.name}
                    </span>
                  </div>

                  {/* Available Credits */}
                  <div className="flex justify-between">
                    <span className="text-slate-700">Available Credits</span>
                    <span className="font-semibold text-slate-900">
                      {selectedProject.activeCredits.toLocaleString()}
                    </span>
                  </div>

                  {/* Credits for Sale */}
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-700 font-medium">
                      Credits for Sale
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProject.activeCredits}
                      value={creditsForSale}
                      onChange={(e) =>
                        setCreditsForSale(Number(e.target.value))
                      }
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-400 outline-none"
                      placeholder="Enter credits to sell"
                    />
                  </div>

                  {/* Price per Credit */}
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-700 font-medium">
                      Price per Credit ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pricePerCredit}
                      onChange={(e) =>
                        setPricePerCredit(Number(e.target.value))
                      }
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-400 outline-none"
                      placeholder="Set price"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  {/* Sell Button */}
                  <Button
                    className="w-full rounded bg-linear-to-r from-red-500 to bg-red-900 text-white hover:bg-red-700 shadow-md shadow-red-500/20"
                    onClick={handleSellCredits}
                  >
                    Sell Credits
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
            <DialogContent className="bg-white border border-slate-200 shadow-xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Confirm Sale
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Please review the details before listing your credits.
                </DialogDescription>
              </DialogHeader>

              {selectedProject && (
                <div className="space-y-3 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Project</span>
                    <span className="font-medium text-slate-900">
                      {selectedProject.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Credits for Sale</span>
                    <span className="font-medium text-slate-900">
                      {creditsForSale}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Price per Credit</span>
                    <span className="font-medium text-slate-900">
                      ${pricePerCredit}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-slate-700 font-semibold">
                      Total Value
                    </span>
                    <span className="font-bold text-slate-900">
                      ${(creditsForSale * pricePerCredit).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex-col mt-4">
                    <Button
                      variant="outline"
                      className="w-full m-1 text-slate-900 bg-slate-300 hover:bg-slate-400 "
                      onClick={() => setOpenConfirmDialog(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      className="w-full m-1 bg-linear-to-r from-red-500 to bg-red-900 text-white hover:bg-red-700 shadow-md shadow-red-500/20"
                      onClick={confirmSellCredits}
                    >
                      Confirm Sell
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Mycredits;
