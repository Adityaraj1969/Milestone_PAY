/**
 * Single Source of Truth Route Handler for POST /api/audit-pr and POST /api/audit-and-pay
 * Fetches GitHub PR diff -> Gemini 2.5 Flash structured JSON -> Financial Guardrail -> PayPal Payout
 * Both Express (/server.ts) and Next.js App Router delegate directly to this module.
 */
import {
  fetchGitHubPullRequestDiff,
  auditPullRequestWithGemini,
} from '../../../lib/github-auditor';
import { executeContractorPayout, hasRealPayPalCredentials } from '../../../lib/paypal';
import { evaluatePayoutGuardrail } from '../../../lib/rules';

export async function handleAuditPrRequest(body: Record<string, unknown>) {
  const {
    taskId = 'TASK-2',
    taskName = 'Build Rate-Limiting Middleware & Redis Token Bucket',
    prUrl = 'https://github.com/express-rate-limit/express-rate-limit/pull/1',
    prNumber = 1,
    bountyAmount = 400,
    receiverEmail = 'contractor-dev@personal.example.com',
    acceptanceCriteria = [
      'Implement token bucket rate-limiting middleware',
      'Return HTTP 429 Too Many Requests with Retry-After header',
      'Zero hardcoded secrets or header spoofing flaws',
    ],
    escrowBalance = 1500,
    alreadySettled = false,
    simulateRejection = false,
  } = body || {};

  // 1. Fetch real GitHub PR diff (or vulnerable diff when simulateRejection is true)
  const diffResult = await fetchGitHubPullRequestDiff(
    String(prUrl),
    Boolean(simulateRejection)
  );

  // 2. Evaluate diff with Gemini structured JSON output + @paypal/agent-toolkit bindings
  const auditReport = await auditPullRequestWithGemini({
    taskName: String(taskName),
    acceptanceCriteria: Array.isArray(acceptanceCriteria)
      ? acceptanceCriteria.map(String)
      : [],
    diffResult,
    simulateRejection: Boolean(simulateRejection),
  });

  // 3. Evaluate Financial Escrow Guardrail (Score >= 90 && Escrow Balance >= Bounty)
  const guardrail = evaluatePayoutGuardrail({
    auditScore: auditReport.score,
    minimumRequiredScore: 90,
    escrowBalance: Number(escrowBalance),
    bountyAmount: Number(bountyAmount),
    alreadySettled: Boolean(alreadySettled),
  });

  // 4. If Guardrail passes, immediately trigger PayPal Sandbox Payout
  let payoutResult = null;
  if (guardrail.canExecutePayout) {
    payoutResult = await executeContractorPayout(
      String(receiverEmail),
      Number(bountyAmount),
      String(taskId),
      Number(prNumber) || diffResult.prNumber
    );
  }

  const livePayPalConfigured = hasRealPayPalCredentials();
  const isLivePayPal = payoutResult ? payoutResult.isLiveApi : livePayPalConfigured;

  return {
    success: true,
    taskId: String(taskId),
    isLivePayPal,
    isLiveGemini: auditReport.isLiveGemini,
    isLiveGitHub: diffResult.isLiveGitHub,
    executionMode: isLivePayPal ? 'LIVE_PAYPAL_SANDBOX' : 'SIMULATED_FALLBACK',
    diffResult,
    auditReport,
    guardrail,
    payoutResult,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await handleAuditPrRequest(body);
  return Response.json(result);
}
