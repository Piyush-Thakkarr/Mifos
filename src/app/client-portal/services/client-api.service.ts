import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ClientApiService {
  constructor(private http: HttpClient) {}

  // CLIENT-PORTAL: Get client details
  getClient(clientId: number | string): Observable<any> {
    const headers = new HttpHeaders({ 'Fineract-Platform-TenantId': 'default' });
    const url = `/fineract-provider/api/v1/clients/${clientId}`;
    return this.http.get<any>(url, { headers }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get client accounts (loans, savings, etc.)
  getClientAccounts(clientId: number | string): Observable<any> {
    const headers = new HttpHeaders({ 'Fineract-Platform-TenantId': 'default' });
    const url = `/fineract-provider/api/v1/clients/${clientId}/accounts`;
    return this.http.get<any>(url, { headers }).pipe(catchError((err) => throwError(() => err)));
  }
}
