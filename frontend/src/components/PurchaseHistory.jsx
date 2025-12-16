import { useState } from "react";
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
  Leaf,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  DollarSign,
  Search,
  Download,
  Filter,
  MapPin,
  Award,
  ExternalLink,
} from "lucide-react";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import GradientBg from "../assets/GradientBg.png";

const PurchaseHistory = () => {
  const [toastMessage, setToastMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const query = searchQuery.toLowerCase();

  const purchases = [
    {
      id: "TXN-2024-001",
      date: "2024-03-15",
      projectName: "Rainforest Conservation",
      location: "Gujarat",
      credits: 3000,
      pricePerCredit: 18.5,
      totalAmount: 55500,
      status: "Pending",
      type: "Forestry",
      transactionHash: "0x1a2b3c4d5e6f...",
    },
    {
      id: "TXN-2024-002",
      date: "2024-03-10",
      projectName: "Wind Farm Energy Project",
      location: "Jaipur",
      credits: 2200,
      pricePerCredit: 15.75,
      totalAmount: 34650,
      status: "Completed",
      type: "Renewable Energy",
      transactionHash: "0x2b3c4d5e6f7g...",
    },
    {
      id: "TXN-2024-003",
      date: "2024-03-05",
      projectName: "Mangrove Restoration",
      location: "Mumbai",
      credits: 1800,
      pricePerCredit: 20.0,
      totalAmount: 36000,
      status: "Completed",
      type: "Marine Conservation",
      transactionHash: "0x3c4d5e6f7g8h...",
    },
    {
      id: "TXN-2024-004",
      date: "2024-02-28",
      projectName: "Solar Power Initiative",
      location: "Uttar Pradesh",
      credits: 3000,
      pricePerCredit: 14.25,
      totalAmount: 42750,
      status: "Completed",
      type: "Renewable Energy",
      transactionHash: "0x4d5e6f7g8h9i...",
    },
    {
      id: "TXN-2024-005",
      date: "2024-02-20",
      projectName: "Reforestation Program",
      location: "Tamil Nadu",
      credits: 1500,
      pricePerCredit: 19.5,
      totalAmount: 29250,
      status: "Completed",
      type: "Forestry",
      transactionHash: "0x5e6f7g8h9i0j...",
    },
    {
      id: "TXN-2024-006",
      date: "2024-02-15",
      projectName: "Ocean Cleanup Project",
      location: "Indian Ocean",
      credits: 2000,
      pricePerCredit: 22.0,
      totalAmount: 44000,
      status: "Pending",
      type: "Marine Conservation",
      transactionHash: "0x6f7g8h9i0j1k...",
    },
  ];

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCredits = purchases.reduce((sum, p) => sum + p.credits, 0);
  const completedTransactions = purchases.filter(
    (p) => p.status === "Completed"
  ).length;

const filteredPurchases = purchases.filter(p =>
  p.id.toLowerCase().includes(query) ||
  p.projectName.toLowerCase().includes(query) ||
  p.location.toLowerCase().includes(query)
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
          className={`pt-24 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <main className="px-6 py-4 max-w-7xl mx-auto space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400">Total Spent</p>
                    <p className="text-3xl font-bold text-primary">
                      ${totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400">
                      Total Credits
                    </p>
                    <p className="text-3xl font-bold text-success">
                      {totalCredits.toLocaleString()}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-success" />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400">
                      Transactions
                    </p>
                    <p className="text-3xl font-bold text-info">
                      {completedTransactions}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-info" />
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-2 mb-8">
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
                  Complete list of all your carbon credit purchases
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 space-y-4">
                {filteredPurchases.map((purchase) => (
                  <Card key={purchase.id}
                  className="bg-muted/30 border-border/50 hover:shadow-xl transition-all shadow-md">
                    <CardContent className="pt-2 p-6 space-y-4">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-sm">
                              {purchase.id}
                            </span>
                            <Badge className={purchase.status==="Completed"
                            ?"bg-green-200 text-success border-green-700"
                            :"bg-amber-300 text-amber-700 border-red-700"}>{purchase.status}</Badge>
                            <Badge className={"bg-blue-200 text-blue-700 border-blue-900"}>{purchase.type}</Badge>
                          </div>

                          <h3 className="flex text-lg font-semibold items-start">
                            {purchase.projectName}
                          </h3>

                          <div className="flex gap-4 text-sm text-slate-600 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {purchase.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {purchase.date}
                            </span>
                            <button className="flex items-center gap-1 hover:text-primary">
                              <ExternalLink className="w-3 h-3" />
                              View on blockchain
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-8 text-center">
                          <div>
                            <p className="text-sm text-slate-600">
                              Credits
                            </p>
                            <p className="text-xl font-bold">
                              {purchase.credits}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              Price
                            </p>
                            <p className="text-xl font-bold text-primary">
                              ${purchase.pricePerCredit}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              Total
                            </p>
                            <p className="text-xl font-bold text-success">
                              ${purchase.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-1.5 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">Transaction Hash:</span>
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-sm text-foreground">
                            {purchase.transactionHash}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
              </CardContent>
              {filteredPurchases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  No projects found matching your search.
                </p>
              </div>
            )}
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;
