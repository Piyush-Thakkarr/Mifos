/* eslint-disable @angular-eslint/prefer-standalone */
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
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

  constructor(private authService: AuthService) {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      session: this.authService.dashboard(),
      client: this.authService.client(),
      loans: this.authService.loans(),
      savings: this.authService.savings(),
      transactions: this.authService.transactions()
    }).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.dashboard = result;
      },
      error: (err: any) => {
        this.loading = false;
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
}
