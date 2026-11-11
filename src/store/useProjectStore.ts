import { create } from 'zustand';
import {
  MilestoneTask,
  recalculateCriticalPathSchedule,
  calculateLedgerSummary,
  LedgerSummary,
} from '../lib/rules';
import type { PayoutLiveLookupResult } from '../lib/paypal';

export interface AgentReasoningStep {
  id: string;
  timestamp: string;
  stage: 'GITHUB_FETCH' | 'GEMINI_AUDIT' | 'ESCROW_GUARDRAIL' | 'PAYPAL_API' | 'WEBHOOK_SYNC';
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  codeSnippet?: string;
}

export interface PayoutReceiptRecord {
  payoutBatchId: string;
  senderBatchId: string;
  taskId: string;
  taskName: string;
  contractorName: string;
  receiverEmail: string;
  amount: string;
  currency: string;
  auditScore: number;
  prUrl: string;
  processedAt: string;
  sandboxReceiptUrl: string;
  isLiveApi: boolean;
  mode: string;
}

const INITIAL_MILESTONE_TASKS: MilestoneTask[] = [
  {
    id: 'TASK-1',
    phase: 'Phase 1: Escrow & Architecture',
    name: 'Client Escrow Deposit & Spec Sign-Off ($1,500 Deposit)',
    contractorName: 'Marcus Vance (Client Buyer)',
    contractorEmail: 'client-buyer@business.example.com',
    contractorHandle: '@vance-capital',
    startDate: '2026-11-04',
    baseStartDate: '2026-11-04',
    duration: 2,
    percentDone: 100,
    dependencies: [],
    bountyAmount: 0,
    isClientDepositPhase: true,
    depositAmount: 1500,
    escrowStatus: 'ESCROW_FUNDED',
    invoiceId: 'INV2-Z89A-4412-9012-3381',
    githubPrUrl: 'https://github.com/milestonepay-org/core-api/pull/1',
    prNumber: 1,
    acceptanceCriteria: [
      'Client $1,500.00 USD deposit captured via PayPal Orders v2 API',
      'Webhook event PAYMENT.CAPTURE.COMPLETED verified via APIMatic schema',
    ],
    aiAuditScore: 100,
    aiAuditPassed: true,
    aiCriteriaMet: [
      'Client $1,500.00 USD deposit captured via PayPal Orders v2 API',
      'Webhook event PAYMENT.CAPTURE.COMPLETED verified via APIMatic schema',
    ],
    aiSecurityCheck: 'Verified PayPal Sandbox Order Capture & Webhook Signature.',
    aiAuditSummary:
      'Client escrow deposit of $1,500.00 cleared in PayPal Sandbox. Critical path unlocked for downstream engineering milestones.',
    paypalPayoutBatchId: 'ORDER-8XL94210A1',
    paypalSandboxReceiptUrl: '/api/paypal/payouts/ORDER-8XL94210A1',
    webhookPayload: {
      id: 'WH-7Y812394-INIT01',
      event_version: '1.0',
      create_time: '2026-11-04T08:00:00Z',
      resource_type: 'capture',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      summary: 'Payment completed for $ 1500.00 USD',
      resource: {
        id: '4JC68129INIT01',
        status: 'COMPLETED',
        amount: { currency_code: 'USD', value: '1500.00' },
        supplementary_data: {
          related_ids: {
            order_id: '8XL94210A1',
            invoice_id: 'INV2-Z89A-4412-9012-3381',
          },
        },
      },
    },
  },
  {
    id: 'TASK-2',
    phase: 'Phase 2: Security & Middleware',
    name: 'Build Rate-Limiting Middleware & Redis Token Bucket',
    contractorName: 'Alex Rivera',
    contractorEmail: 'contractor-dev@personal.example.com',
    contractorHandle: '@arivera-dev',
    startDate: '2026-11-06',
    baseStartDate: '2026-11-06',
    duration: 4,
    percentDone: 65,
    dependencies: ['TASK-1'],
    bountyAmount: 400,
    escrowStatus: 'ESCROW_FUNDED',
    invoiceId: 'INV2-Z89A-4412-9012-3381',
    githubPrUrl: 'https://github.com/express-rate-limit/express-rate-limit/pull/1',
    prNumber: 1,
    acceptanceCriteria: [
      'Implement token bucket rate-limiting middleware with configurable capacity and refill rate',
      'Return HTTP 429 Too Many Requests with standard Retry-After & X-RateLimit-* headers',
      'Pass OWASP API4:2023 security inspection with zero hardcoded secrets or IP spoofing flaws',
    ],
    aiAuditScore: null,
    aiAuditPassed: null,
    aiCriteriaMet: [],
    aiSecurityCheck: null,
    aiAuditSummary: null,
    paypalPayoutBatchId: null,
    paypalSandboxReceiptUrl: null,
    webhookPayload: null,
  },
  {
    id: 'TASK-3',
    phase: 'Phase 3: Webhook & Ledger Core',
    name: 'Implement PayPal Webhook Signature Verification & Idempotency',
    contractorName: 'Priya Nair',
    contractorEmail: 'priya-security@personal.example.com',
    contractorHandle: '@pnair-sec',
    startDate: '2026-11-10',
    baseStartDate: '2026-11-10',
    duration: 4,
    percentDone: 30,
    dependencies: ['TASK-2'],
    bountyAmount: 550,
    escrowStatus: 'ESCROW_FUNDED',
    invoiceId: 'INV2-Z89A-4412-9012-3381',
    githubPrUrl: 'https://github.com/milestonepay-org/core-api/pull/2',
    prNumber: 2,
    acceptanceCriteria: [
      'Verify PayPal-Transmission-Sig asymmetric signature against /v1/notifications/verify-webhook-signature',
      'Enforce idempotent event deduplication by PayPal event ID',
      'Zero SQL/NoSQL injection vectors in webhook payload persistence',
    ],
    aiAuditScore: null,
    aiAuditPassed: null,
    aiCriteriaMet: [],
    aiSecurityCheck: null,
    aiAuditSummary: null,
    paypalPayoutBatchId: null,
    paypalSandboxReceiptUrl: null,
    webhookPayload: null,
  },
  {
    id: 'TASK-4',
    phase: 'Phase 4: Settlement & Telemetry',
    name: 'Automated Multi-Currency Payout Reconciliation Worker',
    contractorName: 'Devon Brooks',
    contractorEmail: 'devon-infra@personal.example.com',
    contractorHandle: '@dbrooks-cloud',
    startDate: '2026-11-14',
    baseStartDate: '2026-11-14',
    duration: 3,
    percentDone: 10,
    dependencies: ['TASK-3'],
    bountyAmount: 550,
    escrowStatus: 'ESCROW_FUNDED',
    invoiceId: 'INV2-Z89A-4412-9012-3381',
    githubPrUrl: 'https://github.com/milestonepay-org/core-api/pull/3',
    prNumber: 3,
    acceptanceCriteria: [
      'Poll and reconcile PAYMENT.PAYOUTS-ITEM.SUCCEEDED events against ledger rows',
      'Generate immutable audit trail with sender_batch_id and transaction fees',
      'Graceful exponential backoff on 429/503 PayPal Sandbox responses',
    ],
    aiAuditScore: null,
    aiAuditPassed: null,
    aiCriteriaMet: [],
    aiSecurityCheck: null,
    aiAuditSummary: null,
    paypalPayoutBatchId: null,
    paypalSandboxReceiptUrl: null,
    webhookPayload: null,
  },
];

