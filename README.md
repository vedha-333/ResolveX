# 🎙️ ResolveX — Voice AI Customer Resolution Engine

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Powered by Vaani](https://img.shields.io/badge/Voice_AI-Vaani_Platform-7C3AED?style=for-the-badge)](https://vaani.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://resolvex-three.vercel.app)

**An autonomous voice-driven dispute resolution agent that verifies customer orders, generates one-time secure upload portals, and eliminates upload race conditions in real time.**

[🌐 Live Demo](https://resolvex-three.vercel.app) • [📊 Agent Ops Dashboard](https://resolvex-three.vercel.app/dashboard) • [📦 GitHub Repository](https://github.com/vedha-333/ResolveX)

---

</div>

## 💡 The Problem & Our Solution

When customers call customer support regarding damaged or incorrect items:
1. **Traditional IVRs fail** at capturing real visual proof during an ongoing voice call.
2. **Race conditions occur** when a voice assistant asks a caller to upload a photo while staying on the line — if the agent checks the database too quickly, it misidentifies the upload as failed before the customer finishes submitting.

### ✨ ResolveX's Approach
- **Instant Voice Verification**: Vaani Voice AI calls ResolveX's webhook to look up the order and authenticate the caller in milliseconds.
- **Secure Visual Evidence Link**: Generates a single-use tokenized upload URL delivered immediately to the caller via SMS/voice.
- **Race-Condition-Safe Polling**: Implements a dedicated server-side hold guard (`3-second hold & re-check`) so the voice bot never drops the call or reports a false negative while a customer upload is in flight.
- **Live Ops Dashboard**: Support leads can watch claims stream in real time with auto-refreshing evidence badges.

---

## 🏗️ Architecture & Interaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Vaani as 🗣️ Vaani Voice AI
    participant ResolveX as ⚡ ResolveX API
    participant Portal as 📱 Mobile Upload Portal
    participant Dashboard as 🖥️ Ops Dashboard

    Customer->>Vaani: "My wireless headset arrived with a crack!"
    Vaani->>ResolveX: POST /api/lookup-order (orderId, callerPhone)
    ResolveX-->>Vaani: { success: true, order: { product, price } }
    Vaani->>Customer: "I see order ORD-1001. Let me text you a secure upload link."
    Vaani->>ResolveX: POST /api/create-case (orderId, issueType)
    ResolveX-->>Vaani: { success: true, caseId: "CASE-1001", uploadUrl }
    Vaani->>Customer: "I've sent the link. Please upload a photo or video while on the line."
    
    Customer->>Portal: Opens upload link & attaches photo/video
    Portal->>ResolveX: POST /api/upload/[token] (multipart file)
    ResolveX-->>Portal: { success: true, status: "EVIDENCE_RECEIVED" }

    loop Race Guard Polling
        Vaani->>ResolveX: POST /api/check-upload { token }
        Note over ResolveX: 3s hold guard detects in-flight upload!
        ResolveX-->>Vaani: { success: true, status: "EVIDENCE_RECEIVED" }
    end

    Vaani->>Customer: "Received! Your evidence has been verified and your claim is approved."
    Dashboard->>ResolveX: Polls GET /api/dashboard (every 3s)
    ResolveX-->>Dashboard: Live updated case with "View Evidence" link
```

---

## ⚡ Vaani Custom Tools (API Reference)

All endpoints conform strictly to Vaani's Custom Tool JSON schemas:

### 1. `POST /api/lookup-order`
Validates an order by ID for the calling user.
- **Request:**
  ```json
  {
    "orderId": "ORD-1001",
    "callerPhone": "9876543210"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "order": {
      "product": "Wireless Headset",
      "price": 1499
    }
  }
  ```
- **Response (Not Found):**
  ```json
  {
    "success": false
  }
  ```

---

### 2. `POST /api/create-case`
Initializes a new case and issues a 24-hour expiring upload token with dynamic host URL.
- **Request:**
  ```json
  {
    "orderId": "ORD-1001",
    "issueType": "DAMAGED_PRODUCT",
    "description": "Left earphone cracked on arrival"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "caseId": "CASE-1001",
    "uploadUrl": "https://resolvex-three.vercel.app/upload/d3b07384-d113-4632-a567-336c1e592671"
  }
  ```

---

### 3. `POST /api/check-upload`
Polled by Vaani while the user is uploading evidence. Contains an internal **3-second race-condition guard** to catch uploads in flight.
- **Request:**
  ```json
  {
    "token": "d3b07384-d113-4632-a567-336c1e592671"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "status": "EVIDENCE_RECEIVED"
  }
  ```
  *(or `"status": "EVIDENCE_PENDING"` if not yet received)*

---

### 4. `POST /api/upload/[token]`
Multipart file receiver supporting videos and photos up to 50MB. Saves evidence and marks case as `EVIDENCE_RECEIVED`.

---

### 5. `GET /api/dashboard`
Real-time JSON feed of all cases, consumed by the dashboard every 3 seconds.

---

## 📦 Demo Orders for Voice Testing

The local storage layer (`data/demo-orders.json`) comes preloaded with three test orders:

| Order ID | Product | Price | Status | Demo Phone |
| :--- | :--- | :--- | :--- | :--- |
| `ORD-1001` | **Wireless Headset** | ₹1,499 | `DELIVERED` | `9876543210` |
| `ORD-1002` | **Smart Watch** | ₹2,499 | `IN_TRANSIT` | `9876543211` |
| `ORD-1003` | **Cotton T-Shirt** | ₹499 | `DELIVERED` | `9876543212` |

---

## 🖥️ Pages & UI Features

| Route | Description |
| :--- | :--- |
| **`/`** | **Interactive API Tester & Simulator** — Test Vaani webhooks directly in your browser without placing a call. |
| **`/dashboard`** | **Live Agent Operations Dashboard** — Auto-polls every 3s, displaying live case statuses, total metrics, and direct evidence links. |
| **`/upload/[token]`** | **Customer Evidence Portal** — Mobile-optimized interface for camera/gallery capture with immediate visual confirmation: *"Received ✓ Your evidence has been attached to your case."* |

---

## 🚀 Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/vedha-333/ResolveX.git
cd ResolveX
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Build for production
```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Schema Enforcement)
- **Voice Platform**: [Vaani AI](https://vaani.dev/) (HTTP Tool Calls)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Storage Layer**: Abstracted File Storage (`lib/storage.ts`) ready for DB swap
- **Hosting**: [Vercel](https://vercel.com/)

---

<div align="center">

Built with ❤️ for the Voice AI Hackathon.

</div>
