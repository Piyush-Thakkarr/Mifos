import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from django.conf import settings
import requests
from requests import Response


logger = logging.getLogger(__name__)


class MifosAuthError(Exception):
    pass


class MifosUpstreamError(Exception):
    pass


class MifosNotFoundError(Exception):
    """Raised when a Fineract resource (e.g., client) is not found (404)."""
    pass


@dataclass
class MifosClient:
    base_url: str = settings.MIFOS_BASE_URL
    tenant_id: str = settings.MIFOS_TENANT_ID
    admin_user: str = settings.MIFOS_ADMIN_USER
    admin_pass: str = settings.MIFOS_ADMIN_PASS
    verify_ssl: bool = settings.MIFOS_VERIFY_SSL
    client_id: str = settings.MIFOS_CLIENT_ID

    def _auth_url(self) -> str:
        # Base authentication URL; used by validate_client_credentials (user-level) and
        # by auth_check (admin-level) with different paths.
        return f"{self.base_url.rstrip('/')}/authentication"

    def _request(self, username: str, password: str) -> Response:
        params = {"tenantIdentifier": self.tenant_id}
        headers = {"Fineract-Platform-TenantId": self.tenant_id}
        return requests.get(
            self._auth_url(),
            params=params,
            headers=headers,
            auth=(username, password),
            timeout=10,
            verify=self.verify_ssl,
        )

    def validate_client_credentials(self, username: str, password: str) -> Dict[str, Any]:
        try:
            resp = self._request(username, password)
        except requests.RequestException as exc:  # type: ignore[no-untyped-def]
            raise MifosUpstreamError(str(exc)) from exc

        if resp.status_code == 200:
            try:
                data = resp.json()
            except ValueError:
                data = {}
            normalized = {
                "username": username,
                "displayName": data.get("authenticated", username) if isinstance(data, dict) else username,
                "raw": data,
            }
            return normalized

        if resp.status_code in (401, 403):
            raise MifosAuthError(f"Authentication failed for user {username}")

        raise MifosUpstreamError(f"Unexpected status {resp.status_code} from Fineract")

    def auth_check(self) -> None:
        """Check Fineract availability using admin credentials only.

        Tries POST /authentication with JSON body (preferred), then falls back
        to Basic Auth variants. The first 200/204 wins.
        """

        tenant_header = {"Fineract-Platform-TenantId": self.tenant_id}
        content_header = {"Content-Type": "application/json"}
        json_body = {"username": self.admin_user, "password": self.admin_pass}

        attempts: List[Dict[str, Any]] = [
            # Preferred: POST with JSON body (confirmed working format) - try this first with shorter timeout
            {"method": "POST", "path": "/authentication", "tenant_strategy": "both", "auth_type": "json_body", "timeout": 3},
            # Fallback: Basic Auth variant - only try one more
            {"method": "POST", "path": "/authentication", "tenant_strategy": "both", "auth_type": "basic", "timeout": 3},
        ]

        errors: List[str] = []
        last_status: Optional[int] = None

        for idx, attempt in enumerate(attempts):
            params: Dict[str, Any] = {}
            headers: Dict[str, str] = dict(content_header)
            auth_tuple: Optional[tuple] = None
            json_data: Optional[Dict[str, str]] = None

            tenant_strategy = attempt["tenant_strategy"]
            if tenant_strategy in ("both", "header_only"):
                headers.update(tenant_header)
            if tenant_strategy in ("both", "query_only"):
                params["tenantIdentifier"] = self.tenant_id

            auth_type = attempt.get("auth_type", "basic")
            if auth_type == "json_body":
                json_data = json_body
            else:
                auth_tuple = (self.admin_user, self.admin_pass)

            url = f"{self.base_url.rstrip('/')}{attempt['path']}"
            logger.info(
                "Mifos admin auth attempt",
                extra={
                    "attempt_index": idx,
                    "method": attempt["method"],
                    "url": url,
                    "params": params,
                    "auth_type": auth_type,
                    "verify_ssl": self.verify_ssl,
                    "tenant_strategy": tenant_strategy,
                },
            )

            try:
                # Use attempt-specific timeout if provided, otherwise default to 5 seconds
                attempt_timeout = attempt.get("timeout", 5)
                resp = requests.request(
                    attempt["method"],
                    url,
                    params=params,
                    headers=headers,
                    json=json_data,
                    auth=auth_tuple,
                    timeout=attempt_timeout,
                    verify=self.verify_ssl,
                )
            except requests.RequestException as exc:  # type: ignore[no-untyped-def]
                errors.append(f"{attempt['method']} {url} ({auth_type}) -> request_error:{exc}")
                logger.warning(
                    "Mifos admin auth request error",
                    exc_info=exc,
                    extra={"attempt_index": idx, "url": url, "auth_type": auth_type},
                )
                continue

            last_status = resp.status_code
            text_preview = resp.text[:300] if resp.text else ""
            logger.info(
                "Mifos admin auth response",
                extra={
                    "attempt_index": idx,
                    "status_code": resp.status_code,
                    "reason": resp.reason,
                    "text_preview": text_preview,
                    "auth_type": auth_type,
                },
            )

            if resp.status_code in (200, 204):
                logger.info(
                    "Mifos admin auth_check succeeded",
                    extra={
                        "attempt_index": idx,
                        "method": attempt["method"],
                        "url": url,
                        "auth_type": auth_type,
                        "tenant_strategy": tenant_strategy,
                        "verify_ssl": self.verify_ssl,
                    },
                )
                return

            errors.append(f"{attempt['method']} {url} ({auth_type}) -> {resp.status_code}")
            if resp.status_code in (401, 403):
                continue

        if last_status in (401, 403):
            raise MifosAuthError("Admin authentication failed against Fineract")

        raise MifosUpstreamError(f"All admin auth attempts failed: {'; '.join(errors)}")

    def fetch_with_admin(self, path: str, method: str = "GET", params: Optional[Dict[str, Any]] = None, json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        headers = {"Fineract-Platform-TenantId": self.tenant_id, "Content-Type": "application/json"}
        params = params or {}
        params.setdefault("tenantIdentifier", self.tenant_id)

        logger.debug(
            "Mifos admin fetch",
            extra={
                "method": method,
                "url": url,
                "params": params,
                "json": json,
                "verify_ssl": self.verify_ssl,
            },
        )

        try:
            resp = requests.request(
                method,
                url,
                params=params,
                headers=headers,
                auth=(self.admin_user, self.admin_pass),
                json=json,
                timeout=10,  # Reduced from 15 to 10 seconds to prevent long hangs
                verify=self.verify_ssl,
            )
        except requests.RequestException as exc:  # type: ignore[no-untyped-def]
            raise MifosUpstreamError(str(exc)) from exc

        if resp.status_code in (200, 201, 204):
            try:
                return resp.json()
            except ValueError:
                return {}

        if resp.status_code == 404:
            raise MifosNotFoundError(f"{method} {url} returned 404 (resource not found)")

        if resp.status_code in (401, 403):
            raise MifosAuthError(f"Admin authentication failed for {url}")

        raise MifosUpstreamError(f"{method} {url} returned {resp.status_code}")

    def fetch_client_bundle(self) -> Dict[str, Any]:
        """Fetch client profile with associations for dashboard."""
        path = f"/clients/{self.client_id}"
        params = {"associations": "all"}
        return self.fetch_with_admin(path, params=params)

    def fetch_client_loans(self) -> List[Dict[str, Any]]:
        """Fetch all loans for the client with repayment schedule and outstanding balance."""
        path = f"/loans"
        params = {"clientId": self.client_id}
        try:
            data = self.fetch_with_admin(path, params=params)
            loans = data.get("pageItems", [])
            # Fetch individual loans with associations to get repayment schedule and outstanding
            enriched_loans = []
            for loan in loans:
                loan_id = loan.get("id")
                if loan_id:
                    try:
                        loan_detail = self.fetch_with_admin(f"/loans/{loan_id}", params={"associations": "repaymentSchedule"})
                        # Merge repayment schedule and outstanding balance into loan data
                        loan.update(loan_detail)
                    except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                        # If we can't fetch detail, use what we have
                        pass
                enriched_loans.append(loan)
            return enriched_loans
        except MifosNotFoundError:
            return []

    def fetch_client_savings(self) -> List[Dict[str, Any]]:
        """Fetch all savings accounts for the client with summary."""
        path = f"/savingsaccounts"
        params = {"clientId": self.client_id}
        try:
            data = self.fetch_with_admin(path, params=params)
            accounts = data.get("pageItems", [])
            
            # Filter accounts to only include those that actually belong to this client
            # (Fineract API sometimes returns accounts from other clients)
            client_id_int = int(self.client_id) if self.client_id else None
            filtered_accounts = [
                acc for acc in accounts 
                if acc.get("clientId") == client_id_int
            ]
            
            # Fetch individual accounts with summary for balance info
            enriched_accounts = []
            for account in filtered_accounts:
                account_id = account.get("id")
                if account_id:
                    try:
                        account_detail = self.fetch_with_admin(f"/savingsaccounts/{account_id}", params={"associations": "summary"})
                        # Merge summary into account data
                        account.update(account_detail)
                    except (MifosAuthError, MifosUpstreamError, MifosNotFoundError):
                        # If we can't fetch detail, use what we have
                        pass
                enriched_accounts.append(account)
            return enriched_accounts
        except MifosNotFoundError:
            return []

    def fetch_savings_transactions(self, savings_account_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent transactions for a savings account."""
        path = f"/savingsaccounts/{savings_account_id}/transactions"
        params = {"limit": limit, "offset": 0}
        try:
            data = self.fetch_with_admin(path, params=params)
            return data.get("pageItems", [])
        except MifosNotFoundError:
            return []

    def fetch_loan_transactions(self, loan_id: int) -> List[Dict[str, Any]]:
        """Fetch transactions for a loan account."""
        # Use 'transactions' association instead of 'all' for faster response
        path = f"/loans/{loan_id}"
        params = {"associations": "transactions"}
        try:
            data = self.fetch_with_admin(path, params=params)
            # Transactions can be in 'transactions' or 'transactionHistory' key
            return data.get("transactions", []) or data.get("transactionHistory", [])
        except MifosNotFoundError:
            return []

    def fetch_loan_details(self, loan_id: int) -> Dict[str, Any]:
        """Fetch detailed loan information with repayment schedule."""
        path = f"/loans/{loan_id}"
        params = {"associations": "repaymentSchedule,transactions"}
        return self.fetch_with_admin(path, params=params)
