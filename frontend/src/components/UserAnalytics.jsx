import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";
import Sidebar from "./ui/Sidebar";
import Footer from "./ui/Footer";
import GradientBg from "../assets/GradientBg.png";
import { FolderOpen, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ComposedChart, Line, Area,
  ResponsiveContainer,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────────
const API = "http://127.0.0.1:8000/api/analytics";

const STATUS_COLORS = {
  VERIFIED: "#10b981",
  REVIEW_REQUIRED: "#f59e0b",
  REJECTED: "#ef4444",
  PENDING: "#94a3b8",
};

const DOMAIN_COLORS = {
  PLANTATION: "#16a34a",
  SOLAR:      "#eab308",
  METHANE:    "#8b5cf6",
  COOKSTOVE:  "#f97316",
  WIND:       "#06b6d4",
};

// Shared card class — flex-col so inner content can stretch
const CARD = "rounded-xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-md p-6 flex flex-col h-full";

const tooltipStyle = {
  contentStyle: { borderRadius: 10, fontSize: 12, border: "1px solid #e2e8f0" },
};

const axisStyle = { fontSize: 11, fill: "#64748b" };

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

// ── Data hook ─────────────────────────────────────────────────────────────────
function useJson(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.get(url, { headers: authHeader() })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading };
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function CardShell({ title, subtitle, children, className = "" }) {
  return (
    <div className={`${CARD} ${className}`}>
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[200px] text-slate-400">
      <FolderOpen className="w-10 h-10" />
      <p className="text-sm text-center">No data yet — submit your first project</p>
      <button
        onClick={() => navigate("/AddProject")}
        className="text-sm text-emerald-600 underline font-medium"
      >
        Add a project
      </button>
    </div>
  );
}

// ── Chart 1 — Project Status Pie ──────────────────────────────────────────────
function ProjectStatusChart() {
  const { data, loading } = useJson(`${API}/user/project-status/`);
  return (
    <CardShell title="Project Verification Status" subtitle="Breakdown by decision outcome">
      {loading ? <LoadingState /> : (
        !data || data.values.every(v => v === 0) ? <EmptyState /> : (() => {
          const chartData = data.labels
            .map((l, i) => ({ name: l.replace("_", " "), key: l, value: data.values[i] }))
            .filter(d => d.value > 0);
          return (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={85}>
                    {chartData.map(e => <Cell key={e.key} fill={STATUS_COLORS[e.key] || "#94a3b8"} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    payload={chartData.map(e => ({
                      value: `${e.name}: ${e.value}`,
                      type: "circle",
                      color: STATUS_COLORS[e.key] || "#94a3b8",
                    }))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      )}
    </CardShell>
  );
}

// ── Chart 2 — Project Type Pie ────────────────────────────────────────────────
function ProjectTypesChart() {
  const { data, loading } = useJson(`${API}/user/project-types/`);
  return (
    <CardShell title="Project Type Breakdown" subtitle="Portfolio by domain">
      {loading ? <LoadingState /> : (
        !data || data.values.every(v => v === 0) ? <EmptyState /> : (() => {
          const chartData = data.labels
            .map((l, i) => ({ name: l, value: data.values[i] }))
            .filter(d => d.value > 0);
          return (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={115}>
                    {chartData.map(e => <Cell key={e.name} fill={DOMAIN_COLORS[e.name] || "#94a3b8"} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 13 }}
                    payload={chartData.map(e => ({
                      value: `${e.name}: ${e.value}`,
                      type: "circle",
                      color: DOMAIN_COLORS[e.name] || "#94a3b8",
                    }))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      )}
    </CardShell>
  );
}

// ── Chart 3 — CO₂ Over Time ───────────────────────────────────────────────────
function CO2OverTimeChart() {
  const { data, loading } = useJson(`${API}/user/co2-over-time/`);
  const fmtCO2 = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v;
  return (
    <CardShell title="Your CO₂ Impact Over Time" subtitle="Cumulative tCO₂ sequestered or avoided from verified projects">
      {loading ? <LoadingState /> : (
        !data || !data.data.length ? <EmptyState /> : (
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis scale="log" domain={[1, 'auto']} tickFormatter={fmtCO2} tick={axisStyle} allowDataOverflow />
                <Tooltip formatter={(v) => [`${v.toLocaleString()} tCO₂`]} {...tooltipStyle} />
                <Bar dataKey="co2" fill="#10b981" radius={[4, 4, 0, 0]} name="Monthly CO₂" />
                <Line type="monotone" dataKey="cumulative" stroke="#059669" strokeWidth={2} dot={false} name="Cumulative CO₂" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </CardShell>
  );
}

// ── Chart 4 — Credits Per Project (scrollable) ────────────────────────────────
function CreditsPerProjectChart() {
  const { data, loading } = useJson(`${API}/user/credits-per-project/`);
  return (
    <CardShell title="Credits Issued Per Project" subtitle="Verified projects ranked by credits">
      {loading ? <LoadingState /> : (
        !data || !data.data.length ? <EmptyState /> : (() => {
          const chartData = data.data.map(d => ({
            ...d,
            name: d.project_name.length > 18 ? d.project_name.substring(0, 18) + "…" : d.project_name,
          }));
          const rowH = 40;
          const chartH = Math.max(200, Math.min(chartData.length * rowH, 400));
          return (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={chartData} layout="vertical"
                  margin={{ top: 4, right: 50, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={axisStyle} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ ...axisStyle, textAnchor: "end" }} />
                  <Tooltip formatter={(v) => [`${v.toLocaleString()} ICC`]} {...tooltipStyle} />
                  <Bar dataKey="credits" fill="#14b8a6" radius={[0, 6, 6, 0]}
                    label={{ position: "right", fontSize: 10, fill: "#475569" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      )}
    </CardShell>
  );
}

// ── Chart 5 — Confidence Scores (scrollable) ──────────────────────────────────
function ConfidenceScoresChart() {
  const { data, loading } = useJson(`${API}/user/confidence-scores/`);
  return (
    <CardShell title="ML Verification Confidence" subtitle="Score per project (green ≥ 70%, amber ≥ 40%)">
      {loading ? <LoadingState /> : (
        !data || !data.data.length ? <EmptyState /> : (() => {
          const chartData = data.data.map(d => ({
            name: d.project_name.length > 16 ? d.project_name.substring(0, 16) + "…" : d.project_name,
            confidence: d.confidence,
            fill: d.confidence >= 70 ? "#10b981" : d.confidence >= 40 ? "#f59e0b" : "#ef4444",
          }));
          const rowH = 40;
          const chartH = Math.max(200, Math.min(chartData.length * rowH, 400));
          return (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={chartData} layout="vertical"
                  margin={{ top: 4, right: 50, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={axisStyle} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ ...axisStyle, textAnchor: "end" }} />
                  <Tooltip formatter={(v) => [`${v}%`]} {...tooltipStyle} />
                  <Bar dataKey="confidence" radius={[0, 6, 6, 0]}
                    label={{ position: "right", fontSize: 10, fill: "#475569", formatter: v => `${v}%` }}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      )}
    </CardShell>
  );
}

// ── Chart 6 — Marketplace Activity ───────────────────────────────────────────
function MarketplaceActivityChart() {
  const { data, loading } = useJson(`${API}/user/marketplace-activity/`);
  return (
    <CardShell title="Marketplace Activity" subtitle="Credits bought vs. sold per month">
      {loading ? <LoadingState /> : (
        !data || !data.data.length ? <EmptyState /> : (
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="credits_sold" fill="#10b981" radius={[4, 4, 0, 0]} name="Credits Sold" />
                <Bar dataKey="credits_bought" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Credits Bought" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </CardShell>
  );
}

// ── Chart 7 — P&L ─────────────────────────────────────────────────────────────
function PnLChart() {
  const { data, loading } = useJson(`${API}/user/pnl/`);
  const inrFmt = v => {
    const n = Math.abs(v);
    if (n >= 1e6) return `₹${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
    return `₹${n}`;
  };
  return (
    <CardShell title="Transaction P&L" subtitle="Monthly INR earned vs. spent on purchases">
      {loading ? <LoadingState /> : (
        !data || !data.data.length ? <EmptyState /> : (
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tickFormatter={inrFmt} tick={axisStyle} />
                <Tooltip formatter={(v, n) => [inrFmt(v), n]} {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="earned" fill="#10b981" radius={[4, 4, 0, 0]} name="Earned (₹)" />
                <Bar dataKey="spent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spent (₹)" />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} dot={false} name="Net (₹)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </CardShell>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const UserAnalytics = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) navigate("/Login");
  }, [navigate]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GradientBg})` }}
    >
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar sidebarOpen={sidebarOpen} />

      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"} pt-24`}>
        <div className="px-6 max-w-7xl mx-auto space-y-6 pb-10">

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900">My Analytics</h1>
            <p className="text-slate-600 mt-1">Your personal carbon credit performance</p>
          </div>

          {/* Row 1 — Status (1 col) + Types (2 col) — equal height via items-stretch */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-1 flex flex-col h-full">
              <ProjectStatusChart />
            </div>
            <div className="lg:col-span-2 flex flex-col h-full">
              <ProjectTypesChart />
            </div>
          </div>

          {/* Row 2 — CO₂ over time (full width) */}
          <CO2OverTimeChart />

          {/* Row 3 — Credits (2 col) + Confidence (1 col) — both capped + scrollable */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 flex flex-col h-full">
              <CreditsPerProjectChart />
            </div>
            <div className="lg:col-span-1 flex flex-col h-full">
              <ConfidenceScoresChart />
            </div>
          </div>

          {/* Row 4 — Marketplace activity */}
          <MarketplaceActivityChart />

          {/* Row 5 — P&L */}
          <PnLChart />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default UserAnalytics;
