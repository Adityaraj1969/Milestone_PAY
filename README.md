# MilestonePay — Autonomous Financial Escrow & Payment-Aware Scheduling Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Node.js-%3E%3D20.19.0-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![PayPal](https://img.shields.io/badge/PayPal-Agent%20Toolkit%20%2B%20Sandbox-00457C.svg)](https://developer.paypal.com/)
[![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-Structured%20Audit-4285F4.svg)](https://ai.google.dev/)
[![AG Grid](https://img.shields.io/badge/AG%20Grid-Enterprise%20Master%2FDetail-FD1015.svg)](https://www.ag-grid.com/)
[![Bryntum](https://img.shields.io/badge/Bryntum-Gantt%20Critical%20Path-FF5722.svg)](https://bryntum.com/products/gantt/)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg)](https://milestone-pay.onrender.com)

> **Live Production Deployment**: [https://milestone-pay.onrender.com](https://milestone-pay.onrender.com)  
> **PayPal Agentic Commerce & Autonomous Escrow Command Center**

---

## 1. Executive Summary & Problem Statement

Milestone-based engineering contracts suffer from two fundamental disconnects:
1. **Time Does Not Respect Money**: Project schedules assume that contractors will begin work even when client deposits are overdue. In reality, unfunded milestones cause delayed delivery, scope friction, and cash flow insolvency.
2. **Money Does Not Respect Code**: Payout disbursements depend on manual client reviews and subjective approvals, leading to payment delays for developers, or premature release of funds for vulnerable, insecure pull requests.

**MilestonePay** introduces the first closed-loop **Payment-Aware Critical Path & Autonomous Escrow Protocol**:
- **Loop 1: Money Controls Time** — If the client's Phase 1 escrow deposit is overdue, downstream critical-path Gantt timelines automatically lock and shift forward (+4 days). When funded via PayPal Orders v2, the schedule snaps back to baseline.
- **Loop 2: Code Controls Money** — When a developer submits a GitHub Pull Request, Gemini 2.5 Flash conducts an automated code & OWASP security audit. If the PR scores >= 90/100 and satisfies all acceptance criteria, the `@paypal/agent-toolkit` and PayPal Payouts API automatically disburse the bounty from escrow to the contractor's PayPal account in real time.

---

## 2. Dual-Loop Architecture Blueprint

```
========================================================================================
LOOP 1: PAYMENT-AWARE CRITICAL PATH (Money Controls Time)
========================================================================================

  [ Client Buyer ]
         │
         ├── (Scenario 1: Overdue Deposit) ──► AG Grid Status = UNPAID_LATE
         │                                      │
         │                                      ▼
         │                               Bryntum Gantt Critical Path shifts +4 days forward
         │                               (All downstream milestone task bars locked in red)
         │
         └── (Scenario 2: PayPal Deposit) ──► POST /v2/checkout/orders (Capture Client Deposit)
                                                │
                                                ▼
                                         Webhook PAYMENT.CAPTURE.COMPLETED
                                                │
                                                ▼
                                         Escrow Pool Cleared & Funded
                                         Bryntum Gantt snaps to baseline schedule (Green)


========================================================================================
LOOP 2: FINANCIAL ESCROW GUARDRAIL & CODE-TO-PAYOUT (Code Controls Money)
========================================================================================

  [ Developer PR ] ──► GitHub REST API v3 ──► Unified Diff Extracted
                                                    │
                                                    ▼
                                      Gemini 2.5 Flash Structured Auditor
                                      - Schema-enforced JSON score (0 - 100)
                                      - Acceptance criteria checklist verification
                                      - OWASP API & CWE-798 vulnerability scan
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      ▼                                                           ▼
         [ Score < 90 / CWE Detected ]                               [ Score >= 90 / Passed ]
                      │                                                           │
                      ▼                                                           ▼
         FINANCIAL ESCROW GUARDRAIL                                  FINANCIAL ESCROW GUARDRAIL
             - Payout BLOCKED                                            - Check Cleared Escrow Pool
             - Escrow balance untouched                                  - Disburse Bounty
             - Reason logged to AG Grid                                           │
                                                                                  ▼
                                                                     @paypal/agent-toolkit &
                                                                     POST /v1/payments/payouts
                                                                                  │
                                                                                  ▼
                                                                     Contractor Payout Disbursed
                                                                     (Instant Verified Receipt)
```

---

## 3. Prize-Track Alignment Matrix

| Category / Sponsor | Integration Component | Implementation Details |
| :--- | :--- | :--- |
| **PayPal Agentic Commerce** | `@paypal/agent-toolkit` | Uses official `@paypal/agent-toolkit/openai` runtime for AI agent tool calling (`create_invoice`, `send_invoice`, `create_order`, `capture_order`, `list_invoices`). |
| **PayPal REST APIs** | Payouts & Orders v2 | `POST /v2/checkout/orders` for client escrow deposits; `POST /v1/payments/payouts` with unique `sender_batch_id` idempotency for contractor disbursements; `GET /api/paypal/payouts/:batchId` for real-time live verification. |
| **PayPal Webhooks** | Cryptographic Verification | Handled by `/api/webhooks/paypal`; validates `paypal-transmission-id`, `paypal-transmission-sig`, `paypal-cert-url`, and `paypal-auth-algo`. |
| **APIMatic** | OpenAPI Context & Types | Integrated with APIMatic PayPal OpenAPI specifications and strict schema-validated event structures. |
| **Gemini AI** | `@google/genai` (2.5 Flash) | Real-time AST and unified diff evaluation with strict JSON schema response typing (`responseSchema`), CWE vulnerability scanning, and objective criteria matching. |
| **Bryntum Gantt** | `BryntumGantt` & `taskRenderer` | Live interactive timeline showing critical path dependency chaining, duration deltas, milestone anchor dates, and custom visual bounty indicators. |
| **AG Grid Enterprise** | `AgGridReact` & Master/Detail | Dark-blue theme with master/detail row expansion displaying live Gemini code review summaries, acceptance criteria checklists, raw PayPal webhook payloads, and pinned bottom escrow summary rows. |

---

## 4. Interactive Judge Sandbox Simulator Scenarios

The top **Judge Sandbox Simulator Bar** enables instant one-click evaluation of all scenarios:

### Scenario 1: Simulate Late Client Deposit
- **Action**: Click `1. Simulate Late Client Deposit`.
- **System Behavior**: Phase 1 is marked `UNPAID_LATE`. The entire critical path shifts +4 days forward on the Bryntum Gantt chart, and all downstream contractor tasks display `LOCKED - UNPAID`. Escrow pool balance drops to $0.

### Scenario 2: Instant Client Escrow Capture
- **Action**: Click `2. Fund Escrow Deposit`.
- **System Behavior**: Calls PayPal Orders v2 API, captures the $1,500.00 deposit, emits a `PAYMENT.CAPTURE.COMPLETED` webhook, clears escrow funds, and snaps the Gantt schedule back to its baseline anchor.

### Scenario 3: Real GitHub PR Audit & Payout Release
- **Action**: Click `3. Run Live GitHub PR Audit`.
- **System Behavior**: Fetches PR diff from GitHub REST API, evaluates code quality with Gemini 2.5 Flash (Scores 96/100), passes the financial escrow guardrail, executes a real PayPal Sandbox Payout via `/v1/payments/payouts`, and updates the AG Grid ledger to `PAYOUT_SETTLED`.

### Scenario 4: Vulnerable PR CWE-798 Injection & Financial Guardrail Block
- **Action**: Click `4. Simulate Vulnerable PR (Score 62/100)`.
- **System Behavior**: Injects code containing hardcoded credentials (`REDIS_MASTER_TOKEN`) and spoofable `X-Forwarded-For` IP rate-limiting. Gemini detects CWE-798 and CWE-290, awarding a failing score of 62/100. The **Financial Escrow Guardrail blocks the $400.00 payout**, preserving the client's escrow pool.

---

## 5. Verified PayPal API Live Lookup (In-App Receipt Modal)

Judges can click **[Verify Receipt]** on any settled milestone row in the AG Grid ledger to open the verified live lookup modal:
- **Client Deposits (`ORDER-*`)**: Dynamically queries PayPal Orders v2 API (`GET /v2/checkout/orders/{orderId}`).
- **Contractor Payouts (`MPAY_*` / `P8B*`)**: Queries PayPal Payouts API (`GET /v1/payments/payouts/{payoutBatchId}`).
- **Zero Friction**: Bypasses dead PayPal login walls by displaying the real-time authenticated JSON response, HTTP status, and response headers (`paypal-debug-id`).

---

## 6. Environment Variables Reference

Configure these in your local `.env` or in the Render Dashboard (**Environment** tab):

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Optional | Port for the Express server (Render injects automatically) | `10000` |
| `PAYPAL_CLIENT_ID` | Yes | PayPal Sandbox App Client ID from developer.paypal.com | `A21AA...` |
| `PAYPAL_CLIENT_SECRET` | Yes | PayPal Sandbox App Secret | `EK3...` |
| `PAYPAL_ENVIRONMENT` | Yes | PayPal environment mode | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | Yes | PayPal Webhook listener ID | `WH-94812...` |
| `GEMINI_API_KEY` | Yes | Google Gemini API Key from Google AI Studio | `AIzaSy...` |
| `GITHUB_TOKEN` | Optional | GitHub personal token (prevents API rate limits on shared hosting) | `ghp_...` |

---

## 7. Local Development & Setup

### Prerequisites
- **Node.js**: `>=20.19.0` (or Node 22+)
- **npm**: `>=10.0.0`

### Installation
```bash
# Clone the repository
git clone https://github.com/Adityaraj1969/Milestone_PAY.git
cd Milestone_PAY

# Install dependencies cleanly
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials
```

### Running Locally
```bash
# Start full-stack development server (Express backend + Vite HMR)
npm run dev

# Or build client static bundle and run production server
npm run build
npm start
```
The server will start on `http://localhost:3000`.

---

## 8. Deployment on Render

This project is pre-configured for **Render Web Services**:

1. Create a new **Web Service** on [Render](https://dashboard.render.com).
2. Connect your GitHub repository `Adityaraj1969/Milestone_PAY`.
3. Configure the service settings:
   - **Environment**: `Node`
   - **Root Directory**: *Leave blank* (default repository root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In the **Environment** tab, add your 6 mandatory environment keys (`GEMINI_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=sandbox`, `PAYPAL_WEBHOOK_ID`, `GITHUB_TOKEN`).
5. Click **Deploy Web Service**.

Alternatively, Render will automatically detect [`render.yaml`](render.yaml) as an infrastructure Blueprint.

---

## 9. Security & Governance

- **Zero Hardcoded Secrets**: Secrets are loaded strictly from the environment; mock fallbacks protect the interface when keys are unconfigured.
- **Fail-Safe Financial Guardrails**: Payouts cannot execute without satisfying both the Gemini AI score threshold (>= 90) and verified escrow cleared balance.
- **Asymmetric Webhook Signatures**: All incoming PayPal Webhook payloads undergo asymmetric RSA-SHA256 signature verification against PayPal's public certificates.

---

## 10. License

MilestonePay is open-source software licensed under the [MIT License](LICENSE).
