# Loan Application Form Fields - Design Reference

This document lists all fields required for the "Apply for New Loan" feature in the client portal. Use this for Figma design.

---

## 📋 Form Structure Overview

The loan application form should be organized into **multiple steps/sections**:

1. **Step 1: Loan Product Selection & Basic Details**
2. **Step 2: Loan Terms & Amount**
3. **Step 3: Review & Submit**

---

## Step 1: Loan Product Selection & Basic Details

### 🔴 Required Fields

| Field Name                     | Type                  | Description                         | Notes                                                                    |
| ------------------------------ | --------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **Product Name**               | Dropdown (Searchable) | Select loan product                 | Must fetch from `/loanproducts` API. User must select before proceeding. |
| **Submitted On Date**          | Date Picker           | Date when application is submitted  | Default: Today's date. Cannot be in the past.                            |
| **Expected Disbursement Date** | Date Picker           | Expected date to receive loan funds | Must be >= Submitted On Date. Required.                                  |

### 🟡 Optional Fields (shown after product selection)

| Field Name                       | Type       | Description                | Notes                                                  |
| -------------------------------- | ---------- | -------------------------- | ------------------------------------------------------ |
| **External ID**                  | Text Input | External reference ID      | Optional identifier for client's records               |
| **Loan Officer**                 | Dropdown   | Assign loan officer        | Options fetched from API after product selection       |
| **Loan Purpose**                 | Dropdown   | Purpose of the loan        | Options: Business, Education, Housing, etc. (from API) |
| **Fund**                         | Dropdown   | Source of funds            | Options fetched from API                               |
| **Link Savings Account**         | Dropdown   | Link to savings account    | Shows client's savings accounts. Optional.             |
| **Create Standing Instructions** | Checkbox   | Auto-transfer instructions | Only shown if savings account is linked                |

---

## Step 2: Loan Terms & Amount

### 🔴 Required Fields

| Field Name                      | Type                           | Description                        | Notes                                                                                 |
| ------------------------------- | ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------- |
| **Principal Amount**            | Number Input (Currency)        | Loan amount requested              | Required. Must be within product min/max limits.                                      |
| **Loan Term**                   | Number Input (Auto-calculated) | Total loan duration                | Auto-calculated from: `numberOfRepayments × repaymentEvery`. Display only (disabled). |
| **Loan Term Frequency**         | Dropdown                       | Unit for loan term                 | Options: Days, Weeks, Months, Years. Required.                                        |
| **Number of Repayments**        | Number Input                   | Total number of installments       | Required. User enters this.                                                           |
| **Repaid Every**                | Number Input                   | Frequency number                   | Example: "1" for every 1 month. Required.                                             |
| **Repayment Frequency**         | Dropdown (Auto-filled)         | Frequency unit                     | Usually auto-filled from product. Options: Days, Weeks, Months, Years. Required.      |
| **Interest Rate Per Period**    | Number Input (%)               | Interest rate                      | May be auto-filled from product. Display with % symbol.                               |
| **Interest Rate Frequency**     | Dropdown                       | Frequency for interest calculation | Options: Days, Weeks, Months, Years.                                                  |
| **Interest Method**             | Dropdown                       | How interest is calculated         | Options: Flat, Declining Balance.                                                     |
| **Amortization Type**           | Dropdown                       | How principal is repaid            | Options: Equal Principal Payments, Equal Installments. Required.                      |
| **Interest Calculation Period** | Dropdown                       | When interest is calculated        | Options: Daily, Same as repayment period.                                             |
| **Repayment Strategy**          | Dropdown                       | How repayments are processed       | Options from API. Required.                                                           |

### 🟡 Optional Fields

| Field Name                            | Type         | Description                              | Notes                                           |
| ------------------------------------- | ------------ | ---------------------------------------- | ----------------------------------------------- |
| **First Repayment Date**              | Date Picker  | Override first payment date              | Optional. If not set, calculated automatically. |
| **Interest Charged From Date**        | Date Picker  | When interest starts                     | Optional. If not set, uses disbursement date.   |
| **Fixed EMI Amount**                  | Number Input | Fixed installment amount                 | Only if product allows.                         |
| **Grace on Principal Payment**        | Number Input | Periods before principal payments start  | Number of periods.                              |
| **Grace on Interest Payment**         | Number Input | Periods before interest payments start   | Number of periods.                              |
| **Interest Free Period**              | Number Input | Periods with no interest                 | Number of periods.                              |
| **Arrears Tolerance**                 | Number Input | Amount allowed before marking as overdue | Currency amount.                                |
| **Calculate Interest for Exact Days** | Checkbox     | Use exact days in partial periods        | Only relevant for certain calculation types.    |
| **Link Existing Loan**                | Dropdown     | Link to existing loan (for top-up)       | Only shown if product supports top-up loans.    |
| **Is Top-up Loan**                    | Checkbox     | Mark as top-up loan                      | Only if product supports.                       |

