import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import Sidebar from "./ui/Sidebar";
import {
  Home,
  Zap,
  ShoppingCart,
  Target,
  Wallet,
  Users,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  FolderOpen,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import GradientBg from "../assets/GradientBg.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import Footer from "./ui/Footer";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // API Data State
  const [creditSummary, setCreditSummary] = useState({
    total_available: 0,
    total_used: 0,
    issued_available: 0,
    purchased_available: 0,
  });
  const [projectCount, setProjectCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/Login");
        return;
      }

      // Get user ID from token
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        setUserId(parseInt(tokenPayload.user_id || tokenPayload.sub, 10));
      } catch (e) {
        console.error("Error parsing token:", e);
      }

      try {
        // Fetch credit summary
        const creditResponse = await axios.get(
          "http://127.0.0.1:8000/api/credits/summary/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCreditSummary(creditResponse.data);

        // Fetch projects count
        const projectResponse = await axios.get(
          "http://127.0.0.1:8000/api/projects/projects/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjectCount(projectResponse.data.length);

        // Fetch recent transactions
        const transactionResponse = await axios.get(
          "http://127.0.0.1:8000/api/transactions/my/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecentTransactions(transactionResponse.data.slice(0, 5));

        // Fetch profile for company name
        try {
          const profileRes = await axios.get(
            "http://127.0.0.1:8000/api/accounts/profile/",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCompanyName(profileRes.data?.name || "");
        } catch (_) {}

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          navigate("/Login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Generate chart data from credit summary
  const chartData = [
    { name: "Issued", credits: creditSummary.issued_available, fill: "#4CAF50" },
    { name: "Purchased", credits: creditSummary.purchased_available, fill: "#36C2B4" },
    { name: "Used", credits: creditSummary.total_used, fill: "#94a3b8" },
  ];

  // Helper to determine transaction type
  const getTransactionType = (transaction) => {
    const buyerId = parseInt(transaction.buyer_id, 10);
    if (buyerId === userId) return "PURCHASE";
    return "SALE";
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* Top Navigation */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />


      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main Content */}
      <div
        className={`pt-20 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="px-6 max-w-7xl mx-auto space-y-8 pb-4">
          {/* Header */}
          <div className="space-y-2 mt-5">
            <h1 className="text-4xl font-bold text-slate-900">
              Welcome Back{companyName ? `, ${companyName}` : "!"} 🌍
            </h1>
            <p className="text-slate-600">
              Here's your weekly eco-impact summary
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: FolderOpen,
                label: "View Projects",
                description: "Track your submitted projects",
                color: "from-teal-400 to-cyan-400",
                path: "/ViewProjects",
              },
              {
                icon: PlusCircle,
                label: "Add Project",
                description: "Submit a new project for verification",
                color: "from-blue-400 to-cyan-500",
                path: "/AddProject",
              },
            ].map((stat, idx) => (
              <button
                key={idx}
                onClick={() => navigate(stat.path)}
                className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-linear-to-br from-white/60 to-white/40 border border-white/30 p-6 hover:border-white/50 transition-all shadow-lg hover:shadow-2xl cursor-pointer text-left"
              >
                <div className="absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${stat.color} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{stat.label}</p>
                    <p className="text-sm text-slate-500">{stat.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Credit Distribution Chart */}
            <div className="lg:col-span-2 rounded-lg backdrop-blur-xl bg-linear-to-br from-white/60 to-white/40 border border-white/30 p-8 shadow-lg hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Credit Distribution
                  </h2>
                  <p className="text-sm text-slate-600">Your carbon credits breakdown</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                    }}
                    formatter={(value) => [`${value} Credits`, "Amount"]}
                  />
                  <Bar
                    dataKey="credits"
                    fill="#36C2B4"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats Summary */}
            <div className="space-y-6">
              <div className="rounded-lg backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 border border-white/30 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Credits Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <Award size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-600">Total Available</p>
                        <p className="text-xl font-bold text-slate-900">{creditSummary.total_available}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                        <Zap size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-600">Issued</p>
                        <p className="text-xl font-bold text-slate-900">{creditSummary.issued_available}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                        <ShoppingCart size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-600">Purchased</p>
                        <p className="text-xl font-bold text-slate-900">{creditSummary.purchased_available}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
                        <Target size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-600">Used/Retired</p>
                        <p className="text-xl font-bold text-slate-900">{creditSummary.total_used}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 rounded-lg backdrop-blur-lg bg-gradient-to-br from-white/60 to-white/40 border border-white/30 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Recent Transactions
                </h2>
                <button 
                  onClick={() => navigate("/PurchaseHistory")}
                  className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All <ArrowRight size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No transactions yet</p>
                    <p className="text-sm text-slate-400">Your transaction history will appear here</p>
                  </div>
                ) : (
                  recentTransactions.map((transaction) => {
                    const txType = getTransactionType(transaction);
                    const isBuyer = txType === "PURCHASE";
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/40 transition-colors group cursor-pointer"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
                            isBuyer 
                              ? "bg-gradient-to-br from-red-400 to-rose-500" 
                              : "bg-gradient-to-br from-emerald-400 to-teal-500"
                          }`}
                        >
                          {isBuyer ? (
                            <ArrowUpRight size={20} className="text-white" />
                          ) : (
                            <ArrowDownLeft size={20} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {isBuyer ? "Purchased from" : "Sold to"} {isBuyer ? transaction.seller_username : transaction.buyer_username}
                          </p>
                          <p className="text-xs text-slate-500">
                            {transaction.project_name || `Project #${transaction.project_id}`} • {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${isBuyer ? "text-red-600" : "text-emerald-600"}`}>
                            {isBuyer ? "-" : "+"}${parseFloat(transaction.total_amount || 0).toFixed(2)}
                          </span>
                          <p className="text-xs text-slate-500">{transaction.credits_transferred} credits</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br backdrop-blur-2xl from-white/60 to-white/40 border border-white/30 p-4 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/AddProject")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <PlusCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add New Project</p>
                      <p className="text-xs text-slate-500">Submit for verification</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/Marketplace")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                      <ShoppingCart size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Browse Marketplace</p>
                      <p className="text-xs text-slate-500">Buy carbon credits</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/Mycredits")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                      <Wallet size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">My Credits</p>
                      <p className="text-xs text-slate-500">Manage your portfolio</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/ViewProjects")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <FolderOpen size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">View Projects</p>
                      <p className="text-xs text-slate-500">Track project status</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  );
};

export default Dashboard;
