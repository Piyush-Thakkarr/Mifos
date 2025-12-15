/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-loans',
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.scss'],
  standalone: false
})
export class ClientportalLoansComponent implements OnInit {
  loading = false;
  error: string | null = null;
  loans: any[] = [];
  summary: any = null;
  clientProfile: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadClientProfile();
  }

  loadClientProfile(): void {
    this.authService.client().subscribe({
      next: (result: any) => {
        this.clientProfile = result.profile || null;
      },
      error: () => {
        // Silently fail - will use default
      }
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.authService.loans().subscribe({
      next: (result: any) => {
        this.loading = false;
        this.loans = result.loans || [];
        this.calculateSummary();
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load loans data.';
        }
      }
    });
  }

  calculateSummary(): void {
    const totalLoans = this.loans.length;
    const activeLoans = this.loans.filter((l) => this.getStatus(l.status) === 'Active').length;
    const closedLoans = totalLoans - activeLoans;
    const totalDisbursed = this.loans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
    const totalOutstanding = this.loans.reduce((sum, loan) => sum + (loan.outstanding || loan.principal || 0), 0);

    this.summary = {
      totalLoans,
      active: activeLoans,
      closed: closedLoans,
      totalDisbursed,
      totalOutstanding
    };
  }

  getStatus(status: any): string {
    if (typeof status === 'string') {
      return status;
    }
    return status?.value || status?.code || '—';
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  viewLoanDetails(loanId: number): void {
    this.router.navigate([
      '/clientportal/loans',
      loanId
    ]);
  }
}