### 📊 Advanced Fields (Conditional - shown based on product settings)

| Field Name                  | Type         | Description                         | When Shown                                                                             |
| --------------------------- | ------------ | ----------------------------------- | -------------------------------------------------------------------------------------- |
| **Multi-Disbursement**      | Checkbox     | Enable multiple disbursements       | If product allows multi-disbursement                                                   |
| **Max Outstanding Balance** | Number Input | Maximum allowed balance             | If multi-disbursement enabled                                                          |
| **Disbursement Schedule**   | Table        | Multiple disbursement dates/amounts | If multi-disbursement enabled. Columns: Date, Amount, Actions (Delete)                 |
| **Collateral**              | Table        | Add collateral items                | If product requires collateral. Columns: Type, Quantity, Total Value, Actions (Delete) |
| **Add Collateral Button**   | Button       | Add new collateral entry            | If product requires collateral                                                         |

---

## Step 3: Review & Submit

### Display Summary

Show a read-only summary of all entered information:

- **Loan Product:** [Product Name]
- **Principal Amount:** [Amount] [Currency]
- **Loan Term:** [Number] [Frequency]
- **Number of Repayments:** [Number]
- **Repayment Frequency:** Every [Number] [Frequency]
- **Interest Rate:** [Rate]% per [Frequency]
- **Expected Disbursement Date:** [Date]
- **Submitted On Date:** [Date]
- **Loan Officer:** [Name] (if selected)
- **Loan Purpose:** [Purpose] (if selected)
- **Repayment Schedule Preview:** (Optional - show first 3-5 installments)

### Actions

- **Back Button** - Go to previous step
- **Submit Application Button** - Submit to Fineract
- **Cancel Button** - Discard and return to dashboard

---

## 🔄 API Data Needed (Fetch from Fineract)

### Before Form Loads:

1. **Loan Products** - `GET /loanproducts`
   - Returns: List of available loan products
   - Fields needed: `id`, `name`, `minPrincipal`, `maxPrincipal`, `currency.code`

### After Product Selection:

2. **Loan Product Template** - `GET /self/loans/template?productId={id}`
   - Returns: Product-specific options and defaults
   - Fields needed:
     - `loanOfficerOptions` - List of loan officers
     - `loanPurposeOptions` - List of loan purposes
     - `fundOptions` - List of funds
     - `accountLinkingOptions` - Client's savings accounts
     - `termFrequencyTypeOptions` - Frequency types (Days, Weeks, Months, Years)
     - `amortizationTypeOptions` - Amortization types
     - `interestTypeOptions` - Interest calculation methods
     - `transactionProcessingStrategyOptions` - Repayment strategies
     - `interestCalculationPeriodTypeOptions` - Interest calculation periods
     - `interestRateFrequencyTypeOptions` - Interest rate frequency
     - `repaymentFrequencyTypeOptions` - Repayment frequency types
     - `collateralOptions` - Available collateral types (if applicable)
     - `currency` - Currency details
     - Default values for interest rate, repayment frequency, etc.

### For Repayment Schedule Preview:

3. **Calculate Schedule** - `POST /self/loans?command=calculateLoanSchedule`
   - Returns: Calculated repayment schedule
   - Use this to show preview in Step 3

---

## 📤 API Payload Structure (What Gets Sent)

When user clicks "Submit Application", send this to `POST /self/loans`:

```json
{
  "clientId": 3, // Auto-filled from logged-in client
  "productId": 1, // Selected product
  "principal": 10000, // Principal amount
  "loanTermFrequency": 12, // Auto-calculated
  "loanTermFrequencyType": 2, // 2 = Months
  "loanType": "individual", // Always "individual" for client portal
  "numberOfRepayments": 12,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2, // 2 = Months
  "interestRatePerPeriod": 12.0,
  "amortizationType": 1, // 1 = Equal installments
  "interestType": 1, // 1 = Declining balance
  "interestCalculationPeriodType": 1, // 1 = Same as repayment period
  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "expectedDisbursementDate": "2024-12-15",
  "submittedOnDate": "2024-12-01",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en",

  // Optional fields (only include if user provided):
  "loanOfficerId": 1,
  "loanPurposeId": 1,
  "fundId": 1,
  "externalId": "EXT-123",
  "linkAccountId": 5,
  "createStandingInstructionAtDisbursement": true,
  "graceOnPrincipalPayment": 0,
  "graceOnInterestPayment": 0,
  "graceOnInterestCharged": 0,
  "allowPartialPeriodInterestCalcualtion": false,
  "fixedEmiAmount": 1000,
  "inArrearsTolerance": 100,
  "repaymentsStartingFromDate": "2024-12-15",
  "interestChargedFromDate": "2024-12-15",

  // Collateral (if added):
  "collateral": [
    {
      "clientCollateralId": 1,
      "quantity": 2
    }
  ],

  // Multi-disbursement (if enabled):
  "disbursementData": [
    {
      "expectedDisbursementDate": "2024-12-15",
      "principal": 5000
    },
    {
      "expectedDisbursementDate": "2025-01-15",
      "principal": 5000
    }
  ]
}
```

