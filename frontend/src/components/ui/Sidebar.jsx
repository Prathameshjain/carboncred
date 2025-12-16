import { Home, Zap, ShoppingCart, Wallet, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useState } from "react";

const Sidebar = ({ sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/Dashboard" },
    { icon: Zap, label: "Credits", path: "/Mycredits" },
    { icon: ShoppingCart, label: "Marketplace", path: "/Marketplace" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: Users, label: "Community", path: "/community" },
  ];

  return (
    <div
      className={`fixed left-0 top-20 bottom-0 z-30 backdrop-blur-xl bg-white/50 border-r border-white/20 transition-all duration-300
      ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
    >
      <div className="p-4 space-y-6">
        {/* Menu Section */}
        <div className="space-y-2">
          {sidebarOpen && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
              Menu
            </p>
          )}

        {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group
                  ${
                    isActive
                      ? "bg-linear-to-r from-green-400/30 to-teal-400/30 text-teal-700 font-medium border border-teal-200/50"
                      : "text-slate-600 hover:bg-white/40"
                  }`}
              >
                <item.icon size={20} />

                {/* Hide labels when collapsed */}
                {sidebarOpen ? (
                  <span className="text-sm">{item.label}</span>
                ) : (
                  <span className="absolute left-16 opacity-0 pointer-events-none group-hover:opacity-100
                    bg-slate-900 text-white text-xs rounded-md px-2 py-1 transition-all">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* QUICK ACCESS */}
        <div className="border-t border-white/20 pt-4">
          {sidebarOpen && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
              Quick Access
            </p>
          )}

          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-white/40 transition-all relative group"
          >
            <Settings size={20} />

            {sidebarOpen ? (
              <span className="text-sm">Settings</span>
            ) : (
              <span className="absolute left-16 opacity-0 pointer-events-none group-hover:opacity-100
                    bg-slate-900 text-white text-xs rounded-md px-2 py-1 transition-all">
                Settings
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
