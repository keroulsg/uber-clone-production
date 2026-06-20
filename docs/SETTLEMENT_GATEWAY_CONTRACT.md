# Settlement Gateway Contract

## Current Manual Flow (MVP)

```
Driver submits settlement request
         │
         ▼
Status: pending
         │
         ▼
Admin reviews & approves/rejects
         │
         ├── Approved → DriverDebt paid_at set, debt cleared
         └── Rejected  → Reason recorded, debt unchanged
```

## Future Gateway Adapter Design

### Status Flow with Gateway Verification

```
Driver submits settlement (online payment)
         │
         ▼
Status: awaiting_verification
         │
         ▼
Payment gateway processes payment
         │
         ├── Success → Webhook received → Status: approved → Debts cleared
         │
         └── Failure → Webhook received → Status: failed → Debt unchanged
         │
         └── Manual review → Admin reviews → Status: approved/rejected
```

### Settlement Status Definitions

| Status | Description |
|--------|-------------|
| `pending` | Manual settlement awaiting admin review |
| `awaiting_verification` | Online payment sent, awaiting gateway/webhook confirmation |
| `approved` | Settlement confirmed, debts marked paid |
| `rejected` | Settlement rejected by admin, debts unchanged |
| `failed` | Gateway payment failed or declined |
| `cancelled` | Driver cancelled the request |

### Provider Reference Fields

| Field | Type | Purpose |
|-------|------|---------|
| `provider` | string | e.g. `instapay`, `vodafone_cash`, `bank_transfer`, `card` |
| `provider_reference` | string | Transaction reference from gateway |
| `provider_transaction_id` | string | Unique transaction ID from gateway |
| `verification_status` | string | Current gateway verification status |
| `verified_at` | timestamp | When gateway confirmed the transaction |
| `webhook_payload` | JSON (nullable) | Full webhook payload for debugging |
| `gateway_fee` | decimal (nullable) | Fee charged by gateway |
| `net_amount` | decimal (nullable) | Amount after gateway fee |

### Webhook Expectations

Webhook endpoint (future): `POST /api/v1/settlements/webhook`

Payload example:
```json
{
  "provider": "vodafone_cash",
  "provider_transaction_id": "VCF123456",
  "status": "success",
  "amount": 150.00,
  "gateway_fee": 1.50,
  "net_amount": 148.50,
  "signature": "hmac_sha256_signature"
}
```

Security:
- Webhook endpoint validates HMAC signature using provider's shared secret
- Only updates `awaiting_verification` settlements
- Cannot approve/reject settlements directly — only transitions:
  - `awaiting_verification` → `approved` (on success)
  - `awaiting_verification` → `failed` (on failure)

### Adapter Interface (Conceptual)

```php
interface SettlementGatewayAdapter {
    public function name(): string;
    public function process(float $amount, array $metadata): SettlementResult;
    public function verify(string $transactionId): VerificationResult;
    public function handleWebhook(array $payload): WebhookResult;
}
```

Each gateway implements this adapter:
- `InstapayAdapter`
- `VodafoneCashAdapter`
- `BankTransferAdapter`
- `CardGatewayAdapter`
- `FawryAdapter`
- `PaymobAdapter`

### Approval Rules

| Role | Can Create | Can Approve | Can Reject |
|------|-----------|-------------|------------|
| Driver | ✅ Own only | ❌ | ❌ |
| Admin | ❌ | ✅ | ✅ |
| Gateway (webhook) | ❌ | ✅ (awaiting_verification only) | ❌ |

### Security Rules

1. Drivers can only create settlements for themselves (enforced by `auth:api` + `driver_id` from token)
2. Amount cannot exceed outstanding debt (validated in `DriverSettlementController@store`)
3. Non-cash methods require a reference number
4. Approval/rejection only by admin (enforced by `auth:api` + admin middleware)
5. Approved settlements cannot be edited
6. Rejected settlements do not mark debts as paid
7. Provider fields (`provider`, `provider_reference`, `provider_transaction_id`, `webhook_payload`) are not user-editable from frontend
8. All actions are timestamped (`reviewed_by`, `reviewed_at`)

### Database

See `driver_settlements` table migration for the complete schema.

### No Gateway Integration Now

All gateway adapters are **future work**. The current MVP supports only:
- Manual cash submission to admin
- Electronic reference submission (Instapay, Vodafone Cash, Bank Transfer, Card, Other)
- All submitted as `pending` status
- Admin manually approves/rejects
