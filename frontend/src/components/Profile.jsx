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
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Wallet,
  FileText,
  Loader2,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import Sidebar from "./ui/Sidebar";
import Navbar from "./ui/Navbar";
import { useNavigate } from "react-router-dom";
import GradientBg from "../assets/GradientBg.png";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/Login");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/accounts/profile/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      {/* Header */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Background Overlay */}
      <div className="absolute inset-0"></div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        <div
          className={`pt-24 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <main className="px-6 py-4 max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-2 text-slate-600">Loading profile...</span>
              </div>
            ) : profile ? (
              <>
                {/* Profile Header */}
                <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                        <p className="text-emerald-100">@{profile.username}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-white/20 text-white border-white/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified Organization
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <Card className="bg-white border-border/50 shadow-md">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-left text-base">
                        <User className="w-5 h-5 text-emerald-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-2">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">Email</p>
                        <p className="font-medium text-slate-800 text-left">{profile.email}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">Phone</p>
                        <p className="font-medium text-slate-800 text-left">{profile.phone}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">Owner Name</p>
                        <p className="font-medium text-slate-800 text-left">{profile.owner_name}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Registration Details */}
                  <Card className="bg-white border-border/50 shadow-md">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-left text-base">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Registration Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-2">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">Registration No.</p>
                        <p className="font-medium text-slate-800 text-left">{profile.registration_no}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">Registration Year</p>
                        <p className="font-medium text-slate-800 text-left">{profile.registration_year}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-emerald-600 text-left mb-1">PAN ID</p>
                        <p className="font-medium text-slate-800 text-left">{profile.pan_id}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Wallet Information */}
                <Card className="bg-white border-border/50 shadow-md">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-left text-base">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                      Wallet Information
                    </CardTitle>
                    <CardDescription className="text-left text-sm">Your MetaMask wallet connected to this account</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-emerald-600 text-left mb-1">MetaMask Wallet Address</p>
                          <p className="font-mono text-sm text-slate-800 break-all text-left">
                            {profile.metamask_wallet_address}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(profile.metamask_wallet_address, 'wallet')}
                        className="text-slate-500 hover:text-slate-700 flex-shrink-0"
                      >
                        {copied === 'wallet' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="bg-white border-border/50 shadow-md">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div className="text-left">
                          <p className="text-xs text-emerald-600 text-left mb-1">Member Since</p>
                          <p className="font-medium text-slate-800 text-left">{formatDate(profile.created_at)}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                        Active Account
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-24">
                <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg font-medium">Profile not found</p>
                <p className="text-slate-500 text-sm mt-2">
                  Unable to load your profile information.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
