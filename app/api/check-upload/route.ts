import { NextRequest, NextResponse } from "next/server";
import { findCaseByToken, updateCaseStatus } from "@/lib/storage";

// ── Vaani-compatible response shapes ─────────────────────────────────────────
interface VaaniCheckUploadSuccess {
  success: true;
  status: "EVIDENCE_RECEIVED" | "EVIDENCE_PENDING";
}

interface VaaniCheckUploadFailure {
  success: false;
  error: string;
}

type VaaniCheckUploadResponse = VaaniCheckUploadSuccess | VaaniCheckUploadFailure;

// ── POST /api/check-upload ───────────────────────────────────────────────────
// Vaani calls this endpoint with { "token": "..." } in the request body.
// This is different from the internal GET /api/check-upload/[token] route
// which is used for debugging only.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token) {
      const res: VaaniCheckUploadFailure = {
        success: false,
        error: "TOKEN_REQUIRED",
      };
      return NextResponse.json(res, { status: 400 });
    }

    // 1. Find case by token
    let currentCase = await findCaseByToken(token);

    if (!currentCase) {
      const res: VaaniCheckUploadFailure = {
        success: false,
        error: "INVALID_TOKEN",
      };
      return NextResponse.json(res, { status: 404 });
    }

    // 2. Race-condition guard: if evidence not yet present, wait 3 seconds
    //    then re-read fresh state from storage to catch an in-flight upload.
    if (!currentCase.hasEvidence) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const rechecked = await findCaseByToken(token);
      if (rechecked) {
        currentCase = rechecked;
      }
    }

    // 3. Evidence received — update status if needed and respond
    if (currentCase.hasEvidence) {
      if (currentCase.status !== "EVIDENCE_RECEIVED") {
        await updateCaseStatus(currentCase.caseId, "EVIDENCE_RECEIVED");
      }
      const res: VaaniCheckUploadSuccess = {
        success: true,
        status: "EVIDENCE_RECEIVED",
      };
      return NextResponse.json(res);
    }

    // 4. Still pending
    const res: VaaniCheckUploadSuccess = {
      success: true,
      status: "EVIDENCE_PENDING",
    };
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[POST /api/check-upload] Error:", error);
    const res: VaaniCheckUploadFailure = {
      success: false,
      error: error.message || "INTERNAL_SERVER_ERROR",
    };
    return NextResponse.json(res, { status: 500 });
  }
}

