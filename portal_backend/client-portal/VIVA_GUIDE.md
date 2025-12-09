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

### **4.3 Class Initialization (Lines 22-50)**

```python
class MifosClient:
    def __init__(self, client_id: int | None = None):
        self.base_url = settings.MIFOS_BASE_URL
        self.tenant_id = settings.MIFOS_TENANT_ID
        self.admin_user = settings.MIFOS_ADMIN_USER
        self.admin_pass = settings.MIFOS_ADMIN_PASS
        self.verify_ssl = settings.MIFOS_VERIFY_SSL
        self.client_id = client_id or settings.MIFOS_CLIENT_ID
        self._auth_token: str | None = None
```

**What**: Initializes client with configuration from Django settings

**Parameters**:
- `client_id`: Optional client ID (defaults to `MIFOS_CLIENT_ID` from settings)

**Instance Variables**:
- `base_url`: Fineract API base URL (e.g., `https://localhost:8443/fineract-provider/api/v1`)
- `tenant_id`: Fineract tenant identifier (usually `"default"`)
- `admin_user`: Admin username (e.g., `"mifos"`)
- `admin_pass`: Admin password (e.g., `"password"`)
- `verify_ssl`: Whether to verify SSL certificates (False for local dev)
- `client_id`: Client ID to fetch data for (e.g., `3`)
- `_auth_token`: Cached authentication token (None initially)

**Why**: Centralizes configuration - all Fineract settings come from Django settings

---

### **4.4 Authentication Method (Lines 52-95)**

```python
def auth_check(self) -> bool:
    """Check if admin credentials work with Fineract."""
    # Try multiple authentication strategies
    strategies = [
        # Strategy 1: POST /authentication with JSON body
        {
            "url": f"{self.base_url}/authentication",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Fineract-Platform-TenantId": self.tenant_id,
            },
            "data": {"username": self.admin_user, "password": self.admin_pass},
        },
        # Strategy 2: POST /self/authentication
        {
            "url": f"{self.base_url}/self/authentication",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Fineract-Platform-TenantId": self.tenant_id,
            },
            "data": {"username": self.admin_user, "password": self.admin_pass},
        },
    ]
    
    for strategy in strategies:
        try:
            response = requests.post(
                strategy["url"],
                json=strategy["data"],
                headers=strategy["headers"],
                verify=self.verify_ssl,
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                self._auth_token = data.get("base64EncodedAuthenticationKey")
                return True
        except Exception as e:
            logger.debug(f"Auth strategy failed: {e}")
            continue
    
    return False
```

**What**: Tests if admin credentials work with Fineract

**How**:
1. Tries multiple authentication endpoints/strategies
2. Sends POST request with username/password in JSON body
3. If successful (200), extracts and caches auth token
4. Returns `True` if any strategy works, `False` otherwise

**Why Multiple Strategies**: Different Fineract versions/configurations may use different endpoints

**Used By**: `login_view` to verify Fineract is accessible before allowing client login

---

### **4.5 Core Fetch Method (Lines 97-145)**

```python
def fetch_with_admin(
    self, path: str, params: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Fetch data from Fineract using admin credentials."""
    url = f"{self.base_url}{path}"
    headers = {
        "Fineract-Platform-TenantId": self.tenant_id,
        "Content-Type": "application/json",
    }
    
    # Add auth token if available
    if self._auth_token:
        headers["Authorization"] = f"Basic {self._auth_token}"
    
    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            verify=self.verify_ssl,
            timeout=30,
        )
        
        if response.status_code == 401:
            # Token expired, re-authenticate
            if self.auth_check():
                headers["Authorization"] = f"Basic {self._auth_token}"
                response = requests.get(url, params=params, headers=headers, ...)
            else:
                raise MifosAuthError("Authentication failed")
        
        if response.status_code == 404:
            raise MifosNotFoundError(f"Resource not found: {path}")
        
        if response.status_code != 200:
            raise MifosUpstreamError(f"Fineract error: {response.status_code}")
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise MifosUpstreamError(f"Network error: {str(e)}")
```

**What**: Core method for making GET requests to Fineract

**Parameters**:
- `path`: API endpoint path (e.g., `"/clients/3"`)
- `params`: Query parameters (e.g., `{"associations": "all"}`)

**How**:
1. Builds full URL from base URL + path
2. Adds required headers (tenant ID, content type)
3. Adds auth token if available
4. Makes GET request
5. Handles errors:
   - **401**: Re-authenticates and retries
   - **404**: Raises `MifosNotFoundError`
   - **Other errors**: Raises `MifosUpstreamError`
6. Returns JSON response

**Why**: Centralizes all Fineract API calls - handles auth, errors, retries

**Used By**: All data-fetching methods (`fetch_client_bundle`, `fetch_client_loans`, etc.)

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

**Next Section**: Views - API Endpoints Logic (coming next...)

