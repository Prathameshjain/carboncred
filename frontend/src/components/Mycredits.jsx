import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
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
  Store,
  CheckCircle,
  ShoppingCart,
  ExternalLink,
  Link,
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
  const purchaseCertificateRef = useRef(null);
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
  const [userId, setUserId] = useState(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);

  // API data states
  const [issuedCredits, setIssuedCredits] = useState([]);
  const [purchasedCredits, setPurchasedCredits] = useState([]);
  const [myListings, setMyListings] = useState([]); // Track user's active marketplace listings
  const [creditSummary, setCreditSummary] = useState({
    total_available: 0,
    total_used: 0,
    issued_available: 0,
    purchased_available: 0,
  });

  // Download Purchase Certificate as PDF
  const downloadPurchaseCertificate = async () => {
    if (!purchaseCertificateRef.current || !selectedCredit) return;

    setDownloadingCertificate(true);
    try {
      const element = purchaseCertificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgHeight / imgWidth;

      const a4Width = 210;
      const a4Height = 297;
      let pdfWidth = a4Width;
      let pdfHeight = a4Width * aspectRatio;

      if (pdfHeight > a4Height) {
        pdfHeight = a4Height;
        pdfWidth = a4Height / aspectRatio;
      }

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CarbonCred_Purchase_Certificate_${selectedCredit.id}.pdf`);
    } catch (error) {
      console.error("Error generating certificate:", error);
    } finally {
      setDownloadingCertificate(false);
    }
  };

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

    // Get user ID from token
    let currentUserId = null;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = tokenPayload.user_id || tokenPayload.sub || "N/A";
      setUserId(currentUserId);
    } catch (e) {
      setUserId("N/A");
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

      // Fetch user's active marketplace listings
      const listingsResponse = await axios.get(
        "http://127.0.0.1:8000/api/marketplace/orders/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter only current user's listings
      const userListings = listingsResponse.data.filter(
        listing => listing.seller === currentUserId
      );
      setMyListings(userListings);
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

  // Helper function to check if a credit wallet is listed on marketplace
  const getListingInfo = (projectId) => {
    return myListings.find(listing => listing.project === projectId);
  };

  // Combine issued and purchased credits for display
  const credits = [
    ...issuedCredits.map(c => {
      const listing = getListingInfo(c.project_id);
      return {
        id: c.id,
        project_id: c.project_id,
        projectName: c.project_name || (c.project_id ? `Project #${c.project_id}` : "Direct Issuance"),
        location: c.project_location || "N/A",
        projectType: c.project_type || "Carbon Credit",
        amount: c.available_credits,
        purchaseDate: c.created_at,
        status: c.available_credits > 0 ? "Active" : "Used",
        type: c.credit_type,
        value: listing ? listing.credits_for_sale * listing.price_per_credit : null,
        retired: c.used_credits,
        creditType: "ISSUED",
        isListed: !!listing,
        listingInfo: listing,
        blockchain_minted: c.blockchain_minted,
        blockchain_tx_hash: c.blockchain_tx_hash,
      };
    }),
    ...purchasedCredits.map(c => {
      const listing = getListingInfo(c.project_id);
      return {
        id: c.id,
        project_id: c.project_id,
        projectName: c.project_name || (c.project_id ? `Project #${c.project_id}` : "Marketplace Purchase"),
        location: c.project_location || "N/A",
        projectType: c.project_type || "Carbon Credit",
        amount: c.available_credits,
        purchaseDate: c.created_at,
        status: c.available_credits > 0 ? "Active" : "Used",
        type: c.credit_type,
        value: listing ? listing.credits_for_sale * listing.price_per_credit : null,
        retired: c.used_credits,
        creditType: "PURCHASED",
        isListed: !!listing,
        listingInfo: listing,
        blockchain_minted: c.blockchain_minted,
        blockchain_tx_hash: c.blockchain_tx_hash,
      };
    }),
  ];

  const totalCredits = creditSummary.total_available;
  const totalValue = credits.reduce((sum, credit) => sum + (credit.value || credit.amount * 18.5), 0);
  const totalRetired = creditSummary.total_used;
  const activeCredits = creditSummary.total_available;

  const showDetails = (credit) => {
    setSelectedCredit(credit);
    setOpenDetailsDialog(true);
  };

  // Fetch full project details and open report dialog
  const openProjectReport = async (credit) => {
    // For PURCHASED credits, only show basic credit details (not the full project report)
    // The buyer shouldn't see the seller's full verification report
    if (credit.creditType === "PURCHASED") {
      setSelectedCredit(credit);
      setOpenDetailsDialog(true);
      return;
    }

    // For ISSUED credits (project owner), show full verification report
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

    if (creditsForSale > selectedProject.activeCredits) {
      setError("You cannot sell more credits than you own.");
      return;
    }

    // Open confirmation dialog
    setOpenConfirmDialog(true);
  };

  const confirmSellCredits = async () => {
    setListingLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://127.0.0.1:8000/api/marketplace/sell/",
        {
          project_id: selectedProject.project_id,
          credits_for_sale: parseInt(creditsForSale),
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
      console.error("Error creating marketplace listing:", error);
      setError(error.response?.data?.error || "Failed to list credits on marketplace");
    } finally {
      setListingLoading(false);
    }
  };

  const cancelListing = async (listingId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `http://127.0.0.1:8000/api/marketplace/sell-orders/${listingId}/cancel/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh credits data
      await fetchCredits();
    } catch (error) {
      console.error("Error cancelling listing:", error);
      alert(error.response?.data?.error || "Failed to cancel listing");
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
          className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"
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

                              {credit.isListed && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-500">
                                  <Store className="w-3 h-3 mr-1" />
                                  Listed
                                </Badge>
                              )}
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

                            {/* Show Value only when listed on marketplace */}
                            {credit.isListed && credit.value && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                  Listed Value
                                </p>
                                <p className="text-2xl font-bold text-emerald-600">
                                  ${credit.value.toLocaleString()}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gap-2 rounded bg-linear-to-r bg-blue-100 border-slate-600 text-slate-800 hover:bg-slate-800 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  showDetails(credit);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </Button>

                              {credit.isListed ? (
                                <Button
                                  size="sm"
                                  className="gap-2 rounded bg-emerald-500 text-white cursor-default shadow-md pointer-events-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Listed
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="gap-2 rounded bg-linear-to-r from-emerald-500 to bg-teal-600 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedProject({
                                      id: credit.id,
                                      project_id: credit.project_id,
                                      name: credit.projectName,
                                      activeCredits:
                                        credit.amount - credit.retired,
                                    });
                                    setCreditsForSale("");
                                    setPricePerCredit("");
                                    setError("");
                                    setOpenDialog(true);
                                  }}
                                  disabled={credit.amount - credit.retired <= 0}
                                >
                                  <Store className="w-4 h-4" />
                                  Add to Marketplace
                                </Button>
                              )}
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
            <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl text-slate-900 font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  {selectedCredit?.creditType === "PURCHASED" ? "Purchased Credit Details" : "Credit Details"}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {selectedCredit?.creditType === "PURCHASED"
                    ? "View details of your marketplace purchase."
                    : "View detailed information about this credit."}
                </DialogDescription>
              </DialogHeader>

              {selectedCredit && (
                <div className="space-y-4 mt-4">
                  {/* Project Name */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">
                      {selectedCredit.creditType === "PURCHASED" ? "Original Project" : "Project Name"}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedCredit.projectName}
                    </p>
                  </div>

                  {/* Purchase Info - Only for PURCHASED credits */}
                  {selectedCredit.creditType === "PURCHASED" && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-700">Purchase Information</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Purchase Date</span>
                          <span className="font-medium text-blue-800">
                            {new Date(selectedCredit.purchaseDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Acquired Via</span>
                          <Badge className="bg-blue-100 text-blue-700">Marketplace</Badge>
                        </div>
                      </div>
                    </div>
                  )}

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
                        ${(selectedCredit.value || selectedCredit.amount * 18.5).toLocaleString()}
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
                        {selectedCredit.creditType === "PURCHASED" ? "PURCHASED" : "ISSUED"}
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
                    {selectedCredit.creditType === "ISSUED" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Location</span>
                          <span className="font-medium text-slate-900">{selectedCredit.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Issue Date</span>
                          <span className="font-medium text-slate-900">
                            {new Date(selectedCredit.purchaseDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Marketplace Status - for listed credits */}
                  {selectedCredit.isListed && selectedCredit.listingInfo && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">Marketplace Listing</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-emerald-600">Credits Listed</span>
                          <span className="font-medium text-emerald-800">
                            {selectedCredit.listingInfo.credits_for_sale}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600">Price per Credit</span>
                          <span className="font-medium text-emerald-800">
                            ${parseFloat(selectedCredit.listingInfo.price_per_credit).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600">Total Value</span>
                          <span className="font-bold text-emerald-800">
                            ${(selectedCredit.listingInfo.credits_for_sale * parseFloat(selectedCredit.listingInfo.price_per_credit)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blockchain Record Section */}
                  {selectedCredit.blockchain_tx_hash && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Link className="w-4 h-4 text-indigo-600" />
                        <p className="text-sm font-semibold text-indigo-700">Blockchain Record</p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-indigo-600 mb-1">Transaction Hash</p>
                          <p className="font-mono text-xs text-indigo-800 bg-indigo-100 px-2 py-1 rounded" title={selectedCredit.blockchain_tx_hash}>
                            {selectedCredit.blockchain_tx_hash.slice(0, 10)}...{selectedCredit.blockchain_tx_hash.slice(-8)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-600">Network</span>
                          <Badge className="bg-indigo-100 text-indigo-700">Sepolia</Badge>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${selectedCredit.blockchain_tx_hash.startsWith('0x') ? selectedCredit.blockchain_tx_hash : '0x' + selectedCredit.blockchain_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Etherscan
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {selectedCredit.creditType === "PURCHASED" && (
                      <Button
                        className="flex-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={downloadPurchaseCertificate}
                        disabled={downloadingCertificate}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloadingCertificate ? "Generating..." : "Download Certificate"}
                      </Button>
                    )}
                    <Button
                      className={`${selectedCredit.creditType === "PURCHASED" ? "flex-1" : "w-full"} rounded bg-slate-800 text-white hover:bg-slate-700`}
                      onClick={() => setOpenDetailsDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Hidden Purchase Certificate for PDF Generation */}
          {selectedCredit && selectedCredit.creditType === "PURCHASED" && (
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              <div
                ref={purchaseCertificateRef}
                style={{
                  width: '800px',
                  padding: '40px',
                  backgroundColor: '#ffffff',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {/* Certificate Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #10b981', paddingBottom: '20px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#064e3b', marginBottom: '5px' }}>
                    🌱 CarbonCred
                  </h1>
                  <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '5px' }}>
                    Carbon Credit Purchase Certificate
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Certificate ID: CC-{selectedCredit.id}-{Date.now().toString(36).toUpperCase()}
                  </p>
                </div>

                {/* Certificate Body */}
                <div style={{ marginBottom: '30px' }}>
                  <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', textAlign: 'center' }}>
                    This certifies that the following carbon credits have been successfully purchased and transferred.
                  </p>

                  {/* Credit Details Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569', width: '40%' }}>Original Project</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{selectedCredit.projectName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569' }}>Credits Purchased</td>
                        <td style={{ padding: '12px', color: '#1e293b', fontWeight: 'bold' }}>{selectedCredit.amount.toLocaleString()} Credits</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569' }}>Credit Type</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{selectedCredit.type}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569' }}>Purchase Date</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>
                          {new Date(selectedCredit.purchaseDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569' }}>Acquired Via</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>CarbonCred Marketplace</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#475569' }}>Status</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            backgroundColor: selectedCredit.status === 'Active' ? '#dcfce7' : '#fef3c7',
                            color: selectedCredit.status === 'Active' ? '#166534' : '#92400e',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {selectedCredit.status}
                          </span>
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: '#ecfdf5' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#065f46' }}>Portfolio Value</td>
                        <td style={{ padding: '12px', color: '#065f46', fontWeight: 'bold', fontSize: '18px' }}>
                          ${(selectedCredit.value || selectedCredit.amount * 18.5).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Blockchain Transaction Record */}
                {selectedCredit.blockchain_tx_hash && (
                  <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4338ca', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔗 Blockchain Transaction Record
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0', fontWeight: '600', color: '#6366f1', width: '35%' }}>Transaction Hash</td>
                          <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: '11px', color: '#1e1b4b', wordBreak: 'break-all' }}>
                            {selectedCredit.blockchain_tx_hash.startsWith('0x') ? selectedCredit.blockchain_tx_hash : '0x' + selectedCredit.blockchain_tx_hash}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', fontWeight: '600', color: '#6366f1' }}>Network</td>
                          <td style={{ padding: '8px 0', color: '#1e1b4b' }}>Ethereum Sepolia Testnet</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', fontWeight: '600', color: '#6366f1' }}>Token</td>
                          <td style={{ padding: '8px 0', color: '#1e1b4b' }}>CCT (CarbonCred Token)</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', fontWeight: '600', color: '#6366f1' }}>Verify On-Chain</td>
                          <td style={{ padding: '8px 0', color: '#4f46e5', fontSize: '11px' }}>
                            https://sepolia.etherscan.io/tx/{selectedCredit.blockchain_tx_hash.startsWith('0x') ? selectedCredit.blockchain_tx_hash : '0x' + selectedCredit.blockchain_tx_hash}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                    This certificate is digitally generated by CarbonCred Platform and serves as proof of purchase.
                  </p>
                  {selectedCredit.blockchain_tx_hash && (
                    <p style={{ fontSize: '11px', color: '#6366f1', marginBottom: '10px' }}>
                      ✓ This transaction is permanently recorded on the Ethereum blockchain.
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Generated on: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '15px' }}>
                    CarbonCred Technologies Pvt. Ltd. | 12th Floor, Jio World Centre, BKC Phase 2, Worli, Mumbai 400001
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <DialogTitle className="text-xl text-slate-900 font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Add to Marketplace
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
                      Credits to List
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProject.activeCredits}
                      value={creditsForSale}
                      onChange={(e) =>
                        setCreditsForSale(Number(e.target.value))
                      }
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-400 outline-none"
                      placeholder="Enter credits to list"
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
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-400 outline-none"
                      placeholder="Set price"
                    />
                  </div>

                  {/* Total Value Preview */}
                  {creditsForSale > 0 && pricePerCredit > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-700">Total Listing Value</span>
                        <span className="text-xl font-bold text-emerald-700">
                          ${(creditsForSale * pricePerCredit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  {/* List Button */}
                  <Button
                    className="w-full rounded bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                    onClick={handleSellCredits}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    List on Marketplace
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
            <DialogContent className="bg-white border border-slate-200 shadow-xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Confirm Listing
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
                    <span className="text-slate-600">Credits to List</span>
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
                      Total Listing Value
                    </span>
                    <span className="font-bold text-emerald-600">
                      ${(creditsForSale * pricePerCredit).toLocaleString()}
                    </span>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-slate-900 bg-slate-100 hover:bg-slate-200"
                      onClick={() => setOpenConfirmDialog(false)}
                      disabled={listingLoading}
                    >
                      Cancel
                    </Button>

                    <Button
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={confirmSellCredits}
                      disabled={listingLoading}
                    >
                      {listingLoading ? "Listing..." : "Confirm Listing"}
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
