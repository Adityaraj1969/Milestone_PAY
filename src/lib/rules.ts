/**
 * Pure domain logic for MilestonePay:
 * 1. Loop 1: Payment-Aware Critical Path (Money Controls Time)
 * 2. Loop 2: Financial Escrow Guardrail & Ledger Calculations (Code Controls Money)
 */

export type EscrowStatus =
  | 'ESCROW_FUNDED'
  | 'UNPAID_LATE'
  | 'AWAITING_PR'
  | 'AUDITING'
  | 'PAYOUT_SETTLED'
  | 'AUDIT_REJECTED';

export interface MilestoneTask {
  id: string;
  phase: string;
  name: string;
  contractorName: string;
  contractorEmail: string;
  contractorHandle: string;
  startDate: string; // YYYY-MM-DD
  baseStartDate: string; // Original YYYY-MM-DD before any late deposit shifts
  duration: number; // in days
  percentDone: number;
  dependencies: string[];
  bountyAmount: number;
  isClientDepositPhase?: boolean;
  depositAmount?: number;
  escrowStatus: EscrowStatus;
  invoiceId: string;
  githubPrUrl: string;
  prNumber: number;
  acceptanceCriteria: string[];
  aiAuditScore: number | null;
  aiAuditPassed: boolean | null;
  aiCriteriaMet: string[];
  aiSecurityCheck: string | null;
  aiAuditSummary: string | null;
  paypalPayoutBatchId: string | null;
  paypalSandboxReceiptUrl: string | null;
  webhookPayload: Record<string, unknown> | null;
}

export interface LedgerSummary {
  totalClientDeposit: number;
  clearedEscrowFunds: number;
  disbursedPayouts: number;
  remainingEscrowBalance: number;
  scheduleDelayDays: number;
  projectedDeliveryDate: string;
}

export interface PayoutGuardrailInput {
  auditScore: number;
  minimumRequiredScore?: number;
  escrowBalance: number;
  bountyAmount: number;
  alreadySettled: boolean;
}

export interface PayoutGuardrailResult {
  canExecutePayout: boolean;
  reason: string;
  remainingBalanceAfterPayout: number;
}

/**
 * Adds a specified number of calendar days to an ISO date string (YYYY-MM-DD).
 */
export function addDaysToDate(isoDate: string, daysToShift: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + daysToShift);
  return dt.toISOString().slice(0, 10);
}

/**
 * Calculates end date string (YYYY-MM-DD) given startDate and duration in days.
 */
export function calculateEndDate(startDate: string, duration: number): string {
  return addDaysToDate(startDate, Math.max(0, duration));
}

/**
 * Loop 1: Shifts start dates forward by `delayDays` (default 4) when Phase 1 is marked UNPAID_LATE,
 * or snaps them back to `baseStartDate` when paid/funded.
 */
export function recalculateCriticalPathSchedule(
  tasks: MilestoneTask[],
  isDepositLate: boolean,
  delayDays = 4
): MilestoneTask[] {
  const shift = isDepositLate ? delayDays : 0;
  return tasks.map((task) => {
    const newStart = addDaysToDate(task.baseStartDate, shift);
    if (task.isClientDepositPhase) {
      return {
        ...task,
        startDate: task.baseStartDate, // Deposit milestone sits at Day 0 anchor, or reflects overdue state
        escrowStatus: isDepositLate ? 'UNPAID_LATE' : 'ESCROW_FUNDED',
        percentDone: isDepositLate ? 0 : 100,
      };
    }
    return {
      ...task,
      startDate: newStart,
      escrowStatus: isDepositLate
        ? 'UNPAID_LATE'
        : task.escrowStatus === 'UNPAID_LATE'
        ? 'ESCROW_FUNDED'
        : task.escrowStatus,
    };
  });
}

/**
 * Loop 2: Financial Guardrail evaluation.
 * Checks if AI Audit Score >= 90 AND Escrow Pool has sufficient cleared funds.
 */
export function evaluatePayoutGuardrail(
  input: PayoutGuardrailInput
): PayoutGuardrailResult {
  const threshold = input.minimumRequiredScore ?? 90;

  if (input.alreadySettled) {
    return {
      canExecutePayout: false,
      reason: 'Payout already settled for this task milestone.',
      remainingBalanceAfterPayout: input.escrowBalance,
    };
  }

  if (input.auditScore < threshold) {
    return {
      canExecutePayout: false,
      reason: `AI Code Audit score (${input.auditScore}/100) is below the ${threshold}/100 security & acceptance threshold.`,
      remainingBalanceAfterPayout: input.escrowBalance,
    };
  }

  if (input.escrowBalance < input.bountyAmount) {
    return {
      canExecutePayout: false,
      reason: `Insufficient cleared escrow balance ($${input.escrowBalance.toLocaleString()}) to cover $${input.bountyAmount.toLocaleString()} task bounty. Client deposit must be captured first.`,
      remainingBalanceAfterPayout: input.escrowBalance,
    };
  }

  return {
    canExecutePayout: true,
    reason: `Guardrail passed: Audit Score ${input.auditScore}/100 >= ${threshold} and Cleared Escrow ($${input.escrowBalance}) covers $${input.bountyAmount} bounty.`,
    remainingBalanceAfterPayout: input.escrowBalance - input.bountyAmount,
  };
}

/**
 * Computes real-time financial & schedule totals for the AG Grid Pinned Bottom Row and Top Bar.
 */
export function calculateLedgerSummary(tasks: MilestoneTask[]): LedgerSummary {
  const depositTask = tasks.find((t) => t.isClientDepositPhase);
  const totalClientDeposit = depositTask?.depositAmount ?? 1500;
  const isDepositLate = depositTask?.escrowStatus === 'UNPAID_LATE';
  const clearedEscrowFunds = isDepositLate ? 0 : totalClientDeposit;

  const disbursedPayouts = tasks
    .filter((t) => !t.isClientDepositPhase && t.escrowStatus === 'PAYOUT_SETTLED')
    .reduce((sum, t) => sum + t.bountyAmount, 0);

  const remainingEscrowBalance = Math.max(0, clearedEscrowFunds - disbursedPayouts);
  const scheduleDelayDays = isDepositLate ? 4 : 0;

  // Find latest end date across all tasks
  let latestEnd = '2026-11-04';
  for (const t of tasks) {
    const end = calculateEndDate(t.startDate, t.duration);
    if (end > latestEnd) {
      latestEnd = end;
    }
  }

  return {
    totalClientDeposit,
    clearedEscrowFunds,
    disbursedPayouts,
    remainingEscrowBalance,
    scheduleDelayDays,
    projectedDeliveryDate: latestEnd,
  };
}
