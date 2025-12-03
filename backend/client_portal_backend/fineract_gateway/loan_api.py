# BACKEND-PLACEHOLDER-START
"""
REVIEW NOTE: Updated to call Fineract admin APIs via executor with env-driven config.
Only minimal fields are returned, normalized for the client portal.
"""

from typing import Any, Dict, List

from .executor import execute_json


def _norm_loan_details(raw: Dict[str, Any]) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    status = raw.get("status", {}) if isinstance(raw.get("status"), dict) else {"code": raw.get("status")}
    return {
        "loanId": raw.get("id"),
        "accountNo": raw.get("accountNo"),
        "productName": raw.get("loanProductName") or raw.get("productName"),
        "status": status.get("code") or status.get("value"),
        "clientId": raw.get("clientId"),
        "principal": raw.get("principal") or raw.get("approvedPrincipal"),
        "approvedPrincipal": raw.get("approvedPrincipal") or raw.get("principal"),
        "interestRatePerPeriod": raw.get("interestRatePerPeriod"),
        "annualInterestRate": raw.get("annualInterestRate"),
        "termFrequency": raw.get("termFrequency"),
        "numberOfRepayments": raw.get("numberOfRepayments"),
        "nextDueDate": raw.get("nextRepaymentDate"),
    }
    # BACKEND-PLACEHOLDER-END


def _norm_transactions(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    # BACKEND-PLACEHOLDER-START
    txns: List[Dict[str, Any]] = []
    for t in (raw or {}).get("transactions", []):
        txns.append(
            {
                "id": t.get("id"),
                "date": (t.get("date") or t.get("submittedOnDate")),
                "type": (t.get("type", {}) or {}).get("code") or t.get("type"),
                "amount": t.get("amount"),
                "principalPortion": t.get("principalPortion"),
                "interestPortion": t.get("interestPortion"),
                "outstandingLoanBalance": t.get("outstandingLoanBalance"),
            }
        )
    return txns
    # BACKEND-PLACEHOLDER-END


def _norm_schedule(raw: Dict[str, Any]) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    sched = (raw or {}).get("repaymentSchedule", {})
    periods_out: List[Dict[str, Any]] = []
    for p in sched.get("periods", []):
        periods_out.append(
            {
                "period": p.get("period"),
                "fromDate": p.get("fromDate"),
                "dueDate": p.get("dueDate"),
                "principalDue": p.get("principalDue"),
                "interestDue": p.get("interestDue"),
                "totalDue": p.get("totalDueForPeriod") or p.get("totalDue"),
                "principalOutstanding": p.get("principalOutstanding"),
            }
        )
    return {"loanId": raw.get("id"), "periods": periods_out}
    # BACKEND-PLACEHOLDER-END


def get_loan_details(loan_id: str) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    raw, _cid = execute_json(path=f"/loans/{loan_id}")
    return _norm_loan_details(raw)
    # BACKEND-PLACEHOLDER-END


def get_loan_transactions(loan_id: str) -> List[Dict[str, Any]]:
    # BACKEND-PLACEHOLDER-START
    raw, _cid = execute_json(path=f"/loans/{loan_id}/transactions")
    return _norm_transactions(raw)
    # BACKEND-PLACEHOLDER-END


def get_repayment_schedule(loan_id: str) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    raw, _cid = execute_json(path=f"/loans/{loan_id}", query={"associations": "repaymentSchedule"})
    return _norm_schedule(raw)
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
