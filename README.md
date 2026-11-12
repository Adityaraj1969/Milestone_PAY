# MilestonePay — Autonomous Financial Escrow & Payment-Aware Scheduling Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Node.js-%3E%3D20.19.0-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![PayPal Agent Toolkit](https://img.shields.io/badge/PayPal-Agent%20Toolkit%20%2B%20Sandbox-00457C.svg)](https://developer.paypal.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini%202.5%20Flash-Structured%20Audit-4285F4.svg)](https://ai.google.dev/)
[![AG Grid Enterprise](https://img.shields.io/badge/AG%20Grid-Enterprise%20Master%2FDetail-FD1015.svg)](https://www.ag-grid.com/)
[![Bryntum Gantt](https://img.shields.io/badge/Bryntum-Gantt%20Critical%20Path-FF5722.svg)](https://bryntum.com/products/gantt/)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg)](https://milestone-pay.onrender.com)

> **Live Production Deployment**: [https://milestone-pay.onrender.com](https://milestone-pay.onrender.com)  
> **Repository**: [https://github.com/Adityaraj1969/Milestone_PAY](https://github.com/Adityaraj1969/Milestone_PAY)  
> **Autonomous Escrow Protocol & Payment-Aware Critical Path Command Center**

---

## 1. Executive Summary & Problem Statement

Milestone-based engineering contracts suffer from two fundamental disconnects:

1. **Time Does Not Respect Money**: Traditional project management tools assume developers will execute milestones on schedule even when client funding deposits are late or unpaid. In reality, working on unfunded milestones creates severe counterparty risk, contractor insolvency, and timeline friction.
2. **Money Does Not Respect Code**: Payout disbursements traditionally rely on manual client approvals or arbitrary sign-offs. This results in lengthy payment delays for contractors or, worse, premature release of escrow funds for vulnerable, non-compliant pull requests.

**MilestonePay** introduces the first closed-loop **Payment-Aware Critical Path & Autonomous Escrow Protocol**:

* **Loop 1: Money Controls Time (Critical Path Scheduling)** — If a client's Phase 1 escrow deposit is overdue, downstream engineering timelines automatically lock in crimson and shift forward (+4 calendar days). When the deposit is captured via the PayPal Orders v2 API, the Bryntum Gantt engine unlocks the milestones and snaps the critical path back to baseline.
* **Loop 2: Code Controls Money (Autonomous Financial Guardrail)** — When a contractor submits a GitHub Pull Request, Gemini 2.5 Flash conducts an automated code quality and OWASP security audit against structured acceptance criteria. If the PR scores $\ge 90/100$ with zero security violations, the `@paypal/agent-toolkit` and PayPal Payouts API automatically release the milestone bounty from escrow directly to the developer's PayPal wallet in real time.

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
         │                               (All downstream milestone task bars locked in crimson)
         │
         └── (Scenario 2: PayPal Deposit) ──► POST /v2/checkout/orders (Capture Client Deposit)
                                                │
                                                ▼
                                         Webhook: PAYMENT.CAPTURE.COMPLETED
                                                │
                                                ▼
                                         Escrow Pool Cleared & Funded ($1,500.00)
                                         Bryntum Gantt snaps to baseline schedule (Green)


========================================================================================
LOOP 2: FINANCIAL ESCROW GUARDRAIL & CODE-TO-PAYOUT (Code Controls Money)
========================================================================================

  [ Developer PR ] ──► GitHub REST API v3 ──► Unified Diff Extracted
  (Adityaraj1969/MilestonePay#1)                    │
                                                    ▼
                                      Gemini 2.5 Flash Structured Auditor
                                      - Schema-enforced JSON score (0 - 100)
                                      - Acceptance criteria checklist verification
                                      - OWASP API4:2023 & CWE-798 vulnerability scan
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      ▼                                                           ▼
         [ Score < 90 / CWE Detected ]                               [ Score >= 90 / Passed ]
                      │                                                           │
                      ▼                                                           ▼
         FINANCIAL ESCROW GUARDRAIL                                  FINANCIAL ESCROW GUARDRAIL
             - Payout BLOCKED                                            - Verify Cleared Escrow Pool
             - Escrow balance untouched ($1,100 held)                    - Authorize Milestone Bounty
             - Reason logged to AG Grid / Drawer                                  │
                                                                                  ▼
                                                                     @paypal/agent-toolkit &
                                                                     POST /v1/payments/payouts
                                                                                  │
                                                                                  ▼
                                                                     Batch Disbursed (e.g. PUK7APPS4CGHW)
                                                                     Webhook: PAYMENT.PAYOUTS-ITEM.SUCCEEDED
                                                                     (Instant In-App Modal Verification)
```

---

## 3. Technology Integration & Partner Alignment

| Category | Component | Implementation Highlights |
| :--- | :--- | :--- |
| **PayPal Agentic Commerce** | `@paypal/agent-toolkit` | Uses official `@paypal/agent-toolkit` action bindings for autonomous agent workflows (`create_invoice`, `send_invoice`, `create_order`, `get_order`, `list_invoices`). |
| **PayPal REST APIs** | Payouts & Orders v2 | Dual-engine implementation: `POST /v2/checkout/orders` for client escrow deposits; `POST /v1/payments/payouts` with unique `sender_batch_id` idempotency for contractor disbursements; `GET /api/paypal/payouts/:batchId` for real-time verification. |
| **PayPal Webhook Engine** | Cryptographic Verification | Implemented at `/api/webhooks/paypal`; validates `paypal-transmission-id`, `paypal-transmission-sig`, `paypal-cert-url`, and `paypal-auth-algo` against PayPal Sandbox certificates. |
| **AI Code Review Engine** | Google Gemini 2.5 Flash | Real-time AST and unified diff evaluation using `@google/genai` with strict JSON schema response typing (`responseSchema`), CWE vulnerability detection, and acceptance criteria matching. |
| **Gantt & Scheduling Engine** | Bryntum Gantt | Interactive payment-aware Gantt chart displaying critical path dependency chaining, duration deltas, milestone anchor dates, and custom visual bounty indicators. |
| **Financial Ledger Table** | AG Grid Enterprise | Dark-blue theme with master/detail row expansion displaying live Gemini code review summaries, acceptance criteria checklists, raw PayPal webhook payloads, and pinned bottom escrow summary rows. |

---

## 4. Interactive Judge Sandbox Simulator Scenarios

The top **Judge Simulator Bar** provides four deterministic, one-click scenarios designed for seamless evaluation:

```
[ 1. Simulate Late Client Deposit ]  [ 2. Simulate Client PayPal Payment ($1,500) ]  [ 3. Run Live GitHub PR Audit ($400) ]  [ 4. Simulate Vulnerable PR (Score 62/100 — Payout Blocked) ]  [ ↺ Reset ]
```

### Scenario 1: Simulate Late Client Deposit
* **Trigger**: Click `1. Simulate Late Client Deposit`.
* **System Action**: Generates a simulated PayPal `INVOICING.INVOICE.OVERDUE` webhook.
* **Gantt Engine**: Phase 1 locks in crimson (`UNPAID_LATE`), and the Bryntum Gantt engine shifts all downstream engineering tasks (`TASK-2`, `TASK-3`, `TASK-4`) forward by **+4 calendar days**, adjusting projected project delivery from `2026-11-17` to `2026-11-21`.
* **Escrow Pool**: Cleared escrow balance drops to `$0.00`. Downstream rows reflect `UNPAID_LATE`.

### Scenario 2: Simulate Client PayPal Payment ($1,500)
* **Trigger**: Click `2. Simulate Client PayPal Payment ($1,500)`.
* **System Action**: Calls the live PayPal Orders v2 API (`POST /v2/checkout/orders`) with test card credentials and captures `$1,500.00 USD`. Emits a verified `PAYMENT.CAPTURE.COMPLETED` webhook.
* **Gantt Engine**: Phase 1 is marked `ESCROW_FUNDED (100%)`. Bryntum Gantt unlocks the critical path and snaps downstream milestone start dates back to their original baseline schedule (Delivery: `2026-11-17`).
* **Escrow Pool**: Credited with `$1,500.00 USD` cleared funds, unlocking downstream contractor deliverables.

### Scenario 3: Run Live GitHub PR Audit & Payout Release ($400)
* **Trigger**: Click `3. Run Live GitHub PR Audit ($400)`.
* **GitHub Integration**: Fetches the real unified diff from [Adityaraj1969/MilestonePay#1](https://github.com/Adityaraj1969/MilestonePay/pull/1) (*"feat: add Express rate-limiting middleware with Redis token bucket"*).
* **Gemini 2.5 Flash**: Audits the atomic Lua token-bucket implementation, IP sanitization, and unit test coverage against acceptance criteria. Assigns a score of **96/100 (PASSED)**.
* **Financial Guardrail**: Confirms `Score (96) >= 90` and `Cleared Escrow ($1,500.00) >= Bounty ($400.00)`. Releases payout via the PayPal Payouts API (`POST /v1/payments/payouts`).
* **Ledger State**: `TASK-2` transitions to `PAYOUT_SETTLED` (100%), displays authentic payout batch ID (e.g. `PUK7APPS4CGHW`), and logs a `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` webhook event in the drawer.

### Scenario 4: Simulate Vulnerable PR (Score 62/100 — Payout Blocked)
* **Trigger**: Click `4. Simulate Vulnerable PR (Score 62/100 — Payout Blocked)`.
* **Security Gate**: Injects code containing hardcoded production credentials (`REDIS_MASTER_TOKEN`, CWE-798) and unvalidated `X-Forwarded-For` header spoofing (CWE-290).
* **Gemini 2.5 Flash**: Detects high-severity vulnerabilities and fails the audit with **62/100 (REJECTED)**.
* **Financial Guardrail**: **Blocks the $550.00 escrow release** for `TASK-3`. Escrow funds remain safely protected in the client pool, and the reason is recorded in the autonomous trace log.

---

## 5. Verified PayPal API Live Lookup Modal

Judges can click **[Verify Deposit]** on Row 1 or **[Verify Receipt]** on Row 2 to open the authenticated receipt inspector:

* **Client Deposits (`ORDER-*`)**: Queries live PayPal Orders v2 (`GET /v2/checkout/orders/{orderId}`) and surfaces order state, payer identity, capture IDs, and transmission headers.
* **Contractor Disbursements (`PUK7*`)**: Queries live PayPal Payouts API (`GET /v1/payments/payouts/{payoutBatchId}`) and surfaces recipient details, batch metadata, fee structures, and debug identifiers (`paypal-debug-id`).
* **Zero Dead Ends**: Eliminates sandbox login screens by providing immediate, verifiable JSON telemetry directly in the application interface.

---

## 6. Repository Architecture

```
Milestone_PAY/
├── server.ts                       # Express backend server with Vite middleware & REST endpoints
├── vite.config.ts                  # Vite build and development configuration
├── package.json                    # Project dependencies and script declarations
├── render.yaml                     # Render Infrastructure-as-Code Blueprint
├── dist/                           # Production static assets bundle
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main MilestonePay command center dashboard
│   │   ├── globals.css             # Tailwind CSS tokens, themes, and Gantt styling
│   │   └── api/
│   │       ├── audit-pr/route.ts   # GitHub diff fetch -> Gemini audit -> PayPal payout pipeline
│   │       ├── escrow/fund/route.ts# Client deposit capture endpoint
│   │       ├── paypal/status/      # PayPal credentials & live API status probe
│   │       └── webhooks/paypal/    # Asymmetric webhook signature verification
│   ├── components/
│   │   ├── JudgeSimulatorBar.tsx   # Top 4 one-click judge scenario toolbar
│   │   ├── BryntumGanttPanel.tsx   # Payment-aware critical path Gantt timeline
│   │   ├── AgGridLedgerPanel.tsx   # AG Grid Enterprise financial ledger with Master/Detail view
│   │   ├── AgentAuditDrawer.tsx    # Live streaming autonomous trace log & JSON inspector
│   │   └── PayPalLiveReceiptModal.tsx # In-app verified PayPal API live lookup modal
│   ├── lib/
│   │   ├── github-auditor.ts       # GitHub REST API v3 diff fetcher & Gemini 2.5 Flash auditor
│   │   ├── paypal.ts               # PayPal Orders v2, Payouts, and @paypal/agent-toolkit bindings
│   │   ├── rules.ts                # Pure domain logic: critical path math & financial guardrails
│   │   └── rules.test.ts           # Automated test suite (Node test runner)
│   ├── middleware/
│   │   ├── rateLimiter.ts          # Express Redis token-bucket middleware (matches PR #1 diff)
│   │   └── rateLimiter.test.ts     # Unit tests verifying rate-limiting and fail-open behaviors
│   └── store/
│       └── useProjectStore.ts      # Zustand state store coordinating timelines, ledger, and trace
```

---

## 7. Environment Variables Reference

Configure these in your local `.env` file or in the **Environment** settings on Render:

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Optional | Server port (injected by host) | `10000` |
| `PAYPAL_CLIENT_ID` | Yes | PayPal Sandbox REST App Client ID | `A21AA...` |
| `PAYPAL_CLIENT_SECRET`| Yes | PayPal Sandbox REST App Secret | `EK3...` |
| `PAYPAL_ENVIRONMENT` | Yes | Target PayPal environment | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | Optional | Registered PayPal Webhook listener ID | `WH-94812...` |
| `GEMINI_API_KEY` | Yes | Google Gemini API Key from Google AI Studio | `AIzaSy...` |
| `GITHUB_TOKEN` | Optional | Personal GitHub access token (prevents API rate-limiting) | `ghp_...` |

---

## 8. Local Setup & Verification

### Prerequisites
* **Node.js**: `>=20.19.0` (or Node 22+)
* **npm**: `>=10.0.0`

### Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Adityaraj1969/Milestone_PAY.git
cd Milestone_PAY

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your PayPal Sandbox and Gemini API keys in .env

# 4. Run automated test suite
npm run test:rules

# 5. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## 9. Automated Test Suite

MilestonePay includes comprehensive automated unit tests covering both scheduling and financial domain rules:

```bash
npx tsx --test src/lib/rules.test.ts
```

**Test Coverage**:
* `✔ addDaysToDate shifts ISO dates accurately`: Verifies calendar date shifts across month and year boundaries.
* `✔ Loop 1: recalculateCriticalPathSchedule shifts dependent tasks +4 days when late and snaps back when paid`: Verifies critical path shifting and automatic reset upon funding.
* `✔ Loop 2: evaluatePayoutGuardrail enforces score >= 90 and sufficient escrow balance`: Validates financial guardrail protection against low audit scores and unfunded escrow balances.
* `✔ PayPal Webhook Signature Verification rejects missing headers and accepts signed headers`: Tests asymmetric RSA-SHA256 signature verification.
* `✔ Clean PR audit and Vulnerable PR fetch preserve LIVE_GEMINI_API and LIVE_GITHUB_REST_API`: Validates structured audit parsing and live GitHub diff retrieval.

---

## 10. Security & Governance

* **Zero Hardcoded Secrets**: All API credentials and cryptographic secrets are strictly ingested through environment variables.
* **Double-Check Financial Guardrail**: Money moves only when both technical criteria ($\ge 90/100$ score) and fiscal criteria (cleared escrow pool balance $\ge$ bounty amount) are verified simultaneously.
* **Idempotent Payouts**: Contractor disbursements use deterministic `sender_batch_id` values (`MPAY_{taskId}_{prNumber}_{timestamp}`), preventing duplicate payments across network retries.
* **Asymmetric Signature Verification**: Webhook notifications validate transmission headers against PayPal public certificates, rejecting spoofed or tampered events.

---

## 11. License

MilestonePay is open-source software licensed under the [MIT License](LICENSE).
