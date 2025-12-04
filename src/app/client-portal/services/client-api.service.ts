import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable()
export class ClientApiService {
  private baseUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) { }

  // CLIENT-PORTAL: Get client details from Django backend
  getClient(clientId?: number | string): Observable<any> {
    const url = clientId ? `${this.baseUrl}/api/client/${clientId}` : `${this.baseUrl}/api/client`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get client accounts from Django backend
  getClientAccounts(clientId?: number | string): Observable<any> {
    // Django /loans endpoint returns loan accounts
    const url = `${this.baseUrl}/api/loans`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }

  // CLIENT-PORTAL: Get client savings from Django backend
  getClientSavings(clientId?: number | string): Observable<any> {
    const url = `${this.baseUrl}/api/savings`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(catchError((err) => throwError(() => err)));
  }
}
