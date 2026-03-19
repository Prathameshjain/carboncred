import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import GradientBg from "../assets/GradientBg.png";
import {
  Search,
  Filter,
  MapPin,
  Award,
  TrendingUp,
  ShoppingCart,
  Loader2,
  User,
  RefreshCw,
} from "lucide-react";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // API data states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    activeListings: 0,
    averagePrice: 0,
    availableCredits: 0,
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/Login");
      return;
    }

    // Get user ID from token
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setUserId(tokenPayload.user_id || tokenPayload.sub);
    } catch (e) {
      setUserId(null);
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/marketplace/orders/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const activeListings = response.data;
      setListings(activeListings);

      // Calculate stats
      const totalCredits = activeListings.reduce((sum, l) => sum + l.credits_for_sale, 0);
      const avgPrice = activeListings.length > 0
        ? (activeListings.reduce((sum, l) => sum + parseFloat(l.price_per_credit), 0) / activeListings.length).toFixed(2)
        : 0;

      setStats({
        activeListings: activeListings.length,
        averagePrice: avgPrice,
        availableCredits: totalCredits,
      });
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/Login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Transform listings to project format for display
  const projects = listings.map(listing => ({
    id: listing.id,
    sellOrderId: listing.id,
    name: listing.project_name || `Project #${listing.project}`,
    type: listing.project_type || "Carbon Credit",
    location: listing.project_location || "Global",
    credits: listing.credits_for_sale,
    price: parseFloat(listing.price_per_credit),
    verified: listing.project_verified !== false,
    sellerId: listing.seller,
    sellerName: listing.seller_name || `User #${listing.seller}`,
    createdAt: listing.created_at,
    projectId: listing.project,
  }));

  const handlePurchase = (project) => {
    if (project.sellerId === userId) {
      setToastMessage("You cannot purchase your own listing");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setSelectedProject(project);
    setPurchaseQuantity(1);
    setPurchaseError("");
    setOpenDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedProject) return;

    if (purchaseQuantity <= 0 || purchaseQuantity > selectedProject.credits) {
      setPurchaseError("Invalid quantity");
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://127.0.0.1:8000/api/marketplace/buy/",
        {
          sell_order_id: selectedProject.sellOrderId,
          credits_to_buy: purchaseQuantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOpenDialog(false);
      setToastMessage(`Successfully purchased ${purchaseQuantity} credits from ${selectedProject.name}!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh listings
      await fetchListings();
    } catch (error) {
      console.error("Error purchasing credits:", error);
      setPurchaseError(error.response?.data?.error || "Failed to complete purchase");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      searchQuery === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* Header */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />
      {/* Background Overlay for readability */}
      <div className="absolute inset-0"></div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top">
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        )}

        <div
          className={`pt-20 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"
            }`}
        >
          <main className="px-6 py-4 max-w-7xl mx-auto space-y-8">
            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 ">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">
                        Active Listings
                      </p>
                      <p className="text-3xl font-bold text-white">{stats.activeListings}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">
                        Average Price
                      </p>
                      <p className="text-3xl font-bold text-emerald-600">
                        ₹{stats.averagePrice}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">
                        Available Credits
                      </p>
                      <p className="text-3xl font-bold text-cyan-500">{stats.availableCredits.toLocaleString()}</p>
                    </div>
                    <Award className="w-8 h-8 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative border-b border-slate-700">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900 " />
                <Input
                  className="pl-10 text-slate-900 placeholder:text-slate-900"
                  placeholder="Search projects by name, location, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 rounded bg-slate-700 text-white border-slate-700 hover:bg-slate-600 hover:text-white"
                onClick={fetchListings}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded bg-emerald-600 text-white border-slate-700  hover:bg-emerald-500 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-2 text-slate-600">Loading marketplace...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-white/50 rounded-xl">
                <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg font-medium">
                  {searchQuery ? "No listings found matching your search." : "No active listings available"}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  {searchQuery ? "Try a different search term." : "Be the first to list your carbon credits on the marketplace!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="bg-white border-slate-800 shadow-md hover:shadow-emerald-500/20 transition-all duration-300 group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-400/30 hover:text-emerald-900 transition-colors">
                          {project.type}
                        </Badge>
                        <div className="flex gap-1">
                          {project.verified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-emerald-400/30 hover:text-emerald-900 transition-colors">
                              <Award className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {project.sellerId === userId && (
                            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                              Your Listing
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg  group-hover:text-emerald-400 transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                        <User className="w-3 h-3" />
                        Seller: {project.sellerName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">
                            Available Credits
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {project.credits.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">
                            Price per Credit
                          </span>
                          <span className="text-lg font-bold text-emerald-400">
                            ₹{project.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Total Value</span>
                          <span className="text-sm font-medium text-slate-600">
                            ₹{(project.credits * project.price).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          className={`w-full rounded shadow-lg ${project.sellerId === userId
                              ? "bg-slate-400 cursor-not-allowed"
                              : "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 group-hover:shadow-emerald-500/40"
                            }`}
                          onClick={() => handlePurchase(project)}
                          disabled={project.sellerId === userId}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {project.sellerId === userId ? "Your Listing" : "Purchase Credits"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl text-slate-900 font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Purchase Credits
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Review the details before completing your purchase.
                  </DialogDescription>
                </DialogHeader>

                {selectedProject && (
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Project</span>
                      <span className="font-semibold text-slate-900">
                        {selectedProject.name}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-700">Location</span>
                      <span className="font-semibold">
                        {selectedProject.location}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-700">Seller</span>
                      <span className="font-semibold text-slate-700">
                        {selectedProject.sellerName}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-700">Available Credits</span>
                      <span className="font-semibold">
                        {selectedProject.credits.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-700">Price per Credit</span>
                      <span className="font-semibold text-emerald-400">
                        ₹{selectedProject.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Input */}
                    <div className="flex flex-col gap-2 mt-4">
                      <label className="text-slate-700 font-medium">
                        Credits to Purchase
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProject.credits}
                        value={purchaseQuantity}
                        onChange={(e) => setPurchaseQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedProject.credits))}
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400 outline-none"
                        placeholder="Number of credits to purchase"
                      />
                    </div>

                    {/* Total Cost Preview */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-700 font-medium">Total Cost</span>
                        <span className="text-2xl font-bold text-emerald-700">
                          ₹{(purchaseQuantity * selectedProject.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Error */}
                    {purchaseError && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{purchaseError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded text-slate-700 hover:bg-slate-100"
                        onClick={() => setOpenDialog(false)}
                        disabled={purchaseLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={confirmPurchase}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Confirm Purchase
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
