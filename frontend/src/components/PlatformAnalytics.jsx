import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import GradientBg from "../assets/GradientBg.png";
import { Leaf, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip,
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ComposedChart, Line, LineChart,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000/api/analytics";
const DOMAINS = ["PLANTATION", "SOLAR", "METHANE", "COOKSTOVE", "WIND"];
const STATUSES = ["VERIFIED", "REVIEW_REQUIRED", "REJECTED", "PENDING"];

const DOMAIN_COLORS = {
  PLANTATION: "#16a34a",
  SOLAR:      "#eab308",
  METHANE:    "#8b5cf6",
  COOKSTOVE:  "#f97316",
  WIND:       "#06b6d4",
};
const STATUS_COLORS = {
  VERIFIED:        "#10b981",
  REVIEW_REQUIRED: "#f59e0b",
  REJECTED:        "#ef4444",
  PENDING:         "#94a3b8",
};

const tooltipStyle = { contentStyle: { borderRadius: 10, fontSize: 12 } };
const axisStyle = { fontSize: 11, fill: "#64748b" };

// ── Data hook ─────────────────────────────────────────────────────────────────
function useJson(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.get(url)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading };
}

// ── Shared card (matches Home.jsx style) ────────────────────────────────────
function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-900 mb-0.5">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-emerald-500" /></div>;
}

