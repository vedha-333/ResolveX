import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { findCaseByToken, updateCase, findOrderById } from "@/lib/storage";

// ─── GET /api/upload/[token] ─────────────────────────────────────────────────
// Used by the upload page on mount to verify the token and fetch case details.
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

    // Check token expiration
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
// Receives the file upload from the customer's upload page.
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // 1. Verify token and find case
    const currentCase = await findCaseByToken(token);
    if (!currentCase) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    // Check token expiration
    if (new Date(currentCase.tokenExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    // 2. Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "NO_FILE_PROVIDED" },
        { status: 400 }
      );
    }

    // Basic validation: only allow image/* and video/*
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    // 3. Save the file to public/uploads/${caseId}-${sanitizedFileName}
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Sanitize file name to remove special chars
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${currentCase.caseId}-${Date.now()}-${safeFileName}`;
    const destinationPath = path.join(uploadsDir, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(destinationPath, buffer);

    const relativePublicPath = `/uploads/${uniqueFileName}`;

    // 4. Update the case in storage with evidence details
    await updateCase(currentCase.caseId, {
      hasEvidence: true,
      evidencePath: relativePublicPath,
      status: "EVIDENCE_RECEIVED",
    });

    // 5. Return success
    return NextResponse.json({
      success: true,
      filePath: relativePublicPath,
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
