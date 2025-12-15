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

## 3. Settings Configuration (`portal_backend/settings.py`)

This file configures Django framework behavior, security, database, CORS, and external service connections.

### **Key Sections Explained**

#### **3.1 Imports and Setup (Lines 1-15)**

```python
import os
from pathlib import Path
from corsheaders.defaults import default_headers
from dotenv import load_dotenv
```

**What**: Import necessary libraries
- `os`: Access environment variables
- `Path`: Modern file path handling
- `corsheaders`: CORS headers for cross-origin requests
- `load_dotenv`: Load `.env` file

```python
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
```

**What**: 
- `BASE_DIR`: Absolute path to project root (2 directories up from settings.py)
- `load_dotenv()`: Loads environment variables from `.env` file

**Why**: Keeps sensitive data (passwords, API keys) out of code

---

#### **3.2 Security Settings (Lines 17-31)**

```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
```

**What**:
- `SECRET_KEY`: Cryptographic key for signing sessions, cookies, CSRF tokens
- `DEBUG`: Show detailed error pages (True in dev, False in production)

**Why**: 
- Secret key must be unique in production
- DEBUG=False hides sensitive info in production

```python
ALLOWED_HOSTS: list[str] = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",  # Render subdomains
    ".render.com",
]
```

**What**: List of hostnames Django accepts requests from

**Why**: Security feature - prevents HTTP Host header attacks

---

#### **3.3 Installed Apps (Lines 33-43)**

```python
INSTALLED_APPS = [
    "django.contrib.admin",      # Admin interface
    "django.contrib.auth",       # Authentication
    "django.contrib.sessions",   # Session management
    "rest_framework",            # REST API framework
    "corsheaders",               # CORS middleware
    "core",                      # Our custom app
]
```

**What**: Django apps to load
- Built-in apps: admin, auth, sessions, etc.
- Third-party: `rest_framework`, `corsheaders`
- Custom: `core` (our app)

**Why**: Django needs to know which apps to initialize

---

#### **3.4 Middleware (Lines 45-67)**

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Only in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]
```

**What**: Middleware = code that runs on every request/response

**Order Matters!** They execute in this order:
1. **SecurityMiddleware**: Adds security headers (HTTPS redirect, etc.)
2. **WhiteNoiseMiddleware**: Serves static files in production
3. **SessionMiddleware**: Manages user sessions (creates `request.session`)
4. **CorsMiddleware**: Handles CORS headers (MUST be before CSRF)
5. **CommonMiddleware**: Common utilities
6. **CsrfViewMiddleware**: CSRF protection
7. **AuthenticationMiddleware**: Adds `request.user` object
8. **MessagesMiddleware**: Flash messages

**Why**: Each middleware processes request/response. Order is critical!

---

#### **3.5 Database Configuration (Lines 89-102)**

```python
if os.getenv("DATABASE_URL") and dj_database_url:
    # Production: PostgreSQL
    DATABASES = {
        "default": dj_database_url.parse(os.getenv("DATABASE_URL"))
    }
else:
    # Development: SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
```

**What**: 
- **Production**: Uses PostgreSQL (from `DATABASE_URL` environment variable)
- **Development**: Uses SQLite (file-based database)

**Why**: 
- PostgreSQL: Better for production (concurrent access, performance)
- SQLite: Simpler for development (no server setup needed)

---

#### **3.6 CORS Configuration (Lines 124-171)**

```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]
```

**What**: CORS = Cross-Origin Resource Sharing
- Allows frontend (different domain/port) to call backend API
- `CORS_ALLOW_CREDENTIALS`: Allow cookies in CORS requests

**Why**: Browser security blocks cross-origin requests by default. We need CORS because:
- Frontend: `localhost:4200` or `https://frontend.onrender.com`
- Backend: `localhost:8000` or `https://backend.onrender.com`

```python
if not DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://.*\.onrender\.com$",
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = True
```

**What**: 
- **Production**: Only allow `.onrender.com` subdomains (regex pattern)
- **Development**: Allow all origins (for testing)

**Why**: Security - restrict origins in production

```python
CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-Correlation-ID",
    "Fineract-Platform-TenantId",
    "Content-Type",
    "Authorization",
]
```

**What**: Headers frontend can send in requests
- Custom: `X-Correlation-ID` (for request tracking)
- Fineract: `Fineract-Platform-TenantId` (required by Fineract)

---

#### **3.7 Session Configuration (Lines 173-176)**

```python
SESSION_COOKIE_NAME = "cp_session"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
```

**What**: Session cookie settings
- `SESSION_COOKIE_NAME`: Cookie name (`cp_session` = Client Portal session)
- `SESSION_COOKIE_HTTPONLY`: JavaScript can't access (prevents XSS)
- `SESSION_COOKIE_SAMESITE`: When to send cookie (`Lax` = same-site + top-level nav)
- `SESSION_COOKIE_SECURE`: Only send over HTTPS (production only)

**Why**: Security best practices for session management

---

#### **3.8 Fineract Configuration (Lines 178-183)**

```python
MIFOS_BASE_URL = os.getenv("MIFOS_BASE_URL", "https://localhost:8443/fineract-provider/api/v1")
MIFOS_TENANT_ID = os.getenv("MIFOS_TENANT_ID", "default")
MIFOS_ADMIN_USER = os.getenv("MIFOS_ADMIN_USER", "mifos")
MIFOS_ADMIN_PASS = os.getenv("MIFOS_ADMIN_PASS", "password")
MIFOS_VERIFY_SSL = os.getenv("MIFOS_VERIFY_SSL", "true").lower() == "true"
MIFOS_CLIENT_ID = os.getenv("MIFOS_CLIENT_ID", "3")
```

