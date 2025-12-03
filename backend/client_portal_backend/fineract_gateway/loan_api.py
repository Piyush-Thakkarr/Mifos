
"""
Loan API Gateway.
Functions to fetch loan details, transactions, and repayment schedules.
"""

from typing import Any, Dict, List

from .executor import execute_json


def _norm_loan_details(raw: Dict[str, Any]) -> Dict[str, Any]:

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



def _norm_transactions(raw: Dict[str, Any]) -> List[Dict[str, Any]]:

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



def _norm_schedule(raw: Dict[str, Any]) -> Dict[str, Any]:

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



def get_loan_details(loan_id: str, headers_override: Dict[str, str] | None = None) -> Dict[str, Any]:

    raw, _cid = execute_json(path=f"/loans/{loan_id}", headers_override=headers_override)
    return _norm_loan_details(raw)



def get_loan_transactions(loan_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:

    raw, _cid = execute_json(path=f"/loans/{loan_id}/transactions", headers_override=headers_override)
    return _norm_transactions(raw)


def get_repayment_schedule(loan_id: str, headers_override: Dict[str, str] | None = None) -> Dict[str, Any]:
    raw, _cid = execute_json(path=f"/loans/{loan_id}", query={"associations": "repaymentSchedule"}, headers_override=headers_override)
    return _norm_schedule(raw)


def get_loan_charges(loan_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch loan charges."""
    raw, _cid = execute_json(path=f"/loans/{loan_id}/charges", headers_override=headers_override)
    return raw if isinstance(raw, list) else []


def get_loan_collateral(loan_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch loan collateral."""
    raw, _cid = execute_json(path=f"/loans/{loan_id}/collaterals", headers_override=headers_override)
    return raw if isinstance(raw, list) else []


