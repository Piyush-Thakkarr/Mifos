import json
import logging
import uuid
import csv
from datetime import date, timedelta
from io import StringIO

import requests

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from mifos_client import MifosClient, MifosAuthError, MifosUpstreamError, MifosNotFoundError
from django.conf import settings


logger = logging.getLogger(__name__)


def new_correlation_id() -> str:
    return str(uuid.uuid4())


def add_cors_headers(response: JsonResponse, request: HttpRequest) -> JsonResponse:
    """Helper function to add CORS headers to response."""
    origin = request.headers.get("Origin")
    if origin:
        response["Access-Control-Allow-Origin"] = origin
    else:
        # If no Origin header, allow all origins (for development/testing)
        response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response


@csrf_exempt
def login_view(request: HttpRequest):
    # Handle OPTIONS preflight request
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"
        return response
    
    if request.method != "POST":
        response = JsonResponse({"error": "method_not_allowed"}, status=405)
        return add_cors_headers(response, request)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        response = JsonResponse({"error": "invalid_json"}, status=400)
        return add_cors_headers(response, request)

    username = body.get("username")
    password = body.get("password")

    if username != "client" or password != "password":
        correlation_id = new_correlation_id()
        logger.warning(
            "Invalid clientportal credentials",
            extra={"correlation_id": correlation_id, "username": username},
        )
        response = JsonResponse({"error": "invalid_credentials", "correlation_id": correlation_id}, status=401)
        return add_cors_headers(response, request)

    client = MifosClient()

    # Try to verify upstream Fineract availability, but don't block login if it's temporarily unavailable
    # This allows users to log in even if the demo server is down/slow
    try:
        # Verify upstream Fineract availability using admin credentials only.
        client.auth_check()
        logger.info("Fineract connectivity verified during login")
    except (MifosAuthError, MifosUpstreamError) as e:
        correlation_id = new_correlation_id()
        # Log warning but don't block login - demo server can be slow/down
        logger.warning(
            "Fineract temporarily unavailable during login (non-blocking)",
            extra={"correlation_id": correlation_id, "error": str(e)}
        )
        # Continue with login - user can still access the portal, but some features may not work
    except Exception as e:
        # Catch any other unexpected errors
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error during login", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)

    try:
        request.session["cp_user"] = {
            "username": "client",
            "displayName": "client",
        }
        request.session.save()
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Failed to save session", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "session_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)

    try:
        response = JsonResponse(
            {
                "username": "client",
                "display_name": "client",
            },
            status=200,
        )
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Failed to create response", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "response_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


def me_view(request: HttpRequest):
    user = request.session.get("cp_user")
    if not user:
        correlation_id = new_correlation_id()
        logger.info("Unauthenticated /auth/me call", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "unauthorized", "correlation_id": correlation_id}, status=401)
        # Add CORS headers
        origin = request.headers.get("Origin")
        if origin:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
        return response

    response = JsonResponse(user, status=200)
    return add_cors_headers(response, request)


def dashboard_view(request: HttpRequest):
    user = request.session.get("cp_user")
    if not user:
        correlation_id = new_correlation_id()
        logger.info("Unauthorized dashboard access", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "unauthorized", "correlation_id": correlation_id}, status=401)
        return add_cors_headers(response, request)

    response = JsonResponse(
        {
            "authenticated": True,
            "user": user,
            "message": "Dashboard API functional  ready for Day 3 7 Fineract integration",
        },
        status=200,
    )
    return add_cors_headers(response, request)


def _require_session(request: HttpRequest):
    user = request.session.get("cp_user")
    if not user:
        correlation_id = new_correlation_id()
        logger.info("Unauthorized resource access", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "unauthorized", "correlation_id": correlation_id}, status=401)
        response = add_cors_headers(response, request)
        return None, response
    return user, None


def client_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        bundle = client.fetch_client_bundle()
    except MifosNotFoundError:
        # Client doesn't exist in Fineract - return empty profile
        logger.info("Client not found in Fineract, returning empty profile")
        response = JsonResponse({"profile": {}}, status=200)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch client bundle", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    # Extract office and staff information
    office = bundle.get("office", {})
    staff = bundle.get("staff", {})
    
    profile = {
        "id": bundle.get("id"),
        "accountNo": bundle.get("accountNo"),
        "displayName": bundle.get("displayName"),
        "status": bundle.get("status"),
        "officeName": bundle.get("officeName") or office.get("name"),
        "office": office,
        "staff": staff,
    }
    response = JsonResponse({"profile": profile}, status=200)
    return add_cors_headers(response, request)


def loans_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        loan_accounts = client.fetch_client_loans()
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan data", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    loans = []
    for item in loan_accounts:
        status_obj = item.get("status", {})
        status_value = status_obj.get("value") if isinstance(status_obj, dict) else status_obj
        
        # Get outstanding balance and next repayment date from repayment schedule
        outstanding = item.get("totalOutstanding")
        next_repayment = None
        emi_amount = None
        paid_emis = 0
        total_emis = 0
        progress_percentage = 0
        
        repayment_schedule = item.get("repaymentSchedule", {})
        if repayment_schedule:
            periods = repayment_schedule.get("periods", [])
            total_emis = len(periods)
            paid_emis = len([p for p in periods if p.get("complete")])
            
            if total_emis > 0:
                progress_percentage = int((paid_emis / total_emis) * 100)
            
            for period in periods:
                if period.get("complete") is False:
                    # Get outstanding from first incomplete period if not at top level
                    if outstanding is None:
                        outstanding = period.get("principalLoanBalanceOutstanding")
                    # Format dueDate from array [year, month, day] to string
                    due_date = period.get("dueDate")
                    if isinstance(due_date, list) and len(due_date) == 3:
                        next_repayment = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
                    elif due_date:
                        next_repayment = due_date
                    # Get EMI amount from first incomplete period
                    if emi_amount is None:
                        emi_amount = period.get("totalDueForPeriod")
                    break
        
        # Calculate interest rate (annualized)
        interest_rate = item.get("interestRatePerPeriod")
        repayment_frequency = item.get("repaymentFrequencyType", {})
        if isinstance(repayment_frequency, dict):
            freq_value = repayment_frequency.get("value", "")
        else:
            freq_value = str(repayment_frequency) if repayment_frequency else ""
        
        # Annualize interest rate if it's monthly
        if interest_rate and "month" in freq_value.lower():
            interest_rate_annual = interest_rate * 12
        else:
            interest_rate_annual = interest_rate
        
        # Get tenure (number of repayments)
        tenure = item.get("numberOfRepayments") or total_emis
        
        loans.append(
            {
                "id": item.get("id"),
                "accountNo": item.get("accountNo"),
                "productName": item.get("loanProductName"),
                "status": status_value,
                "principal": item.get("principal"),
                "outstanding": outstanding,
                "nextRepaymentDate": next_repayment or item.get("nextRepaymentDate"),
                "interestRate": round(interest_rate_annual, 2) if interest_rate_annual else None,
                "tenure": tenure,
                "emiAmount": emi_amount,
                "paidEMIs": paid_emis,
                "remainingEMIs": total_emis - paid_emis if total_emis > 0 else 0,
                "progressPercentage": progress_percentage,
            }
        )

    response = JsonResponse({"loans": loans}, status=200)
    return add_cors_headers(response, request)


