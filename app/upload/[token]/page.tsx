"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Video,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  Package,
} from "lucide-react";

interface CaseDetails {
  caseId: string;
  orderId: string;
  product: string;
  issueType: string;
  description: string;
  status: string;
  hasEvidence: boolean;
  evidencePath?: string;
  tokenExpiresAt: string;
}

export default function UploadPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCaseDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/upload/${token}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(
            data.error === "TOKEN_EXPIRED"
              ? "This upload link has expired. Please contact support or request a new link."
              : "Invalid or expired upload link. Please check your link or contact support."
          );
          setLoading(false);
          return;
        }

        setCaseData(data.case);
        if (data.case.hasEvidence || data.case.status === "EVIDENCE_RECEIVED") {
          setUploadSuccess(true);
        }
      } catch (err: any) {
        setError("Unable to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchCaseDetails();
    }
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setFilePreview(url);
      } else {
        setFilePreview(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a photo or video before submitting.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload file");
      }

      setUploadSuccess(true);
      if (caseData) {
        setCaseData({
          ...caseData,
          status: "EVIDENCE_RECEIVED",
          hasEvidence: true,
          evidencePath: data.filePath,
        });
      }
    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Verifying upload link...</h2>
          <p className="text-sm text-slate-500 mt-1">Connecting to ResolveX Case Management</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-red-200 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-800 text-sm mb-4">
            {error}
          </div>
          <p className="text-xs text-slate-500">
            If you received this link via call from our voice assistant, please request a fresh upload link or call back.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-4 h-4" /> Secure Resolution Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Resolve<span className="text-blue-600">X</span> Evidence Upload
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fast-track your resolution by providing visual proof of the issue.
          </p>
        </div>

        {/* Case Information Card */}
        {caseData && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-500" />
                <span className="font-semibold text-slate-800 text-sm">
                  Case ID: <span className="font-mono text-blue-700">{caseData.caseId}</span>
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  uploadSuccess || caseData.status === "EVIDENCE_RECEIVED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {uploadSuccess || caseData.status === "EVIDENCE_RECEIVED"
                  ? "EVIDENCE_RECEIVED"
                  : "EVIDENCE_PENDING"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Order Number</span>
                <span className="font-mono font-medium text-slate-700">{caseData.orderId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Product</span>
                <span className="font-medium text-slate-700 truncate block">{caseData.product}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block font-medium">Reported Issue</span>
                <span className="text-slate-700 font-medium">{caseData.issueType}</span>
                {caseData.description && (
                  <p className="text-xs text-slate-500 mt-0.5 italic">"{caseData.description}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {uploadSuccess ? (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                Received &#10003; Your evidence has been attached to your case.
              </h2>
              <p className="text-sm text-emerald-700 mt-2">
                Our AI resolution agent is reviewing your case. You may now return to your call or await confirmation.
              </p>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-full uppercase tracking-wider">
                Status: EVIDENCE_RECEIVED
              </div>
            </div>

            {caseData?.evidencePath && (
              <div className="pt-4 border-t border-emerald-200">
                <a
                  href={caseData.evidencePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium"
                >
                  View uploaded file &rarr;
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Upload Form */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">
                Please record a video or upload a photo showing the damage.
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Accepted formats: Video or Image (mp4, webm, mov, jpeg, png).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Input Box */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 transition-colors bg-slate-50/50 flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  id="evidence-file"
                  accept="video/*,image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />

                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  Tap to record video or choose from gallery
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tap here to open your camera or gallery
                </p>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 shrink-0">
                      {selectedFile.type.startsWith("video/") ? (
                        <Video className="w-5 h-5 text-purple-600" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown format"}
                      </p>
                    </div>
                    <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>

                  {filePreview && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 max-h-48 flex justify-center bg-black/5">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="object-contain max-h-48"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  !selectedFile || uploading
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading Evidence...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Submit Evidence
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Powered by ResolveX &bull; End-to-end encrypted resolution pipeline
        </p>
      </div>
    </main>
  );
}