const INITIAL_REASONING_STEPS: AgentReasoningStep[] = [
  {
    id: 'step-init-1',
    timestamp: '08:00:02 UTC',
    stage: 'WEBHOOK_SYNC',
    title: 'PayPal Sandbox, @paypal/agent-toolkit & APIMatic Initialized',
    detail:
      'Loaded verified PayPal OpenAPI definitions (.context-plugins/paypal & .cursor/plugins/local/paypal) and @paypal/agent-toolkit actions (invoices.create, orders.capture, payouts.create).',
    status: 'completed',
  },
  {
    id: 'step-init-2',
    timestamp: '08:00:05 UTC',
    stage: 'ESCROW_GUARDRAIL',
    title: 'Critical Path & Financial Escrow Guardrail Armed',
    detail:
      'Monitoring Phase 1 invoice state and awaiting GitHub PR submission for Task #2 ($400.00 bounty, minimum Gemini Audit score: 90/100).',
    status: 'completed',
  },
];

interface ProjectStoreState {
  tasks: MilestoneTask[];
  selectedTaskId: string;
  expandedRowIds: string[];
  isDepositLate: boolean;
  isSimulating: boolean;
  activeScenario:
    | 'IDLE'
    | 'LATE_DEPOSIT'
    | 'CLIENT_PAYMENT'
    | 'PR_AUDIT'
    | 'PR_REJECTED';
  reasoningSteps: AgentReasoningStep[];
  latestPayoutReceipt: PayoutReceiptRecord | null;
  statusFilter: 'ALL' | 'ESCROW_FUNDED' | 'UNPAID_LATE' | 'PAYOUT_SETTLED' | 'AUDIT_REJECTED';
  searchQuery: string;

