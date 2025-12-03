# BACKEND-PLACEHOLDER-START
# TEST: placeholder auth flow tests — do not use for production.
"""
Django TestCase suite verifying the placeholder login + client-data flow.
No DB, no external calls; relies on placeholder endpoints and cookies.
"""

from django.test import TestCase, Client
from unittest.mock import patch
from client_portal_backend.fineract_gateway.executor import GatewayError


class PlaceholderAuthFlowTests(TestCase):
    # BACKEND-PLACEHOLDER-START
    def setUp(self):
        self.client = Client()

    def test_unauthenticated_client_data_returns_401(self):
        resp = self.client.get("/client-data/overview")
        self.assertEqual(resp.status_code, 401)
        data = resp.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"].get("code"), "unauthenticated")

    def test_me_without_cookie_returns_401_json(self):
        resp = self.client.get("/auth/me")
        self.assertEqual(resp.status_code, 401)
        body = resp.json()
        self.assertEqual(body.get("error", {}).get("code"), "unauthenticated")

    def test_login_sets_cookie_and_allows_client_data_access(self):
        # Form-encoded login using placeholder creds
        login_resp = self.client.post(
            "/auth/login",
            {"username": "client", "password": "password"},
        )
        self.assertEqual(login_resp.status_code, 200)
        # Ensure placeholder cookie was set (cp_session)
        self.assertIn("cp_session", login_resp.cookies)

        def fake_execute_json(path, method="GET", query=None, body=None):
            if path.startswith("/clients/") and path.endswith("/accounts"):
                return ({"loanAccounts": [{"id": 1, "accountNo": "0000001", "loanProductName": "LP", "status": {"code": "active"}, "principal": 10000.0, "principalOutstanding": 8500.0}]}, "CID")
            if path.startswith("/clients/"):
                return ({"id": "CL-0001", "displayName": "Client A", "externalId": "EXT", "officeName": "Main", "mobileNo": "+123"}, "CID")
            if path.startswith("/loans/") and path.endswith("/transactions"):
                return ({"transactions": [{"id": 1, "submittedOnDate": "2025-01-15", "type": {"code": "repayment"}, "amount": 650.0, "principalPortion": 500.0, "interestPortion": 150.0, "outstandingLoanBalance": 9500.0}]}, "CID")
            if path.startswith("/loans/"):
                # Both details and schedule (ignoring associations for brevity)
                return ({"id": "123", "clientId": "CL-0001", "accountNo": "LN-00001", "loanProductName": "LP", "status": {"code": "active"}, "principal": 10000.0, "approvedPrincipal": 10000.0, "repaymentSchedule": {"periods": []}}, "CID")
            return ({}, "CID")

        # Patch execute_json at the import sites used by services (client_api and loan_api)
        with patch("client_portal_backend.fineract_gateway.client_api.execute_json", side_effect=fake_execute_json), \
             patch("client_portal_backend.fineract_gateway.loan_api.execute_json", side_effect=fake_execute_json):
            # With cookies preserved by the test client, client-data should succeed
            overview = self.client.get("/client-data/overview")
            self.assertEqual(overview.status_code, 200)
            ov = overview.json()
            for key in ("clientId", "displayName", "accounts"):
                self.assertIn(key, ov)

            # Loan endpoints with a sample loan id
            loan_id = "123"
            details = self.client.get(f"/client-data/loan/{loan_id}/details")
            self.assertEqual(details.status_code, 200)
            self.assertIn("loanId", details.json())

            schedule = self.client.get(f"/client-data/loan/{loan_id}/schedule")
            self.assertEqual(schedule.status_code, 200)
            self.assertIn("periods", schedule.json())

            txns = self.client.get(f"/client-data/loan/{loan_id}/transactions")
            self.assertEqual(txns.status_code, 200)
            self.assertIn("transactions", txns.json())

        # /auth/me should return 200 with client id when cp_session is present
        me = self.client.get("/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertIn("client_id", me.json())

    def test_login_wrong_credentials_fails(self):
        bad = self.client.post(
            "/auth/login",
            {"username": "mifos", "password": "mifos"},
        )
        self.assertEqual(bad.status_code, 400)

    def test_gateway_unauthorized_maps_401(self):
        # Login first
        self.client.post("/auth/login", {"username": "client", "password": "password"})

        def raise_unauth(*args, **kwargs):
            raise GatewayError(status=401, message="", correlation_id="CID401")

        # For overview, client_api is sufficient
        with patch("client_portal_backend.fineract_gateway.client_api.execute_json", side_effect=raise_unauth):
            resp = self.client.get("/client-data/overview")
            self.assertEqual(resp.status_code, 401)
            body = resp.json()
            self.assertEqual(body.get("error", {}).get("code"), "unauthenticated")

    def test_ownership_mismatch_maps_403(self):
        # Login first
        self.client.post("/auth/login", {"username": "client", "password": "password"})

        def fake_loan_details(path, method="GET", query=None, body=None):
            if path.startswith("/loans/") and not path.endswith("/transactions"):
                return ({"id": "123", "clientId": "OTHER"}, "CID403")
            return ({}, "CID403")

        # For loan views, patch loan_api import site
        with patch("client_portal_backend.fineract_gateway.loan_api.execute_json", side_effect=fake_loan_details):
            resp = self.client.get("/client-data/loan/123/details")
            self.assertEqual(resp.status_code, 403)
            body = resp.json()
            self.assertEqual(body.get("error", {}).get("code"), "forbidden")
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
