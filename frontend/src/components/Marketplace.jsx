import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const projects = [
    {
      id: 1,
      name: "Amazon Rainforest Conservation",
      location: "Brazil",
      credits: 5000,
      price: 18.5,
      verified: true,
      type: "Forestry",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Wind Farm Energy Project",
      location: "Texas, USA",
      credits: 3200,
      price: 15.75,
      verified: true,
      type: "Renewable Energy",
      rating: 4.6,
    },
    {
      id: 3,
      name: "Mangrove Restoration",
      location: "Indonesia",
      credits: 4100,
      price: 20.0,
      verified: true,
      type: "Marine Conservation",
      rating: 4.9,
    },
    {
      id: 4,
      name: "Solar Power Initiative",
      location: "India",
      credits: 6500,
      price: 14.25,
      verified: true,
      type: "Renewable Energy",
      rating: 4.7,
    },
    {
      id: 5,
      name: "Reforestation Program",
      location: "Kenya",
      credits: 2800,
      price: 19.5,
      verified: true,
      type: "Forestry",
      rating: 4.5,
    },
    {
      id: 6,
      name: "Ocean Cleanup Project",
      location: "Pacific Ocean",
      credits: 3900,
      price: 22.0,
      verified: true,
      type: "Marine Conservation",
      rating: 4.8,
    },
  ];

  const handlePurchase = (project) => {
    setSelectedProject(project);
    setOpenDialog(true);
    setToastMessage(`Processing purchase for ${projects.name}`);
    setTimeout(() => setToastMessage(null), 3000);
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
          className={`pt-24 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
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
                      <p className="text-3xl font-bold text-white">156</p>
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
                        $18.50
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
                      <p className="text-3xl font-bold text-cyan-500">42.5K</p>
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
                className="gap-2 rounded bg-emerald-600 text-white border-slate-700  hover:bg-emerald-500 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Projects Grid */}
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
                      {project.verified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-emerald-400/30 hover:text-emerald-900 transition-colors">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg  group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3 h-3" />
                      {project.location}
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
                          ${project.price}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Rating</span>
                        <span className="text-sm font-medium text-amber-400">
                          ★ {project.rating}
                        </span>
                      </div>
                      <Button
                        className="w-full rounded bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40"
                        onClick={() => handlePurchase(project)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase Credits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl text-slate-900 font-bold">
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
                      <span className="text-slate-700">Available Credits</span>
                      <span className="font-semibold">
                        {selectedProject.credits.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-700">Price per Credit</span>
                      <span className="font-semibold text-emerald-400">
                        ${selectedProject.price}
                      </span>
                    </div>

                    {/* Quantity Input */}
                    <div className="flex flex-col gap-2 mt-4">
                      <label className="bg-white/70 text-slate-900 placeholder:text-slate-400">
                        Enter quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-slate-900 placeholder:text-slate-400"
                        placeholder="Number of credits to purchase"
                      />
                    </div>

                    <Button className="w-full rounded bg-emerald-600 hover:bg-emerald-700  mt-4">
                      Confirm Purchase
                    </Button>
                  </div>
                )}
              </DialogContent>
              {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  No projects found matching your search.
                </p>
              </div>
            )}
            </Dialog>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
