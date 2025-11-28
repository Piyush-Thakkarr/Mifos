import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LoanApiService {
  constructor(private http: HttpClient) {
    // Placeholder: dependencies can be added later if needed.
  }

  // CLIENT-PORTAL: Get loan details with associations
  getLoan(loanId: number | string): Observable<any> {
    const headers = new HttpHeaders({ 'Fineract-Platform-TenantId': 'default' });
    const url = `/fineract-provider/api/v1/loans/${loanId}?associations=all`;
    return this.http.get<any>(url, { headers }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get loan transactions
  getLoanTransactions(loanId: number | string): Observable<any> {
    const headers = new HttpHeaders({ 'Fineract-Platform-TenantId': 'default' });
    const url = `/fineract-provider/api/v1/loans/${loanId}/transactions?offset=0&limit=500`;
    return this.http.get<any>(url, { headers }).pipe(catchError((err) => throwError(() => err)));
  }
}
