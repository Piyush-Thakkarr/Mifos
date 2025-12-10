/* eslint-disable @angular-eslint/prefer-standalone */
import { Component } from '@angular/core';
import { forkJoin, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class ClientportalDashboardComponent {
  loading = false;
  error: string | null = null;
  dashboard: any = null;
  showComingSoonPopup = false;

  constructor(private authService: AuthService) {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    // Add timeout (30 seconds) and error handling to prevent infinite loading
    forkJoin({
      session: this.authService.dashboard().pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Dashboard session error:', err);
          return of({ authenticated: false, user: null });
        })
      ),
      client: this.authService.client().pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Client error:', err);
          return of({ profile: {} });
        })
      ),
      loans: this.authService.loans().pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Loans error:', err);
          return of({ loans: [] });
        })
      ),
      savings: this.authService.savings().pipe(
        timeout(30000),
        catchError((err) => {
          // Silently handle errors - return empty savings if API fails
          return of({ savings: [] });
        })
      ),
      transactions: this.authService.transactions().pipe(
        timeout(30000),
        catchError((err) => {
          // Silently handle errors - return empty transactions if API fails
          return of({ transactions: [] });
        })
      )
    }).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.dashboard = result;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Dashboard load error:', err);
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load dashboard data.';
        }
      }
    });
  }

  getStatus(status: any): string {
    if (typeof status === 'string') {
      return status;
    }
    return status?.value || status?.code || '—';
  }

  getTotalOutstanding(loans: any[]): number {
    if (!loans || loans.length === 0) return 0;
    return loans.reduce((sum, loan) => sum + (loan.outstanding || loan.principal || 0), 0);
  }

  getNextEMI(loans: any[]): number {
    if (!loans || loans.length === 0) return 0;
    // Find the loan with the earliest next repayment date
    const loansWithDates = loans.filter((l) => l.nextRepaymentDate);
    if (loansWithDates.length === 0) return 0;
    // For now, return a placeholder - would need repayment schedule data
    return 1800; // Placeholder
  }

  getNextEMIDate(loans: any[]): string {
    if (!loans || loans.length === 0) return 'N/A';
    const loansWithDates = loans
      .filter((l) => l.nextRepaymentDate)
      .sort((a, b) => (a.nextRepaymentDate || '').localeCompare(b.nextRepaymentDate || ''));
    return loansWithDates[0]?.nextRepaymentDate || 'N/A';
  }

  getTotalSavings(savings: any[]): number {
    if (!savings || savings.length === 0) return 0;
    return savings.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }

  getLastLoginDate(): string {
    const now = new Date();
    return `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  formatDate(date: any): string {
    if (!date) return '—';
    if (typeof date === 'string') {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (Array.isArray(date) && date.length === 3) {
      return `${date[0]}-${String(date[1]).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`;
    }
    return String(date);
  }

  showComingSoon(): void {
    this.showComingSoonPopup = true;
  }

  closeComingSoonPopup(): void {
    this.showComingSoonPopup = false;
  }
}