**What**: Configuration for connecting to Fineract (core banking engine)

**Why**: 
- Django backend acts as middleware between frontend and Fineract
- Uses admin credentials to fetch client data
- `MIFOS_CLIENT_ID` determines which client's data to show

**Example**: Backend uses `mifos/password` to login to Fineract, then fetches data for client ID 3

---

#### **3.9 Logging Configuration (Lines 185-212)**

```python
LOGGING = {
    "version": 1,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "mifos_client": {"level": "DEBUG"},
        "core": {"level": "DEBUG"},
    },
}
```

**What**: Python logging configuration
- **Formatters**: How to format log messages (level, timestamp, module, message)
- **Handlers**: Where to send logs (console = print to terminal)
- **Loggers**: Which modules to log (`mifos_client`, `core` at DEBUG level)

**Why**: 
- Debugging: See what's happening in code
- Monitoring: Track errors and requests

**Example Log Output**:
```
DEBUG 2025-12-09 10:30:45,123 mifos_client Mifos admin fetch
INFO 2025-12-09 10:30:45,456 core Login request received
```

---

## 4. MifosClient - Fineract Communication (`mifos_client/client.py`)

This file contains the `MifosClient` class that handles all communication with the Fineract core banking API.

### **4.1 Class Overview**

**Purpose**: Acts as a wrapper around Fineract API calls, handling authentication, error handling, and data fetching.

**Key Responsibilities**:
1. Authenticate with Fineract using admin credentials
2. Fetch client data (profile, loans, savings, transactions)
3. Handle errors gracefully (404, 401, 503)
4. Manage authentication tokens/sessions

---

### **4.2 Custom Exceptions (Lines 1-20)**

```python
class MifosAuthError(Exception):
    """Raised when Fineract authentication fails."""
    pass

class MifosUpstreamError(Exception):
    """Raised when Fineract is unavailable or returns an error."""
    pass

class MifosNotFoundError(Exception):
    """Raised when a resource is not found (404)."""
    pass
```

**What**: Custom exception classes for different error types

**Why**: 
- **MifosAuthError**: Admin credentials wrong or expired
- **MifosUpstreamError**: Fineract server down or network error
- **MifosNotFoundError**: Client/loan/savings not found (404)

**Usage**: Views catch these exceptions and return appropriate HTTP status codes

---

### **4.3 Class Initialization (Lines 26-33)**

```python
@dataclass
class MifosClient:
    base_url: str = settings.MIFOS_BASE_URL
    tenant_id: str = settings.MIFOS_TENANT_ID
    admin_user: str = settings.MIFOS_ADMIN_USER
    admin_pass: str = settings.MIFOS_ADMIN_PASS
    verify_ssl: bool = settings.MIFOS_VERIFY_SSL
    client_id: str = settings.MIFOS_CLIENT_ID
```

**What**: Dataclass that initializes with configuration from Django settings

**Dataclass**: Python decorator that auto-generates `__init__`, `__repr__`, etc.

**Instance Variables** (default values from Django settings):
- `base_url`: Fineract API base URL (e.g., `https://localhost:8443/fineract-provider/api/v1`)
- `tenant_id`: Fineract tenant identifier (usually `"default"`)
- `admin_user`: Admin username (e.g., `"mifos"`)
- `admin_pass`: Admin password (e.g., `"password"`)
- `verify_ssl`: Whether to verify SSL certificates (False for local dev)
- `client_id`: Client ID to fetch data for (e.g., `"3"`)

**Why**: Centralizes configuration - all Fineract settings come from Django settings. Dataclass makes it cleaner.

---

### **4.4 Authentication Method (Lines 75-184)**

```python
def auth_check(self) -> None:
    """Check Fineract availability using admin credentials only.
    
    Tries POST /authentication with JSON body (preferred), then falls back
    to Basic Auth variants. The first 200/204 wins.
    """
    tenant_header = {"Fineract-Platform-TenantId": self.tenant_id}
    content_header = {"Content-Type": "application/json"}
    json_body = {"username": self.admin_user, "password": self.admin_pass}
    
    attempts = [
        # Preferred: POST with JSON body (confirmed working format)
        {"method": "POST", "path": "/authentication", "tenant_strategy": "both", "auth_type": "json_body"},
        # Fallback: Basic Auth variants
        {"method": "POST", "path": "/authentication", "tenant_strategy": "both", "auth_type": "basic"},
        {"method": "POST", "path": "/self/authentication", "tenant_strategy": "both", "auth_type": "basic"},
        {"method": "GET", "path": "/authentication", "tenant_strategy": "both", "auth_type": "basic"},
    ]
    
    for attempt in attempts:
        # Build headers, params, auth based on attempt config
        headers = dict(content_header)
        params = {}
        auth_tuple = None
        json_data = None
        
        # Add tenant ID to header and/or query params
        if attempt["tenant_strategy"] in ("both", "header_only"):
            headers.update(tenant_header)
        if attempt["tenant_strategy"] in ("both", "query_only"):
            params["tenantIdentifier"] = self.tenant_id
        
        # Choose auth method
        if attempt["auth_type"] == "json_body":
            json_data = json_body
        else:
            auth_tuple = (self.admin_user, self.admin_pass)  # Basic Auth
        
        url = f"{self.base_url.rstrip('/')}{attempt['path']}"
        
        try:
            resp = requests.request(
                attempt["method"],
                url,
                params=params,
                headers=headers,
                json=json_data,
                auth=auth_tuple,
                timeout=10,
                verify=self.verify_ssl,
            )
            
            if resp.status_code in (200, 204):
                logger.info("Mifos admin auth_check succeeded")
                return  # Success!
        except requests.RequestException:
            continue  # Try next strategy
    
    # All attempts failed
    raise MifosAuthError("Admin authentication failed against Fineract")
```

