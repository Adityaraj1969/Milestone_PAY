# APIMatic Context Plugin Setup & Verification Notes

## Overview
MilestonePay uses the official **APIMatic PayPal Context Plugin** (`npx context-plugins install paypal`) to ground all PayPal REST API integrations in verified OpenAPI 3.0 schemas and TypeScript SDK patterns.

## Installation Command Executed
```bash
npx context-plugins install paypal
```

## Verified OpenAPI Endpoints & Schemas Applied in `/src/lib/paypal.ts`

### 1. OAuth 2.0 Client Credentials Grant
- **Endpoint**: `POST https://api-m.sandbox.paypal.com/v1/oauth2/token`
- **Headers**:
  - `Authorization: Basic <base64(PAYPAL_CLIENT_ID:PAYPAL_CLIENT_SECRET)>`
  - `Content-Type: application/x-www-form-urlencoded`
- **Body**: `grant_type=client_credentials`
- **Response Schema**:
  ```json
  {
    "scope": "https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/payments/payouts",
    "access_token": "A21AA...",
    "token_type": "Bearer",
    "app_id": "APP-80W284485P519543T",
    "expires_in": 32400
  }
  ```

### 2. Orders v2 / Escrow Deposit Capture (`@paypal/agent-toolkit` & Orders API)
- **Create Order Endpoint**: `POST https://api-m.sandbox.paypal.com/v2/checkout/orders`
- **Capture Order Endpoint**: `POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{id}/capture`
- **Schema Pattern**:
  ```json
  {
    "intent": "CAPTURE",
    "purchase_units": [
      {
        "reference_id": "PHASE_1_ESCROW_DEPOSIT",
        "description": "MilestonePay Client Escrow Deposit — Q4 Core API Architecture",
        "amount": {
          "currency_code": "USD",
          "value": "1500.00"
        }
      }
    ]
  }
  ```

### 3. Automated Contractor Payouts (`POST /v1/payments/payouts`)
- **Endpoint**: `POST https://api-m.sandbox.paypal.com/v1/payments/payouts`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
  - `PayPal-Request-Id: <idempotency_key>`
- **Verified Request Payload**:
  ```json
  {
    "sender_batch_header": {
      "sender_batch_id": "MPAY_TASK_2_PR_1_1730724000",
      "email_subject": "MilestonePay Automated Bounty Payout — PR #1 Passed AI Audit!",
      "email_message": "Your GitHub Pull Request passed the Gemini 2.5 Flash code audit (Score: 96/100). Your escrow bounty has been released."
    },
    "items": [
      {
        "recipient_type": "EMAIL",
        "amount": {
          "value": "400.00",
          "currency": "USD"
        },
        "note": "Automated payout for Task #2 (Build Rate-Limiting Middleware) — GitHub PR #1",
        "sender_item_id": "TASK_2_PR_1",
        "receiver": "contractor-dev@personal.example.com"
      }
    ]
  }
  ```

### 4. Webhook Signature Verification & Event Payload (`POST /api/webhooks/paypal`)
- **Supported Events**:
  - `INVOICING.INVOICE.PAID`
  - `CHECKOUT.ORDER.APPROVED`
  - `PAYMENT.CAPTURE.COMPLETED`
  - `PAYMENT.PAYOUTS-ITEM.SUCCEEDED`
- **Verification Endpoint**: `POST https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature`
