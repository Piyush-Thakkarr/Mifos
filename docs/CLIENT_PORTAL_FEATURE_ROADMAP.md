# Client Portal Feature Roadmap

> **Note:** This roadmap focuses on features that can be implemented using Fineract APIs. Payment processing features have been excluded.

## ✅ Currently Implemented Features

1. **Authentication & Dashboard**
   - Client login (username: `client`, password: `password`)
   - Dashboard with profile, loans summary, savings summary, recent transactions
   - View all loans, loan details, EMI schedule
   - Transaction history with filters and downloads
   - Notifications center
   - Support page with contact info and complaint form

2. **Loan Management**
   - View all loans with status
   - View individual loan details
   - Download loan statement (PDF)
   - Download repayment schedule (CSV)

3. **Transactions**
   - View transaction history
   - Filter by type, loan account, search
   - Download filtered statements (CSV)
   - Credit/Debit summary

---

## 🚀 Planned Features

### 1. **Apply for New Loan** ⭐

**Description:** Full loan application workflow using Fineract APIs

- **Frontend:**
  - Multi-step form (Loan Details → Review → Submit)
  - Loan product selection dropdown (fetch from Fineract)
  - Loan amount calculator with EMI preview
  - Application status tracking page
- **Backend:**
  - Fetch available loan products (`GET /loanproducts`)
  - Create loan application via Fineract API (`POST /loans`)
  - Submit to Fineract for approval
- **Integration:**
  - Appears in bank's Mifos dashboard for approval
  - Status updates (Submitted → Pending Approval → Approved/Rejected)
- **Fineract API:**
  - `GET /loanproducts` - Fetch available loan products
  - `POST /loans` - Create loan application
  - `GET /loans/{id}` - Track application status
- **Complexity:** High

---

### 2. **Loan Application Status Tracker**

**Description:** Track loan application lifecycle status (not repayment schedule) - shows where the application is in the approval process

- **Frontend:**
  - Application timeline showing status progression (Submitted → Pending Approval → Approved/Rejected → Disbursed)
  - Status updates with dates from timeline
  - Visual progress indicator showing current stage
  - Display who submitted/approved/disbursed the loan
- **Backend:**
  - Fetch loan application status from Fineract (`GET /loans/{id}`)
  - Parse loan status object (pendingApproval, waitingForDisbursal, active, closed, etc.)
  - Parse timeline object (submittedOnDate, approvedOnDate, rejectedOnDate, actualDisbursementDate, etc.)
  - Return formatted timeline data with status progression
- **Fineract API:**
  - `GET /loans/{id}` - Returns loan with `status` object and `timeline` object containing:
    - Status fields: `pendingApproval`, `waitingForDisbursal`, `active`, `closed`, `code`, `value`
    - Timeline fields: `submittedOnDate`, `submittedByUsername`, `approvedOnDate`, `approvedByUsername`, `rejectedOnDate`, `actualDisbursementDate`, `disbursedByUsername`
- **Complexity:** Low-Medium

---

### 3. **Financial Calculators**

**Description:** Loan and savings calculators to help users understand costs and compare products

- **Frontend:**
  - Loan EMI calculator (amount, tenure, interest rate)
  - Savings maturity calculator
  - Interest calculator
  - Comparison tool (compare loan products from Fineract)
- **Backend:**
  - Fetch loan products for comparison (`GET /loanproducts`)
  - Fetch savings products for comparison (`GET /savingsproducts`)
- **Fineract API:**
  - `GET /loanproducts` - Fetch loan products for comparison
  - `GET /savingsproducts` - Fetch savings products for comparison
- **Complexity:** Low (mostly frontend logic)

---

## 🔗 Fineract API Endpoints Reference

### Loan Management:

- `GET /loanproducts` - Fetch available loan products
- `POST /loans` - Create loan application
- `GET /loans/{id}` - Get loan details
- `GET /loans/{id}?associations=repaymentSchedule` - Get repayment schedule

### Loan Status Tracking:

- `GET /loans/{id}` - Get loan status and details
- `GET /loans/{id}?associations=repaymentSchedule` - Get repayment schedule

### Product Information:

- `GET /loanproducts` - Fetch loan products for calculators
- `GET /savingsproducts` - Fetch savings products for calculators

---

## 📝 Notes

- All features use **only Fineract APIs** - no external dependencies
- **No payment processing features** - This portal focuses on viewing information and submitting applications only
- All features should maintain banking compliance (read-only for sensitive data)
- Consider mobile responsiveness for all new features
- Implement proper error handling and user feedback
- Add loading states and optimistic UI updates
- Test with real Fineract data before deploying
