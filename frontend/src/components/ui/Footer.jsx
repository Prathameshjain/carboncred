import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className=" bg-gray-900 text-white py-4">
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
  );
}
export default Footer;  
      