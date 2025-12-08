import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  username: string;
  display_name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.djangoApiUrl || 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/auth/login`,
      { username, password },
      {
        withCredentials: true
      }
    );
  }

  dashboard(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/dashboard`, {
      withCredentials: true
    });
  }

  client(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/client`, {
      withCredentials: true
    });
  }

  loans(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/loans`, {
      withCredentials: true
    });
  }

  savings(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/savings`, {
      withCredentials: true
    });
  }

  transactions(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/transactions`, {
      withCredentials: true
    });
  }

  loanDetails(loanId: string | number): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/loans/${loanId}`, {
      withCredentials: true
    });
  }

  downloadStatement(loanId: string | number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/clientportal/loans/${loanId}/statement`, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  downloadSchedule(loanId: string | number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/clientportal/loans/${loanId}/schedule`, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  downloadTransactionsStatement(
    searchQuery: string = '',
    transactionType: string = 'all',
    loanAccount: string = 'all'
  ): Observable<Blob> {
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (transactionType !== 'all') params.type = transactionType;
    if (loanAccount !== 'all') params.account = loanAccount;

    return this.http.get(`${this.baseUrl}/clientportal/transactions/download`, {
      withCredentials: true,
      responseType: 'blob',
      params: params
    });
  }

  notifications(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/clientportal/notifications`, {
      withCredentials: true
    });
  }

  markNotificationRead(notificationId: number): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.baseUrl}/clientportal/notifications/${notificationId}/read`,
      {},
      {
        withCredentials: true
      }
    );
  }

  markAllNotificationsRead(): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.baseUrl}/clientportal/notifications/read-all`,
      {},
      {
        withCredentials: true
      }
    );
  }

  deleteNotification(notificationId: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.baseUrl}/clientportal/notifications/${notificationId}`, {
      withCredentials: true
    });
  }
}