**What**: Tests if admin credentials work with Fineract

**How**:
1. Tries multiple authentication strategies (JSON body, Basic Auth, different endpoints)
2. For each attempt, builds appropriate headers, params, and auth
3. If any attempt succeeds (200/204), returns immediately
4. If all fail, raises `MifosAuthError`

**Why Multiple Strategies**: Different Fineract versions/configurations may use different endpoints or auth methods

**Tenant Strategy**: Some Fineract setups require tenant ID in header, query param, or both

**Used By**: `login_view` to verify Fineract is accessible before allowing client login

---

### **4.5 Core Fetch Method (Lines 186-229)**

```python
def fetch_with_admin(
    self, 
    path: str, 
    method: str = "GET", 
    params: Optional[Dict[str, Any]] = None, 
    json: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Fetch data from Fineract using admin credentials (Basic Auth)."""
    url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
    headers = {
        "Fineract-Platform-TenantId": self.tenant_id,
        "Content-Type": "application/json"
    }
    params = params or {}
    params.setdefault("tenantIdentifier", self.tenant_id)  # Add tenant to query params
    
    try:
        resp = requests.request(
            method,
            url,
            params=params,
            headers=headers,
            auth=(self.admin_user, self.admin_pass),  # Basic Auth
            json=json,
            timeout=15,
            verify=self.verify_ssl,
        )
    except requests.RequestException as exc:
        raise MifosUpstreamError(str(exc)) from exc
    
    # Success responses
    if resp.status_code in (200, 201, 204):
        try:
            return resp.json()
        except ValueError:
            return {}  # Empty response body
    
    # Error handling
    if resp.status_code == 404:
        raise MifosNotFoundError(f"{method} {url} returned 404 (resource not found)")
    
    if resp.status_code in (401, 403):
        raise MifosAuthError(f"Admin authentication failed for {url}")
    
    raise MifosUpstreamError(f"{method} {url} returned {resp.status_code}")
```

**What**: Core method for making requests to Fineract using Basic Auth

**Parameters**:
- `path`: API endpoint path (e.g., `"clients/3"` or `"/clients/3"`)
- `method`: HTTP method (default: `"GET"`)
- `params`: Query parameters (e.g., `{"associations": "all"}`)
- `json`: JSON body for POST/PUT requests

**How**:
1. Builds full URL (handles leading/trailing slashes)
2. Adds required headers (tenant ID, content type)
3. Adds tenant ID to query params as fallback
4. Uses Basic Auth with admin credentials
5. Makes HTTP request
6. Handles responses:
   - **200/201/204**: Returns JSON (or empty dict if no body)
   - **404**: Raises `MifosNotFoundError`
   - **401/403**: Raises `MifosAuthError`
   - **Other**: Raises `MifosUpstreamError`

**Why**: Centralizes all Fineract API calls - handles auth, errors, URL building

**Used By**: All data-fetching methods (`fetch_client_bundle`, `fetch_client_loans`, etc.)

**Note**: Uses Basic Auth (username/password) instead of token-based auth

---

### **4.6 Client Data Fetching Methods**

#### **4.6.1 Fetch Client Profile (Lines 231-235)**

```python
def fetch_client_bundle(self) -> Dict[str, Any]:
    """Fetch client profile with associations for dashboard."""
    path = f"/clients/{self.client_id}"
    params = {"associations": "all"}
    return self.fetch_with_admin(path, params=params)
```

**What**: Fetches complete client profile with all related data

**Fineract API**: `GET /clients/{client_id}?associations=all`

**Returns**: Client object with profile, office, staff, groups, etc.

**Used By**: `client_view` in `core/views.py`

---

#### **4.6.2 Fetch Client Loans (Lines 237-259)**

```python
def fetch_client_loans(self) -> List[Dict[str, Any]]:
    """Fetch all loans for the client with repayment schedule."""
    path = f"/loans"
    params = {"clientId": self.client_id}
    try:
        data = self.fetch_with_admin(path, params=params)
        loans = data.get("pageItems", [])
        
        # Enrich each loan with repayment schedule
        enriched_loans = []
        for loan in loans:
            loan_id = loan.get("id")
            if loan_id:
                try:
                    loan_detail = self.fetch_with_admin(
                        f"/loans/{loan_id}",
                        params={"associations": "repaymentSchedule"}
                    )
                    loan.update(loan_detail)  # Merge detail into loan
                except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                    pass  # Use what we have
            enriched_loans.append(loan)
        return enriched_loans
    except MifosNotFoundError:
        return []  # No loans found
```

**What**: Fetches all loans for the client, enriched with repayment schedule

**How**:
1. Fetches list of loans: `GET /loans?clientId={client_id}`
2. For each loan, fetches detailed data: `GET /loans/{loan_id}?associations=repaymentSchedule`
3. Merges repayment schedule into loan object
4. Returns enriched loans list

