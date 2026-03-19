import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import Marketplace from "./components/Marketplace";
import Mycredits from "./components/Mycredits";
import PurchaseHistory from "./components/PurchaseHistory";
import AddProject from "./components/AddProject";
import ViewProjects from "./components/ViewProjects";
import Profile from "./components/Profile";
import UserAnalytics from "./components/UserAnalytics";
import PlatformAnalytics from "./components/PlatformAnalytics";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

/** Redirect logged-in users away from public-only pages */
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if (token) return <Navigate to="/Dashboard" replace />;
  return children;
};

function App() {
  return (
    <>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Home />} />
        <Route path="/PlatformStats" element={<PlatformAnalytics />} />
        <Route path="/Login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/Registration" element={<PublicOnlyRoute><Registration /></PublicOnlyRoute>} />

        {/* ── Protected (auth required) ── */}
        <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/Marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/Mycredits" element={<ProtectedRoute><Mycredits /></ProtectedRoute>} />
        <Route path="/PurchaseHistory" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
        <Route path="/AddProject" element={<ProtectedRoute><AddProject /></ProtectedRoute>} />
        <Route path="/ViewProjects" element={<ProtectedRoute><ViewProjects /></ProtectedRoute>} />
        <Route path="/Profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/Analytics" element={<ProtectedRoute><UserAnalytics /></ProtectedRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-8xl font-bold text-slate-200">404</h1>
      <p className="text-slate-600 mt-4 text-xl">Page not found</p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  );
}

export default App;
