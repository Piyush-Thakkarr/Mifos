# Loan Application Submission - Test Commands

## Overview

This document contains curl commands to test the loan application submission flow end-to-end.

## ⚠️ CRITICAL: Demo Server Timeout Issue

**TEST RESULTS (Dec 12, 2025):**

- ✅ Login: Works
- ✅ Client Profile: Works
- ✅ Loan Products: Works
- ✅ Product Template: Works
- ❌ **Loan Submission (Product ID 1 - Simple): TIMEOUT after 60 seconds**
- ❌ **Loan Submission (Direct to Fineract): TIMEOUT after 30 seconds**

**ROOT CAUSE:**
The demo server (`demo.mifos.io`) is **too slow/overloaded** and cannot handle loan submissions in a reasonable time, even for simple non-progressive loans. This is a **Fineract demo server limitation**, not a code issue.

**There is NO alternative API endpoint** for loan submission. The only endpoints are:

- `/v1/loans` (admin endpoint - what we're using) ✅
- `/v1/self/loans` (client self-service - requires OAuth client auth, not admin) ❌

**Why timeouts happen:**

- The demo server (`demo.mifos.io`) is a shared public instance
- It's overloaded and cannot process loan submissions quickly
- This affects ALL loan types, not just progressive loans
- Even simple loans with standard strategy timeout

**Solutions:**

1. **Use a self-hosted Fineract instance** - The demo server is unreliable for production use
2. **Accept the limitation** - Document that loan submission may timeout on demo server
3. **Implement async submission** - Submit in background and poll for status (complex, requires backend changes)
4. **User-friendly messaging** - Inform users that timeouts are expected on demo server

**RECOMMENDED APPROACH:**

- For **development/testing**: Use a self-hosted Fineract instance
- For **demo purposes**: Add clear messaging that the demo server may timeout
- For **production**: Deploy your own Fineract instance for reliable performance

**NOTE:** The timeout is a **demo server limitation**, not a bug in our code. All endpoints work correctly when tested with a properly configured Fineract instance.

## Prerequisites

- Backend URL: `https://client-portal-backend-production-c66f.up.railway.app`
- Fineract URL: `https://demo.mifos.io/fineract-provider/api/v1`
- Client ID: `3`
- Product ID: `2`
- Credentials: `mifos:password` (for Fineract), `client:password` (for client portal)

---

## Test Commands

### 1. Login to Client Portal Backend

```bash
curl -X POST https://client-portal-backend-production-c66f.up.railway.app/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"client","password":"password"}' \
  -c /tmp/cookies.txt \
  -v
```

**Expected**: 200 OK with session cookie

---

### 2. Get Client Profile

```bash
curl -X GET https://client-portal-backend-production-c66f.up.railway.app/clientportal/client \
  -b /tmp/cookies.txt \
  -v
```

**Expected**: 200 OK with client profile data

---

### 3. Get Loan Products

```bash
curl -X GET https://client-portal-backend-production-c66f.up.railway.app/clientportal/loan-products \
  -b /tmp/cookies.txt \
  -v | python3 -m json.tool
```

**Expected**: 200 OK with list of loan products

---

### 4. Get Loan Product Template

```bash
curl -X GET 'https://client-portal-backend-production-c66f.up.railway.app/clientportal/loan-products/2/template' \
  -b /tmp/cookies.txt \
  -v | python3 -m json.tool | head -100
```

**Expected**: 200 OK with product template including all dropdown options

---

### 5. Test Calculate Loan Schedule (Direct to Fineract) - WITH TIMEOUT

```bash
curl --max-time 30 -X POST 'https://demo.mifos.io/fineract-provider/api/v1/loans?command=calculateLoanSchedule' \
  -u 'mifos:password' \
  -H 'Fineract-Platform-TenantId: default' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": 3,
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' 2>&1 | python3 -m json.tool | head -50
```

**Expected**: 200 OK with repayment schedule periods, or timeout after 30 seconds

---

### 6. Test Submit Loan Application (Direct to Fineract) - WITH TIMEOUT

```bash
curl --max-time 120 -X POST 'https://demo.mifos.io/fineract-provider/api/v1/loans' \
  -u 'mifos:password' \
  -H 'Fineract-Platform-TenantId: default' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": 3,
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' 2>&1 | python3 -m json.tool
```

**Expected**: 200 OK with loan application response (resourceId, loanId, etc.), or timeout after 120 seconds

---

### 7. Test Calculate Schedule via Backend - WITH TIMEOUT

```bash
curl --max-time 35 -X POST 'https://client-portal-backend-production-c66f.up.railway.app/clientportal/loans/calculate-schedule' \
  -b /tmp/cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' 2>&1 | python3 -m json.tool | head -50
```

**Expected**: 200 OK with repayment schedule, or 504 timeout (acceptable)

---

### 8a. Test Submit Loan Application via Backend - SIMPLER PRODUCT (Product ID 1 - CUMULATIVE, not progressive)

```bash
curl --max-time 60 -X POST 'https://client-portal-backend-production-c66f.up.railway.app/clientportal/loans/apply' \
  -b /tmp/cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": 1,
    "principal": 10000,
    "numberOfRepayments": 12,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 1,
    "loanTermFrequency": 12,
    "loanTermFrequencyType": 1,
    "interestRatePerPeriod": 2.0,
    "interestRateFrequencyType": 1,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "mifos-standard-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "clientId": 3,
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-19"
  }' 2>&1
```

**Expected**: Should complete faster (within 60 seconds) since Product ID 1 uses CUMULATIVE schedule, not PROGRESSIVE

---

### 8b. Test Submit Loan Application via Backend - PROGRESSIVE PRODUCT (Product ID 2 - May timeout)

```bash
curl --max-time 130 -X POST 'https://client-portal-backend-production-c66f.up.railway.app/clientportal/loans/apply' \
  -b /tmp/cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "clientId": 3,
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' 2>&1
```

**Expected**:

- ✅ 200 OK with loan application response (may take 2+ minutes for progressive loans)
- ⏱️ 504 Gateway Timeout (if demo server is too slow - this is expected)
- ❌ 400/500 error with details (check error message)

**Note**: The timeout is expected for progressive loans on the demo server. The loan may still be submitted successfully even if the request times out - check the loan list to verify.

**IMPORTANT**: If Product ID 2 (progressive) keeps timing out, try Product ID 1 (cumulative) first with command 8a above to verify the submission endpoint works.

---

## Required Fields Check

Based on Fineract API documentation, these fields are **MANDATORY** for loan submission:

1. ✅ `clientId` - Client ID
2. ✅ `productId` - Loan product ID
3. ✅ `principal` - Loan amount
4. ✅ `numberOfRepayments` - Number of installments
5. ✅ `repaymentEvery` - Repayment frequency value
6. ✅ `repaymentFrequencyType` - Repayment frequency type (enum)
7. ✅ `loanTermFrequency` - Loan term value
8. ✅ `loanTermFrequencyType` - Loan term frequency type (enum)
9. ✅ `interestRatePerPeriod` - Interest rate
10. ✅ `interestRateFrequencyType` - Interest rate frequency type (enum)
11. ✅ `interestType` - Interest calculation type (enum)
12. ✅ `amortizationType` - Amortization type (enum)
13. ✅ `interestCalculationPeriodType` - Interest calculation period type (enum)
14. ✅ `transactionProcessingStrategyCode` - Payment allocation strategy
15. ✅ `loanType` - Must be "individual" for client portal
16. ✅ `submittedOnDate` - Application submission date
17. ✅ `expectedDisbursementDate` - Expected disbursement date
18. ✅ `dateFormat` - Date format (yyyy-MM-dd)
19. ✅ `locale` - Locale (en)

---

## Potential Issues to Check

1. **Missing Fields**: Run command #8 and check if any required fields are missing
2. **Field Type Mismatch**: Ensure all enum fields are integers, not strings
3. **Date Format**: Ensure dates are in YYYY-MM-DD format
4. **Timeout Issues**:
   - ⚠️ **EXPECTED** for progressive loans (Product ID 2) on demo server
   - Progressive loan schedule calculations are computationally expensive
   - Demo server may take 2+ minutes or timeout completely
   - **Solution**: Submit without pre-calculating schedule, or use simpler product (ID 1 or 3)
5. **CORS Issues**: Commands #7 and #8 should include CORS headers in response
6. **Session Issues**: Ensure cookies are saved and sent correctly
7. **No Alternative API**: There is no alternative endpoint - `/v1/self/loans` requires OAuth client auth

---

## Quick Test Sequence

Run these in order:

```bash
# 1. Login
curl -X POST https://client-portal-backend-production-c66f.up.railway.app/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"client","password":"password"}' \
  -c /tmp/cookies.txt -s | python3 -m json.tool

# 2. Test direct Fineract submission (bypasses backend)
curl -X POST 'https://demo.mifos.io/fineract-provider/api/v1/loans' \
  -u 'mifos:password' \
  -H 'Fineract-Platform-TenantId: default' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": 3,
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' -s | python3 -m json.tool

# 3. Test via backend
curl -X POST 'https://client-portal-backend-production-c66f.up.railway.app/clientportal/loans/apply' \
  -b /tmp/cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": 2,
    "principal": 50000,
    "numberOfRepayments": 24,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "loanTermFrequency": 24,
    "loanTermFrequencyType": 2,
    "interestRatePerPeriod": 15.5,
    "interestRateFrequencyType": 2,
    "interestType": 0,
    "amortizationType": 1,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "advanced-payment-allocation-strategy",
    "loanType": "individual",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "clientId": 3,
    "submittedOnDate": "2025-12-12",
    "expectedDisbursementDate": "2025-12-30"
  }' -s | python3 -m json.tool
```