**Why Two API Calls**: 
- List endpoint doesn't include repayment schedule
- Need detailed endpoint with `associations=repaymentSchedule` to get EMI schedule

**Used By**: `loans_view` in `core/views.py`

---

#### **4.6.3 Fetch Client Savings (Lines 261-283)**

```python
def fetch_client_savings(self) -> List[Dict[str, Any]]:
    """Fetch all savings accounts for the client with summary."""
    path = f"/savingsaccounts"
    params = {"clientId": self.client_id}
    try:
        data = self.fetch_with_admin(path, params=params)
        accounts = data.get("pageItems", [])
        
        # Enrich each account with summary (balance info)
        enriched_accounts = []
        for account in accounts:
            account_id = account.get("id")
            if account_id:
                try:
                    account_detail = self.fetch_with_admin(
                        f"/savingsaccounts/{account_id}",
                        params={"associations": "summary"}
                    )
                    account.update(account_detail)  # Merge summary
                except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                    pass
            enriched_accounts.append(account)
        return enriched_accounts
    except MifosNotFoundError:
        return []
```

**What**: Fetches all savings accounts with balance information

**How**: Similar to loans - fetches list, then enriches each with summary

**Why**: Summary contains `accountBalance` and `availableBalance` not in list endpoint

**Used By**: `savings_view` in `core/views.py`

---

#### **4.6.4 Fetch Savings Transactions (Lines 285-293)**

```python
def fetch_savings_transactions(self, savings_account_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent transactions for a savings account."""
    path = f"/savingsaccounts/{savings_account_id}/transactions"
    params = {"limit": limit, "offset": 0}
    try:
        data = self.fetch_with_admin(path, params=params)
        return data.get("pageItems", [])
    except MifosNotFoundError:
        return []
```

**What**: Fetches transactions for a specific savings account

**Fineract API**: `GET /savingsaccounts/{id}/transactions?limit=10&offset=0`

**Used By**: `transactions_view` in `core/views.py`

---

#### **4.6.5 Fetch Loan Transactions (Lines 295-304)**

```python
def fetch_loan_transactions(self, loan_id: int) -> List[Dict[str, Any]]:
    """Fetch transactions for a loan account."""
    path = f"/loans/{loan_id}"
    params = {"associations": "all"}
    try:
        data = self.fetch_with_admin(path, params=params)
        # Transactions can be in 'transactions' or 'transactionHistory' key
        return data.get("transactions", []) or data.get("transactionHistory", [])
    except MifosNotFoundError:
        return []
```

**What**: Fetches transactions for a specific loan

**Fineract API**: `GET /loans/{loan_id}?associations=all`

**Note**: Fineract may return transactions in different keys, so we check both

**Used By**: `transactions_view` in `core/views.py`

---

#### **4.6.6 Fetch Loan Details (Lines 306-310)**

```python
def fetch_loan_details(self, loan_id: int) -> Dict[str, Any]:
    """Fetch detailed loan information with repayment schedule."""
    path = f"/loans/{loan_id}"
    params = {"associations": "repaymentSchedule,transactions"}
    return self.fetch_with_admin(path, params=params)
```

**What**: Fetches complete loan details with repayment schedule and transactions

**Fineract API**: `GET /loans/{loan_id}?associations=repaymentSchedule,transactions`

**Used By**: `loan_details_view` in `core/views.py`

---

### **4.7 Key Design Patterns**

1. **Error Handling**: Custom exceptions allow views to handle errors appropriately
2. **Token Caching**: Auth token cached in `_auth_token` to avoid re-authenticating on every request
3. **Retry Logic**: If token expires (401), automatically re-authenticates and retries
4. **Data Enrichment**: List endpoints don't have all data, so we fetch details for each item
5. **Graceful Degradation**: If detail fetch fails, uses data from list endpoint

---

## 5. Views - API Endpoints Logic (`core/views.py`)

This file contains all Django view functions that handle HTTP requests and return JSON responses.

### **5.1 Helper Functions**

#### **Correlation ID Generator (Lines 18-19)**

```python
def new_correlation_id() -> str:
    return str(uuid.uuid4())
```

**What**: Generates unique ID for tracking requests

**Why**: Helps debug issues by correlating logs with specific requests

**Used By**: All error responses

---

#### **Session Check Helper (Lines 102-109)**

```python
def _require_session(request: HttpRequest) -> tuple[dict | None, JsonResponse | None]:
    """Check if user is authenticated. Returns (user, None) if OK, (None, error_response) if not."""
    user = request.session.get("cp_user")
    if not user:
        correlation_id = new_correlation_id()
        logger.info("Unauthenticated request", extra={"correlation_id": correlation_id})
        return None, JsonResponse({"error": "unauthorized", "correlation_id": correlation_id}, status=401)
    return user, None
```

**What**: Checks if user has valid session

**Returns**: 
- `(user_dict, None)` if authenticated
- `(None, error_response)` if not authenticated

**Why**: DRY principle - avoid repeating session check in every view

**Used By**: All protected endpoints

---

### **5.2 Authentication Views**

#### **Login View (Lines 22-81)**

