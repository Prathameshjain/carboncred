import React from "react";
import { useState } from "react";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import GradientBg from '../assets/GradientBg.png';
import { 
  Leaf, 
  ArrowLeft,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  Eye
} from "lucide-react";
import { Card,CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";

function Mycredits() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const credits = [
    {
      id: 1,
      projectName: "Amazon Rainforest Conservation",
      location: "Brazil",
      amount: 1500,
      purchaseDate: "2024-01-15",
      status: "Active",
      type: "Forestry",
      value: 27750,
      retired: 0,
    },
    {
      id: 2,
      projectName: "Wind Farm Energy Project",
      location: "Texas, USA",
      amount: 2200,
      purchaseDate: "2024-02-20",
      status: "Active",
      type: "Renewable Energy",
      value: 34650,
      retired: 500,
    },
    {
      id: 3,
      projectName: "Mangrove Restoration",
      location: "Indonesia",
      amount: 1800,
      purchaseDate: "2024-03-10",
      status: "Partially Retired",
      type: "Marine Conservation",
      value: 36000,
      retired: 800,
    },
    {
      id: 4,
      projectName: "Solar Power Initiative",
      location: "India",
      amount: 3000,
      purchaseDate: "2023-12-05",
      status: "Active",
      type: "Renewable Energy",
      value: 42750,
      retired: 0,
    },
  ];

  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalValue = credits.reduce((sum, credit) => sum + credit.value, 0);
  const totalRetired = credits.reduce((sum, credit) => sum + credit.retired, 0);
  const activeCredits = totalCredits - totalRetired;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* <div className="absolute inset-0"></div> */}
      {/* Top Navigation */}
    <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        } pt-24`}
      >
        <div className="px-6 max-w-7xl mx-auto space-y-8 pb-4">

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
                <Award className="w-8 h-8 text-muted-foreground" />
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
                <CardTitle className="items-start ">Credit Holdings</CardTitle>
                <CardDescription>
                  Your carbon credit portfolio breakdown
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2 rounded bg-emerald-600 border-slate-700 text-white hover:bg-emerald-500 hover:text-slate-900">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {credits.map((credit) => (
                <Card
                  key={credit.id}
                  className="bg-muted/30 border-border/50 hover:shadow-xl transition-all shadow-md"
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
                                ? "bg-success/20 text-success border-success/30"
                                : "bg-warning/20 text-warning border-warning/30"
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
                            {(credit.amount - credit.retired).toLocaleString()}
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

                        <div className="flex items-center">
                          <Button variant="outline" size="sm" className="gap-2 rounded bg-emerald-600 border-slate-700 text-white hover:bg-emerald-500 hover:text-slate-900">
                            <Eye className="w-4 h-4" />
                            Details
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
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-4">
          <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">CarbonCred</h3>
              <p className="text-gray-400 text-sm">12th Floor, Jio World Centre,</p>
              <p className="text-gray-400 text-sm">BKC Phase 2, Worli,</p>
              <p className="text-gray-400 text-sm">Mumbai 400001</p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-4">© 2025 CarbonCred Technologies Pvt. Ltd. All rights reserved.</p>
              <div className="flex space-x-4 justify-end">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Mycredits;
