/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.scss'],
  standalone: false
})
export class ClientportalApplicationStatusComponent implements OnInit {
  loading = false;
  error: string | null = null;
  loanId: string | null = null;
  application: any = null;
  timelineEvents: any[] = [];
  clientProfile: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClientProfile();
    this.route.queryParams.subscribe((params) => {
      this.loanId = params['loanId'] || null;
      if (this.loanId) {
        this.load();
      } else {
        // If no loanId, load first loan or show message
        this.loadFirstLoan();
      }
    });
  }

  loadClientProfile(): void {
    this.authService.client().subscribe({
      next: (result: any) => {
        this.clientProfile = result.profile || null;
      },
      error: () => {
        // Silently fail
      }
    });
  }

  loadFirstLoan(): void {
    this.loading = true;
    this.authService.loans().subscribe({
      next: (result: any) => {
        this.loading = false;
        const loans = result.loans || [];
        if (loans.length > 0) {
          this.loanId = loans[0].id;
          this.load();
        } else {
          this.error = 'No loan applications found.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load applications.';
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
        this.application = result.loan || null;
        this.buildTimelineEvents(result.loan);
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load application status.';
        }
      }
    });
  }

  buildTimelineEvents(loan: any): void {
    if (!loan) return;

    const events: any[] = [];
    const transactions = loan.transactions || [];

    // Application submitted event
    const submittedDate = this.parseDate(loan.timeline?.submittedOnDate || loan.submittedOnDate);
    if (submittedDate) {
      events.push({
        event: 'Application Submitted',
        date: submittedDate.date,
        time: submittedDate.time,
        performedBy: this.clientProfile?.displayName || 'You',
        status: 'Completed'
      });
    }

    // Document verification (if available)
    const approvedDate = this.parseDate(loan.timeline?.approvedOnDate);
    if (approvedDate && submittedDate) {
      events.push({
        event: 'Document Verification',
        date: this.addDays(submittedDate.date, 1),
        time: '9:15 AM',
        performedBy: 'System',
        status: 'Completed'
      });
    }

    // Sent for approval
    if (approvedDate && submittedDate) {
      events.push({
        event: 'Sent for Approval',
        date: this.addDays(submittedDate.date, 1),
        time: '9:20 AM',
        performedBy: 'System',
        status: 'Completed'
      });
    }

    // Current status event
    const currentStatus = this.getStatusLabel(loan.status);
    if (currentStatus !== 'Submitted') {
      const fallbackDate =
        submittedDate?.date ||
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      events.push({
        event: currentStatus,
        date: approvedDate?.date || this.addDays(fallbackDate, 1),
        time: approvedDate?.time || '9:20 AM',
        performedBy: 'Loan Officer',
        status: this.getStatusBadgeType(loan.status)
      });
    }

    // Sort events by date
    this.timelineEvents = events.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA.getTime() - dateB.getTime();
    });
  }

  parseDate(dateValue: any): { date: string; time: string } | null {
    if (!dateValue) return null;

    let date: Date;
    if (Array.isArray(dateValue) && dateValue.length === 3) {
      date = new Date(dateValue[0], dateValue[1] - 1, dateValue[2]);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return null;
    }

    if (isNaN(date.getTime())) return null;

    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return { date: dateStr, time: timeStr };
  }

  addDays(dateStr: string, days: number): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatus(status: any): string {
    if (typeof status === 'string') {
      return status;
    }
    return status?.value || status?.code || 'Unknown';
  }

  getStatusLabel(status: any): string {
    const statusValue = this.getStatus(status).toLowerCase();
    if (statusValue.includes('pending') || statusValue.includes('submitted')) {
      return 'Pending Approval';
    }
    if (statusValue.includes('approved')) {
      return 'Approved';
    }
    if (statusValue.includes('disbursed') || statusValue.includes('active')) {
      return 'Disbursed';
    }
    if (statusValue.includes('closed') || statusValue.includes('overpaid')) {
      return 'Closed';
    }
    return 'Pending Approval';
  }

  getStatusBadgeType(status: any): string {
    const statusValue = this.getStatus(status).toLowerCase();
    if (statusValue.includes('pending') || statusValue.includes('submitted')) {
      return 'In Progress';
    }
    if (statusValue.includes('approved') || statusValue.includes('disbursed') || statusValue.includes('active')) {
      return 'Completed';
    }
    return 'In Progress';
  }

  getStatusCode(status: any): string {
    const statusValue = this.getStatus(status).toUpperCase();
    if (statusValue.includes('PENDING')) {
      return 'PENDING_APPROVAL';
    }
    if (statusValue.includes('APPROVED')) {
      return 'APPROVED';
    }
    if (statusValue.includes('DISBURSED') || statusValue.includes('ACTIVE')) {
      return 'DISBURSED';
    }
    return 'PENDING_APPROVAL';
  }

  getNextAction(status: any): string {
    const statusValue = this.getStatus(status).toLowerCase();
    if (statusValue.includes('pending') || statusValue.includes('submitted')) {
      return 'Awaiting review by Loan Officer. Expected within 2-3 business days.';
    }
    if (statusValue.includes('approved')) {
      return 'Your loan has been approved. Disbursement will be processed shortly.';
    }
    if (statusValue.includes('disbursed') || statusValue.includes('active')) {
      return 'Your loan has been disbursed. Check your account for details.';
    }
    return 'Awaiting review by Loan Officer. Expected within 2-3 business days.';
  }

  getJourneyStages(): any[] {
    if (!this.application) return [];

    const status = this.getStatus(this.application.status).toLowerCase();
    const submittedDate = this.parseDate(
      this.application.timeline?.submittedOnDate || this.application.submittedOnDate
    );

    return [
      {
        name: 'Submitted',
        icon: '✓',
        date: submittedDate?.date || 'N/A',
        by: this.clientProfile?.displayName || 'You',
        completed: true,
        active: false
      },
      {
        name: 'Pending Approval',
        icon: '⏰',
        date: submittedDate ? this.addDays(submittedDate.date, 1) : 'N/A',
        completed: status.includes('approved') || status.includes('disbursed') || status.includes('active'),
        active: status.includes('pending') || status.includes('submitted')
      },
      {
        name: 'Approved',
        icon: '📄',
        date: this.parseDate(this.application.timeline?.approvedOnDate)?.date || 'N/A',
        completed: status.includes('disbursed') || status.includes('active'),
        active: status.includes('approved') && !status.includes('disbursed')
      },
      {
        name: 'Disbursed',
        icon: '$',
        date: this.parseDate(this.application.timeline?.actualDisbursementDate)?.date || 'N/A',
        completed: status.includes('disbursed') || status.includes('active'),
        active: status.includes('disbursed') || status.includes('active')
      }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: any): string {
    if (!date) return '—';
    const parsed = this.parseDate(date);
    return parsed ? parsed.date : String(date);
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  goBack(): void {
    this.router.navigate(['/clientportal/loans']);
  }

  viewApplicationDetails(): void {
    if (this.loanId) {
      this.router.navigate([
        '/clientportal/loans',
        this.loanId
      ]);
    }
  }

  generateApplicationId(loan: any): string {
    if (!loan) return 'LA-2024-000000';
    const id = loan.id || loan.accountNo || '000000';
    const year = new Date().getFullYear();
    return `LA-${year}-${String(id).padStart(6, '0')}`;
  }

  getLastModifiedTime(loan: any): string {
    const parsed = this.parseDate(loan.timeline?.lastModifiedDate || loan.lastModifiedDate);
    return parsed?.time || 'N/A';
  }
}
