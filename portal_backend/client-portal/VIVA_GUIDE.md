# Complete Backend VIVA Guide - Client Portal

This document contains everything you need to know for your viva examination about the backend implementation.

---

## Table of Contents

1. [API Endpoints Overview](#1-api-endpoints-overview)
2. [File Structure](#2-file-structure)
3. [Settings Configuration](#3-settings-configuration)
4. [MifosClient - Fineract Communication](#4-mifosclient---fineract-communication)
5. [Views - API Endpoints Logic](#5-views---api-endpoints-logic)
6. [URL Routing](#6-url-routing)
7. [Common Questions & Answers](#7-common-questions--answers)

---

## 1. API Endpoints Overview

### Base URL
- **Local Development**: `http://localhost:8000`
- **Production**: `https://your-backend-service.onrender.com`

### All API Endpoints

#### **Authentication Endpoints**

##### 1. `POST /auth/login`
- **Purpose**: Client portal login
- **Request Body**:
  ```json
  {
    "username": "client",
    "password": "password"
  }
  ```
- **Response (200)**:
  ```json
  {
    "username": "client",
    "display_name": "client"
  }
  ```
- **Error Responses**:
  - `401`: Invalid credentials
  - `503`: Fineract unavailable
- **What it does**: 
  - Validates username/password (hardcoded: `client`/`password`)
  - Checks Fineract availability using admin credentials
  - Creates Django session with `cp_user` data
  - Returns user info with CORS headers

##### 2. `GET /auth/me`
- **Purpose**: Get current logged-in user info
- **Headers**: Requires session cookie (`cp_session`)
- **Response (200)**:
  ```json
  {
    "username": "client",
    "displayName": "client"
  }
  ```
- **Error (401)**: Not authenticated
- **What it does**: Returns user data from session

#### **Dashboard Endpoints**

##### 3. `GET /dashboard`
- **Purpose**: Dashboard health check endpoint
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "authenticated": true,
    "user": {...},
    "message": "Dashboard API functional"
  }
  ```
- **What it does**: Simple endpoint to verify authentication

#### **Client Data Endpoints**

##### 4. `GET /clientportal/client`
- **Purpose**: Get client profile information
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "profile": {
      "id": 3,
      "accountNo": "000000003",
      "displayName": "John Doe",
      "status": {...},
      "officeName": "Head Office"
    }
  }
  ```
- **Fineract API Used**: `GET /clients/{client_id}?associations=all`
- **What it does**: Fetches client profile from Fineract using admin credentials

##### 5. `GET /clientportal/loans`
- **Purpose**: Get all loans for the client
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "loans": [
      {
        "id": 1,
        "accountNo": "000000001",
        "productName": "Personal Loan",
        "status": "Active",
        "principal": 100000,
        "outstanding": 75000,
        "nextRepaymentDate": "2025-01-15",
        "interestRate": 12.0,
        "tenure": 12,
        "emiAmount": 8884,
        "paidEMIs": 3,
        "remainingEMIs": 9,
        "progressPercentage": 25
      }
    ]
  }
  ```
- **Fineract API Used**: 
  - `GET /loans?clientId={client_id}` (list all loans)
  - `GET /loans/{loan_id}?associations=repaymentSchedule` (for each loan)
- **What it does**: 
  - Fetches all loans for client
  - Enriches each loan with repayment schedule data
  - Calculates progress, paid/remaining EMIs
  - Annualizes interest rate if monthly

##### 6. `GET /clientportal/loans/<loan_id>`
- **Purpose**: Get detailed information for a specific loan
- **Parameters**: `loan_id` (integer) - Loan ID from URL
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "loan": {
      "id": 1,
      "accountNo": "000000001",
      "productName": "Personal Loan",
      "status": "Active",
      "principal": 100000,
      "outstanding": 75000,
      "nextRepaymentDate": "2025-01-15",
      "interestRate": 12.0,
      "tenure": 12,
      "emiAmount": 8884,
      "paidEMIs": 3,
      "remainingEMIs": 9
    },
    "emiSchedule": [
      {
        "period": 1,
        "emiNumber": 1,
        "dueDate": "2024-10-15",
        "emiAmount": 8884,
        "principal": 8000,
        "interest": 884,
        "complete": true,
        "paymentDate": "2024-10-15",
        "reference": "PAY-000001"
      }
    ]
  }
  ```
- **Fineract API Used**: `GET /loans/{loan_id}?associations=repaymentSchedule,transactions`
- **What it does**: 
  - Fetches detailed loan data with repayment schedule
  - Builds EMI schedule with payment status
  - Maps transactions to payment dates

##### 7. `GET /clientportal/savings`
- **Purpose**: Get all savings accounts for the client
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "savings": [
      {
        "id": 1,
        "accountNo": "000000001",
        "productName": "Regular Savings",
        "status": "Active",
        "balance": 50000,
        "availableBalance": 45000
      }
    ]
  }
  ```
- **Fineract API Used**: 
  - `GET /savingsaccounts?clientId={client_id}` (list all)
  - `GET /savingsaccounts/{account_id}?associations=summary` (for each account)
- **What it does**: Fetches savings accounts with balance information

##### 8. `GET /clientportal/transactions`
- **Purpose**: Get all transactions (loans + savings) with filters
- **Query Parameters**:
  - `search` (optional): Search in description, reference, type
  - `type` (optional): Filter by transaction type (e.g., "repayment", "disbursement")
  - `account` (optional): Filter by loan account number
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "transactions": [
      {
        "id": 1,
        "type": "Repayment",
        "amount": -8884,
        "date": "2024-10-15",
        "accountType": "Loan",
        "accountNo": "000000001",
        "description": "EMI Payment for October 2024",
        "reference": "TXN-000001",
        "status": "Success"
      }
    ],
    "summary": {
      "total": 25,
      "totalCredit": 100000,
      "totalDebit": 26652,
      "remaining": 73348
    }
  }
  ```
- **Fineract API Used**: 
  - `GET /savingsaccounts/{id}/transactions` (for each savings account)
  - `GET /loans/{id}?associations=all` (for each loan)
- **What it does**: 
  - Fetches transactions from all savings and loan accounts
  - Applies client-side filters (search, type, account)
  - Calculates summary (total, credit, debit, remaining)
  - Formats dates and descriptions

#### **Download Endpoints**

##### 9. `GET /clientportal/loans/<loan_id>/statement`
- **Purpose**: Download loan statement as HTML (printable as PDF)
- **Parameters**: `loan_id` (integer)
- **Headers**: Requires session cookie
- **Response**: HTML file download
- **Content-Type**: `text/html`
- **What it does**: 
  - Generates HTML statement with loan details
  - Includes transaction history table
  - Styled for printing/PDF conversion

##### 10. `GET /clientportal/loans/<loan_id>/schedule`
- **Purpose**: Download repayment schedule as CSV
- **Parameters**: `loan_id` (integer)
- **Headers**: Requires session cookie
- **Response**: CSV file download
- **Content-Type**: `text/csv`
- **What it does**: 
  - Generates CSV with EMI schedule
  - Includes: EMI #, Due Date, Amount, Principal, Interest, Status, Payment Date, Reference

##### 11. `GET /clientportal/transactions/download`
- **Purpose**: Download transaction statement as CSV with filters
- **Query Parameters**: Same as `/clientportal/transactions` (search, type, account)
- **Headers**: Requires session cookie
- **Response**: CSV file download
- **Content-Type**: `text/csv`
- **What it does**: 
  - Applies same filters as transactions endpoint
  - Generates CSV with transaction history
  - Includes summary (total, credit, debit, remaining)

#### **Notifications Endpoints**

##### 12. `GET /clientportal/notifications`
- **Purpose**: Get all notifications for the client
- **Headers**: Requires session cookie
- **Response (200)**:
  ```json
  {
    "notifications": [
      {
        "id": 1,
        "type": "EMI Due Reminder",
        "title": "EMI Due Reminder",
        "description": "Your EMI of ₹8,884 for loan 000000001 is due on January 15, 2025",
        "timestamp": "2025-12-09 09:00 AM",
        "read": false
      }
    ]
  }
  ```
- **What it does**: 
  - Generates notifications from loan data (EMI reminders)
  - Creates payment received notifications from transactions
  - Adds sample notifications (loan updates, messages, document verification)
  - Sorts by timestamp (most recent first)

##### 13. `POST /clientportal/notifications/<notification_id>/read`
- **Purpose**: Mark a notification as read
- **Parameters**: `notification_id` (integer)
- **Headers**: Requires session cookie, CSRF exempt
- **Response (200)**:
  ```json
  {
    "success": true
  }
  ```
- **What it does**: Marks notification as read (currently mock - returns success)

##### 14. `POST /clientportal/notifications/read-all`
- **Purpose**: Mark all notifications as read
- **Headers**: Requires session cookie, CSRF exempt
- **Response (200)**:
  ```json
  {
    "success": true
  }
  ```
- **What it does**: Marks all notifications as read (currently mock)

##### 15. `POST /clientportal/notifications/<notification_id>`
- **Purpose**: Delete a notification
- **Parameters**: `notification_id` (integer)
- **Headers**: Requires session cookie, CSRF exempt
- **Response (200)**:
  ```json
  {
    "success": true
  }
  ```
- **What it does**: Deletes notification (currently mock)

---

## 2. File Structure

### Backend Directory Structure

```
portal_backend/
├── core/                          # Main Django app
│   ├── __init__.py               # Package marker (1 line comment)
│   ├── apps.py                   # App configuration (Django required)
│   ├── urls.py                   # URL routing (38 lines)
│   ├── views.py                  # API endpoints logic (1281 lines)
│   └── migrations/               # Database migrations
│       └── __init__.py           # Empty (Django required)
│
├── mifos_client/                 # Fineract API client
│   ├── __init__.py               # Exports classes (4 lines)
│   └── client.py                 # Fineract communication (311 lines)
│
├── portal_backend/               # Django project config
│   ├── __init__.py               # Package marker (1 line comment)
│   ├── settings.py               # Django configuration (213 lines)
│   ├── urls.py                   # Main URL routing (6 lines)
│   └── wsgi.py                   # WSGI entry point (8 lines)
│
├── manage.py                     # Django CLI tool (15 lines)
├── requirements.txt              # Python dependencies
├── build.sh                      # Build script for Render
├── start.sh                      # Start script for Render
└── README.md                     # Documentation
```

### File Purposes

- **`core/views.py`**: Contains all API endpoint functions (login, dashboard, loans, transactions, etc.)
- **`core/urls.py`**: Maps URLs to view functions
- **`mifos_client/client.py`**: Handles all communication with Fineract API
- **`portal_backend/settings.py`**: Django configuration (database, CORS, middleware, etc.)
- **`portal_backend/urls.py`**: Main URL configuration (includes core.urls)
- **`portal_backend/wsgi.py`**: Production server entry point (used by Gunicorn)

---

**Next Section**: Settings Configuration (coming next...)