```python
@csrf_exempt
def login_view(request: HttpRequest):
    # Handle OPTIONS preflight (CORS)
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)
    
    # Parse JSON body
    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid_json"}, status=400)
    
    username = body.get("username")
    password = body.get("password")
    
    # Validate credentials (hardcoded for client portal)
    if username != "client" or password != "password":
        return JsonResponse({"error": "invalid_credentials"}, status=401)
    
    # Check Fineract availability
    client = MifosClient()
    try:
        client.auth_check()  # Uses admin credentials
    except (MifosAuthError, MifosUpstreamError):
        return JsonResponse({"error": "upstream_unavailable"}, status=503)
    
    # Create session
    request.session["cp_user"] = {
        "username": "client",
        "displayName": "client",
    }
    request.session.save()
    
    # Return success with CORS headers
    response = JsonResponse({"username": "client", "display_name": "client"}, status=200)
    origin = request.headers.get("Origin")
    if origin:
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
    return response
```

**What**: Handles client portal login

**Flow**:
1. Handle CORS preflight (OPTIONS request)
2. Validate HTTP method (must be POST)
3. Parse JSON body
4. Validate credentials (hardcoded: `client`/`password`)
5. Check Fineract availability using admin credentials
6. Create Django session with user data
7. Return success with CORS headers

**Key Points**:
- `@csrf_exempt`: Disables CSRF protection (API endpoint)
- **Local validation**: Credentials validated in Django, NOT in Fineract
- **Admin check**: Uses admin credentials to verify Fineract is up
- **Session**: Stores user data in Django session (cookie: `cp_session`)

**Error Responses**:
- `405`: Wrong HTTP method
- `400`: Invalid JSON
- `401`: Invalid credentials
- `503`: Fineract unavailable

---

#### **Me View (Lines 84-91)**

```python
def me_view(request: HttpRequest):
    user = request.session.get("cp_user")
    if not user:
        return JsonResponse({"error": "unauthorized"}, status=401)
    return JsonResponse(user, status=200)
```

**What**: Returns current logged-in user info

**Used By**: Frontend to check if user is still authenticated

---

#### **Dashboard View (Lines 94-100)**

```python
def dashboard_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    return JsonResponse({
        "authenticated": True,
        "user": user,
        "message": "Dashboard API functional"
    }, status=200)
```

**What**: Simple health check endpoint for dashboard

**Why**: Frontend can call this to verify authentication

---

### **5.3 Client Data Views**

#### **Client Profile View (Lines 103-130)**

```python
def client_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    client = MifosClient()
    try:
        client_data = client.fetch_client_bundle()
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch client data", extra={"correlation_id": correlation_id})
        return JsonResponse({"error": "upstream_unavailable", "correlation_id": correlation_id}, status=503)
    except MifosNotFoundError:
        # Client not found - return empty profile
        return JsonResponse({"profile": {}}, status=200)
    
    # Normalize Fineract response to frontend-friendly format
    profile = {
        "id": client_data.get("id"),
        "accountNo": client_data.get("accountNo"),
        "displayName": client_data.get("displayName"),
        "status": client_data.get("status", {}),
        "officeName": client_data.get("office", {}).get("name"),
    }
    
    return JsonResponse({"profile": profile}, status=200)
```

**What**: Fetches and returns client profile

**Flow**:
1. Check authentication
2. Fetch client data from Fineract
3. Handle errors (503 for upstream, empty profile for 404)
4. Normalize data (extract only needed fields)
5. Return JSON

**Data Normalization**: Fineract returns nested objects, we flatten to simple structure

---

#### **Loans View (Lines 147-233)**

```python
def loans_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    client = MifosClient()
    try:
        loan_accounts = client.fetch_client_loans()
    except (MifosAuthError, MifosUpstreamError) as exc:
        return JsonResponse({"error": "upstream_unavailable"}, status=503)
    
    loans = []
    for item in loan_accounts:
        # Extract status
        status_obj = item.get("status", {})
        status_value = status_obj.get("value") if isinstance(status_obj, dict) else status_obj
        
        # Extract repayment schedule data
        outstanding = item.get("totalOutstanding")
        next_repayment = None
        emi_amount = None
        paid_emis = 0
        total_emis = 0
        
        repayment_schedule = item.get("repaymentSchedule", {})
        if repayment_schedule:
            periods = repayment_schedule.get("periods", [])
            total_emis = len(periods)
            paid_emis = len([p for p in periods if p.get("complete")])
            
            # Find first incomplete period for next repayment
            for period in periods:
                if period.get("complete") is False:
                    if outstanding is None:
                        outstanding = period.get("principalLoanBalanceOutstanding")
                    due_date = period.get("dueDate")
                    if isinstance(due_date, list) and len(due_date) == 3:
                        next_repayment = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
                    emi_amount = period.get("totalDueForPeriod")
                    break
        
        # Calculate annualized interest rate
        interest_rate = item.get("interestRatePerPeriod")
        repayment_frequency = item.get("repaymentFrequencyType", {})
        if isinstance(repayment_frequency, dict):
            freq_value = repayment_frequency.get("value", "")
        else:
            freq_value = str(repayment_frequency) if repayment_frequency else ""
        
        if interest_rate and "month" in freq_value.lower():
            interest_rate_annual = interest_rate * 12
        else:
            interest_rate_annual = interest_rate
        
        # Build loan object
        loans.append({
            "id": item.get("id"),
            "accountNo": item.get("accountNo"),
            "productName": item.get("loanProductName"),
            "status": status_value,
            "principal": item.get("principal"),
            "outstanding": outstanding,
            "nextRepaymentDate": next_repayment,
            "interestRate": round(interest_rate_annual, 2) if interest_rate_annual else None,
            "tenure": item.get("numberOfRepayments") or total_emis,
            "emiAmount": emi_amount,
            "paidEMIs": paid_emis,
            "remainingEMIs": total_emis - paid_emis if total_emis > 0 else 0,
            "progressPercentage": int((paid_emis / total_emis) * 100) if total_emis > 0 else 0,
        })
    
    return JsonResponse({"loans": loans}, status=200)
```

