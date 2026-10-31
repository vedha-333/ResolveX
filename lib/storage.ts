import fs from "fs/promises";
import path from "path";
import { Order, Case } from "./types";

const ORDERS_FILE = path.join(process.cwd(), "data", "demo-orders.json");
const CASES_FILE = path.join(process.cwd(), "data", "cases.json");

export async function getOrders(): Promise<Order[]> {
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(data) as Order[];
  } catch (error) {
    console.error("Error reading orders file:", error);
    return [];
  }
}

export async function findOrderById(orderId: string): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find(
    (o) => o.orderId.toLowerCase() === orderId.trim().toLowerCase()
  );
  return order || null;
}

export async function getCases(): Promise<Case[]> {
  try {
    const data = await fs.readFile(CASES_FILE, "utf-8");
    return JSON.parse(data) as Case[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      await fs.writeFile(CASES_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    console.error("Error reading cases file:", error);
    return [];
  }
}

export async function saveCase(newCase: Case): Promise<Case> {
  const cases = await getCases();
  cases.push(newCase);
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
  return newCase;
}

export async function findCaseByToken(token: string): Promise<Case | null> {
  const cases = await getCases();
  const matchedCase = cases.find((c) => c.uploadToken === token);
  return matchedCase || null;
}

export async function findCaseById(caseId: string): Promise<Case | null> {
  const cases = await getCases();
  const matchedCase = cases.find((c) => c.caseId === caseId);
  return matchedCase || null;
}

export async function updateCaseStatus(
  caseId: string,
  status: string
): Promise<Case | null> {
  const cases = await getCases();
  const index = cases.findIndex((c) => c.caseId === caseId);
  if (index === -1) {
    return null;
  }
  cases[index].status = status;
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
  return cases[index];
}

export async function updateCase(
  caseId: string,
  updates: Partial<Case>
): Promise<Case | null> {
  const cases = await getCases();
  const index = cases.findIndex((c) => c.caseId === caseId);
  if (index === -1) {
    return null;
  }
  cases[index] = { ...cases[index], ...updates };
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
  return cases[index];
}

export async function generateNextCaseId(): Promise<string> {
  const cases = await getCases();
  if (cases.length === 0) {
    return "CASE-1001";
  }
  
  // Extract numbers from case IDs like CASE-1001, CASE-1042
  const ids = cases
    .map((c) => {
      const match = c.caseId.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((num) => num > 0);

  const maxId = ids.length > 0 ? Math.max(...ids) : 1000;
  return `CASE-${maxId + 1}`;
}

