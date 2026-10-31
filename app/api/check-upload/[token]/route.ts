import { NextRequest, NextResponse } from "next/server";
import { findCaseByToken, updateCaseStatus } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // 1. Find case by uploadToken
    let currentCase = await findCaseByToken(token);

    // 2. If not found, return INVALID_TOKEN
    if (!currentCase) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    // 3. Check if evidence exists
    // 4. The 5-Second Race Condition Fix: If hasEvidence is false, wait 3 seconds, then check again
    if (!currentCase.hasEvidence) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Re-read fresh state from storage
      const recheckedCase = await findCaseByToken(token);
      if (recheckedCase) {
        currentCase = recheckedCase;
      }
    }

    // 5. If hasEvidence is true (or becomes true after wait), update case status
    if (currentCase.hasEvidence) {
      if (currentCase.status !== "EVIDENCE_RECEIVED") {
        await updateCaseStatus(currentCase.caseId, "EVIDENCE_RECEIVED");
      }
      return NextResponse.json({
        success: true,
        uploaded: true,
        caseId: currentCase.caseId,
      });
    }

    // 6. If still false
    return NextResponse.json({
      success: true,
      uploaded: false,
      status: "EVIDENCE_PENDING",
    });
  } catch (error: any) {
    console.error("Error in check-upload:", error);
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