**What**: Fetches all loans and calculates derived fields

**Key Calculations**:
- **Progress Percentage**: `(paid_emis / total_emis) * 100`
- **Annualized Interest Rate**: If monthly, multiply by 12
- **Next Repayment Date**: First incomplete period's due date
- **Outstanding Balance**: From first incomplete period or top-level

**Data Transformation**:
- Date format: `[2024, 10, 15]` → `"2024-10-15"`
- Status: Extract `value` from nested object
- EMI schedule: Count complete/incomplete periods

---

### **5.4 Transaction Views**

#### **Transactions View (Lines 236-350+)**

```python
def transactions_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    client = MifosClient()
    
    # Fetch all transactions from loans and savings
    all_transactions = []
    
    try:
        # Get savings transactions
        savings_accounts = client.fetch_client_savings()
        for account in savings_accounts:
            account_id = account.get("id")
            if account_id:
                transactions = client.fetch_savings_transactions(account_id, limit=1000)
                for txn in transactions:
                    all_transactions.append({
                        "id": txn.get("id"),
                        "type": txn.get("transactionType", {}).get("value", "Unknown"),
                        "amount": txn.get("amount", 0),
                        "date": format_date(txn.get("date")),
                        "accountType": "Savings",
                        "accountNo": account.get("accountNo"),
                        "description": f"{txn.get('transactionType', {}).get('value', 'Transaction')} - {account.get('accountNo')}",
                        "reference": txn.get("id"),
                        "status": "Success" if txn.get("reversed") is False else "Reversed",
                    })
        
        # Get loan transactions
        loans = client.fetch_client_loans()
        for loan in loans:
            loan_id = loan.get("id")
            if loan_id:
                transactions = client.fetch_loan_transactions(loan_id)
                for txn in transactions:
                    all_transactions.append({
                        "id": txn.get("id"),
                        "type": txn.get("type", {}).get("value", "Unknown"),
                        "amount": txn.get("amount", 0),
                        "date": format_date(txn.get("date")),
                        "accountType": "Loan",
                        "accountNo": loan.get("accountNo"),
                        "description": build_transaction_description(txn, loan),
                        "reference": txn.get("id"),
                        "status": "Success",
                    })
    except (MifosAuthError, MifosUpstreamError):
        return JsonResponse({"error": "upstream_unavailable"}, status=503)
    except MifosNotFoundError:
        # No accounts found - return empty list
        pass
    
    # Calculate summary
    total = len(all_transactions)
    total_credit = sum(t["amount"] for t in all_transactions if t["amount"] > 0)
    total_debit = abs(sum(t["amount"] for t in all_transactions if t["amount"] < 0))
    remaining = total_credit - total_debit
    
    return JsonResponse({
        "transactions": all_transactions,
        "summary": {
            "total": total,
            "totalCredit": total_credit,
            "totalDebit": total_debit,
            "remaining": remaining,
        }
    }, status=200)
```

**What**: Fetches all transactions from loans and savings accounts

**Key Logic**:
- **Credit**: Positive amounts (money coming IN - e.g., disbursement)
- **Debit**: Negative amounts (money going OUT - e.g., repayment, fees)
- **Remaining**: `Total Credit - Total Debit`

**Data Aggregation**: Combines transactions from multiple sources (savings + loans)

---

### **5.5 Download Views**

#### **Loan Statement Download (Lines 500+)**

```python
def download_loan_statement(request: HttpRequest, loan_id: int):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    client = MifosClient()
    try:
        loan_data = client.fetch_loan_details(loan_id)
    except (MifosAuthError, MifosUpstreamError):
        return JsonResponse({"error": "upstream_unavailable"}, status=503)
    except MifosNotFoundError:
        return JsonResponse({"error": "not_found"}, status=404)
    
    # Generate HTML statement
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Loan Statement - {loan_data.get('accountNo')}</title>
        <style>
            body {{ font-family: Arial; margin: 20px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        </style>
    </head>
    <body>
        <h1>Loan Statement</h1>
        <p>Account: {loan_data.get('accountNo')}</p>
        <p>Principal: ₹{loan_data.get('principal')}</p>
        <p>Outstanding: ₹{loan_data.get('totalOutstanding')}</p>
        <!-- Transaction table -->
    </body>
    </html>
    """
    
    response = HttpResponse(html, content_type="text/html")
    response["Content-Disposition"] = f'attachment; filename="loan_statement_{loan_id}.html"'
    return response
```

**What**: Generates HTML statement for printing/PDF conversion

**Why HTML**: Browser can print to PDF, no external library needed

---

#### **Repayment Schedule Download (CSV)**

```python
def download_repayment_schedule(request: HttpRequest, loan_id: int):
    # ... fetch loan data ...
    
    # Generate CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["EMI #", "Due Date", "Amount", "Principal", "Interest", "Status", "Payment Date", "Reference"])
    
    for period in repayment_schedule.get("periods", []):
        writer.writerow([
            period.get("period"),
            format_date(period.get("dueDate")),
            period.get("totalDueForPeriod"),
            period.get("principalDue"),
            period.get("interestDue"),
            "Paid" if period.get("complete") else "Pending",
            format_date(period.get("actualPaymentDate")),
            period.get("id"),
        ])
    
    response = HttpResponse(output.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="repayment_schedule_{loan_id}.csv"'
    return response
```

