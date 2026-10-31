import { NextRequest, NextResponse } from "next/server";
import { getEvidence } from "@/lib/evidence";

export async function GET(
  _request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { caseId } = params;
    const evidence = await getEvidence(caseId);

    if (!evidence) {
      return NextResponse.json(
        { success: false, error: "NO_EVIDENCE" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(evidence.data, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": evidence.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${evidence.fileName}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
