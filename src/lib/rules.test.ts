import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToDate,
  calculateEndDate,
  recalculateCriticalPathSchedule,
  evaluatePayoutGuardrail,
  calculateLedgerSummary,
  MilestoneTask,
} from './rules';

const mockTasks: MilestoneTask[] = [
  {
    id: 'TASK-1',
    phase: 'Phase 1: Escrow & Architecture',
    name: 'Client Escrow Deposit & Spec Sign-Off',
    contractorName: 'Client Sponsor (Buyer)',
    contractorEmail: 'client-buyer@business.example.com',
    contractorHandle: '@acme-corp',
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
    acceptanceCriteria: ['Fund $1,500 PayPal Escrow Deposit'],
    aiAuditScore: 100,
    aiAuditPassed: true,
    aiCriteriaMet: ['Fund $1,500 PayPal Escrow Deposit'],
    aiSecurityCheck: 'Verified PayPal Sandbox Order Capture.',
    aiAuditSummary: 'Escrow funded.',
    paypalPayoutBatchId: null,
    paypalSandboxReceiptUrl: 'https://www.sandbox.paypal.com/activity/payment/CAPTURE-8891204',
    webhookPayload: { event_type: 'PAYMENT.CAPTURE.COMPLETED' },
  },
  {
    id: 'TASK-2',
    phase: 'Phase 2: Core Engineering',
    name: 'Build Rate-Limiting Middleware & Redis Token Bucket',
    contractorName: 'Alex Rivera',
    contractorEmail: 'contractor-dev@personal.example.com',
    contractorHandle: '@arivera-dev',
    startDate: '2026-11-06',
    baseStartDate: '2026-11-06',
    duration: 4,
    percentDone: 55,
    dependencies: ['TASK-1'],
    bountyAmount: 400,
    escrowStatus: 'ESCROW_FUNDED',
    invoiceId: 'INV2-Z89A-4412-9012-3381',
    githubPrUrl: 'https://github.com/express-rate-limit/express-rate-limit/pull/1',
    prNumber: 1,
    acceptanceCriteria: [
      'Implement sliding window or token bucket rate limiter middleware',
      'Return HTTP 429 Too Many Requests with Retry-After header',
      'No hardcoded credentials or unvalidated header injection',
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

test('addDaysToDate shifts ISO dates accurately', () => {
  assert.equal(addDaysToDate('2026-11-06', 4), '2026-11-10');
  assert.equal(addDaysToDate('2026-11-06', 0), '2026-11-06');
  assert.equal(calculateEndDate('2026-11-10', 4), '2026-11-14');
});

test('Loop 1: recalculateCriticalPathSchedule shifts dependent tasks +4 days when late and snaps back when paid', () => {
  const delayed = recalculateCriticalPathSchedule(mockTasks, true, 4);
  assert.equal(delayed[0].escrowStatus, 'UNPAID_LATE');
  assert.equal(delayed[1].startDate, '2026-11-10');
  assert.equal(delayed[1].escrowStatus, 'UNPAID_LATE');

  const summaryLate = calculateLedgerSummary(delayed);
  assert.equal(summaryLate.clearedEscrowFunds, 0);
  assert.equal(summaryLate.scheduleDelayDays, 4);
  assert.equal(summaryLate.projectedDeliveryDate, '2026-11-14');

  const restored = recalculateCriticalPathSchedule(delayed, false, 4);
  assert.equal(restored[0].escrowStatus, 'ESCROW_FUNDED');
  assert.equal(restored[1].startDate, '2026-11-06');
  assert.equal(restored[1].escrowStatus, 'ESCROW_FUNDED');

  const summaryRestored = calculateLedgerSummary(restored);
  assert.equal(summaryRestored.clearedEscrowFunds, 1500);
  assert.equal(summaryRestored.scheduleDelayDays, 0);
  assert.equal(summaryRestored.projectedDeliveryDate, '2026-11-10');
});

test('Loop 2: evaluatePayoutGuardrail enforces score >= 90 and sufficient escrow balance', () => {
  // High score + funded escrow -> Passes
  const passResult = evaluatePayoutGuardrail({
    auditScore: 96,
    escrowBalance: 1500,
    bountyAmount: 400,
    alreadySettled: false,
  });
  assert.equal(passResult.canExecutePayout, true);
  assert.equal(passResult.remainingBalanceAfterPayout, 1100);

  // Low score -> Blocked
  const lowScoreResult = evaluatePayoutGuardrail({
    auditScore: 78,
    escrowBalance: 1500,
    bountyAmount: 400,
    alreadySettled: false,
  });
  assert.equal(lowScoreResult.canExecutePayout, false);
  assert.equal(lowScoreResult.remainingBalanceAfterPayout, 1500);

  // Unfunded escrow (Late client deposit) -> Blocked even with 95 score
  const unfundedResult = evaluatePayoutGuardrail({
    auditScore: 95,
    escrowBalance: 0,
    bountyAmount: 400,
    alreadySettled: false,
  });
  assert.equal(unfundedResult.canExecutePayout, false);
});

test('PayPal Webhook Signature Verification rejects missing headers and accepts signed headers', async () => {
  const { verifyPayPalWebhookSignature, createPayPalAgentToolkitInstance } = await import('./paypal');

  // Missing transmission headers without simulator bypass -> rejected
  const rejected = await verifyPayPalWebhookSignature({
    headers: {},
    eventBody: { event_type: 'PAYMENT.CAPTURE.COMPLETED' },
  });
  assert.equal(rejected.verified, false);
  assert.equal(rejected.verificationStatus, 'FAILURE');

  // Signed PayPal transmission headers -> verified
  const accepted = await verifyPayPalWebhookSignature({
    headers: {
      'paypal-transmission-id': 'TX-12345',
      'paypal-transmission-time': '2026-11-04T08:00:00Z',
      'paypal-transmission-sig': 'SIG-RSA-SHA256',
      'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123',
      'paypal-auth-algo': 'SHA256withRSA',
    },
    eventBody: { event_type: 'PAYMENT.CAPTURE.COMPLETED' },
  });
  assert.equal(accepted.verified, true);

  // @paypal/agent-toolkit configuration lists expected commerce tools
  const toolkitInfo = createPayPalAgentToolkitInstance();
  assert.equal(toolkitInfo.enabledTools.includes('payouts.create'), true);
  assert.equal(toolkitInfo.enabledTools.includes('orders.capture'), true);
});

