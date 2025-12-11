import React, { useState } from 'react';
import { useLocation } from "react-router-dom"; 
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, User, LogOut, Settings, Home, Zap, ShoppingCart, Target, Wallet, Users, MessageSquare,
  TrendingUp, Leaf, Award, TreePine, Droplet, Wind, ChevronDown, ChevronRight, Lock, CheckCircle,
  Plus, ArrowRight, Heart, Share2, Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import GradientBg from '../assets/GradientBg.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const chartData = [
    { date: 'Mon', credits: 12, reduction: 8.5 },
    { date: 'Tue', credits: 19, reduction: 12.3 },
    { date: 'Wed', credits: 15, reduction: 10.1 },
    { date: 'Thu', credits: 28, reduction: 18.7 },
    { date: 'Fri', credits: 35, reduction: 22.4 },
    { date: 'Sat', credits: 42, reduction: 28.5 },
    { date: 'Sun', credits: 38, reduction: 25.2 }
  ];

  const activities = [
    { icon: TreePine, action: 'Planted a tree', credits: '+20', color: 'from-green-400 to-teal-400' },
    { icon: Droplet, action: 'Reduced water usage', credits: '+12', color: 'from-blue-400 to-cyan-400' },
    { icon: Wind, action: 'Joined cleanup drive', credits: '+35', color: 'from-teal-400 to-emerald-400' },
    { icon: Zap, action: 'Used renewable energy', credits: '+18', color: 'from-yellow-400 to-amber-400' }
  ];

  const menuItems = [
  { icon: Home, label: "Dashboard", path: "/Dashboard" },
  { icon: Zap, label: "Activities", path: "/activities" },
  { icon: ShoppingCart, label: "Marketplace", path: "/Marketplace" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Users, label: "Community", path: "/community" }
  ];


  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat"style={{ backgroundImage: `url(${GradientBg})` }}>
      <div className="absolute inset-0"></div>
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/40 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Leaf size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-black bg-clip-text">
                Carbon<span className="text-green-600">Cred</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs mx-8">
            <Search size={18} className="text-slate-400 ml-3" />
            <input 
              type="text" 
              placeholder="Search activities..."
              className="w-full bg-white/40 border border-white/20 rounded-xl px-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:bg-white/60 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-3 hover:bg-white/40 rounded-xl transition-colors">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-white/40 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-md">
                  <User size={18} className="text-white" />
                </div>
                <ChevronDown size={16} className="text-slate-600" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-xl overflow-hidden">
                  <button className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-2 text-sm">
                    <User size={16} /> Profile
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-2 text-sm border-t border-white/10">
                    <Settings size={16} /> Settings
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-2 text-sm border-t border-white/10 text-red-600">
                    <LogOut size={16} /> Signout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} pt-24 pb-8`}>
        <div className="px-6 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Welcome back! 🌍</h1>
            <p className="text-slate-600">Here's your weekly eco-impact summary</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Award, label: 'Total Credits', value: '1,245', color: 'from-green-400 to-teal-400' },
              { icon: Wind, label: 'CO₂ Reduced', value: '245 kg', color: 'from-teal-400 to-cyan-400' },
              { icon: Wallet, label: 'Wallet Balance', value: '850 C', color: 'from-blue-400 to-indigo-400' }
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="group relative overflow-hidden rounded-lg backdrop-blur-xl bg-linear-to-br from-white/60 to-white/40 border border-white/30 p-6 hover:border-white/50 transition-all shadow-lg hover:shadow-2xl cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Carbon Footprint Chart */}
            <div className="lg:col-span-2 rounded-lg backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 border border-white/30 p-8 shadow-lg hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Carbon Impact Trend</h2>
                  <p className="text-sm text-slate-600">Your weekly progress</p>
                </div>
                <select className="px-4 py-2 bg-white/40 border border-white/20 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/60 transition-colors cursor-pointer">
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorReduction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#36C2B4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#36C2B4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reduction" 
                    stroke="#36C2B4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorReduction)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Profile Completion */}
            <div className="space-y-6">
              <div className="rounded-lg backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 border border-white/30 p-8 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Completion</h3>
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        fill="none" 
                        stroke="url(#grad1)" 
                        strokeWidth="8"
                        strokeDasharray={`${351.86 * 0.75} 351.86`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4CAF50" />
                          <stop offset="100%" stopColor="#36C2B4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">75%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Email Verified', done: true },
                    { label: 'Photo Added', done: true },
                    { label: 'Phone Verified', done: true },
                    { label: 'Identity Verified', done: false }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-colors">
                      {item.done ? (
                        <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Lock size={18} className="text-slate-400 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${item.done ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activities & Community */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Activities */}
            <div className="lg:col-span-2 rounded-lg backdrop-blur-lg bg-gradient-to-br from-white/60 to-white/40 border border-white/30 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Recent Activities</h2>
                <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center gap-1">
                  View All <ArrowRight size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {activities.map((activity, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/40 transition-colors group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <activity.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500">Today at 2:45 PM</p>
                    </div>
                    <span className="font-bold text-teal-600 text-lg">{activity.credits}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <Card className="bg-gradient-to-br backdrop-blur-2xl from-white/60 to-white/40 border border-white/30 p-8 shadow-lg">
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Current carbon credit market trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Average Price</span>
                    <span className="text-lg font-bold text-success">$18.50</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">24h Volume</span>
                    <span className="text-lg font-bold text-foreground">125,400</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Market Trend</span>
                    <span className="text-lg font-bold text-primary flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +5.2%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;