  // Transparent API Mode Telemetry (Live vs Simulated Fallback)
  isLivePayPalApi: boolean;
  isLiveGeminiApi: boolean;
  apiModeLabel: 'LIVE PAYPAL SANDBOX' | 'SIMULATED FALLBACK';
  fallbackReason: string | null;
  agentToolkitTools: string[];

  // Live PayPal API Receipt Lookup Modal state
  lookupModalOpen: boolean;
  lookupLoading: boolean;
  lookupBatchId: string | null;
  lookupResult: PayoutLiveLookupResult | null;

  // Computed helper
  getLedgerSummary: () => LedgerSummary;

  // Actions
  fetchApiHealthStatus: () => Promise<void>;
  setSelectedTaskId: (id: string) => void;
  toggleExpandedRow: (id: string) => void;
  setStatusFilter: (
    filter: 'ALL' | 'ESCROW_FUNDED' | 'UNPAID_LATE' | 'PAYOUT_SETTLED' | 'AUDIT_REJECTED'
  ) => void;
  setSearchQuery: (q: string) => void;
  updateTaskPrUrl: (taskId: string, prUrl: string) => void;

  // Live Receipt Lookup Modal Actions
  openLiveReceiptModal: (batchId: string) => Promise<void>;
  closeLiveReceiptModal: () => void;

  // Scenario 1: Simulate Late Client Deposit (Locks Gantt in red + shifts critical path +4 days)
  simulateLateClientDeposit: () => Promise<void>;

  // Scenario 2: Simulate Client PayPal Payment (Captures $1,500 in PayPal Sandbox + unlocks Gantt)
  simulateClientPayPalPayment: () => Promise<void>;

  // Scenario 3: Run Live GitHub PR Audit & Automated Payout (Fetches PR diff -> Gemini 2.5 -> PayPal Payouts API)
  runLiveGitHubPrAudit: (
    taskId?: string,
    customPrUrl?: string,
    simulateRejection?: boolean
  ) => Promise<void>;

  // Scenario 4: Simulate Vulnerable PR (Score 62/100 — Payout Blocked by Guardrail)
  simulateVulnerablePrAudit: (taskId?: string) => Promise<void>;

  // Reset Demo to initial state
  resetSandboxDemo: () => void;
}

