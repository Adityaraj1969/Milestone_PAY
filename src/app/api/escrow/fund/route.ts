/**
 * Single Source of Truth Route Handler for POST /api/escrow/fund
 * Both Express (/server.ts) and Next.js App Router execute this exact module.
 */
import { createAndFundDepositOrder } from '../../../../lib/paypal';

export async function handleEscrowFundRequest(body: Record<string, unknown>) {
  const amount = Number(body?.amount) || 1500;
  const deposit = await createAndFundDepositOrder(amount);
  return {
    success: true,
    isLiveApi: deposit.isLiveApi,
    mode: deposit.mode,
    fallbackReason: deposit.fallbackReason,
    deposit,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await handleEscrowFundRequest(body);
  return Response.json(result);
}
