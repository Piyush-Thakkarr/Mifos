import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable()
export class LoanApiService {
  private baseUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) { }

  // CLIENT-PORTAL: Get loan details from Django backend
  getLoan(loanId: number | string): Observable<any> {
    const url = `${this.baseUrl}/api/loans/${loanId}`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get loan transactions from Django backend
  getLoanTransactions(loanId: number | string): Observable<any> {
    const url = `${this.baseUrl}/api/loans/${loanId}/transactions`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get loan repayment schedule from Django backend
  getLoanRepayments(loanId: number | string): Observable<any> {
    const url = `${this.baseUrl}/api/loans/${loanId}/repayments`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get loan charges from Django backend
  getLoanCharges(loanId: number | string): Observable<any> {
    const url = `${this.baseUrl}/api/loans/${loanId}/charges`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }
}
