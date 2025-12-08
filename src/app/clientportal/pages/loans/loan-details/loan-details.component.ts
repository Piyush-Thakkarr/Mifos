/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.scss'],
  standalone: false
})
export class ClientportalLoanDetailsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  loanId: string | null = null;
  loan: any = null;
  emiSchedule: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.loanId = params.get('id');
      if (this.loanId) {
        this.load();
      }
    });
  }

  load(): void {
    if (!this.loanId) return;

    this.loading = true;
    this.error = null;

    this.authService.loanDetails(this.loanId).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.loan = result.loan || null;
        this.emiSchedule = result.emiSchedule || [];
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load loan details.';
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

  getUserName(): string {
    return 'Client PortalUser2';
  }

  goBack(): void {
    this.router.navigate(['/clientportal/loans']);
  }

  downloadStatement(): void {
    if (!this.loanId) return;

    this.authService.downloadStatement(this.loanId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Determine file extension based on content type
        const contentType = blob.type;
        let extension = '.html';
        if (contentType.includes('csv')) {
          extension = '.csv';
        } else if (contentType.includes('pdf')) {
          extension = '.pdf';
        }

        link.download = `loan_statement_${this.loan?.accountNo || this.loanId}_${new Date().toISOString().split('T')[0]}${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download statement:', err);
        alert('Failed to download statement. Please try again.');
      }
    });
  }

  downloadSchedule(): void {
    if (!this.loanId) return;

    this.authService.downloadSchedule(this.loanId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `repayment_schedule_${this.loan?.accountNo || this.loanId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download schedule:', err);
        alert('Failed to download repayment schedule. Please try again.');
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '—';
    if (typeof date === 'string') {
      return date;
    }
    if (Array.isArray(date) && date.length === 3) {
      return `${date[0]}-${String(date[1]).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`;
    }
    return String(date);
  }
}