**What**: Generates CSV file with EMI schedule

**Why CSV**: Easy to open in Excel, lightweight format

---

### **5.6 Notification Views**

#### **Notifications View (Lines 800+)**

```python
def notifications_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    client = MifosClient()
    notifications = []
    
    try:
        # Generate EMI reminders from loans
        loans = client.fetch_client_loans()
        for loan in loans:
            next_repayment = loan.get("nextRepaymentDate")
            if next_repayment:
                due_date = datetime.strptime(next_repayment, "%Y-%m-%d").date()
                days_until = (due_date - date.today()).days
                
                if 0 <= days_until <= 7:  # Due within 7 days
                    notifications.append({
                        "id": f"emi_reminder_{loan.get('id')}",
                        "type": "EMI Due Reminder",
                        "title": "EMI Due Reminder",
                        "description": f"Your EMI of ₹{loan.get('emiAmount')} for loan {loan.get('accountNo')} is due on {format_date(next_repayment)}",
                        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
                        "read": False,
                    })
        
        # Generate payment received notifications from transactions
        # ... (similar logic)
        
        # Add sample notifications
        notifications.extend([
            {
                "id": "sample_1",
                "type": "Loan Update",
                "title": "Loan Approved",
                "description": "Your loan application has been approved.",
                "timestamp": "2025-12-08 10:00 AM",
                "read": False,
            },
            # ... more samples
        ])
    except (MifosAuthError, MifosUpstreamError):
        return JsonResponse({"error": "upstream_unavailable"}, status=503)
    
    # Sort by timestamp (most recent first)
    notifications.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return JsonResponse({"notifications": notifications}, status=200)
```

**What**: Generates notifications from loan/transaction data

**Notification Types**:
- **EMI Reminders**: Generated from loan repayment dates
- **Payment Received**: Generated from successful transactions
- **Loan Updates**: Sample notifications
- **Messages**: Sample notifications
- **Document Verification**: Sample notifications

**Note**: Currently mock implementation - notifications generated on-the-fly, not stored in database

---

## 6. URL Routing (`core/urls.py`)

This file maps URL patterns to view functions.

### **6.1 URL Patterns**

```python
from django.urls import path
from .views import (
    login_view,
    me_view,
    dashboard_view,
    client_view,
    loans_view,
    loan_details_view,
    savings_view,
    transactions_view,
    download_loan_statement,
    download_repayment_schedule,
    download_transactions_statement,
    notifications_view,
    mark_notification_read_view,
    mark_all_notifications_read_view,
    delete_notification_view,
)

urlpatterns = [
    # Authentication
    path("auth/login", login_view, name="login"),
    path("auth/me", me_view, name="me"),
    
    # Dashboard
    path("dashboard", dashboard_view, name="dashboard"),
    
    # Client data
    path("clientportal/client", client_view, name="client"),
    path("clientportal/loans", loans_view, name="loans"),
    path("clientportal/loans/<int:loan_id>", loan_details_view, name="loan_details"),
    path("clientportal/savings", savings_view, name="savings"),
    path("clientportal/transactions", transactions_view, name="transactions"),
    
    # Downloads
    path("clientportal/loans/<int:loan_id>/statement", download_loan_statement, name="loan_statement"),
    path("clientportal/loans/<int:loan_id>/schedule", download_repayment_schedule, name="repayment_schedule"),
    path("clientportal/transactions/download", download_transactions_statement, name="transactions_download"),
    
    # Notifications
    path("clientportal/notifications", notifications_view, name="notifications"),
    path("clientportal/notifications/<int:notification_id>/read", mark_notification_read_view, name="mark_notification_read"),
    path("clientportal/notifications/read-all", mark_all_notifications_read_view, name="mark_all_read"),
    path("clientportal/notifications/<int:notification_id>", delete_notification_view, name="delete_notification"),
]
```

**What**: Defines URL patterns and their corresponding view functions

**URL Pattern Syntax**:
- `"auth/login"` → `/auth/login`
- `"clientportal/loans/<int:loan_id>"` → `/clientportal/loans/1` (captures `loan_id` as integer)

**Name Parameter**: Used for reverse URL lookup in templates/views

---

