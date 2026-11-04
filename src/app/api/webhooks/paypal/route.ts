/**
 * Single Source of Truth Route Handler for POST /api/webhooks/paypal
 * Validates PayPal asymmetric cryptographic transmission headers:
 * - paypal-transmission-id
 * - paypal-transmission-time
 * - paypal-transmission-sig
 * - paypal-cert-url
 * - paypal-auth-algo
 * Both Express (/server.ts) and Next.js App Router delegate directly to this module.
 */
import { verifyPayPalWebhookSignature } from '../../../../lib/paypal';

export async function handlePayPalWebhookRequest(
  headers: Record<string, string | undefined>,
  eventBody: Record<string, unknown>
) {
  const verification = await verifyPayPalWebhookSignature({
    headers,
    eventBody,
  });

  const eventType = String(eventBody?.event_type || 'PAYMENT.CAPTURE.COMPLETED');
  const eventId = String(eventBody?.id || `WH-${Date.now()}`);

  return {
    httpStatus: verification.verified ? 200 : 400,
    payload: {
      verified: verification.verified,
      verificationStatus: verification.verificationStatus,
      isLiveApi: verification.isLiveApi,
      webhookId: process.env.PAYPAL_WEBHOOK_ID || 'SANDBOX_WEBHOOK_CONFIG',
      eventId,
      eventType,
      cryptographicHeadersChecked: {
        'paypal-transmission-id': verification.transmissionId,
        'paypal-transmission-time': verification.transmissionTime,
        'paypal-cert-url': verification.certUrl,
        'paypal-auth-algo': verification.authAlgo,
        'paypal-transmission-sig': verification.transmissionSigPresent ? 'PRESENT' : 'MISSING',
      },
      reason: verification.reason,
      receivedAt: new Date().toISOString(),
    },
  };
}

export async function POST(request: Request) {
  const eventBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const headers: Record<string, string | undefined> = {
    'paypal-transmission-id': request.headers.get('paypal-transmission-id') ?? undefined,
    'paypal-transmission-time': request.headers.get('paypal-transmission-time') ?? undefined,
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') ?? undefined,
    'paypal-cert-url': request.headers.get('paypal-cert-url') ?? undefined,
    'paypal-auth-algo': request.headers.get('paypal-auth-algo') ?? undefined,
    'x-sandbox-simulator-bypass':
      request.headers.get('x-sandbox-simulator-bypass') ?? undefined,
  };

  const result = await handlePayPalWebhookRequest(headers, eventBody);
  return Response.json(result.payload, { status: result.httpStatus });
}
