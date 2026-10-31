"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { Case } from "@/lib/types";

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchCases = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.cases)) {
        setCases(data.cases);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
    // Poll every 3 seconds as specified
    const interval = setInterval(() => {
      fetchCases();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const totalCases = cases.length;
  const receivedCases = cases.filter(
    (c) => c.status === "EVIDENCE_RECEIVED" || c.hasEvidence
  ).length;
  const pendingCases = totalCases - receivedCases;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm">
              R
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Resolve<span className="text-blue-600">X</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Agent Ops Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Polling (every 3s) &bull; {lastUpdated.toLocaleTimeString()}
            </div>

            <button
              onClick={() => fetchCases(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-xs flex items-center gap-1.5 font-medium"
              title="Refresh now"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              API Tester &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Cases
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCases}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Evidence Received
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {receivedCases}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Evidence Pending
              </p>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {pendingCases}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Cases Table Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Resolution Cases
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time tracking of claims initiated via Voice AI agent webhooks.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-900">{cases.length}</span> cases
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm">Loading resolution cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800">No cases created yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Trigger a case creation from your Voice AI agent or use the API tester to generate a demo case.
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  Open Interactive Tester
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Case ID
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Order ID
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Issue
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Evidence Link
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Upload Portal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {cases.map((c) => {
                    const isReceived =
                      c.status === "EVIDENCE_RECEIVED" || c.hasEvidence;
                    const uploadPageUrl = `/upload/${c.uploadToken}`;

                    return (
                      <tr key={c.caseId} className="hover:bg-gray-50/80 transition-colors">
                        {/* Case ID */}
                        <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-blue-600">
                          {c.caseId}
                        </td>

                        {/* Order ID */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200">
                            {c.orderId}
                          </span>
                        </td>

                        {/* Issue */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {c.issueType || "General Claim"}
                          </div>
                          {c.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs" title={c.description}>
                              {c.description}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isReceived ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                              EVIDENCE_RECEIVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 animate-pulse"></span>
                              EVIDENCE_PENDING
                            </span>
                          )}
                        </td>

                        {/* Evidence Link */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isReceived && c.evidencePath ? (
                            <a
                              href={c.evidencePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                            >
                              <span>View Evidence</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Awaiting upload
                            </span>
                          )}
                        </td>

                        {/* Upload Portal Link / Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={uploadPageUrl}
                              target="_blank"
                              className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </Link>
                            <button
                              onClick={() => {
                                const fullUrl = `${window.location.origin}${uploadPageUrl}`;
                                copyToClipboard(fullUrl, c.uploadToken);
                              }}
                              className="text-xs p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                              title="Copy upload link"
                            >
                              {copiedToken === c.uploadToken ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

