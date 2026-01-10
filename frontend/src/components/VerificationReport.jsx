import React, { useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Leaf,
  Sun,
  BarChart3,
  FileText,
  Calendar,
  MapPin,
  TrendingUp,
  Shield,
  Award,
  Download,
  Loader2,
  Link,
  ExternalLink,
} from "lucide-react";

/**
 * Professional PDF-style Verification Report Component
 * Displays verification results in a formal document format
 */
const VerificationReport = ({ project, showDownloadButton = true }) => {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!project) return null;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) {
      console.error("Report ref not found");
      return;
    }

    setDownloading(true);
    try {
      const element = reportRef.current;

      // Create canvas using html2canvas-pro (supports oklch colors)
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // Calculate aspect ratio of the captured content
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgHeight / imgWidth;

      // A4 dimensions in mm: 210 x 297
      const a4Width = 210;
      const a4Height = 297;

      // Calculate PDF dimensions based on content aspect ratio
      // Always use full width, adjust height based on aspect ratio
      let pdfWidth = a4Width;
      let pdfHeight = a4Width * aspectRatio;

      // If content is taller than A4, scale to fit height instead
      if (pdfHeight > a4Height) {
        pdfHeight = a4Height;
        pdfWidth = a4Height / aspectRatio;
      }

      // Create PDF with custom size matching content aspect ratio
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      // Add the image - fills entire page with no margins
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Generate filename
      const reportId = project.report_id || project.project_name.replace(/\s+/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `CarbonCred_Report_${reportId}_${dateStr}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      console.error("Error details:", error.message, error.stack);
      alert("Failed to generate PDF: " + (error.message || "Unknown error"));
    } finally {
      setDownloading(false);
    }
  };

  const getDecisionStyle = (decision) => {
    switch (decision) {
      case "VERIFIED":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-500",
          text: "text-emerald-700",
          icon: CheckCircle,
          label: "VERIFIED",
        };
      case "REJECTED":
        return {
          bg: "bg-red-50",
          border: "border-red-500",
          text: "text-red-700",
          icon: XCircle,
          label: "REJECTED",
        };
      case "REVIEW_REQUIRED":
        return {
          bg: "bg-amber-50",
          border: "border-amber-500",
          text: "text-amber-700",
          icon: AlertTriangle,
          label: "REVIEW REQUIRED",
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-400",
          text: "text-slate-600",
          icon: FileText,
          label: "PENDING",
        };
    }
  };

  const getClassificationIcon = (classification) => {
    switch (classification) {
      case "SOLAR":
        return Sun;
      case "VEGETATION":
      case "PLANTATION":
        return Leaf;
      default:
        return BarChart3;
    }
  };

  const decisionStyle = getDecisionStyle(project.final_decision);
  const DecisionIcon = decisionStyle.icon;
  const ClassificationIcon = getClassificationIcon(project.classification);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${(parseFloat(value) * 100).toFixed(1)}%`;
  };

  const formatDecimal = (value, decimals = 2) => {
    if (value === null || value === undefined) return "N/A";
    return parseFloat(value).toFixed(decimals);
  };

  // Parse explanation into sections
  const parseExplanation = (explanation) => {
    if (!explanation) return null;

    const sections = {};
    const lines = explanation.split('\n');
    let currentSection = 'header';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.includes('ANALYSIS SUMMARY')) {
        currentSection = 'analysis';
        sections[currentSection] = [];
      } else if (trimmed.includes('ENVIRONMENTAL IMPACT')) {
        currentSection = 'environmental';
        sections[currentSection] = [];
      } else if (trimmed.includes('CLAIM VERIFICATION')) {
        currentSection = 'claim';
        sections[currentSection] = [];
      } else if (trimmed.includes('DECISION RATIONALE')) {
        currentSection = 'decision';
        sections[currentSection] = [];
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        if (sections[currentSection]) {
          sections[currentSection].push(trimmed.replace(/^[•-]\s*/, ''));
        }
      } else if (currentSection === 'header') {
        if (!sections.header) sections.header = [];
        sections.header.push(trimmed);
      }
    });

    return sections;
  };

  const explanationSections = parseExplanation(project.explanation);

  return (
    <div className="space-y-4">
      {/* Download Button */}
      {showDownloadButton && (
        <div className="flex justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition font-medium shadow-sm"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      )}

      {/* Report Content - This will be captured for PDF */}
      <div ref={reportRef} className="bg-white border border-slate-300 shadow-lg rounded-sm overflow-hidden">
        {/* PDF Header - Like a formal document */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">CarbonCred</h1>
                <p className="text-slate-300 text-sm">Carbon Credit Verification Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Report ID</p>
              <p className="font-mono text-sm">{project.report_id || "PENDING"}</p>
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Title Section */}
          <div className="border-b-2 border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {project.project_name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(project.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <ClassificationIcon className="w-4 h-4" />
                {project.classification} Project
              </span>
            </div>
          </div>

          {/* Decision Banner */}
          <div className={`${decisionStyle.bg} border-l-4 ${decisionStyle.border} p-4 rounded-r-lg`}>
            <div className="flex items-center gap-3">
              <DecisionIcon className={`w-8 h-8 ${decisionStyle.text}`} />
              <div>
                <p className={`text-lg font-bold ${decisionStyle.text}`}>
                  {decisionStyle.label}
                </p>
                <p className="text-sm text-slate-600">
                  {project.final_decision === "VERIFIED"
                    ? "This project has been verified based on satellite imagery analysis."
                    : project.final_decision === "REJECTED"
                      ? "This project did not meet verification criteria."
                      : "This project requires additional review."}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Confidence Score</p>
                <p className="text-2xl font-bold text-slate-800">
                  {formatPercentage(project.confidence_score)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Claim Alignment</p>
                <p className="text-2xl font-bold text-slate-800">
                  {project.claim_alignment || "N/A"}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Est. CO₂/year</p>
                <p className="text-2xl font-bold text-slate-800">
                  {formatDecimal(project.estimated_co2_tco2_year)} <span className="text-sm font-normal">tCO₂</span>
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-xs text-emerald-600 uppercase tracking-wide mb-1">Credits Issued</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {project.credits_issued || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Transaction Section */}
          {project.blockchain_minted && project.blockchain_tx_hash && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link className="w-4 h-4" />
                Blockchain Record
              </h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-600 uppercase tracking-wide mb-1">Transaction Hash</p>
                    <p className="text-sm font-mono text-indigo-800 break-all">
                      {project.blockchain_tx_hash}
                    </p>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${project.blockchain_tx_hash.startsWith('0x') ? project.blockchain_tx_hash : '0x' + project.blockchain_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Etherscan
                  </a>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-indigo-600">Network</p>
                    <p className="font-medium text-indigo-800">Sepolia Testnet</p>
                  </div>
                  <div>
                    <p className="text-indigo-600">Token</p>
                    <p className="font-medium text-indigo-800">CCT (CarbonCred Token)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Details Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Project Details
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-3 text-slate-500 font-medium w-1/3">Project Area</td>
                    <td className="px-4 py-3 text-slate-800">{project.project_area_hectares} hectares</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-3 text-slate-500 font-medium">Project Cost</td>
                    <td className="px-4 py-3 text-slate-800">₹{formatDecimal(project.project_cost_lakh_inr)} Lakh</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-3 text-slate-500 font-medium">Claimed Improvement</td>
                    <td className="px-4 py-3 text-slate-800">{project.claimed_improvement_pct}%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 font-medium">Classification</td>
                    <td className="px-4 py-3 text-slate-800">{project.classification}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis Summary Section */}
          {explanationSections?.analysis && explanationSections.analysis.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analysis Summary
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {explanationSections.analysis.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Environmental Impact Section */}
          {explanationSections?.environmental && explanationSections.environmental.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Environmental Impact
              </h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {explanationSections.environmental.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Claim Verification Section */}
          {explanationSections?.claim && explanationSections.claim.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Claim Verification
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {explanationSections.claim.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Decision Rationale Section */}
          {explanationSections?.decision && explanationSections.decision.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Decision Rationale
              </h3>
              <div className={`${decisionStyle.bg} border ${decisionStyle.border.replace('border-', 'border-')} rounded-lg p-4`}>
                <ul className="space-y-2">
                  {explanationSections.decision.map((item, index) => (
                    <li key={index} className={`flex items-start gap-2 text-sm ${decisionStyle.text}`}>
                      <span className="mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Fallback: Raw Explanation if parsing failed */}
          {(!explanationSections || Object.keys(explanationSections).length <= 1) && project.explanation && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Verification Details
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {project.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PDF Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              <p>This is a computer-generated verification report.</p>
              <p>Generated by CarbonCred ML Verification Engine v1.0</p>
            </div>
            <div className="text-right">
              <p>Report Generated: {formatDate(project.generated_at || project.created_at)}</p>
              <p>© {new Date().getFullYear()} CarbonCred Technologies Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationReport;