def savings_view(request: HttpRequest):
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        savings_accounts = client.fetch_client_savings()
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch savings data", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    savings = []
    for item in savings_accounts:
        status_obj = item.get("status", {})
        status_value = status_obj.get("value") if isinstance(status_obj, dict) else status_obj
        
        # Get balance from summary if available
        summary = item.get("summary", {})
        balance = summary.get("accountBalance") if summary else item.get("accountBalance")
        available_balance = summary.get("availableBalance") if summary else item.get("availableBalance")
        
        # Ensure balance is a number and reasonable (not absurdly large)
        try:
            if balance is not None:
                balance = float(balance)
                # Cap at 10 million per account (reasonable maximum for a single savings account)
                # If balance is absurdly large, log it and set to 0
                if balance > 10000000:  # 10 million
                    logger.warning(f"Savings balance too large for account {item.get('id')}: {balance}, setting to 0")
                    balance = 0
                elif balance < 0:
                    # Negative balances are possible (overdraft), but we'll keep them
                    pass
            else:
                balance = 0
        except (ValueError, TypeError):
            logger.warning(f"Invalid balance value for savings account {item.get('id')}: {balance}")
            balance = 0
        
        try:
            if available_balance is not None:
                available_balance = float(available_balance)
                # Cap at 10 million per account
                if available_balance > 10000000:  # 10 million
                    logger.warning(f"Available balance too large for account {item.get('id')}: {available_balance}, setting to 0")
                    available_balance = 0
            else:
                available_balance = balance  # Fallback to account balance
        except (ValueError, TypeError):
            available_balance = balance  # Fallback to account balance
        
        savings.append(
            {
                "id": item.get("id"),
                "accountNo": item.get("accountNo"),
                "productName": item.get("savingsProductName") or item.get("productName"),
                "status": status_value,
                "balance": balance,
                "availableBalance": available_balance,
            }
        )

    response = JsonResponse({"savings": savings}, status=200)
    return add_cors_headers(response, request)


def transactions_view(request: HttpRequest):
    try:
        user, error_response = _require_session(request)
        if error_response:
            return error_response

        client = MifosClient()
        all_transactions = []

        try:
            # Fetch savings and loans separately
            savings_accounts = client.fetch_client_savings()
            loan_accounts = client.fetch_client_loans()
        except (MifosAuthError, MifosUpstreamError) as exc:
            correlation_id = new_correlation_id()
            logger.exception("Failed to fetch transactions data", extra={"correlation_id": correlation_id})
            response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
            return add_cors_headers(response, request)

        # Fetch savings account transactions (limit to prevent timeout)
        for savings_account in savings_accounts[:5]:  # Limit to first 5 savings accounts
            savings_id = savings_account.get("id")
            if savings_id:
                try:
                    savings_txns = client.fetch_savings_transactions(savings_id, limit=10)  # Limit transactions per account
                    for txn in savings_txns:
                        # Format date from array [year, month, day] to string
                        date_value = txn.get("date")
                        if isinstance(date_value, list) and len(date_value) == 3:
                            date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
                        else:
                            date_str = date_value
                        
                        all_transactions.append(
                            {
                                "id": txn.get("id"),
                                "type": txn.get("transactionType", {}).get("value", "Unknown") if isinstance(txn.get("transactionType"), dict) else txn.get("transactionType", "Unknown"),
                                "amount": txn.get("amount"),
                                "date": date_str,
                                "accountType": "Savings",
                                "accountNo": savings_account.get("accountNo"),
                            }
                        )
                except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                    # Skip if we can't fetch transactions for this account
                    continue

        # Fetch loan account transactions (limit to prevent timeout)
        for loan_account in loan_accounts[:10]:  # Limit to first 10 loans
            loan_id = loan_account.get("id")
            loan_account_no = loan_account.get("accountNo")
            loan_product_name = loan_account.get("loanProductName", "")
            if loan_id:
                try:
                    loan_txns = client.fetch_loan_transactions(loan_id)
                    # Limit transactions per loan to prevent huge responses
                    for txn in loan_txns[:50]:  # Max 50 transactions per loan
                        txn_type = txn.get("type", {})
                        if isinstance(txn_type, dict):
                            txn_type_value = txn_type.get("value", "Unknown")
                        else:
                            txn_type_value = txn_type or "Unknown"
                        
                        # Filter out internal transactions, keep only user-relevant ones
                        if txn_type_value.lower() in ["accrual", "waive", "writeoff"]:
                            continue
                        
                        # Format date from array [year, month, day] to string
                        date_value = txn.get("date")
                        month_year = ""
                        if isinstance(date_value, list) and len(date_value) == 3:
                            date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
                            # Extract month/year for description - use month names
                            month_names = ["", "January", "February", "March", "April", "May", "June",
                                         "July", "August", "September", "October", "November", "December"]
                            if 1 <= date_value[1] <= 12:
                                month_year = f"{month_names[date_value[1]]} {date_value[0]}"
                        else:
                            date_str = date_value or "—"
                        
                        # Generate description based on transaction type
                        description = ""
                        if txn_type_value.lower() == "repayment":
                            description = f"EMI Payment for {month_year}" if month_year else "EMI Payment"
                        elif txn_type_value.lower() == "disbursement":
                            description = f"Loan disbursement - {loan_product_name}" if loan_product_name else "Loan disbursement"
                        elif txn_type_value.lower() in ["processing fee", "processingfee"]:
                            description = "Loan processing charges"
                        elif txn_type_value.lower() in ["late fee", "latefee"]:
                            description = "Late payment charge"
                        else:
                            description = txn_type_value
                        
                        # Format reference number
                        txn_id = txn.get("id")
                        reference = f"TXN-{str(txn_id).zfill(6)}" if txn_id else f"TXN-{str(txn.get('id', '')).zfill(6)}"
                        
                        all_transactions.append(
                            {
                                "id": txn_id,
                                "type": txn_type_value,
                                "amount": txn.get("amount"),
                                "date": date_str,
                                "accountType": "Loan",
                                "accountNo": loan_account_no,
                                "description": description,
                                "reference": reference,
                                "status": "Success",
                            }
                        )
                except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                    # Skip if we can't fetch transactions for this loan
                    continue
                except Exception as e:
                    # Catch any other unexpected errors and continue
                    logger.warning(f"Unexpected error fetching transactions for loan {loan_id}: {e}")
                    continue

        # Sort by date (most recent first)
        all_transactions.sort(key=lambda x: str(x.get("date", "")), reverse=True)
        # Limit total transactions to prevent huge responses
        all_transactions = all_transactions[:100]  # Max 100 total transactions

        response = JsonResponse({"transactions": all_transactions}, status=200)
        return add_cors_headers(response, request)
    except Exception as e:
        # Catch any unexpected errors and return proper response
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in transactions_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


def _fetch_all_transactions(client: MifosClient) -> list:
    """Helper function to fetch all transactions from savings and loans."""
    all_transactions = []
    
    try:
        savings_accounts = client.fetch_client_savings()
        loan_accounts = client.fetch_client_loans()
    except (MifosAuthError, MifosUpstreamError):
        return []
    
    # Fetch savings account transactions
    for savings_account in savings_accounts:
        savings_id = savings_account.get("id")
        if savings_id:
            try:
                savings_txns = client.fetch_savings_transactions(savings_id, limit=100)
                for txn in savings_txns:
                    date_value = txn.get("date")
                    if isinstance(date_value, list) and len(date_value) == 3:
                        date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
                    else:
                        date_str = date_value
                    
                    all_transactions.append({
                        "id": txn.get("id"),
                        "type": txn.get("transactionType", {}).get("value", "Unknown") if isinstance(txn.get("transactionType"), dict) else txn.get("transactionType", "Unknown"),
                        "amount": txn.get("amount"),
                        "date": date_str,
                        "accountType": "Savings",
                        "accountNo": savings_account.get("accountNo"),
                        "description": txn.get("transactionType", {}).get("value", "Unknown") if isinstance(txn.get("transactionType"), dict) else txn.get("transactionType", "Unknown"),
                        "reference": f"TXN-{str(txn.get('id', '')).zfill(6)}",
                        "status": "Success",
                    })
            except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                continue
    
    # Fetch loan account transactions
    for loan_account in loan_accounts:
        loan_id = loan_account.get("id")
        loan_account_no = loan_account.get("accountNo")
        loan_product_name = loan_account.get("loanProductName", "")
        if loan_id:
            try:
                loan_txns = client.fetch_loan_transactions(loan_id)
                for txn in loan_txns:
                    txn_type = txn.get("type", {})
                    if isinstance(txn_type, dict):
                        txn_type_value = txn_type.get("value", "Unknown")
                    else:
                        txn_type_value = txn_type or "Unknown"
                    
                    if txn_type_value.lower() in ["accrual", "waive", "writeoff"]:
                        continue
                    
                    date_value = txn.get("date")
                    month_year = ""
                    if isinstance(date_value, list) and len(date_value) == 3:
                        date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
                        month_names = ["", "January", "February", "March", "April", "May", "June",
                                     "July", "August", "September", "October", "November", "December"]
                        if 1 <= date_value[1] <= 12:
                            month_year = f"{month_names[date_value[1]]} {date_value[0]}"
                    else:
                        date_str = date_value or "—"
                    
                    description = ""
                    if txn_type_value.lower() == "repayment":
                        description = f"EMI Payment for {month_year}" if month_year else "EMI Payment"
                    elif txn_type_value.lower() == "disbursement":
                        description = f"Loan disbursement - {loan_product_name}" if loan_product_name else "Loan disbursement"
                    elif txn_type_value.lower() in ["processing fee", "processingfee"]:
                        description = "Loan processing charges"
                    elif txn_type_value.lower() in ["late fee", "latefee"]:
                        description = "Late payment charge"
                    else:
                        description = txn_type_value
                    
                    txn_id = txn.get("id")
                    reference = f"TXN-{str(txn_id).zfill(6)}" if txn_id else f"TXN-{str(txn.get('id', '')).zfill(6)}"
                    
                    all_transactions.append({
                        "id": txn_id,
                        "type": txn_type_value,
                        "amount": txn.get("amount"),
                        "date": date_str,
                        "accountType": "Loan",
                        "accountNo": loan_account_no,
                        "description": description,
                        "reference": reference,
                        "status": "Success",
                    })
            except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                continue
    
    # Sort by date (most recent first)
    all_transactions.sort(key=lambda x: str(x.get("date", "")), reverse=True)
    return all_transactions