---

## 🎨 UI/UX Design Recommendations

### Form Layout:

- **Multi-step wizard** with progress indicator (Step 1 of 3, Step 2 of 3, etc.)
- **Clear section headers** for each group of fields
- **Tooltips/help icons** for complex fields (interest calculation, amortization, etc.)
- **Inline validation** - show errors immediately
- **Auto-calculate** loan term when user enters number of repayments and repayment frequency
- **Conditional fields** - only show relevant fields based on product selection
- **Currency formatting** - show currency symbol and format numbers properly
- **Date pickers** - use calendar widget, prevent invalid dates
- **Dropdown search** - make product selection searchable (many products)

### Visual Hierarchy:

- **Required fields** - mark with asterisk (\*) or "Required" label
- **Optional fields** - mark with "Optional" or lighter text
- **Disabled/auto-calculated fields** - gray out, show lock icon
- **Conditional sections** - use collapsible sections or show/hide based on selections

### Error Handling:

- **Field-level errors** - show below each field
- **Step-level errors** - show at top of step if form invalid
- **API errors** - show user-friendly message, highlight problematic fields
- **Validation messages** - clear, actionable (e.g., "Principal must be between $100 and $10,000")

### Success State:

- **Confirmation page** - after successful submission
- **Application ID** - show the loan application ID
- **Next steps** - "Your application has been submitted. You will be notified once it's reviewed."
- **Link to tracker** - "Track your application status here"

---

## 📱 Mobile Responsiveness

- **Stack fields vertically** on mobile
- **Full-width inputs** on mobile
- **Larger touch targets** for buttons and dropdowns
- **Simplified multi-step** - maybe combine steps on mobile
- **Collapsible sections** for optional/advanced fields

---

## 🔍 Field Validation Rules

### Principal Amount:

- Required
- Must be a positive number
- Must be within product's min/max limits
- Format: Currency with 2 decimal places

### Dates:

- Submitted On Date: Cannot be in the past
- Expected Disbursement Date: Must be >= Submitted On Date
- First Repayment Date: Must be >= Expected Disbursement Date

### Numbers:

- Number of Repayments: Must be > 0, integer
- Repaid Every: Must be > 0, integer
- Interest Rate: Must be >= 0, can have decimals
- Grace periods: Must be >= 0, integer

### Dropdowns:

- Product: Must select before proceeding
- All required dropdowns: Must have a selection

---

## 🚀 Implementation Notes

1. **Client ID** - Auto-fill from logged-in user's session (don't show in form)
2. **Loan Type** - Always "individual" for client portal (don't show in form)
3. **Locale & Date Format** - Use system defaults (don't show in form)
4. **Product Selection** - This is the most important field. Make it prominent and searchable.
5. **Auto-calculations** - Loan term should auto-calculate when user changes number of repayments or repayment frequency
6. **Conditional Logic** - Many fields only appear based on product settings. Fetch product template after selection.
7. **Preview Step** - Show repayment schedule preview in Step 3 (first 5-10 installments)
8. **Error Messages** - Map Fineract API errors to user-friendly messages

---

## 📝 Example User Flow

1. User clicks "Apply for New Loan" from dashboard
2. **Step 1:** User selects loan product from dropdown (searches if needed)
3. Form loads product-specific options (loan officers, purposes, etc.)
4. User fills in basic details (dates, optional fields)
5. User clicks "Next"
6. **Step 2:** User enters principal amount
7. User enters repayment details (number of repayments, frequency)
8. System auto-calculates loan term
9. User adjusts interest/amortization settings (if needed)
10. User adds collateral (if required by product)
11. User clicks "Next"
12. **Step 3:** User reviews all entered information
13. User sees repayment schedule preview
14. User clicks "Submit Application"
15. System shows success message with application ID
16. User is redirected to application tracker page

---

## ✅ Checklist for Design

- [ ] Step 1: Product selection (searchable dropdown)
- [ ] Step 1: Required dates (Submitted On, Expected Disbursement)
- [ ] Step 1: Optional fields section (collapsible?)
- [ ] Step 2: Principal amount input (with currency)
- [ ] Step 2: Loan term section (auto-calculated)
- [ ] Step 2: Repayment details section
- [ ] Step 2: Interest settings section
- [ ] Step 2: Advanced options (collapsible?)
- [ ] Step 2: Collateral table (if applicable)
- [ ] Step 2: Multi-disbursement table (if applicable)
- [ ] Step 3: Review summary (read-only)
- [ ] Step 3: Repayment schedule preview
- [ ] Step 3: Submit button
- [ ] Success confirmation page
- [ ] Error states for all fields
- [ ] Loading states during API calls
- [ ] Mobile responsive layout

---

**Last Updated:** Based on Fineract API v1.8+ and existing Mifos loan creation form
