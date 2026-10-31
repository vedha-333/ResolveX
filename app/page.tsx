"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Search,
  PlusCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  // Test states
  const [lookupOrderId, setLookupOrderId] = useState("ORD-1001");
  const [lookupPhone, setLookupPhone] = useState("9876543210");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [createOrderId, setCreateOrderId] = useState("ORD-1001");
  const [issueType, setIssueType] = useState("Damaged item received");
  const [description, setDescription] = useState(
    "Left earphone has a crack and does not turn on."
  );
  const [createResult, setCreateResult] = useState<any>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [checkToken, setCheckToken] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await fetch("/api/lookup-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: lookupOrderId,
          callerPhone: lookupPhone,
        }),
      });
      const data = await res.json();
      setLookupResult({ status: res.status, data });
    } catch (err: any) {
      setLookupResult({ status: 500, data: { error: err.message } });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    try {
      const res = await fetch("/api/create-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createOrderId,
          issueType,
          description,
        }),
      });
      const data = await res.json();
      setCreateResult({ status: res.status, data });
      if (data.uploadToken) {
        setCheckToken(data.uploadToken);
      }
    } catch (err: any) {
      setCreateResult({ status: 500, data: { error: err.message } });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCheckUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckLoading(true);
    setCheckResult(null);
    try {
      // Vaani-compatible: POST with { token } in the body
      const res = await fetch("/api/check-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: checkToken }),
      });
      const data = await res.json();
      setCheckResult({ status: res.status, data });
    } catch (err: any) {
      setCheckResult({ status: 500, data: { error: err.message } });
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Hero Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
                <PhoneCall className="w-3.5 h-3.5" /> Vaani Voice AI Webhook Backend
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Resolve<span className="text-blue-500">X</span>
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                Autonomous customer resolution engine. Verifies orders over voice, creates resolution cases, generates secure visual evidence links, and manages race-condition-safe evidence verification.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition-all"
              >
                <span>Live Agent Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Mock Orders Quick Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Available Demo Orders (`data/demo-orders.json`)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-blue-700">ORD-1001</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  DELIVERED
                </span>
              </div>
              <p className="font-medium text-slate-800">Wireless Headset</p>
              <p className="text-slate-500">₹1,499 &bull; Phone: 9876543210</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-blue-700">ORD-1002</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                  IN_TRANSIT
                </span>
              </div>
              <p className="font-medium text-slate-800">Smart Watch</p>
              <p className="text-slate-500">₹2,499 &bull; Phone: 9876543211</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-blue-700">ORD-1003</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  DELIVERED
                </span>
              </div>
              <p className="font-medium text-slate-800">Cotton T-Shirt</p>
              <p className="text-slate-500">₹499 &bull; Phone: 9876543212</p>
            </div>
          </div>
        </div>

        {/* API Interactive Test Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Lookup Order */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Search className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">1. Lookup Order</h3>
                <code className="text-[11px] text-slate-500">POST /api/lookup-order</code>
              </div>
            </div>

            <form onSubmit={handleLookup} className="space-y-3 flex-1 flex flex-col">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="ORD-1001"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caller Phone
                </label>
                <input
                  type="text"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="9876543210"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
              >
                {lookupLoading ? "Querying..." : "Simulate Vaani Lookup"}
              </button>

              {lookupResult && (
                <div className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                    HTTP {lookupResult.status}
                  </div>
                  <pre className="mt-1">{JSON.stringify(lookupResult.data, null, 2)}</pre>
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Create Case */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">2. Create Case</h3>
                <code className="text-[11px] text-slate-500">POST /api/create-case</code>
              </div>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3 flex-1 flex flex-col">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={createOrderId}
                  onChange={(e) => setCreateOrderId(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="ORD-1001"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Type
                </label>
                <input
                  type="text"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 focus:border-indigo-500 focus:outline-none"
                  placeholder="Damaged item"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded border border-slate-300 focus:border-indigo-500 focus:outline-none"
                  placeholder="Customer remarks"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors"
              >
                {createLoading ? "Creating..." : "Simulate Vaani Case Creation"}
              </button>

              {createResult && (
                <div className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                    HTTP {createResult.status}
                  </div>
                  <pre className="mt-1">{JSON.stringify(createResult.data, null, 2)}</pre>
                  {createResult.data?.uploadUrl && (
                    <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <a
                        href={createResult.data.uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        Open Upload Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Card 3: Check Upload */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">3. Check Upload Status</h3>
                <code className="text-[11px] text-slate-500">POST /api/check-upload</code>
              </div>
            </div>

            <form onSubmit={handleCheckUpload} className="space-y-3 flex-1 flex flex-col">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Token
                </label>
                <input
                  type="text"
                  value={checkToken}
                  onChange={(e) => setCheckToken(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="Paste token or create a case first"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Vaani-compatible:</strong> Sends <code className="font-mono bg-amber-100 px-1 rounded">POST</code> with <code className="font-mono bg-amber-100 px-1 rounded">&#123; "token": "..." &#125;</code> in the body. Includes a 3-second race-condition guard on the server.
              </div>

              <button
                type="submit"
                disabled={checkLoading || !checkToken}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors"
              >
                {checkLoading ? "Checking with 3s race guard..." : "Check Upload Status"}
              </button>

              {checkResult && (
                <div className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                    HTTP {checkResult.status}
                  </div>
                  <pre className="mt-1">{JSON.stringify(checkResult.data, null, 2)}</pre>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

