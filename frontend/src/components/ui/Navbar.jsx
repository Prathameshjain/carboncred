import React from "react";
import GradientBg from '../../assets/GradientBg.png';
import { Menu, Bell, User, ChevronDown, Settings, LogOut, Search,Leaf } from "lucide-react";
import { useState } from "react";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  return (
    <>
    <div className="absolute"></div>
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
    // </>
    );
};

export default Navbar;