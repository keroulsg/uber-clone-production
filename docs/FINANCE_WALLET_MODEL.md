# Finance & Wallet Model

## A) Wallet Ride

```
Rider Wallet  ──deduct──>  Platform Wallet  ──credit──>  Driver Wallet
                                     │
                                     ├── Commission (platform keeps)
                                     └── Driver payout (credited to driver wallet)
```

- Rider pays total fare from their wallet.
- Platform/company collects the full fare.
- Driver payout (total fare − commission) is credited to the driver's wallet.
- Platform keeps the commission.
- **No DriverDebt record** created for wallet rides — the commission is collected upfront.
- `Payment.driver_amount` = driver payout (recorded for earnings queries).

## B) Cash Ride

```
Rider ──cash──> Driver (collects full fare directly)
                 │
                 ├── Keeps: total fare − commission
                 └── Owes: commission to platform (as DriverDebt)
```

- Rider pays driver directly in cash (no wallet movement).
- Driver keeps the fare minus commission.
- Commission is recorded as a **DriverDebt** record (type: `commission`).
- `Payment.driver_amount` = driver's earnings (total fare − commission).
- Commission debt is unpaid until the driver settles with the company.

## C) Cash Overpayment + Change Credit

Example:
- Fare: EGP 80
- Rider pays cash: EGP 100
- Change due: EGP 20

### If driver can return the change:
- Driver gives EGP 20 back to rider.
- Only commission debt recorded.
- No wallet movement.

### If driver cannot return the change (credit change):
```
Rider Wallet ──credit──> +20 (change credit)
Driver ──debt──> +20 cash_change_liability (owes company)
```

- Rider wallet is **credited** EGP 20.
- Driver gets a **DriverDebt** (type: `cash_change_liability`) for EGP 20.
- Commission is still calculated on the original fare (EGP 80), not the cash received.
- Driver's total company dues = commission debt + cash change liability.

## D) Failed Wallet Payment

- Driver clicks Complete, but rider has insufficient wallet balance.
- `PaymentService` checks balance before completion.
- If insufficient:
  - Payment status set to `failed`.
  - **No amount deducted** from rider wallet.
  - **No driver earning** posted.
  - **No commission** created.
  - **No DriverDebt** created.
  - Ride **remains in `ride_started` status** — driver can retry after top-up.
  - Rider gets an insufficient-balance error message.
  - Frontend shows: "Rider must top up their wallet."

## E) DriverDebt Types

| type | Description |
|------|-------------|
| `commission` | Commission owed for a cash ride |
| `cash_change_liability` | Change amount driver couldn't return, credited to rider |

## F) Ledger Entry Types

| type | Description |
|------|-------------|
| `credit` | Wallet top-up or driver earnings credit |
| `debit` | Rider wallet payment for a ride |
| `cash_payment` | Record of a cash ride (no wallet movement) |
| `cash_change_credit` | Change credit to rider wallet |
| `commission_debt` | Record of commission debt creation |

## G) Wallet Transactions Visibility

- `Wallet->transactions()` returns only `LedgerEntry` records where type is `credit` or `debit`.
- Cash ride entries (type `cash_payment`) and commission debt entries (type `commission_debt`) are **excluded** from wallet transaction lists.
- This ensures the rider wallet ledger shows only real wallet movements.

## H) Earnings Queries

- `DriverController@earnings()` and `@performance()` filter payments by `status = completed`.
- `driver_amount` is summed — represents what the driver earned (total fare − commission).
- `driver_amount` is set for ALL payment methods (cash and wallet).
- Failed payments are excluded from earnings.
- Cancelled rides have no payment record, so they are excluded automatically.