def _apply_transaction_filters(transactions: list, search_query: str = "", transaction_type: str = "all", loan_account: str = "all") -> list:
    """Apply filters to transactions list."""
    filtered = list(transactions)
    
    # Search filter
    if search_query:
        query = search_query.lower()
        filtered = [txn for txn in filtered if 
                   (txn.get("reference", "").lower().find(query) != -1) or
                   (txn.get("description", "").lower().find(query) != -1) or
                   (txn.get("type", "").lower().find(query) != -1)]
    
    # Transaction type filter
    if transaction_type and transaction_type != "all":
        filtered = [txn for txn in filtered if txn.get("type", "").lower() == transaction_type.lower()]
    
    # Loan account filter
    if loan_account and loan_account != "all":
        filtered = [txn for txn in filtered if str(txn.get("accountNo", "")) == str(loan_account)]
    
    return filtered


def download_transactions_statement(request: HttpRequest):
    """Generate and download transaction statement as CSV with filters applied."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    # Get filter parameters from query string
    search_query = request.GET.get("search", "")
    transaction_type = request.GET.get("type", "all")
    loan_account = request.GET.get("account", "all")
    
    client = MifosClient()
    try:
        all_transactions = _fetch_all_transactions(client)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch transactions for statement", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)
    
    # Apply filters
    filtered_transactions = _apply_transaction_filters(all_transactions, search_query, transaction_type, loan_account)
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Transaction Statement"])
    writer.writerow([f"Generated: {date.today().strftime('%Y-%m-%d')}"])
    if search_query:
        writer.writerow([f"Search: {search_query}"])
    if transaction_type != "all":
        writer.writerow([f"Transaction Type: {transaction_type}"])
    if loan_account != "all":
        writer.writerow([f"Loan Account: {loan_account}"])
    writer.writerow([])  # Empty row
    
    # Write column headers
    writer.writerow([
        "Date",
        "Type",
        "Loan Account",
        "Description",
        "Amount",
        "Status",
        "Reference"
    ])
    
    # Write data rows
    for txn in filtered_transactions:
        amount = txn.get("amount", 0)
        amount_str = f"₹{amount:,.2f}"
        if amount > 0:
            amount_str = f"+{amount_str}"
        
        writer.writerow([
            txn.get("date", "—"),
            txn.get("type", "—"),
            txn.get("accountNo", "—"),
            txn.get("description", "—"),
            amount_str,
            txn.get("status", "Success"),
            txn.get("reference", "—"),
        ])
    
    # Calculate summary
    # Credit: Money coming IN to the client (Disbursement - bank gives money)
    # Debit: Money going OUT from the client (Repayment, Fees - client pays money)
    total_credit = 0
    total_debit = 0
    
    for txn in filtered_transactions:
        amount = abs(txn.get("amount", 0))
        txn_type = (txn.get("type", "") or "").lower()
        
        if txn_type == "disbursement":
            # Disbursement = bank gives money to client = Credit
            total_credit += amount
        elif txn_type == "repayment" or "fee" in txn_type or "charge" in txn_type:
            # Repayment, Fees, Charges = client pays money = Debit
            total_debit += amount
        else:
            # For other types, use sign of amount
            if txn.get("amount", 0) > 0:
                total_credit += amount
            else:
                total_debit += abs(txn.get("amount", 0))
    
    # Remaining: From client's perspective, how much they still owe
    # Remaining = Total Credit (received) - Total Debit (paid back)
    remaining = total_credit - total_debit
    
    writer.writerow([])
    writer.writerow(["Summary"])
    writer.writerow([f"Total Transactions: {len(filtered_transactions)}"])
    writer.writerow([f"Total Credit (Money Received): ₹{total_credit:,.2f}"])
    writer.writerow([f"Total Debit (Money Paid): ₹{total_debit:,.2f}"])
    writer.writerow([f"Remaining (Amount Owed): ₹{remaining:,.2f}"])
    
    # Prepare response
    output.seek(0)
    response = HttpResponse(output.getvalue(), content_type="text/csv")
    filename = f"transaction_statement_{date.today().strftime('%Y%m%d')}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def loan_details_view(request: HttpRequest, loan_id: int):
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        loan_data = client.fetch_loan_details(loan_id)
    except MifosNotFoundError:
        correlation_id = new_correlation_id()
        logger.info("Loan not found", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "not_found", "correlation_id": correlation_id}, status=404)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan details", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    # Extract loan information
    status_obj = loan_data.get("status", {})
    status_value = status_obj.get("value") if isinstance(status_obj, dict) else status_obj

    # Calculate interest rate (annualized)
    interest_rate = loan_data.get("interestRatePerPeriod")
    repayment_frequency = loan_data.get("repaymentFrequencyType", {})
    if isinstance(repayment_frequency, dict):
        freq_value = repayment_frequency.get("value", "")
    else:
        freq_value = str(repayment_frequency) if repayment_frequency else ""

    if interest_rate and "month" in freq_value.lower():
        interest_rate_annual = interest_rate * 12
    else:
        interest_rate_annual = interest_rate

    # Get repayment schedule
    repayment_schedule = loan_data.get("repaymentSchedule", {})
    periods = repayment_schedule.get("periods", []) if repayment_schedule else []
    
    # Get transactions to find payment dates and references
    transactions = loan_data.get("transactions", []) or loan_data.get("transactionHistory", [])
    
    # Create a map of transaction dates by period (if available)
    # For now, we'll use the due date as payment date for completed periods
    transaction_map = {}
    for txn in transactions:
        txn_type = txn.get("type", {})
        if isinstance(txn_type, dict):
            txn_type_value = txn_type.get("value", "")
        else:
            txn_type_value = str(txn_type) if txn_type else ""
        
        # Map repayment transactions
        if "repayment" in txn_type_value.lower():
            date_value = txn.get("date")
            if isinstance(date_value, list) and len(date_value) == 3:
                date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
            else:
                date_str = date_value
            
            # Try to match with period (simplified - in real system would match by amount/date)
            transaction_map[date_str] = {
                "date": date_str,
                "reference": txn.get("id") or f"PAY-{str(txn.get('id', '')).zfill(6)}"
            }

    # Build EMI schedule
    emi_schedule = []
    for idx, period in enumerate(periods, start=1):
        due_date = period.get("dueDate")
        if isinstance(due_date, list) and len(due_date) == 3:
            due_date_str = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
        else:
            due_date_str = due_date or "—"

        is_complete = period.get("complete", False)
        
        # Find matching transaction for completed periods
        payment_info = None
        if is_complete:
            # Try to find transaction by date
            payment_info = transaction_map.get(due_date_str)
            if not payment_info:
                # Use due date as payment date if no transaction found
                payment_info = {"date": due_date_str, "reference": f"PAY-{str(period.get('id', idx)).zfill(6)}"}

        emi_schedule.append({
            "period": idx,
            "emiNumber": idx,
            "dueDate": due_date_str,
            "totalDueForPeriod": period.get("totalDueForPeriod"),
            "emiAmount": period.get("totalDueForPeriod"),
            "principalDue": period.get("principalDue"),
            "principal": period.get("principalDue"),
            "interestDue": period.get("interestDue"),
            "interest": period.get("interestDue"),
            "complete": is_complete,
            "paymentDate": payment_info.get("date") if payment_info and isinstance(payment_info, dict) else None,
            "reference": payment_info.get("reference") if payment_info and isinstance(payment_info, dict) else None,
        })

    # Calculate summary stats
    total_emis = len(periods)
    paid_emis = len([p for p in periods if p.get("complete")])
    
    # Get EMI amount from first period or incomplete period
    emi_amount = None
    for period in periods:
        if period.get("totalDueForPeriod"):
            emi_amount = period.get("totalDueForPeriod")
            break

    # Get next repayment date
    next_repayment = None
    for period in periods:
        if not period.get("complete"):
            due_date = period.get("dueDate")
            if isinstance(due_date, list) and len(due_date) == 3:
                next_repayment = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
            break

    loan = {
        "id": loan_data.get("id"),
        "accountNo": loan_data.get("accountNo"),
        "productName": loan_data.get("loanProductName"),
        "status": status_value,
        "principal": loan_data.get("principal"),
        "outstanding": loan_data.get("totalOutstanding"),
        "nextRepaymentDate": next_repayment,
        "interestRate": round(interest_rate_annual, 2) if interest_rate_annual else None,
        "tenure": loan_data.get("numberOfRepayments") or total_emis,
        "emiAmount": emi_amount,
        "paidEMIs": paid_emis,
        "remainingEMIs": total_emis - paid_emis if total_emis > 0 else 0,
    }

    response = JsonResponse({"loan": loan, "emiSchedule": emi_schedule}, status=200)
    return add_cors_headers(response, request)


def download_loan_statement(request: HttpRequest, loan_id: int):
    """Generate and download loan statement as HTML (printable as PDF)."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        loan_data = client.fetch_loan_details(loan_id)
    except MifosNotFoundError:
        correlation_id = new_correlation_id()
        logger.info("Loan not found for statement", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "not_found", "correlation_id": correlation_id}, status=404)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan data for statement", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    # Extract loan information
    status_obj = loan_data.get("status", {})
    status_value = status_obj.get("value") if isinstance(status_obj, dict) else status_obj

    # Get transactions
    transactions = loan_data.get("transactions", []) or loan_data.get("transactionHistory", [])
    
    # Format transactions for statement
    statement_transactions = []
    for txn in transactions:
        txn_type = txn.get("type", {})
        if isinstance(txn_type, dict):
            txn_type_value = txn_type.get("value", "")
        else:
            txn_type_value = str(txn_type) if txn_type else ""

        date_value = txn.get("date")
        if isinstance(date_value, list) and len(date_value) == 3:
            date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
        else:
            date_str = date_value or "—"

        statement_transactions.append({
            "date": date_str,
            "type": txn_type_value,
            "amount": txn.get("amount", 0),
            "principal": txn.get("principalPortion", 0),
            "interest": txn.get("interestPortion", 0),
            "reference": txn.get("id") or f"TXN-{str(txn.get('id', '')).zfill(6)}",
        })

    # Sort transactions by date (most recent first)
    statement_transactions.sort(key=lambda x: str(x.get("date", "")), reverse=True)

    # Calculate interest rate
    interest_rate = loan_data.get("interestRatePerPeriod")
    repayment_frequency = loan_data.get("repaymentFrequencyType", {})
    if isinstance(repayment_frequency, dict):
        freq_value = repayment_frequency.get("value", "")
    else:
        freq_value = str(repayment_frequency) if repayment_frequency else ""

    if interest_rate and "month" in freq_value.lower():
        interest_rate_annual = interest_rate * 12
    else:
        interest_rate_annual = interest_rate

    # Generate HTML statement
    account_no = loan_data.get("accountNo", loan_id)
    
    # Get EMI amount and next payment date
    repayment_schedule = loan_data.get("repaymentSchedule", {})
    periods = repayment_schedule.get("periods", []) if repayment_schedule else []
    emi_amount = "N/A"
    next_payment = "N/A"
    if periods and len(periods) > 0:
        first_period = periods[0]
        if first_period.get("totalDueForPeriod"):
            emi_amount = f"₹{first_period.get('totalDueForPeriod', 0):,.2f}"
        
        # Find next incomplete period
        for period in periods:
            if not period.get("complete"):
                due_date = period.get("dueDate")
                if isinstance(due_date, list) and len(due_date) == 3:
                    next_payment = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
                elif due_date:
                    next_payment = str(due_date)
                break
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Loan Statement - {account_no}</title>
    <style>
        @media print {{
            @page {{
                margin: 1cm;
            }}
        }}
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }}
        .header {{
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #1976d2;
            margin: 0;
        }}
        .header p {{
            margin: 5px 0;
            color: #666;
        }}
        .loan-info {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .info-section {{
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }}
        .info-section h3 {{
            margin-top: 0;
            color: #1976d2;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .label {{
            font-weight: 600;
            color: #666;
        }}
        .value {{
            color: #333;
        }}
        .transactions-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        .transactions-table th {{
            background: #1976d2;
            color: white;
            padding: 12px;
            text-align: left;
        }}
        .transactions-table td {{
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
        }}
        .transactions-table tr:nth-child(even) {{
            background: #f9f9f9;
        }}
        .amount {{
            text-align: right;
            font-weight: 500;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Loan Statement</h1>
        <p><strong>Account Number:</strong> {account_no}</p>
        <p><strong>Loan Product:</strong> {loan_data.get("loanProductName", "N/A")}</p>
        <p><strong>Statement Date:</strong> {date.today().strftime("%Y-%m-%d")}</p>
    </div>

    <div class="loan-info">
        <div class="info-section">
            <h3>Loan Details</h3>
            <div class="info-row">
                <span class="label">Principal Amount:</span>
                <span class="value">₹{loan_data.get("principal", 0):,.2f}</span>
            </div>
            <div class="info-row">
                <span class="label">Outstanding Balance:</span>
                <span class="value">₹{loan_data.get("totalOutstanding", 0):,.2f}</span>
            </div>
            <div class="info-row">
                <span class="label">Interest Rate:</span>
                <span class="value">{round(interest_rate_annual, 2) if interest_rate_annual else "N/A"}% p.a.</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">{status_value}</span>
            </div>
        </div>

        <div class="info-section">
            <h3>Repayment Summary</h3>
            <div class="info-row">
                <span class="label">Total EMIs:</span>
                <span class="value">{loan_data.get("numberOfRepayments", 0)}</span>
            </div>
            <div class="info-row">
                <span class="label">EMI Amount:</span>
                <span class="value">{emi_amount}</span>
            </div>
            <div class="info-row">
                <span class="label">Next Payment Date:</span>
                <span class="value">{next_payment}</span>
            </div>
        </div>
    </div>

    <h2>Transaction History</h2>
    <table class="transactions-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Amount</th>
                <th>Reference</th>
            </tr>
        </thead>
        <tbody>
"""

    for txn in statement_transactions:
        html_content += f"""
            <tr>
                <td>{txn["date"]}</td>
                <td>{txn["type"]}</td>
                <td class="amount">₹{txn["principal"]:,.2f}</td>
                <td class="amount">₹{txn["interest"]:,.2f}</td>
                <td class="amount">₹{txn["amount"]:,.2f}</td>
                <td>{txn["reference"]}</td>
            </tr>
"""

    html_content += f"""
        </tbody>
    </table>

    <div class="footer">
        <p>This is a computer-generated statement. No signature is required.</p>
        <p>Generated on {date.today().strftime("%B %d, %Y")}</p>
    </div>
</body>
</html>
"""

    response = HttpResponse(html_content, content_type="text/html")
    response["Content-Disposition"] = f'attachment; filename="loan_statement_{account_no}_{date.today().strftime("%Y%m%d")}.html"'
    return response


def download_repayment_schedule(request: HttpRequest, loan_id: int):
    """Generate and download repayment schedule as CSV."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        loan_data = client.fetch_loan_details(loan_id)
    except MifosNotFoundError:
        correlation_id = new_correlation_id()
        logger.info("Loan not found for schedule", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "not_found", "correlation_id": correlation_id}, status=404)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan data for schedule", extra={"correlation_id": correlation_id, "loan_id": loan_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)

    # Get repayment schedule
    repayment_schedule = loan_data.get("repaymentSchedule", {})
    periods = repayment_schedule.get("periods", []) if repayment_schedule else []
    
    # Get transactions for payment dates and references
    transactions = loan_data.get("transactions", []) or loan_data.get("transactionHistory", [])
    
    transaction_map = {}
    for txn in transactions:
        txn_type = txn.get("type", {})
        if isinstance(txn_type, dict):
            txn_type_value = txn_type.get("value", "")
        else:
            txn_type_value = str(txn_type) if txn_type else ""
        
        if "repayment" in txn_type_value.lower():
            date_value = txn.get("date")
            if isinstance(date_value, list) and len(date_value) == 3:
                date_str = f"{date_value[0]}-{date_value[1]:02d}-{date_value[2]:02d}"
            else:
                date_str = date_value
            
            transaction_map[date_str] = {
                "date": date_str,
                "reference": txn.get("id") or f"PAY-{str(txn.get('id', '')).zfill(6)}"
            }

    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    account_no = loan_data.get("accountNo", loan_id)
    writer.writerow(["Loan Repayment Schedule"])
    writer.writerow([f"Account Number: {account_no}"])
    writer.writerow([f"Loan Product: {loan_data.get('loanProductName', 'N/A')}"])
    writer.writerow([f"Generated: {date.today().strftime('%Y-%m-%d')}"])
    writer.writerow([])  # Empty row
    
    # Write column headers
    writer.writerow([
        "EMI #",
        "Due Date",
        "EMI Amount",
        "Principal",
        "Interest",
        "Status",
        "Payment Date",
        "Reference"
    ])
    
    # Write data rows
    for idx, period in enumerate(periods, start=1):
        due_date = period.get("dueDate")
        if isinstance(due_date, list) and len(due_date) == 3:
            due_date_str = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
        else:
            due_date_str = due_date or "—"

        is_complete = period.get("complete", False)
        status = "Paid" if is_complete else "Pending"
        
        payment_info = None
        if is_complete:
            payment_info = transaction_map.get(due_date_str)
            if not payment_info:
                payment_info = {"date": due_date_str, "reference": f"PAY-{str(period.get('id', idx)).zfill(6)}"}

        writer.writerow([
            idx,
            due_date_str,
            f"₹{period.get('totalDueForPeriod', 0):,.2f}",
            f"₹{period.get('principalDue', 0):,.2f}",
            f"₹{period.get('interestDue', 0):,.2f}",
            status,
            payment_info.get("date") if payment_info and isinstance(payment_info, dict) else "—",
            payment_info.get("reference") if payment_info and isinstance(payment_info, dict) else "—",
        ])

    # Prepare response
    output.seek(0)
    response = HttpResponse(output.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="repayment_schedule_{account_no}_{date.today().strftime("%Y%m%d")}.csv"'
    return response


def notifications_view(request: HttpRequest):
    """Fetch notifications for the client based on their loans and transactions."""
    try:
        user, error_response = _require_session(request)
        if error_response:
            return error_response

        client = MifosClient()
        notifications = []

        try:
            # Fetch loans to generate EMI due reminders
            loan_accounts = client.fetch_client_loans()
        except (MifosAuthError, MifosUpstreamError) as exc:
            correlation_id = new_correlation_id()
            logger.exception("Failed to fetch loans for notifications", extra={"correlation_id": correlation_id})
            response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
            return add_cors_headers(response, request)
        
        # Limit to first 10 loans to prevent timeout
        for loan in loan_accounts[:10]:
            loan_account_no = loan.get("accountNo")
            loan_id = loan.get("id")
            repayment_schedule = loan.get("repaymentSchedule", {})
            periods = repayment_schedule.get("periods", []) if repayment_schedule else []
            
            # Find next due EMI
            for period in periods:
                if not period.get("complete"):
                    due_date = period.get("dueDate")
                    if isinstance(due_date, list) and len(due_date) == 3:
                        due_date_str = f"{due_date[0]}-{due_date[1]:02d}-{due_date[2]:02d}"
                        emi_amount = period.get("totalDueForPeriod", 0)
                        
                        # Create EMI due reminder (unread if due within 30 days)
                        due_date_obj = date(due_date[0], due_date[1], due_date[2])
                        days_until_due = (due_date_obj - date.today()).days
                        
                        if days_until_due <= 30 and days_until_due >= -7:  # Due within 30 days or up to 7 days overdue
                            # Format date for display
                            month_names = ["", "January", "February", "March", "April", "May", "June",
                                         "July", "August", "September", "October", "November", "December"]
                            due_date_display = f"{month_names[due_date[1]]} {due_date[2]}, {due_date[0]}" if 1 <= due_date[1] <= 12 else due_date_str
                            
                            notifications.append({
                                "id": len(notifications) + 1,
                                "type": "EMI Due Reminder",
                                "title": "EMI Due Reminder",
                                "description": f"Your EMI of ₹{emi_amount:,.0f} for loan {loan_account_no} is due on {due_date_display}",
                                "timestamp": f"{date.today().strftime('%Y-%m-%d')} 09:00 AM",
                                "read": False,
                            })
                    break
        
        # Fetch transactions to generate payment received notifications
        # Use a simpler approach - just get recent transactions from loans directly
        recent_payments = []
        try:
            # Get transactions from first few loans only to prevent timeout
            for loan in loan_accounts[:5]:
                loan_id = loan.get("id")
                if loan_id:
                    try:
                        loan_txns = client.fetch_loan_transactions(loan_id)
                        # Filter for repayments and limit
                        repayments = [txn for txn in loan_txns[:20] if txn.get("type", {}).get("value", "").lower() == "repayment" or (isinstance(txn.get("type"), str) and txn.get("type", "").lower() == "repayment")]
                        recent_payments.extend(repayments[:5])
                        if len(recent_payments) >= 5:
                            break
                    except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                        continue
                    except Exception as e:
                        logger.warning(f"Error fetching transactions for loan {loan_id} in notifications: {e}")
                        continue
        except Exception as e:
            logger.warning(f"Error fetching transactions for notifications: {e}")
            # Continue without transaction-based notifications
        
        for idx, txn in enumerate(recent_payments[:5]):  # Limit to 5 payment notifications
            try:
                txn_date = txn.get('date', date.today())
                if isinstance(txn_date, str):
                    try:
                        txn_date_obj = date.fromisoformat(txn_date.split()[0])
                    except:
                        txn_date_obj = date.today() - timedelta(days=idx+5)
                elif isinstance(txn_date, list) and len(txn_date) == 3:
                    txn_date_obj = date(txn_date[0], txn_date[1], txn_date[2])
                else:
                    txn_date_obj = date.today() - timedelta(days=idx+5)
                
                # Get account number from loan if available
                account_no = txn.get('accountNo', 'N/A')
                if not account_no or account_no == 'N/A':
                    # Try to find account number from loan_accounts
                    for loan in loan_accounts:
                        if loan.get('id') == txn.get('loanId'):
                            account_no = loan.get('accountNo', 'N/A')
                            break
                
                time_str = "02:30 PM" if idx == 0 else "11:15 AM" if idx == 1 else "02:30 PM"
                amount = abs(txn.get('amount', 0))
                notifications.append({
                    "id": len(notifications) + 1,
                    "type": "Payment Received",
                    "title": "Payment Received",
                    "description": f"Your payment of ₹{amount:,.0f} for loan {account_no} has been successfully received",
                    "timestamp": f"{txn_date_obj.strftime('%Y-%m-%d')} {time_str}",
                    "read": True,
                })
            except Exception as e:
                logger.warning(f"Error processing payment notification {idx}: {e}")
                continue
        
        # Add some sample notifications
        if loan_accounts:
            loan_account_no = loan_accounts[0].get('accountNo', 'N/A')
            notifications.extend([
                {
                    "id": len(notifications) + 1,
                    "type": "Loan Account Updated",
                    "title": "Loan Account Updated",
                    "description": f"Your loan account {loan_account_no} details have been updated successfully",
                    "timestamp": f"{(date.today() - timedelta(days=16)).strftime('%Y-%m-%d')} 10:00 AM",
                    "read": True,
                },
                {
                    "id": len(notifications) + 1,
                    "type": "New Message",
                    "title": "New Message from Branch Officer",
                    "description": "Your loan officer has sent you a message regarding your loan application",
                    "timestamp": f"{(date.today() - timedelta(days=21)).strftime('%Y-%m-%d')} 03:45 PM",
                    "read": True,
                },
                {
                    "id": len(notifications) + 1,
                    "type": "Document Verification",
                    "title": "Document Verification Required",
                    "description": "Please submit your updated KYC documents at your nearest branch",
                    "timestamp": f"{(date.today() - timedelta(days=25)).strftime('%Y-%m-%d')} 09:30 AM",
                    "read": True,
                },
            ])
        
        # Sort by timestamp (most recent first)
        notifications.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        response = JsonResponse({"notifications": notifications}, status=200)
        return add_cors_headers(response, request)
    except Exception as e:
        # Catch any unexpected errors and return proper response
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in notifications_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def mark_notification_read_view(request: HttpRequest, notification_id: int):
    """Mark a specific notification as read."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    # In a real system, this would update the database
    # For now, just return success
    response = JsonResponse({"success": True}, status=200)
    return add_cors_headers(response, request)


@csrf_exempt
def mark_all_notifications_read_view(request: HttpRequest):
    """Mark all notifications as read."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    # In a real system, this would update the database
    # For now, just return success
    response = JsonResponse({"success": True}, status=200)
    return add_cors_headers(response, request)


@csrf_exempt
def delete_notification_view(request: HttpRequest, notification_id: int):
    """Delete a notification."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response
    
    # In a real system, this would delete from database
    # For now, just return success
    response = JsonResponse({"success": True}, status=200)
    return add_cors_headers(response, request)


def support_view(request: HttpRequest):
    """Fetch support information including loan officer and branch details."""
    try:
        user, error_response = _require_session(request)
        if error_response:
            return error_response

        client = MifosClient()
        
        try:
            # Fetch client bundle to get office and staff information
            bundle = client.fetch_client_bundle()
        except MifosNotFoundError:
            # Client doesn't exist - return empty support info
            response = JsonResponse({
                "loanOfficer": {},
                "branchInfo": {},
                "contactInfo": {
                    "tollFree": "1800-XXX-XXXX",
                    "email": "support@mfi.com",
                    "responseTime": "Within 24 hours"
                }
            }, status=200)
            return add_cors_headers(response, request)
        except (MifosAuthError, MifosUpstreamError) as exc:
            correlation_id = new_correlation_id()
            logger.exception("Failed to fetch support data", extra={"correlation_id": correlation_id})
            response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
            return add_cors_headers(response, request)

        # Extract office information
        office = bundle.get("office", {})
        office_name = office.get("name") or bundle.get("officeName") or "Branch Office"
        office_id = office.get("id")
        
        # Try to get office details if we have office ID
        office_details = {}
        if office_id:
            try:
                office_data = client.fetch_with_admin(f"/offices/{office_id}")
                office_details = {
                    "name": office_data.get("name") or office_name,
                    "code": office_data.get("externalId") or f"OFFICE-{office_id}",
                    "address": office_data.get("openingDate") or "",  # Fineract doesn't store address in office, use opening date as placeholder
                    "workingHours": "Mon - Sat: 9:00 AM - 6:00 PM"  # Default as Fineract doesn't store this
                }
            except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                # If we can't fetch office details, use basic info
                office_details = {
                    "name": office_name,
                    "code": f"OFFICE-{office_id}" if office_id else "N/A",
                    "address": "Contact branch for address",
                    "workingHours": "Mon - Sat: 9:00 AM - 6:00 PM"
                }
        else:
            office_details = {
                "name": office_name,
                "code": "N/A",
                "address": "Contact branch for address",
                "workingHours": "Mon - Sat: 9:00 AM - 6:00 PM"
            }

        # Extract staff/loan officer information
        # First try to get from client's staff assignment
        staff = bundle.get("staff", {})
        staff_id = staff.get("id")
        loan_officer_name_from_loan = None
        
        # If no staff on client, try to get from loans (loan officer)
        if not staff_id:
            try:
                loans_data = client.fetch_client_loans()
                # Find first loan with a loan officer
                for loan in loans_data:
                    loan_officer_id = loan.get("loanOfficerId")
                    loan_officer_name = loan.get("loanOfficerName")
                    if loan_officer_id:
                        staff_id = loan_officer_id
                        loan_officer_name_from_loan = loan_officer_name
                        break
            except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                pass
        
        # If we found staff_id (from client or loans), fetch details
        loan_officer = {}
        if staff_id:
            try:
                staff_data = client.fetch_with_admin(f"/staff/{staff_id}")
                loan_officer = {
                    "name": staff_data.get("displayName") or (staff_data.get("firstname", "") + " " + staff_data.get("lastname", "")).strip() or loan_officer_name_from_loan or "Loan Officer",
                    "employeeId": staff_data.get("externalId") or f"EMP-{staff_id}",
                    "phone": staff_data.get("mobileNo") or "N/A",
                    "email": staff_data.get("email") or "N/A"
                }
            except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                # If we can't fetch staff details, use basic info
                if loan_officer_name_from_loan:
                    # Use loan officer name from loan data
                    loan_officer = {
                        "name": loan_officer_name_from_loan,
                        "employeeId": f"EMP-{staff_id}",
                        "phone": "Contact branch",
                        "email": "Contact branch"
                    }
                else:
                    # Use info from client bundle
                    loan_officer = {
                        "name": (staff.get("displayName") or (staff.get("firstname", "") + " " + staff.get("lastname", "")).strip() or "Loan Officer"),
                        "employeeId": staff.get("externalId") or (f"EMP-{staff_id}" if staff_id else "N/A"),
                        "phone": staff.get("mobileNo") or "N/A",
                        "email": staff.get("email") or "N/A"
                    }
        else:
            # No staff assigned - use defaults
            loan_officer = {
                "name": "Not Assigned",
                "employeeId": "N/A",
                "phone": "Contact branch",
                "email": "Contact branch"
            }

        # Contact info (could be from config or defaults)
        contact_info = {
            "tollFree": "1800-XXX-XXXX",
            "email": "support@mfi.com",
            "responseTime": "Within 24 hours"
        }

        response = JsonResponse({
            "loanOfficer": loan_officer,
            "branchInfo": office_details,
            "contactInfo": contact_info
        }, status=200)
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in support_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def loan_products_view(request: HttpRequest):
    """Fetch available loan products for loan application."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        products = client.fetch_loan_products()
        response = JsonResponse({"products": products}, status=200)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan products", extra={"correlation_id": correlation_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in loan_products_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def loan_product_template_view(request: HttpRequest, product_id: int):
    """Fetch loan product template for creating a loan application."""
    user, error_response = _require_session(request)
    if error_response:
        return error_response

    client = MifosClient()
    try:
        template = client.fetch_loan_product_template(product_id)
        response = JsonResponse(template, status=200)
        return add_cors_headers(response, request)
    except (MifosAuthError, MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to fetch loan product template", extra={"correlation_id": correlation_id, "product_id": product_id})
        response = JsonResponse({"error": "upstream_unavailable", "details": str(exc), "correlation_id": correlation_id}, status=503)
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in loan_product_template_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def calculate_loan_schedule_view(request: HttpRequest):
    """Calculate loan repayment schedule."""
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"
        return response

    if request.method != "POST":
        response = JsonResponse({"error": "method_not_allowed"}, status=405)
        return add_cors_headers(response, request)

    user, error_response = _require_session(request)
    if error_response:
        return error_response

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        response = JsonResponse({"error": "invalid_json"}, status=400)
        return add_cors_headers(response, request)

    client = MifosClient()
    try:
        # Format dates properly
        from datetime import datetime
        date_format = body.get("dateFormat", "yyyy-MM-dd")
        locale = body.get("locale", "en")
        
        # Convert dates to Fineract format if needed
        for date_field in ["submittedOnDate", "expectedDisbursementDate", "repaymentsStartingFromDate", "interestChargedFromDate"]:
            if date_field in body and body[date_field]:
                if isinstance(body[date_field], str):
                    # Try to parse and format
                    try:
                        dt = datetime.fromisoformat(body[date_field].replace("Z", "+00:00"))
                        body[date_field] = dt.strftime("%Y-%m-%d")
                    except:
                        pass
        
        body["dateFormat"] = date_format
        body["locale"] = locale
        
        try:
            schedule = client.calculate_loan_schedule(body)
            response = JsonResponse(schedule, status=200)
            return add_cors_headers(response, request)
        except requests.exceptions.Timeout:
            # Handle timeout specifically to return proper CORS headers
            correlation_id = new_correlation_id()
            logger.error(f"Timeout calculating loan schedule after 30 seconds", extra={
                "correlation_id": correlation_id,
            })
            response = JsonResponse({
                "error": "schedule_calculation_timeout",
                "details": "The schedule calculation request timed out. Please try again. If the problem persists, the Fineract server may be experiencing high load.",
                "correlation_id": correlation_id
            }, status=504)  # 504 Gateway Timeout
            return add_cors_headers(response, request)
    except MifosUpstreamError as upstream_exc:
        # Check if it's a timeout error (wrapped in MifosUpstreamError)
        error_str = str(upstream_exc)
        if "timed out" in error_str.lower() or "timeout" in error_str.lower():
            correlation_id = new_correlation_id()
            logger.error(f"Timeout calculating loan schedule: {upstream_exc}", extra={
                "correlation_id": correlation_id,
            })
            response = JsonResponse({
                "error": "schedule_calculation_timeout",
                "details": "The schedule calculation request timed out. Please try again. If the problem persists, the Fineract server may be experiencing high load.",
                "correlation_id": correlation_id
            }, status=504)  # 504 Gateway Timeout
            return add_cors_headers(response, request)
        # Handle other upstream errors
        correlation_id = new_correlation_id()
        logger.exception("Failed to calculate loan schedule", extra={"correlation_id": correlation_id})
        error_msg = str(upstream_exc)
        # Extract user-friendly error message if available
        if hasattr(upstream_exc, 'response') and hasattr(upstream_exc.response, 'text'):
            try:
                error_data = json.loads(upstream_exc.response.text)
                error_msg = error_data.get("defaultUserMessage", error_data.get("developerMessage", str(upstream_exc)))
            except:
                pass
        response = JsonResponse({"error": "calculation_failed", "details": error_msg, "correlation_id": correlation_id}, status=400)
        return add_cors_headers(response, request)
    except MifosAuthError as exc:
        correlation_id = new_correlation_id()
        logger.exception("Failed to calculate loan schedule", extra={"correlation_id": correlation_id})
        error_msg = str(exc)
        response = JsonResponse({"error": "calculation_failed", "details": error_msg, "correlation_id": correlation_id}, status=400)
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in calculate_loan_schedule_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def submit_loan_application_view(request: HttpRequest):
    """Submit a new loan application."""
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"
        return response

    if request.method != "POST":
        response = JsonResponse({"error": "method_not_allowed"}, status=405)
        return add_cors_headers(response, request)

    user, error_response = _require_session(request)
    if error_response:
        return error_response

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        response = JsonResponse({"error": "invalid_json"}, status=400)
        return add_cors_headers(response, request)

    client = MifosClient()
    try:
        # Format dates properly
        from datetime import datetime
        date_format = body.get("dateFormat", "yyyy-MM-dd")
        locale = body.get("locale", "en")
        
        # clientId will be set by MifosClient from session if not provided
        # No need to validate it here - MifosClient will handle it
        
        # Convert dates to Fineract format if needed (handle both ISO and YYYY-MM-DD formats)
        for date_field in ["submittedOnDate", "expectedDisbursementDate", "repaymentsStartingFromDate", "interestChargedFromDate"]:
            if date_field in body and body[date_field]:
                if isinstance(body[date_field], str):
                    try:
                        # Try parsing as ISO format first
                        if "T" in body[date_field] or "Z" in body[date_field]:
                            dt = datetime.fromisoformat(body[date_field].replace("Z", "+00:00"))
                            body[date_field] = dt.strftime("%Y-%m-%d")
                        # If already in YYYY-MM-DD format, validate it
                        elif len(body[date_field]) == 10 and body[date_field].count("-") == 2:
                            # Already in correct format, just validate
                            datetime.strptime(body[date_field], "%Y-%m-%d")
                        else:
                            # Try other common formats
                            dt = datetime.strptime(body[date_field], "%Y-%m-%d")
                            body[date_field] = dt.strftime("%Y-%m-%d")
                    except (ValueError, AttributeError) as e:
                        logger.warning(f"Failed to parse date field {date_field}: {body[date_field]}, error: {e}")
                        # Keep original value if parsing fails
        
        body["dateFormat"] = date_format
        body["locale"] = locale
        
        # Convert principalAmount to principal if present (frontend might send either)
        if "principalAmount" in body and "principal" not in body:
            body["principal"] = body.pop("principalAmount")
        elif "principalAmount" in body and "principal" in body:
            # If both exist, use principal and remove principalAmount
            body.pop("principalAmount")
        
        # Ensure principal is a number
        if "principal" in body:
            try:
                body["principal"] = float(body["principal"])
            except (ValueError, TypeError):
                response = JsonResponse({"error": "invalid_principal", "details": "Principal amount must be a valid number"}, status=400)
                return add_cors_headers(response, request)
        
        # Convert loanTermFrequency if it's not set (calculate from numberOfRepayments * repaymentEvery)
        if "loanTermFrequency" not in body or body.get("loanTermFrequency") is None or body.get("loanTermFrequency") == "":
            numberOfRepayments = body.get("numberOfRepayments", 0)
            repaymentEvery = body.get("repaymentEvery", 0)
            if numberOfRepayments and repaymentEvery:
                try:
                    body["loanTermFrequency"] = int(numberOfRepayments) * int(repaymentEvery)
                except (ValueError, TypeError):
                    pass
        
        # Ensure loanTermFrequency is an integer
        if "loanTermFrequency" in body and body["loanTermFrequency"] is not None:
            try:
                body["loanTermFrequency"] = int(body["loanTermFrequency"])
            except (ValueError, TypeError):
                response = JsonResponse({
                    "error": "invalid_field_value",
                    "details": f"Field 'loanTermFrequency' must be a valid integer",
                    "field": "loanTermFrequency",
                    "value": body["loanTermFrequency"]
                }, status=400)
                return add_cors_headers(response, request)
        
        # Ensure loanType is set
        if "loanType" not in body:
            body["loanType"] = "individual"
        
        # Validate required fields before sending to Fineract
        # Use 'in' check instead of truthiness to allow 0 values
        # Note: interestRateFrequencyType is required by Fineract but may be empty string
        required_fields = [
            "productId", "principal", "numberOfRepayments", "repaymentEvery",
            "repaymentFrequencyType", "loanTermFrequency", "loanTermFrequencyType",
            "interestRatePerPeriod", "interestRateFrequencyType", "interestType", "amortizationType",
            "interestCalculationPeriodType", "transactionProcessingStrategyCode",
            "expectedDisbursementDate", "submittedOnDate"
        ]
        missing_fields = [field for field in required_fields if field not in body or body[field] is None or body[field] == ""]
        if missing_fields:
            response = JsonResponse({
                "error": "missing_required_fields",
                "details": f"Missing required fields: {', '.join(missing_fields)}",
                "missing_fields": missing_fields
            }, status=400)
            return add_cors_headers(response, request)
        
        # Ensure productId and clientId are integers
        if "productId" in body and body["productId"] is not None:
            try:
                body["productId"] = int(body["productId"])
            except (ValueError, TypeError):
                response = JsonResponse({
                    "error": "invalid_field_value",
                    "details": f"Field 'productId' must be a valid integer",
                    "field": "productId",
                    "value": body["productId"]
                }, status=400)
                return add_cors_headers(response, request)
        
        if "clientId" in body and body["clientId"] is not None:
            try:
                body["clientId"] = int(body["clientId"])
            except (ValueError, TypeError):
                response = JsonResponse({
                    "error": "invalid_field_value",
                    "details": f"Field 'clientId' must be a valid integer",
                    "field": "clientId",
                    "value": body["clientId"]
                }, status=400)
                return add_cors_headers(response, request)
        
        # Ensure numeric fields are numbers, not strings
        numeric_fields = ["principal", "numberOfRepayments", "repaymentEvery", "loanTermFrequency", "interestRatePerPeriod"]
        for field in numeric_fields:
            if field in body and body[field] is not None and body[field] != "":
                try:
                    if field == "principal" or field == "interestRatePerPeriod":
                        body[field] = float(body[field])
                    else:
                        body[field] = int(body[field])
                except (ValueError, TypeError) as e:
                    response = JsonResponse({
                        "error": "invalid_field_value",
                        "details": f"Field '{field}' must be a valid number. Got: {body[field]} (type: {type(body[field]).__name__})",
                        "field": field,
                        "value": body[field]
                    }, status=400)
                    return add_cors_headers(response, request)
        
        # Ensure enum fields are integers
        enum_fields = ["repaymentFrequencyType", "loanTermFrequencyType", "interestRateFrequencyType", 
                      "interestType", "amortizationType", "interestCalculationPeriodType"]
        for field in enum_fields:
            if field in body and body[field] is not None and body[field] != "":
                try:
                    body[field] = int(body[field])
                except (ValueError, TypeError):
                    response = JsonResponse({
                        "error": "invalid_field_value",
                        "details": f"Field '{field}' must be a valid integer",
                        "field": field,
                        "value": body[field]
                    }, status=400)
                    return add_cors_headers(response, request)
        
        # Log the FULL request payload for debugging - print directly to ensure it shows in logs
        import json as json_module
        payload_str = json_module.dumps(body, default=str, indent=2)
        logger.info(f"Submitting loan application - FULL PAYLOAD:\n{payload_str}")
        logger.info("Submitting loan application - FULL PAYLOAD", extra={
            "full_payload": payload_str,
            "productId": body.get("productId"),
            "principal": body.get("principal"),
            "clientId": body.get("clientId"),
            "loanType": body.get("loanType"),
            "numberOfRepayments": body.get("numberOfRepayments"),
            "repaymentEvery": body.get("repaymentEvery"),
            "repaymentFrequencyType": body.get("repaymentFrequencyType"),
            "loanTermFrequency": body.get("loanTermFrequency"),
            "loanTermFrequencyType": body.get("loanTermFrequencyType"),
            "interestRatePerPeriod": body.get("interestRatePerPeriod"),
            "interestRateFrequencyType": body.get("interestRateFrequencyType"),
            "interestType": body.get("interestType"),
            "amortizationType": body.get("amortizationType"),
            "interestCalculationPeriodType": body.get("interestCalculationPeriodType"),
            "transactionProcessingStrategyCode": body.get("transactionProcessingStrategyCode"),
        })
        
        try:
            result = client.submit_loan_application(body)
            response = JsonResponse(result, status=200)
            return add_cors_headers(response, request)
        except MifosUpstreamError as upstream_exc:
            # Check if it's a timeout error (wrapped in MifosUpstreamError)
            error_str = str(upstream_exc)
            if "timed out" in error_str.lower() or "timeout" in error_str.lower():
                correlation_id = new_correlation_id()
                logger.error(f"Timeout submitting loan application to Fineract: {upstream_exc}", extra={
                    "correlation_id": correlation_id,
                })
                response = JsonResponse({
                    "error": "submission_timeout",
                    "details": "The loan application submission request timed out. This is a known limitation of the demo server (demo.mifos.io) which is slow and overloaded. Your application may still have been submitted successfully - please check your loan list to verify. For production use, please use a self-hosted Fineract instance for better performance.",
                    "correlation_id": correlation_id,
                    "demo_server_limitation": True
                }, status=504)  # 504 Gateway Timeout
                return add_cors_headers(response, request)
            # Re-raise other upstream errors to be handled by outer handler
            raise
        except Exception as submit_exc:
            # Log the actual exception before re-raising
            correlation_id = new_correlation_id()
            logger.exception("Exception in submit_loan_application call", extra={
                "correlation_id": correlation_id,
                "error": str(submit_exc),
                "error_type": type(submit_exc).__name__,
                "payload_sent": json.dumps(body, default=str)
            })
            # Don't re-raise - handle it here to ensure CORS headers are set
            response = JsonResponse({
                "error": "submission_failed",
                "details": f"An error occurred while submitting the loan application: {str(submit_exc)}",
                "correlation_id": correlation_id
            }, status=500)
            return add_cors_headers(response, request)
    except MifosAuthError as exc:
        correlation_id = new_correlation_id()
        logger.warning("Client ID mismatch in loan application", extra={"correlation_id": correlation_id, "error": str(exc)})
        response = JsonResponse({"error": "unauthorized", "details": str(exc), "correlation_id": correlation_id}, status=403)
        return add_cors_headers(response, request)
    except (MifosUpstreamError) as exc:
        correlation_id = new_correlation_id()
        error_msg = str(exc)
        # Check if it's a timeout error that wasn't caught by inner handler
        if "timed out" in error_msg.lower() or "timeout" in error_msg.lower():
            logger.error(f"Timeout submitting loan application to Fineract: {exc}", extra={
                "correlation_id": correlation_id,
            })
            response = JsonResponse({
                "error": "submission_timeout",
                "details": "The loan application request timed out. Please try again. If the problem persists, the Fineract server may be experiencing high load.",
                "correlation_id": correlation_id
            }, status=504)  # 504 Gateway Timeout
            return add_cors_headers(response, request)
        logger.exception("Failed to submit loan application", extra={"correlation_id": correlation_id, "error": error_msg, "request_body": body})
        # The error message from MifosUpstreamError should already contain detailed Fineract error
        # Determine status code based on error message
        status_code = 400
        if "500" in error_msg or "Internal Server Error" in error_msg:
            status_code = 500
        elif "403" in error_msg or "Forbidden" in error_msg:
            status_code = 403
        response = JsonResponse({"error": "submission_failed", "details": error_msg, "correlation_id": correlation_id}, status=status_code)
        return add_cors_headers(response, request)
    except Exception as e:
        correlation_id = new_correlation_id()
        logger.exception("Unexpected error in submit_loan_application_view", extra={"correlation_id": correlation_id, "error": str(e)})
        response = JsonResponse({"error": "internal_error", "correlation_id": correlation_id, "message": str(e)}, status=500)
        return add_cors_headers(response, request)
