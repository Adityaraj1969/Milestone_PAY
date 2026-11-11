/**
 * PayPal Status Endpoint (/src/app/api/paypal/status/route.ts)
 * Reports real-time credentials configuration and sandbox API connectivity.
 */
import { getPayPalAccessToken, hasRealPayPalCredentials } from '../../../../lib/paypal';

export async function GET() {
  try {
    const tokenInfo = await getPayPalAccessToken();
    const isLivePayPal = hasRealPayPalCredentials() && tokenInfo.isLiveApi;
    return Response.json({
      configured: hasRealPayPalCredentials(),
      isLivePayPal,
      mode: tokenInfo.mode,
      executionMode: isLivePayPal ? 'LIVE_PAYPAL_SANDBOX' : 'SIMULATED_FALLBACK',
      appId: tokenInfo.app_id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        configured: false,
        isLivePayPal: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
