import { NextResponse } from "next/server";
import { getCases } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cases = await getCases();
    // Sort descending by createdAt or caseId
    const sorted = [...cases].reverse();
    return NextResponse.json({
      success: true,
      cases: sorted,
    });
  } catch (error: any) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

