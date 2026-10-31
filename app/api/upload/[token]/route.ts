import { NextRequest, NextResponse } from "next/server";
import { findCaseByToken, updateCase, findOrderById } from "@/lib/storage";
import { saveEvidence } from "@/lib/evidence";

// ─── GET /api/upload/[token] ─────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const currentCase = await findCaseByToken(token);

    if (!currentCase) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    if (new Date(currentCase.tokenExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    const order = await findOrderById(currentCase.orderId);

    return NextResponse.json({
      success: true,
      case: {
        caseId: currentCase.caseId,
        orderId: currentCase.orderId,
        product: order?.product || "Order Item",
        issueType: currentCase.issueType,
        description: currentCase.description,
        status: currentCase.status,
        hasEvidence: currentCase.hasEvidence,
        evidencePath: currentCase.evidencePath,
        tokenExpiresAt: currentCase.tokenExpiresAt,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/upload] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// ─── POST /api/upload/[token] ─────────────────────────────────────────────────
// Saves evidence (base64 via Upstash Redis or resilient /tmp in-memory fallback)
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const currentCase = await findCaseByToken(token);
    if (!currentCase) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    if (new Date(currentCase.tokenExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "NO_FILE_PROVIDED" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${currentCase.caseId}-${Date.now()}-${safeFileName}`;

    await saveEvidence(currentCase.caseId, {
      fileName: uniqueFileName,
      mimeType: file.type,
      size: file.size,
      data: base64,
    });

    // Mark case as EVIDENCE_RECEIVED
    await updateCase(currentCase.caseId, {
      hasEvidence: true,
      evidencePath: `/api/evidence/${currentCase.caseId}`,
      status: "EVIDENCE_RECEIVED",
    });

    return NextResponse.json({
      success: true,
      caseId: currentCase.caseId,
      status: "EVIDENCE_RECEIVED",
    });
  } catch (error: any) {
    console.error("[POST /api/upload] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
