export interface Order {
  orderId: string;
  product: string;
  price: number;
  status: string;
  phone: string;
  expectedDelivery?: string;
}

export interface Case {
  caseId: string;
  orderId: string;
  issueType: string;
  description: string;
  status: "EVIDENCE_PENDING" | "EVIDENCE_RECEIVED" | string;
  uploadToken: string;
  tokenExpiresAt: string;
  uploadUrl?: string;
  hasEvidence: boolean;
  evidencePath?: string;
  createdAt: string;
}