### **6.2 Main URL Configuration (`portal_backend/urls.py`)**

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
]
```

**What**: Main URL configuration - includes `core.urls`

**Why**: Django projects can have multiple apps, each with its own `urls.py`

---

## 7. Common Questions & Answers

### **Q1: Why does Django act as middleware between Angular and Fineract?**

**A**: 
- **Security**: Fineract admin credentials stay on backend, never exposed to frontend
- **Session Management**: Django handles authentication/sessions (cookies)
- **Data Normalization**: Backend transforms Fineract's complex responses into simple JSON
- **Error Handling**: Backend catches Fineract errors and returns user-friendly messages
- **CORS**: Backend handles CORS for cross-origin requests

---

### **Q2: How does authentication work?**

**A**:
1. **Client Login**: Frontend sends `username: "client"`, `password: "password"` to Django
2. **Local Validation**: Django validates credentials (hardcoded, NOT against Fineract)
3. **Fineract Check**: Django uses admin credentials (`mifos/password`) to verify Fineract is up
4. **Session Creation**: Django creates session with `cp_user` data, sets cookie `cp_session`
5. **Subsequent Requests**: Frontend sends cookie with each request, Django validates session

**Key Point**: Client credentials are NOT authenticated against Fineract - Django validates locally and uses admin credentials to fetch data.

---

### **Q3: Why do we need `@csrf_exempt` on some views?**

**A**: 
- **CSRF Protection**: Django protects against Cross-Site Request Forgery by requiring CSRF tokens
- **API Endpoints**: REST APIs typically don't use CSRF tokens (use session cookies or JWT instead)
- **`@csrf_exempt`**: Disables CSRF protection for specific endpoints
- **Used On**: POST endpoints that don't use Django forms (login, notification actions)

**Note**: Login uses `@csrf_exempt` because Angular sends JSON, not form data.

---

### **Q4: How are transactions categorized as Credit/Debit?**

**A**:
- **Credit** (positive amount): Money coming IN to client
  - Example: Loan disbursement (client receives money)
- **Debit** (negative amount): Money going OUT from client
  - Example: Loan repayment (client pays money), fees (client pays charges)
- **Remaining**: `Total Credit - Total Debit` (net balance from client's perspective)

**Banking Perspective**: From the client's point of view, not the bank's.

---

### **Q5: Why do we fetch loan details individually after getting the list?**

**A**:
- **List Endpoint**: `GET /loans?clientId=3` returns basic loan info (no repayment schedule)
- **Detail Endpoint**: `GET /loans/{id}?associations=repaymentSchedule` returns full details with EMI schedule
- **Data Enrichment**: We need repayment schedule to calculate:
  - Next repayment date
  - Paid/remaining EMIs
  - Progress percentage
  - Outstanding balance

**Trade-off**: More API calls, but richer data for frontend.

---

### **Q6: How does error handling work?**

**A**:
1. **MifosClient Methods**: Raise custom exceptions (`MifosAuthError`, `MifosUpstreamError`, `MifosNotFoundError`)
2. **Views Catch Exceptions**: Try/except blocks in views catch these exceptions
3. **Error Responses**: Return appropriate HTTP status codes:
   - `401`: Authentication failed
   - `404`: Resource not found
   - `503`: Fineract unavailable
4. **Correlation IDs**: Each error includes unique ID for debugging

**Example**:
```python
try:
    data = client.fetch_client_loans()
except MifosNotFoundError:
    return JsonResponse({"loans": []}, status=200)  # Empty list, not error
except (MifosAuthError, MifosUpstreamError):
    return JsonResponse({"error": "upstream_unavailable"}, status=503)
```

---

### **Q7: Why use Django sessions instead of JWT tokens?**

**A**:
- **Simplicity**: Django sessions are built-in, no extra libraries needed
- **Security**: Sessions stored server-side, more secure than client-side tokens
- **Cookie-based**: Browser automatically sends cookies, no manual token management
- **Session Management**: Django handles session expiration, cleanup automatically

**Trade-off**: Sessions are stateful (stored on server), but simpler for this use case.

---

### **Q8: How does CORS work in this project?**

**A**:
1. **Frontend** (Angular): Runs on `localhost:4200` or `https://frontend.onrender.com`
2. **Backend** (Django): Runs on `localhost:8000` or `https://backend.onrender.com`
3. **CORS Issue**: Browser blocks cross-origin requests by default
4. **Solution**: 
   - `django-cors-headers` middleware adds CORS headers to responses
   - `CORS_ALLOWED_ORIGINS` in settings.py lists allowed frontend URLs
   - `CORS_ALLOW_CREDENTIALS = True` allows cookies in CORS requests

**Headers Added**:
- `Access-Control-Allow-Origin: https://frontend.onrender.com`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

---

### **Q9: What happens if Fineract is down?**

**A**:
1. **Login**: `client.auth_check()` fails → Returns `503 upstream_unavailable`
2. **Data Fetching**: `client.fetch_*()` raises `MifosUpstreamError` → View returns `503`
3. **Frontend**: Shows error message to user
4. **Logging**: Error logged with correlation ID for debugging

**Graceful Degradation**: Some views return empty data (e.g., empty loans list) instead of error if client not found.

---

### **Q10: How are dates formatted?**

**A**:
- **Fineract Format**: `[2024, 10, 15]` (array) or `"2024-10-15"` (string)
- **Frontend Format**: `"2024-10-15"` (ISO date string)
- **Helper Function**: `format_date()` converts Fineract dates to strings

**Example**:
```python
def format_date(date_value):
    if isinstance(date_value, list) and len(date_value) == 3:
        return f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
    return date_value or ""
```

---

## Summary

This backend implements a **middleware pattern** between Angular frontend and Fineract core banking engine:

1. **Authentication**: Local validation + Fineract health check
2. **Data Fetching**: Admin credentials fetch client data from Fineract
3. **Data Transformation**: Complex Fineract responses → Simple JSON for frontend
4. **Error Handling**: Fineract errors → User-friendly HTTP responses
5. **Session Management**: Django sessions with cookies
6. **CORS**: Handles cross-origin requests between frontend and backend

**Key Files**:
- `settings.py`: Configuration (CORS, database, Fineract connection)
- `mifos_client/client.py`: Fineract API communication
- `core/views.py`: API endpoints logic
- `core/urls.py`: URL routing

**Architecture**: Angular → Django → Fineract

---

**End of VIVA Guide**