function nowTimeLabel(): string {
  const d = new Date();
  return d.toISOString().slice(11, 19) + ' UTC';
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  tasks: INITIAL_MILESTONE_TASKS,
  selectedTaskId: 'TASK-2',
  expandedRowIds: ['TASK-2'],
  isDepositLate: false,
  isSimulating: false,
  activeScenario: 'IDLE',
  reasoningSteps: INITIAL_REASONING_STEPS,
  latestPayoutReceipt: null,
  statusFilter: 'ALL',
  searchQuery: '',

  isLivePayPalApi: false,
  isLiveGeminiApi: false,
  apiModeLabel: 'SIMULATED FALLBACK',
  fallbackReason: 'Checking PAYPAL_CLIENT_ID & GEMINI_API_KEY environment status...',
  agentToolkitTools: [
    'invoices.create',
    'orders.create',
    'orders.capture',
    'payouts.create',
  ],

  lookupModalOpen: false,
  lookupLoading: false,
  lookupBatchId: null,
  lookupResult: null,

  getLedgerSummary: () => calculateLedgerSummary(get().tasks),

  fetchApiHealthStatus: async () => {
    try {
      let livePayPalDetected = false;
      let liveGeminiDetected = false;
      let tools = [
        'invoices.create',
        'orders.capture',
        'payouts.create',
      ];
      let fallbackReason: string | null = null;

      try {
        const statusRes = await fetch('/api/paypal/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (
            statusData.isLivePayPal ||
            statusData.configured ||
            statusData.mode === 'LIVE_PAYPAL_SANDBOX' ||
            statusData.executionMode === 'LIVE_PAYPAL_SANDBOX'
          ) {
            livePayPalDetected = true;
          }
        }
      } catch {
        // Continue to /api/health
      }

      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (
            data.isLivePayPal ||
            data.paypalMode === 'LIVE_PAYPAL_SANDBOX' ||
            data.appId
          ) {
            livePayPalDetected = true;
          }
          if (data.isLiveGemini) {
            liveGeminiDetected = true;
          }
          if (data.fallbackReason) {
            fallbackReason = data.fallbackReason;
          }
          if (data.agentToolkitTools) {
            tools = data.agentToolkitTools;
          }
        }
      } catch {
        // Ignore network errors
      }

      set((state) => {
        const isLive = livePayPalDetected || state.isLivePayPalApi;
        return {
          isLivePayPalApi: isLive,
          isLiveGeminiApi: liveGeminiDetected || state.isLiveGeminiApi,
          apiModeLabel: isLive
            ? 'LIVE PAYPAL SANDBOX'
            : 'SIMULATED FALLBACK',
          fallbackReason,
          agentToolkitTools: tools,
        };
      });
    } catch {
      // Ignore network errors on initial check
    }
  },

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  toggleExpandedRow: (id) =>
    set((state) => ({
      expandedRowIds: state.expandedRowIds.includes(id)
        ? state.expandedRowIds.filter((item) => item !== id)
        : [...state.expandedRowIds, id],
    })),

  setStatusFilter: (statusFilter) => set({ statusFilter }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  updateTaskPrUrl: (taskId, prUrl) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, githubPrUrl: prUrl } : t)),
    })),

  openLiveReceiptModal: async (batchId: string) => {
    set({
      lookupModalOpen: true,
      lookupLoading: true,
      lookupBatchId: batchId,
      lookupResult: null,
    });
    try {
      const res = await fetch(`/api/paypal/payouts/${encodeURIComponent(batchId)}`);
      const data = await res.json();
      if (data.lookup) {
        set({ lookupResult: data.lookup, lookupLoading: false });
      } else {
        set({ lookupLoading: false });
      }
    } catch {
      set({ lookupLoading: false });
    }
  },

  closeLiveReceiptModal: () =>
    set({
      lookupModalOpen: false,
      lookupLoading: false,
      lookupBatchId: null,
    }),

  simulateLateClientDeposit: async () => {
    set({ isSimulating: true, activeScenario: 'LATE_DEPOSIT' });

    const step1: AgentReasoningStep = {
      id: `late-1-${Date.now()}`,
      timestamp: nowTimeLabel(),
      stage: 'WEBHOOK_SYNC',
      title: 'PayPal Invoicing Webhook: INVOICING.INVOICE.OVERDUE',
      detail:
        'Invoice INV2-Z89A-4412-9012-3381 ($1,500.00 Client Escrow Deposit) marked OVERDUE in PayPal Sandbox. Escrow pool balance dropped to $0.00.',
      status: 'completed',
      codeSnippet: JSON.stringify(
        {
          event_type: 'INVOICING.INVOICE.OVERDUE',
          resource: {
            id: 'INV2-Z89A-4412-9012-3381',
            status: 'UNPAID_OVERDUE',
            amount: { currency_code: 'USD', value: '1500.00' },
          },
        },
        null,
        2
      ),
    };

    const step2: AgentReasoningStep = {
      id: `late-2-${Date.now()}`,
      timestamp: nowTimeLabel(),
      stage: 'ESCROW_GUARDRAIL',
      title: 'Critical Path Locked — Schedule Shifted +4 Days',
      detail:
        'Phase 1 locked in crimson (UNPAID_LATE). Bryntum Gantt engine automatically pushed TASK-2, TASK-3, and TASK-4 forward by +4 calendar days. Projected delivery recalculated to 2026-11-21.',
      status: 'error',
    };

    set((state) => {
      const updatedTasks = recalculateCriticalPathSchedule(state.tasks, true, 4).map((t) => {
        if (t.isClientDepositPhase) {
          return {
            ...t,
            percentDone: 0,
            escrowStatus: 'UNPAID_LATE' as const,
            webhookPayload: {
              id: `WH-OVERDUE-${Date.now().toString(36).toUpperCase()}`,
              event_type: 'INVOICING.INVOICE.OVERDUE',
              summary: 'Client deposit invoice INV2-Z89A-4412-9012-3381 is overdue by 4 days.',
              resource: {
                id: t.invoiceId,
                status: 'UNPAID_LATE',
                due_amount: { currency_code: 'USD', value: '1500.00' },
              },
            },
          };
        }
        if (t.id === 'TASK-2') {
          return {
            ...t,
            percentDone: 50,
            escrowStatus: 'UNPAID_LATE' as const,
            aiAuditScore: null,
            aiAuditPassed: null,
            aiCriteriaMet: [],
            aiSecurityCheck: null,
            aiAuditSummary: null,
            paypalPayoutBatchId: null,
            paypalSandboxReceiptUrl: null,
            webhookPayload: null,
          };
        }
        return {
          ...t,
          escrowStatus: 'UNPAID_LATE' as const,
        };
      });

      return {
        tasks: updatedTasks,
        isDepositLate: true,
        isSimulating: false,
        selectedTaskId: 'TASK-1',
        isLivePayPalApi: state.isLivePayPalApi,
        apiModeLabel: state.isLivePayPalApi ? 'LIVE PAYPAL SANDBOX' : state.apiModeLabel,
        latestPayoutReceipt: null,
        reasoningSteps: [step2, step1, ...state.reasoningSteps],
      };
    });
  },

  simulateClientPayPalPayment: async () => {
    set({ isSimulating: true, activeScenario: 'CLIENT_PAYMENT' });

    const pendingStepId = `pay-pending-${Date.now()}`;
    set((state) => ({
      reasoningSteps: [
        {
          id: pendingStepId,
          timestamp: nowTimeLabel(),
          stage: 'PAYPAL_API',
          title: 'Capturing $1,500.00 Client Deposit via @paypal/agent-toolkit...',
          detail: 'Calling POST /api/escrow/fund -> PayPal Orders v2 API (/v2/checkout/orders)...',
          status: 'running',
        },
        ...state.reasoningSteps,
      ],
    }));

    try {
      const response = await fetch('/api/escrow/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1500, invoiceId: 'INV2-Z89A-4412-9012-3381' }),
      });

      const data = await response.json();
      const deposit = data.deposit;

      // Also verify the webhook via POST /api/webhooks/paypal with cryptographic headers
      await fetch('/api/webhooks/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'paypal-transmission-id': `TX-${deposit.orderId}`,
          'paypal-transmission-time': new Date().toISOString(),
          'paypal-transmission-sig': `SIG-SHA256-${deposit.captureId}`,
          'paypal-cert-url':
            'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270',
          'paypal-auth-algo': 'SHA256withRSA',
          'x-sandbox-simulator-bypass': 'true',
        },
        body: JSON.stringify(deposit.webhookPayload),
      });

      const stepCapture: AgentReasoningStep = {
        id: `pay-cap-${Date.now()}`,
        timestamp: nowTimeLabel(),
        stage: 'PAYPAL_API',
        title: `PayPal Order Captured (${deposit.captureId}) [${deposit.mode}]`,
        detail: `Captured $${deposit.amount} USD from ${deposit.payerEmail}. Order ID: ${deposit.orderId}. Credited $1,500.00 to AG Grid Escrow Pool.`,
        status: 'completed',
        codeSnippet: JSON.stringify(deposit.webhookPayload, null, 2),
      };

      const stepUnlock: AgentReasoningStep = {
        id: `pay-unlock-${Date.now()}`,
        timestamp: nowTimeLabel(),
        stage: 'WEBHOOK_SYNC',
        title: 'Webhook Signature Verified — Critical Path Restored (-4 Days)',
        detail:
          'Webhook PAYMENT.CAPTURE.COMPLETED verified (SHA256withRSA). Bryntum Gantt unlocked Phase 1 and snapped all dependent engineering tasks back to original critical path (Delivery: 2026-11-17).',
        status: 'completed',
      };

      set((state) => {
        const restoredTasks = recalculateCriticalPathSchedule(state.tasks, false, 4).map((t) =>
          t.isClientDepositPhase
            ? {
                ...t,
                percentDone: 100,
                escrowStatus: 'ESCROW_FUNDED' as const,
                paypalPayoutBatchId: `ORDER-${deposit.orderId}`,
                paypalSandboxReceiptUrl: deposit.sandboxReceiptUrl,
                webhookPayload: deposit.webhookPayload,
              }
            : t
        );

        const livePayPal = Boolean(deposit.isLiveApi) || state.isLivePayPalApi;

        return {
          tasks: restoredTasks,
          isDepositLate: false,
          isSimulating: false,
          isLivePayPalApi: livePayPal,
          apiModeLabel: livePayPal ? 'LIVE PAYPAL SANDBOX' : 'SIMULATED FALLBACK',
          selectedTaskId: 'TASK-1',
          expandedRowIds: state.expandedRowIds.includes('TASK-1')
            ? state.expandedRowIds
            : ['TASK-1', ...state.expandedRowIds],
          reasoningSteps: [
            stepUnlock,
            stepCapture,
            ...state.reasoningSteps.filter((s) => s.id !== pendingStepId),
          ],
        };
      });
    } catch (err) {
      set((state) => ({
        isSimulating: false,
        reasoningSteps: [
          {
            id: `pay-err-${Date.now()}`,
            timestamp: nowTimeLabel(),
            stage: 'PAYPAL_API',
            title: 'Escrow Capture Error',
            detail: err instanceof Error ? err.message : 'Failed to capture deposit',
            status: 'error',
          },
          ...state.reasoningSteps.filter((s) => s.id !== pendingStepId),
        ],
      }));
    }
  },

  runLiveGitHubPrAudit: async (
    targetTaskId?: string,
    customPrUrl?: string,
    simulateRejection = false
  ) => {
    const state = get();
    const taskId = targetTaskId || 'TASK-2';
    const task = state.tasks.find((t) => t.id === taskId) || state.tasks[1];
    const prUrlToAudit = customPrUrl || task.githubPrUrl;
    const summaryBefore = calculateLedgerSummary(state.tasks);

    set({
      isSimulating: true,
      activeScenario: simulateRejection ? 'PR_REJECTED' : 'PR_AUDIT',
      selectedTaskId: task.id,
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, escrowStatus: 'AUDITING', githubPrUrl: prUrlToAudit } : t
      ),
    });

    const stepFetchId = `audit-fetch-${Date.now()}`;
    set((s) => ({
      reasoningSteps: [
        {
          id: stepFetchId,
          timestamp: nowTimeLabel(),
          stage: 'GITHUB_FETCH',
          title: simulateRejection
            ? `Inspecting Vulnerable PR #99 Diff (Security Gate Test)...`
            : `Fetching GitHub PR #${task.prNumber} Diff & Metadata...`,
          detail: `Requesting diff from ${prUrlToAudit} and invoking Gemini 2.5 Flash code auditor with @paypal/agent-toolkit bindings...`,
          status: 'running',
        },
        ...s.reasoningSteps,
      ],
    }));

    try {
      const response = await fetch('/api/audit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          taskName: task.name,
          prUrl: prUrlToAudit,
          prNumber: task.prNumber,
          bountyAmount: task.bountyAmount,
          receiverEmail: task.contractorEmail,
          acceptanceCriteria: task.acceptanceCriteria,
          escrowBalance: summaryBefore.remainingEscrowBalance,
          alreadySettled: false,
          simulateRejection,
        }),
      });

      const result = await response.json();
      const { diffResult, auditReport, guardrail, payoutResult } = result;

      const newSteps: AgentReasoningStep[] = [];

      newSteps.push({
        id: `gh-done-${Date.now()}-1`,
        timestamp: nowTimeLabel(),
        stage: 'GITHUB_FETCH',
        title: `GitHub PR #${diffResult.prNumber} Diff Loaded (+${diffResult.additions} / -${diffResult.deletions}) [${diffResult.source}]`,
        detail: `Fetched "${diffResult.title}" by @${diffResult.author} (${diffResult.changedFilesCount} files changed).`,
        status: 'completed',
        codeSnippet: diffResult.diffText.slice(0, 600) + '\n// ... [diff truncated]',
      });

      newSteps.push({
        id: `gemini-done-${Date.now()}-2`,
        timestamp: nowTimeLabel(),
        stage: 'GEMINI_AUDIT',
        title: `Gemini Code Audit Score: ${auditReport.score}/100 (${
          auditReport.passed ? 'PASSED' : 'REJECTED'
        }) [${auditReport.mode}]`,
        detail: `${auditReport.summary} Security Check: ${auditReport.securityCheck}`,
        status: auditReport.passed ? 'completed' : 'error',
        codeSnippet: JSON.stringify(
          {
            score: auditReport.score,
            passed: auditReport.passed,
            mode: auditReport.mode,
            paypalAgentToolsBound: auditReport.paypalAgentToolsBound,
            criteriaMet: auditReport.criteriaMet,
            securityCheck: auditReport.securityCheck,
          },
          null,
          2
        ),
      });

      newSteps.push({
        id: `guardrail-done-${Date.now()}-3`,
        timestamp: nowTimeLabel(),
        stage: 'ESCROW_GUARDRAIL',
        title: guardrail.canExecutePayout
          ? 'Financial Escrow Guardrail: PASSED'
          : 'Financial Escrow Guardrail: PAYOUT BLOCKED ($400.00 Protected)',
        detail: guardrail.reason,
        status: guardrail.canExecutePayout ? 'completed' : 'error',
      });

      if (payoutResult) {
        newSteps.push({
          id: `payout-done-${Date.now()}-4`,
          timestamp: nowTimeLabel(),
          stage: 'PAYPAL_API',
          title: `PayPal Payout Settled: ${payoutResult.payoutBatchId} ($${payoutResult.amount}) [${payoutResult.mode}]`,
          detail: `POST /v1/payments/payouts succeeded via ${payoutResult.agentToolkitUsed}. Disbursed $${payoutResult.amount} USD to ${payoutResult.receiverEmail}. Gantt task updated to 100% complete and AG Grid row marked PAYOUT_SETTLED.`,
          status: 'completed',
          codeSnippet: JSON.stringify(payoutResult.webhookPayload, null, 2),
        });
      }

      set((s) => {
        const livePayPal = Boolean(
          (payoutResult && payoutResult.isLiveApi) ||
          s.isLivePayPalApi ||
          result.isLivePayPal ||
          result.executionMode === 'LIVE_PAYPAL_SANDBOX'
        );

        return {
          isSimulating: false,
          isLivePayPalApi: livePayPal,
          isLiveGeminiApi: Boolean(auditReport.isLiveGemini || s.isLiveGeminiApi),
          apiModeLabel: livePayPal
            ? 'LIVE PAYPAL SANDBOX'
            : 'SIMULATED FALLBACK',
          expandedRowIds: s.expandedRowIds.includes(task.id)
            ? s.expandedRowIds
            : [task.id, ...s.expandedRowIds],
          latestPayoutReceipt: payoutResult
            ? {
                payoutBatchId: payoutResult.payoutBatchId,
                senderBatchId: payoutResult.senderBatchId,
                taskId: task.id,
                taskName: task.name,
                contractorName: task.contractorName,
                receiverEmail: payoutResult.receiverEmail,
                amount: payoutResult.amount,
                currency: payoutResult.currency,
                auditScore: auditReport.score,
                prUrl: prUrlToAudit,
                processedAt: payoutResult.processedAt,
                sandboxReceiptUrl: payoutResult.sandboxReceiptUrl,
                isLiveApi: payoutResult.isLiveApi,
                mode: payoutResult.mode,
              }
            : s.latestPayoutReceipt,
          tasks: s.tasks.map((t) => {
            if (t.id !== task.id) return t;
            if (payoutResult) {
              return {
                ...t,
                percentDone: 100,
                escrowStatus: 'PAYOUT_SETTLED',
                aiAuditScore: auditReport.score,
                aiAuditPassed: auditReport.passed,
                aiCriteriaMet: auditReport.criteriaMet,
                aiSecurityCheck: auditReport.securityCheck,
                aiAuditSummary: auditReport.summary,
                paypalPayoutBatchId: payoutResult.payoutBatchId,
                paypalSandboxReceiptUrl: payoutResult.sandboxReceiptUrl,
                webhookPayload: payoutResult.webhookPayload,
              };
            }
            return {
              ...t,
              percentDone: 65,
              escrowStatus: s.isDepositLate ? 'UNPAID_LATE' : 'AUDIT_REJECTED',
              aiAuditScore: auditReport.score,
              aiAuditPassed: false,
              aiCriteriaMet: auditReport.criteriaMet,
              aiSecurityCheck: auditReport.securityCheck,
              aiAuditSummary: `${auditReport.summary}`,
              paypalPayoutBatchId: null,
              paypalSandboxReceiptUrl: null,
              webhookPayload: {
                event_type: 'ESCROW.GUARDRAIL.PAYOUT_BLOCKED',
                task_id: task.id,
                audit_score: auditReport.score,
                required_score: 90,
                bounty_protected_usd: task.bountyAmount.toFixed(2),
                security_violation: auditReport.securityCheck,
                timestamp: new Date().toISOString(),
              },
            };
          }),
          reasoningSteps: [
            ...newSteps.reverse(),
            ...s.reasoningSteps.filter((step) => step.id !== stepFetchId),
          ],
        };
      });
    } catch (err) {
      set((s) => ({
        isSimulating: false,
        isLivePayPalApi: s.isLivePayPalApi,
        apiModeLabel: s.isLivePayPalApi ? 'LIVE PAYPAL SANDBOX' : s.apiModeLabel,
        tasks: s.tasks.map((t) =>
          t.id === task.id
            ? { ...t, escrowStatus: s.isDepositLate ? 'UNPAID_LATE' : 'ESCROW_FUNDED' }
            : t
        ),
        reasoningSteps: [
          {
            id: `audit-err-${Date.now()}`,
            timestamp: nowTimeLabel(),
            stage: 'GEMINI_AUDIT',
            title: 'PR Audit Execution Error',
            detail: err instanceof Error ? err.message : 'Unexpected error during PR audit',
            status: 'error',
          },
          ...s.reasoningSteps.filter((step) => step.id !== stepFetchId),
        ],
      }));
    }
  },

  simulateVulnerablePrAudit: async (targetTaskId?: string) => {
    await get().runLiveGitHubPrAudit(targetTaskId || 'TASK-2', undefined, true);
  },

  resetSandboxDemo: () =>
    set((s) => ({
      tasks: INITIAL_MILESTONE_TASKS,
      selectedTaskId: 'TASK-2',
      expandedRowIds: ['TASK-2'],
      isDepositLate: false,
      isSimulating: false,
      activeScenario: 'IDLE',
      reasoningSteps: INITIAL_REASONING_STEPS,
      latestPayoutReceipt: null,
      statusFilter: 'ALL',
      searchQuery: '',
      lookupModalOpen: false,
      lookupResult: null,
      isLivePayPalApi: s.isLivePayPalApi,
      apiModeLabel: s.isLivePayPalApi ? 'LIVE PAYPAL SANDBOX' : 'SIMULATED FALLBACK',
    })),
}));
