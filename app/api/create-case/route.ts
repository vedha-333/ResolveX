import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findOrderById, generateNextCaseId, saveCase } from "@/lib/storage";
import { Case } from "@/lib/types";

// ── Vaani-compatible response shapes ─────────────────────────────────────────
interface VaaniCreateCaseSuccess {
  success: true;
  caseId: string;
  uploadUrl: string;
}

interface VaaniCreateCaseFailure {
  success: false;
  error: string;
}

type VaaniCreateCaseResponse = VaaniCreateCaseSuccess | VaaniCreateCaseFailure;

// ── Derive the base URL dynamically from the incoming request ─────────────────
// Works correctly on:
//   • localhost:3000            → http://localhost:3000
//   • Vercel production         → https://your-app.vercel.app
//   • Any custom domain         → https://resolvex.example.com
function deriveBaseUrl(request: NextRequest): string {
  // Prefer the explicit env var if set (e.g., in .env.local or Vercel env)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // Fallback: reconstruct from request headers (works behind Vercel's proxy)
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol.replace(":", "") || "http");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;

  return `${proto}://${host}`;
}

// ── POST /api/create-case ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, issueType, description } = body as {
      orderId?: string;
      issueType?: string;
      description?: string;
    };

    if (!orderId) {
      const res: VaaniCreateCaseFailure = {
        success: false,
        error: "ORDER_ID_REQUIRED",
      };
      return NextResponse.json(res, { status: 400 });
    }

    // 1. Verify order exists
    const order = await findOrderById(orderId);
    if (!order) {
      const res: VaaniCreateCaseFailure = {
        success: false,
        error: "ORDER_NOT_FOUND",
      };
      return NextResponse.json(res, { status: 404 });
    }

    // 2. Generate auto-incrementing caseId (e.g. CASE-1042)
    const caseId = await generateNextCaseId();

    // 3. Generate a secure random upload token
    const uploadToken = crypto.randomUUID();

    // 4. Token expires in 24 hours
    const tokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    // 5. Dynamically derive host so this works on localhost AND Vercel
    const baseUrl = deriveBaseUrl(request);
    const uploadUrl = `${baseUrl}/upload/${uploadToken}`;

    const newCase: Case = {
      caseId,
      orderId: order.orderId,
      issueType: issueType?.trim() || "General Issue",
      description: description?.trim() || "",
      status: "EVIDENCE_PENDING",
      uploadToken,
      tokenExpiresAt,
      uploadUrl,
      hasEvidence: false,
      createdAt: new Date().toISOString(),
    };

    await saveCase(newCase);

    // Return EXACTLY the Vaani-expected shape
    const res: VaaniCreateCaseSuccess = {
      success: true,
      caseId,
      uploadUrl,
    };

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[POST /api/create-case] Error:", error);
    const res: VaaniCreateCaseFailure = {
      success: false,
      error: error.message || "INTERNAL_SERVER_ERROR",
    };
    return NextResponse.json(res, { status: 500 });
  }
}
