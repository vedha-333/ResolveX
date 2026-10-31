import { Order, Case } from "./types";
import { redis, isRedisConfigured } from "./redis";
import fs from "fs/promises";
import path from "path";
import os from "os";

// ── Fallback Demo Orders (used if file read fails on Vercel) ──────────────────
const FALLBACK_ORDERS: Order[] = [
  {
    orderId: "ORD-1001",
    product: "Wireless Headset",
    price: 1499,
    status: "DELIVERED",
    phone: "9876543210",
  },
  {
    orderId: "ORD-1002",
    product: "Smart Watch",
    price: 2499,
    status: "IN_TRANSIT",
    expectedDelivery: "2026-11-02",
    phone: "9876543211",
  },
  {
    orderId: "ORD-1003",
    product: "Cotton T-Shirt",
    price: 499,
    status: "DELIVERED",
    phone: "9876543212",
  },
];

const ORDERS_FILE = path.join(process.cwd(), "data", "demo-orders.json");

export async function getOrders(): Promise<Order[]> {
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(data) as Order[];
    return parsed.length > 0 ? parsed : FALLBACK_ORDERS;
  } catch {
    return FALLBACK_ORDERS;
  }
}

export async function findOrderById(orderId: string): Promise<Order | null> {
  const orders = await getOrders();
  return (
    orders.find(
      (o) => o.orderId.toLowerCase() === orderId.trim().toLowerCase()
    ) ?? null
  );
}

// ── In-Memory & /tmp Fallback Store ───────────────────────────────────────────
// Ensures zero-failure operation even without external Redis / DB.
// Vercel serverless has a read-only filesystem except for os.tmpdir() (/tmp).
declare global {
  // eslint-disable-next-line no-var
  var __resolvex_cases: Case[] | undefined;
}

const TMP_CASES_FILE = path.join(os.tmpdir(), "resolvex_cases.json");

async function readCasesFromTmp(): Promise<Case[]> {
  if (globalThis.__resolvex_cases) {
    return globalThis.__resolvex_cases;
  }
  try {
    const data = await fs.readFile(TMP_CASES_FILE, "utf-8");
    const parsed = JSON.parse(data) as Case[];
    globalThis.__resolvex_cases = parsed;
    return parsed;
  } catch {
    globalThis.__resolvex_cases = [];
    return [];
  }
}

async function writeCasesToTmp(cases: Case[]): Promise<void> {
  globalThis.__resolvex_cases = cases;
  try {
    await fs.writeFile(TMP_CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
  } catch (err) {
    // If tmp write fails for any reason, memory store still holds the data
    console.warn("[storage] Warning: could not write to tmpdir, using in-memory only:", err);
  }
}

// ── Cases Operations (Redis with graceful In-Memory/Tmp fallback) ─────────────
const CASES_LIST_KEY = "cases_list";

export async function getCases(): Promise<Case[]> {
  if (isRedisConfigured()) {
    try {
      const items = await redis.lrange(CASES_LIST_KEY, 0, -1);
      return items.map((item) => JSON.parse(item) as Case);
    } catch (err) {
      console.warn("[storage] Redis lrange failed, falling back to local store:", err);
    }
  }
  return readCasesFromTmp();
}

export async function saveCase(newCase: Case): Promise<Case> {
  if (isRedisConfigured()) {
    try {
      const json = JSON.stringify(newCase);
      await redis.lpush(CASES_LIST_KEY, json);
      await redis.set(`case:${newCase.caseId}`, json);
      await redis.set(`token:${newCase.uploadToken}`, newCase.caseId);
      return newCase;
    } catch (err) {
      console.warn("[storage] Redis save failed, falling back to local store:", err);
    }
  }

  const cases = await readCasesFromTmp();
  cases.unshift(newCase);
  await writeCasesToTmp(cases);
  return newCase;
}

export async function findCaseByToken(token: string): Promise<Case | null> {
  if (isRedisConfigured()) {
    try {
      const caseId = await redis.get(`token:${token}`);
      if (caseId) {
        const found = await findCaseById(caseId);
        if (found) return found;
      }
    } catch (err) {
      console.warn("[storage] Redis token lookup failed, falling back to local store:", err);
    }
  }

  const cases = await readCasesFromTmp();
  return cases.find((c) => c.uploadToken === token) ?? null;
}

export async function findCaseById(caseId: string): Promise<Case | null> {
  if (isRedisConfigured()) {
    try {
      const json = await redis.get(`case:${caseId}`);
      if (json) return JSON.parse(json) as Case;
    } catch (err) {
      console.warn("[storage] Redis id lookup failed, falling back to local store:", err);
    }
  }

  const cases = await readCasesFromTmp();
  return cases.find((c) => c.caseId === caseId) ?? null;
}

export async function updateCase(
  caseId: string,
  updates: Partial<Case>
): Promise<Case | null> {
  if (isRedisConfigured()) {
    try {
      const existing = await findCaseById(caseId);
      if (existing) {
        const updated: Case = { ...existing, ...updates };
        const json = JSON.stringify(updated);
        await redis.set(`case:${caseId}`, json);
        if (updated.uploadToken) {
          await redis.set(`token:${updated.uploadToken}`, caseId);
        }
        const items = await redis.lrange(CASES_LIST_KEY, 0, -1);
        for (let i = 0; i < items.length; i++) {
          const c = JSON.parse(items[i]) as Case;
          if (c.caseId === caseId) {
            await redis.lset(CASES_LIST_KEY, i, json);
            break;
          }
        }
        return updated;
      }
    } catch (err) {
      console.warn("[storage] Redis update failed, falling back to local store:", err);
    }
  }

  const cases = await readCasesFromTmp();
  const index = cases.findIndex((c) => c.caseId === caseId);
  if (index === -1) return null;

  cases[index] = { ...cases[index], ...updates };
  await writeCasesToTmp(cases);
  return cases[index];
}

export async function updateCaseStatus(
  caseId: string,
  status: string
): Promise<Case | null> {
  return updateCase(caseId, { status });
}

export async function generateNextCaseId(): Promise<string> {
  if (isRedisConfigured()) {
    try {
      const len = await redis.llen(CASES_LIST_KEY);
      return `CASE-${1001 + len}`;
    } catch (err) {
      console.warn("[storage] Redis llen failed, using local store for ID generation:", err);
    }
  }

  const cases = await readCasesFromTmp();
  if (cases.length === 0) {
    return "CASE-1001";
  }

  const ids = cases
    .map((c) => {
      const match = c.caseId.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((num) => num > 0);

  const maxId = ids.length > 0 ? Math.max(...ids) : 1000;
  return `CASE-${maxId + 1}`;
}
