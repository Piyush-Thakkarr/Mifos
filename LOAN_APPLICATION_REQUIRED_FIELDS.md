# Loan Application - Required Fields by Fineract API

Based on Fineract API documentation (`POST /self/loans` endpoint), here are the **MANDATORY fields** that users must provide:

## 🔴 Required Fields (User Must Fill or Auto-Filled)

**Note:** Some fields are auto-filled from the selected loan product (set by bank/MFI) and cannot be edited by clients.

### Step 1: Basic Details

1. **Product Name** (`productId`) - Dropdown selection
2. **Submitted On Date** (`submittedOnDate`) - Date picker
3. **Expected Disbursement Date** (`expectedDisbursementDate`) - Date picker

### Step 2: Loan Terms

4. **Principal Amount** (`principal`) - Currency input
5. **Number of Repayments** (`numberOfRepayments`) - Number input
6. **Repaid Every** (`repaymentEvery`) - Number input (e.g., "1" for every 1 month)
7. **Repayment Frequency** (`repaymentFrequencyType`) - Dropdown (Days, Weeks, Months, Years)
8. **Loan Term Frequency** (`loanTermFrequencyType`) - Dropdown (Days, Weeks, Months, Years)
9. **Interest Rate Per Period** (`interestRatePerPeriod`) - **READ-ONLY/DISABLED** - Auto-filled from selected loan product (set by bank/MFI, clients cannot edit)
10. **Interest Method** (`interestType`) - Dropdown (Flat, Declining Balance) - May be disabled if product doesn't allow override
11. **Amortization Type** (`amortizationType`) - Dropdown (Equal Principal Payments, Equal Installments) - May be disabled if product doesn't allow override
12. **Interest Calculation Period** (`interestCalculationPeriodType`) - Dropdown (Daily, Same as repayment period) - May be disabled if product doesn't allow override
13. **Repayment Strategy** (`transactionProcessingStrategyCode`) - Dropdown (from API) - May be disabled if product doesn't allow override

### Auto-Filled/Calculated (Not User Input)

- **Loan Term** (`loanTermFrequency`) - Auto-calculated from `numberOfRepayments × repaymentEvery` (display only, disabled)
- **Client ID** (`clientId`) - Auto-filled from logged-in user (hidden)
- **Loan Type** (`loanType`) - Always "individual" for client portal (hidden)

## 📝 Notes

- **Loan Term** is calculated automatically, so it should be displayed as read-only/disabled
- **Client ID** and **Loan Type** are handled by the backend, not shown to user
- **Interest Rate Per Period** is set by the bank/MFI in the loan product configuration. Clients CANNOT edit this - it should be auto-filled from the selected product and displayed as read-only/disabled
- **Interest Method, Amortization Type, Interest Calculation Period, Repayment Strategy** may be editable or disabled depending on the product's `allowAttributeOverrides` settings. If disabled by product, show as read-only
- All other fields listed above are **REQUIRED** and must be filled by the user (unless disabled by product settings)

## 🟡 Optional Fields (Can be skipped)

- External ID
- Loan Officer
- Loan Purpose
- Fund
- Link Savings Account
- Create Standing Instructions
- First Repayment Date
- Interest Charged From Date
- Fixed EMI Amount
- Grace periods (Principal, Interest, Interest Free)
- Arrears Tolerance
- Collateral (unless product requires it)
- Multi-Disbursement (unless product allows it)

## ⚠️ Conditional Required Fields

These become required only in specific scenarios:

1. **Recalculation Rest Frequency Date** - Only if product has interest recalculation enabled AND rest frequency ≠ repayment period
2. **Recalculation Compounding Frequency Date** - Only if product has interest recalculation with compounding enabled AND compounding frequency ≠ repayment period
3. **Datatables** - Only if Entity-Datatable Check is enabled for loans

These are edge cases and can be handled dynamically based on the selected product's configuration.
