import Navbar from "./ui/Navbarhome";
import React from 'react';
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/homeBG.jpg";
import contextImg from "../assets/contextImg.png";
import GradientBg from '../assets/GradientBg.png';
import { Home, Leaf, Zap, Users, CheckCircle, Box, DollarSign } from 'lucide-react';

export default function CarbonCredHomepage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("accessToken");
  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}>
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white-200 px-8 py-4 backdrop-blur-md">
          <div className="p-2 backdrop-blur-lg">
            <div className="max-w-8xl mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Leaf size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold">
                  Carbon<span className="text-green-600">Cred</span>
                </span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate("/PlatformStats")}
                  className="relative text-gray-900 font-medium pb-1 after:absolute after:left-0 after:-bottom-1 
                  after:h-0.5 after:w-0 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full">
                  Platform Stats
                </button>
                {isLoggedIn ? (
                  <button
                    onClick={() => navigate("/Dashboard")}
                    className="relative text-gray-900 font-medium pb-1 after:absolute after:left-0 after:-bottom-1 
                    after:h-0.5 after:w-0 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full">
                    Home
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/Login")}
                    className="relative text-gray-900 font-medium pb-1 after:absolute after:left-0 after:-bottom-1 
                    after:h-0.5 after:w-0 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full">
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative h-[520px]">
          <img
            src={backgroundImage}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative max-w-7xl mx-auto px-8 py-20 h-full flex flex-col justify-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-relaxed" >
              Accelerating India's<br />
              <span className="text-green-600 drop-shadow-[0_0_0.8px_black]">Net Zero 2070</span> Vision
            </h1>
            <div className="flex flex-col  align-items-center">
              <span className=" text-white font-semibold text-xl max-w-3xl m-3 leading-relaxed flex flex-col  align-items-center">
                CarbonCred utilizes advanced blockchain technology to create a transparent, efficient,
                and secure carbon credit trading ecosystem. We empower businesses to offset their
                footprint while funding verified green projects across India.
              </span>
            </div>

            <button
              onClick={() => navigate("/Marketplace")}
              className="rounded bg-green-600 text-white font-semibold px-6 py-3 flex items-center space-x-2 w-fit hover:bg-green-700 transition-all">
              <span>Get Started</span>
              <span>→</span>
            </button>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-16">
              <h3 className="text-green-500 font-semibold text-sm uppercase tracking-wide mb-2">THE CONTEXT</h3>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">India's Emission Landscape</h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                As the world's 3rd largest emitter, India balances rapid development with
                ambitious climate goals.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow text-left">
                <div className="flex items-center space-x-3 mb-4">
                  <Leaf className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-gray-600 text-sm">Net Zero Target</p>
                    <p className="text-3xl font-bold text-gray-900">2070</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  India's committed year to achieve net-zero greenhouse gas emissions.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow text-left">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-gray-600 text-sm">Renewable Goal</p>
                    <p className="text-3xl font-bold text-gray-900">50%</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Target share of non-fossil fuel energy capacity by 2030.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow text-left">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-gray-600 text-sm">Per Capita</p>
                    <p className="text-3xl font-bold text-gray-900">1.9 Tons</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  CO2 emissions per person, significantly lower than the global average of 4.7 tons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Carbon Credit Model Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Carbon Credit Model</h2>
                <p className="text-gray-600 text-lg mb-8">
                  CarbonCred bridges the gap between green projects and conscious
                  enterprises using the Carbon Credit Trading Scheme (CCTS) framework.
                </p>

                <div className="space-y-6">
                  {/* Feature 1 */}
                  <div className="flex space-x-4">
                    <div className="bg-green-500 rounded-lg p-3 h-fit">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Projects</h3>
                      <p className="text-gray-600">
                        We aggregate certified solar, wind, and reforestation projects verified by
                        accredited agencies.
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex space-x-4">
                    <div className="bg-green-500 rounded-lg p-3 h-fit">
                      <Box className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Tokenization</h3>
                      <p className="text-gray-600">
                        Each credit is tokenized on a secure blockchain, preventing double-counting
                        and ensuring transparency.
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex space-x-4">
                    <div className="bg-green-500 rounded-lg p-3 h-fit">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Seamless Trading</h3>
                      <p className="text-gray-600">
                        Businesses purchase these tokens to offset their emissions, receiving an
                        immutable certificate of retirement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Illustration placeholder */}
              <div className=" rounded-lg p-3  shadow-lg">
                <div className=" bg-linear-to-br from-green-50 to-blue-50 rounded-4xl flex items-center justify-center">
                  <img
                    src={contextImg} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
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
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
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