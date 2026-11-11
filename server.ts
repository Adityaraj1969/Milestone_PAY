/**
 * Express Full-Stack Server (/server.ts)
 *
 * Delegates directly to the Next.js App Router route handlers under /src/app/api/*
 * so there is zero duplicated API logic between Express and Next.js:
 * - POST /api/escrow/fund           -> delegates to src/app/api/escrow/fund/route.ts
 * - POST /api/audit-and-pay         -> delegates to src/app/api/audit-pr/route.ts
 * - POST /api/audit-pr              -> delegates to src/app/api/audit-pr/route.ts
 * - POST /api/webhooks/paypal       -> delegates to src/app/api/webhooks/paypal/route.ts
 * - GET  /api/paypal/payouts/:id    -> live PayPal Sandbox Payouts / Orders lookup for Receipt Modal
 * - GET  /api/health                -> returns live vs simulated API credential status
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getPayPalAccessToken,
  getPayoutBatchDetails,
  hasRealPayPalCredentials,
  createPayPalAgentToolkitInstance,
} from './src/lib/paypal';
import { hasRealGeminiApiKey } from './src/lib/github-auditor';
import { handleEscrowFundRequest } from './src/app/api/escrow/fund/route';
import { handleAuditPrRequest } from './src/app/api/audit-pr/route';
import { handlePayPalWebhookRequest } from './src/app/api/webhooks/paypal/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health & Live vs Simulated API Mode Telemetry
  app.get('/api/health', async (_req, res) => {
    try {
      const tokenInfo = await getPayPalAccessToken();
      const toolkitInfo = createPayPalAgentToolkitInstance();
      const isLivePayPal = hasRealPayPalCredentials() && tokenInfo.isLiveApi;
      const isLiveGemini = hasRealGeminiApiKey();

      res.json({
        status: 'ok',
        service: 'milestonepay-agent',
        isLivePayPal,
        isLiveGemini,
        paypalMode: tokenInfo.mode,
        fallbackReason: tokenInfo.fallbackReason || null,
        agentToolkitTools: toolkitInfo.enabledTools,
        appId: tokenInfo.app_id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err instanceof Error ? err.message : 'Health check failed',
      });
    }
  });

  // Loop 1: Delegates directly to src/app/api/escrow/fund/route.ts
  app.post('/api/escrow/fund', async (req, res) => {
    try {
      const result = await handleEscrowFundRequest(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fund escrow deposit',
      });
    }
  });

  // Loop 2: Delegates directly to src/app/api/audit-pr/route.ts
  const auditRouteDelegate: express.RequestHandler = async (req, res) => {
    try {
      const result = await handleAuditPrRequest(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Audit and payout pipeline failed',
      });
    }
  };

  app.post('/api/audit-and-pay', auditRouteDelegate);
  app.post('/api/audit-pr', auditRouteDelegate);

  // Live PayPal Sandbox Payouts / Order Lookup for the in-app Verified Receipt Modal
  app.get('/api/paypal/payouts/:batchId', async (req, res) => {
    try {
      const batchId = req.params.batchId;
      const lookup = await getPayoutBatchDetails(batchId);
      res.json({
        success: true,
        lookup,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to look up PayPal batch',
      });
    }
  });

  // PayPal Sandbox Webhook Receiver: Delegates directly to src/app/api/webhooks/paypal/route.ts
  app.post('/api/webhooks/paypal', async (req, res) => {
    try {
      const headers: Record<string, string | undefined> = {
        'paypal-transmission-id': req.header('paypal-transmission-id'),
        'paypal-transmission-time': req.header('paypal-transmission-time'),
        'paypal-transmission-sig': req.header('paypal-transmission-sig'),
        'paypal-cert-url': req.header('paypal-cert-url'),
        'paypal-auth-algo': req.header('paypal-auth-algo'),
        'x-sandbox-simulator-bypass': req.header('x-sandbox-simulator-bypass'),
      };
      const result = await handlePayPalWebhookRequest(headers, req.body || {});
      res.status(result.httpStatus).json(result.payload);
    } catch (err) {
      res.status(500).json({
        verified: false,
        error: err instanceof Error ? err.message : 'Webhook verification error',
      });
    }
  });

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    process.argv.includes('--production');

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MilestonePay Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
