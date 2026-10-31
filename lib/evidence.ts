import { redis, isRedisConfigured } from "./redis";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface StoredEvidence {
  fileName: string;
  mimeType: string;
  size: number;
  data: string; // base64
}

declare global {
  // eslint-disable-next-line no-var
  var __resolvex_evidence: Map<string, StoredEvidence> | undefined;
}

function getEvidenceMap(): Map<string, StoredEvidence> {
  if (!globalThis.__resolvex_evidence) {
    globalThis.__resolvex_evidence = new Map<string, StoredEvidence>();
  }
  return globalThis.__resolvex_evidence;
}

const TMP_EVIDENCE_DIR = path.join(os.tmpdir(), "resolvex_evidence");

export async function saveEvidence(
  caseId: string,
  evidence: StoredEvidence
): Promise<void> {
  if (isRedisConfigured()) {
    try {
      const evidenceKey = `evidence:${caseId}`;
      await redis.set(evidenceKey, JSON.stringify(evidence), 7 * 24 * 60 * 60);
      return;
    } catch (err) {
      console.warn("[evidence] Redis save failed, using local fallback:", err);
    }
  }

  // Local /tmp and in-memory fallback
  const map = getEvidenceMap();
  map.set(caseId, evidence);

  try {
    await fs.mkdir(TMP_EVIDENCE_DIR, { recursive: true });
    const filePath = path.join(TMP_EVIDENCE_DIR, `${caseId}.json`);
    await fs.writeFile(filePath, JSON.stringify(evidence), "utf-8");
  } catch (err) {
    console.warn("[evidence] Could not write to tmpdir, memory store kept:", err);
  }
}

export async function getEvidence(caseId: string): Promise<StoredEvidence | null> {
  if (isRedisConfigured()) {
    try {
      const json = await redis.get(`evidence:${caseId}`);
      if (json) {
        return JSON.parse(json) as StoredEvidence;
      }
    } catch (err) {
      console.warn("[evidence] Redis get failed, checking local fallback:", err);
    }
  }

  const map = getEvidenceMap();
  if (map.has(caseId)) {
    return map.get(caseId)!;
  }

  try {
    const filePath = path.join(TMP_EVIDENCE_DIR, `${caseId}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data) as StoredEvidence;
    map.set(caseId, parsed);
    return parsed;
  } catch {
    return null;
  }
}