// ── Summary ───────────────────────────────────────────────────────────────────
function SummaryStats() {
  const { data, loading } = useJson(`${API}/platform/growth/`);
  const last = data?.data?.[data.data.length - 1] || { users: 0, projects: 0, credits: 0 };
  const stats = [
    { label: "Registered Users",       value: last.users.toLocaleString("en-IN"),    color: "from-blue-500 to-blue-600" },
    { label: "Total Projects",          value: last.projects.toLocaleString("en-IN"),  color: "from-emerald-500 to-teal-600" },
    { label: "Credits in Circulation",  value: last.credits.toLocaleString("en-IN"),   color: "from-amber-500 to-orange-500" },
  ];
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.color} text-white p-5 shadow`}>
          <p className="text-sm opacity-80">{s.label}</p>
          <p className="text-3xl font-bold mt-1">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Domain Donut ───────────────────────────────────────────────────────────────
function DomainDonutChart() {
  const { data, loading } = useJson(`${API}/platform/domain-distribution/`);
  if (loading) return <Card title="Projects by Domain" subtitle="Verified projects"><Spinner /></Card>;
  const chartData = (data?.labels || []).map((l, i) => ({ name: l, value: data.values[i] })).filter(d => d.value > 0);
  const total = chartData.reduce((s, d) => s + d.value, 0);
  return (
    <Card title="Projects by Domain" subtitle="Verified projects across all classifications">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} dataKey="value" cx="50%" cy="45%" outerRadius={90} innerRadius={48}>
            {chartData.map(e => <Cell key={e.name} fill={DOMAIN_COLORS[e.name]} />)}
          </Pie>
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#1e293b" style={{ fontSize: 18, fontWeight: 700 }}>{total}</text>
          <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" style={{ fontSize: 11 }}>total</text>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} payload={chartData.map(e => ({ value: `${e.name}: ${e.value}`, type: "circle", color: DOMAIN_COLORS[e.name] }))} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Verification by Domain ────────────────────────────────────────────────────
function VerificationByDomainChart() {
  const { data, loading } = useJson(`${API}/platform/verification-by-domain/`);
  if (loading) return <Card title="Verification Outcome by Domain"><Spinner /></Card>;
  return (
    <Card title="Verification Outcome by Domain" subtitle="Percentage of projects verified, under review, or rejected">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data?.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="domain" tick={axisStyle} />
          <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={axisStyle} />
          <Tooltip formatter={v => [`${v}%`]} {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="VERIFIED"        stackId="a" fill={STATUS_COLORS.VERIFIED}        name="Verified" />
          <Bar dataKey="REVIEW_REQUIRED" stackId="a" fill={STATUS_COLORS.REVIEW_REQUIRED} name="Review" />
          <Bar dataKey="REJECTED"        stackId="a" fill={STATUS_COLORS.REJECTED}        name="Rejected" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── CO₂ Over Time ─────────────────────────────────────────────────────────────
function PlatformCO2Chart() {
  const { data, loading } = useJson(`${API}/platform/co2-over-time/`);
  if (loading) return <Card title="Cumulative CO₂ Impact Over Time"><Spinner /></Card>;
  if (!data?.months?.length) return <Card title="Cumulative CO₂ Impact Over Time"><p className="text-gray-400 text-sm text-center py-16">No verified projects yet</p></Card>;
  const chartData = data.months.map((m, i) => {
    const row = { month: m };
    DOMAINS.forEach(d => { row[d] = data.series[d]?.[i] || 0; });
    return row;
  });
  return (
    <Card title="Cumulative CO₂ Impact Over Time" subtitle="Total tCO₂ sequestered or avoided across all verified projects">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={axisStyle} />
          <YAxis tick={axisStyle} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip formatter={v => [`${v.toLocaleString()} tCO₂`]} {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {DOMAINS.map(d => <Area key={d} type="monotone" dataKey={d} stackId="1" fill={DOMAIN_COLORS[d]} stroke={DOMAIN_COLORS[d]} fillOpacity={0.6} />)}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Monthly Projects ──────────────────────────────────────────────────────────
function MonthlyProjectsChart() {
  const { data, loading } = useJson(`${API}/platform/monthly-projects/`);
  if (loading) return <Card title="Monthly Project Submissions"><Spinner /></Card>;
  return (
    <Card title="Monthly Project Submissions" subtitle="New projects submitted by verification outcome">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data?.data || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {STATUSES.map(s => <Bar key={s} dataKey={s} stackId="a" fill={STATUS_COLORS[s]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Marketplace Volume ────────────────────────────────────────────────────────
function MarketplaceVolumeChart() {
  const { data, loading } = useJson(`${API}/platform/marketplace-volume/`);
  if (loading) return <Card title="Marketplace Trading Volume"><Spinner /></Card>;
  const inrFmt = v => v >= 1e6 ? `₹${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `₹${(v/1e3).toFixed(0)}K` : `₹${v}`;
  return (
    <Card title="Marketplace Trading Volume" subtitle="Monthly INR value and credits traded">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data?.data || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={axisStyle} />
          <YAxis yAxisId="inr" tickFormatter={inrFmt} tick={{ ...axisStyle, fontSize: 10 }} />
          <YAxis yAxisId="credits" orientation="right" tick={axisStyle} />
          <Tooltip formatter={(v, n) => n === "INR Traded" ? [inrFmt(v)] : [v]} {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="inr" dataKey="total_inr" fill="#10b981" radius={[4,4,0,0]} name="INR Traded" />
          <Line yAxisId="credits" type="monotone" dataKey="total_credits" stroke="#06b6d4" strokeWidth={2} dot={false} name="Credits" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Credits by Domain ─────────────────────────────────────────────────────────
function CreditsByDomainChart() {
  const { data, loading } = useJson(`${API}/platform/credits-by-domain/`);
  if (loading) return <Card title="Credits Issued by Domain"><Spinner /></Card>;
  if (!data?.months?.length) return <Card title="Credits Issued by Domain"><p className="text-gray-400 text-sm text-center py-16">No data yet</p></Card>;
  const chartData = data.months.map((m, i) => {
    const row = { month: m };
    DOMAINS.forEach(d => { row[d] = data.series[d]?.[i] || 0; });
    return row;
  });
  return (
    <Card title="Credits Issued by Domain" subtitle="Monthly ICCs minted per domain">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {DOMAINS.map(d => <Bar key={d} dataKey={d} stackId="a" fill={DOMAIN_COLORS[d]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Growth ────────────────────────────────────────────────────────────────────
function GrowthChart() {
  const { data, loading } = useJson(`${API}/platform/growth/`);
  if (loading) return <Card title="Platform Growth Over Time"><Spinner /></Card>;
  const chartData = (data?.data || []).map(d => ({ ...d, credits_k: +(d.credits / 1000).toFixed(1) }));
  return (
    <Card title="Platform Growth Over Time" subtitle="Cumulative users, projects, and credits (credits in thousands)">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="users"     stroke="#3b82f6" strokeWidth={2} dot={false} name="Users" />
          <Line type="monotone" dataKey="projects"  stroke="#10b981" strokeWidth={2} dot={false} name="Projects" />
          <Line type="monotone" dataKey="credits_k" stroke="#f59e0b" strokeWidth={2} dot={false} name="Credits (K)" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const PlatformAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${GradientBg})` }}>
      {/* Same navbar as Home.jsx */}
      <nav className="border-b border-gray-200 px-8 py-4 backdrop-blur-md">
        <div className="p-2 backdrop-blur-lg rounded-2xl border border-white/20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <button onClick={() => navigate("/")} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Leaf size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold">Carbon<span className="text-green-600">Cred</span></span>
            </button>
            {/* Links */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/PlatformStats")}
                className="relative text-green-600 font-semibold pb-1 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-green-500">
                Platform Stats
              </button>
              <button
                onClick={() => navigate("/Login")}
                className="relative text-gray-900 font-medium pb-1 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full">
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h3 className="text-green-500 font-semibold text-sm uppercase tracking-wide">Live Data</h3>
          <h1 className="text-4xl font-bold text-gray-900">CarbonCred Platform Impact</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Real-time statistics on carbon credits issued, traded, and retired across India
          </p>
        </div>

        {/* Summary */}
        <SummaryStats />

        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1 h-full"><DomainDonutChart /></div>
          <div className="lg:col-span-2 h-full"><VerificationByDomainChart /></div>
        </div>

        {/* Row 2 */}
        <PlatformCO2Chart />

        {/* Row 3 */}
        <MonthlyProjectsChart />

        {/* Row 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 h-full"><MarketplaceVolumeChart /></div>
          <div className="lg:col-span-1 h-full"><CreditsByDomainChart /></div>
        </div>

        {/* Row 5 */}
        <GrowthChart />

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center pt-4 pb-2">
          All data reflects verified projects on the CarbonCred platform. CO₂ figures are computed using BEE-CCTS aligned formulas.
        </p>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
