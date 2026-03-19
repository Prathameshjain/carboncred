import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  ShoppingCart,
  Calendar,
  Search,
  Download,
  Filter,
  MapPin,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import GradientBg from "../assets/GradientBg.png";

const PurchaseHistory = () => {
  const [toastMessage, setToastMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const query = searchQuery.toLowerCase();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/Login");
      return;
    }

    // Get user ID from token (ensure it's a number for comparison)
    let currentUserId = null;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = parseInt(tokenPayload.user_id || tokenPayload.sub, 10);
      setUserId(currentUserId);
    } catch (e) {
      console.error("Error parsing token:", e);
      setUserId(null);
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/transactions/my/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/Login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine if user is buyer or seller for each transaction
  const getTransactionType = (transaction) => {
    // Ensure numeric comparison
    const buyerId = parseInt(transaction.buyer_id, 10);
    const sellerId = parseInt(transaction.seller_id, 10);
    const currentUser = parseInt(userId, 10);

    if (buyerId === currentUser) return "PURCHASE";
    if (sellerId === currentUser) return "SALE";
    return "UNKNOWN";
  };

  // Calculate stats based on transaction type
  const totalSpent = transactions
    .filter(t => getTransactionType(t) === "PURCHASE")
    .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);

  const totalEarned = transactions
    .filter(t => getTransactionType(t) === "SALE")
    .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);

  const totalCreditsTransferred = transactions.reduce((sum, t) => sum + t.credits_transferred, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(t =>
    t.id.toString().includes(query) ||
    (t.project_name || '').toLowerCase().includes(query) ||
    (t.seller_username || '').toLowerCase().includes(query) ||
    (t.buyer_username || '').toLowerCase().includes(query)
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
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="flex items-start text-sm text-slate-400">Total Spent</p>
                    <p className="text-3xl font-bold text-red-400">
                      ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-red-400" />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="flex items-start text-sm text-slate-400">Total Earned</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      ₹{totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <ArrowDownLeft className="w-8 h-8 text-emerald-400" />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="flex items-start text-sm text-slate-400">
                      Credits Transferred
                    </p>
                    <p className="text-3xl font-bold text-cyan-400">
                      {totalCreditsTransferred.toLocaleString()}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-cyan-400" />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="flex items-start text-sm text-slate-400">
                      Transactions
                    </p>
                    <p className="text-3xl font-bold text-purple-400">
                      {transactions.length}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-purple-400" />
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-2 mb-8">
              <div className="flex-1 relative border-b border-slate-700">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900 " />
                <Input
                  className="pl-10 text-slate-900 placeholder:text-slate-900"
                  placeholder="Search by transaction ID, project name, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 rounded bg-slate-700 text-white border-slate-700 hover:bg-slate-600 hover:text-white"
                onClick={fetchTransactions}
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
              <Button variant="outline" className="gap-2 rounded bg-emerald-600 border-slate-700 text-white hover:bg-emerald-500 hover:text-slate-900">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            {/* Transactions */}
            <Card className="bg-white border-border/50 shadow-md pt-2 p-6">
              <CardHeader className="flex items-start">
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Complete list of all your carbon credit transactions (purchases & sales)
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="ml-2 text-slate-600">Loading transactions...</span>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg font-medium">
                      {searchQuery ? "No transactions found matching your search." : "No transactions yet"}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      {searchQuery ? "Try a different search term." : "Your transaction history will appear here once you buy or sell credits."}
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const txType = getTransactionType(transaction);
                    const isBuyer = txType === "PURCHASE";

                    return (
                      <Card key={transaction.id}
                        className="bg-muted/30 border-border/50 hover:shadow-xl transition-all shadow-md">
                        <CardContent className="pt-2 p-6 space-y-4">
                          <div className="flex flex-col lg:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-sm">
                                  TXN-{transaction.id}
                                </span>
                                <Badge className={isBuyer
                                  ? "bg-red-100 text-red-700 border-red-300"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
                                }>
                                  {isBuyer ? (
                                    <><ArrowUpRight className="w-3 h-3 mr-1" /> Purchase</>
                                  ) : (
                                    <><ArrowDownLeft className="w-3 h-3 mr-1" /> Sale</>
                                  )}
                                </Badge>
                                {transaction.project_type && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                    {transaction.project_type}
                                  </Badge>
                                )}
                              </div>

                              <h3 className="flex text-lg font-semibold items-start text-slate-800">
                                {transaction.project_name || `Project #${transaction.project_id}`}
                              </h3>

                              <div className="flex gap-4 text-sm text-slate-600 mt-2 flex-wrap">
                                {transaction.project_location && transaction.project_location !== "N/A" && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {transaction.project_location}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* Buyer/Seller Info */}
                              <div className="flex gap-4 text-sm mt-3">
                                {isBuyer ? (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <User className="w-3 h-3" />
                                    Seller: <span className="font-medium text-slate-800">{transaction.seller_username}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <User className="w-3 h-3" />
                                    Buyer: <span className="font-medium text-slate-800">{transaction.buyer_username}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-8 text-center items-center">
                              <div>
                                <p className="text-sm text-slate-600">
                                  Credits
                                </p>
                                <p className="text-xl font-bold text-slate-800">
                                  {transaction.credits_transferred.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-600">
                                  Price/Credit
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                  ₹{parseFloat(transaction.price_per_credit || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-600">
                                  Total
                                </p>
                                <p className={`text-xl font-bold ${isBuyer ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {isBuyer ? '-' : '+'}₹{(transaction.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;
