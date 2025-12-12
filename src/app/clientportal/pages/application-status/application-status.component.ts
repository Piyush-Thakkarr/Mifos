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
  allLoans: any[] = [];
  showDetailView = false;
  dataUnavailable = false;

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
        this.showDetailView = true;
        this.load();
      } else {
        // Show list of all loans
        this.showDetailView = false;
        this.loadAllLoans();
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

  loadAllLoans(): void {
    this.loading = true;
    this.error = null;
    this.dataUnavailable = false;

    this.authService.loans().subscribe({
      next: (result: any) => {
        this.loading = false;
        const loans = result.loans || [];

        if (loans.length === 0) {
          this.dataUnavailable = true;
          this.error = 'No loan applications found. This may be a known limitation of the Fineract demo server.';
          return;
        }

        // Sort loans by ID descending to get the most recent first
        this.allLoans = loans.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      },
      error: (err: any) => {
        this.loading = false;
        this.dataUnavailable = true;
        if (err?.error?.error === 'upstream_unavailable' || err?.status === 503) {
          this.error =
            'Unable to load loan applications. This is a known limitation of the Fineract demo server (demo.mifos.io) which may be slow or unavailable. This is not an issue with our application.';
        } else {
          this.error = 'Failed to load loan applications. Please try again later.';
        }
      }
    });
  }

  viewLoanDetails(loan: any): void {
    if (!loan || !loan.id) return;

    // Only allow clicking on approved/active/disbursed loans
    const status = this.getStatus(loan.status).toLowerCase();
    const isClickable =
      status.includes('approved') ||
      status.includes('disbursed') ||
      status.includes('active') ||
      status.includes('pending') ||
      status.includes('submitted');

    if (isClickable) {
      // Update state directly without navigation to avoid reload
      this.loanId = String(loan.id);
      this.showDetailView = true;
      this.error = null;
      this.load();
    }
  }

  backToList(): void {
    this.showDetailView = false;
    this.application = null;
    this.loanId = null;
    this.timelineEvents = [];
    this.error = null;
    // Update URL without reloading
    this.router.navigate(['/clientportal/application-status'], {
      replaceUrl: true,
      queryParams: {}
    });
  }

  load(): void {
    if (!this.loanId) return;

    this.loading = true;
    this.error = null;
    this.dataUnavailable = false;

    this.authService.loanDetails(this.loanId).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.application = result.loan || null;

        if (!this.application) {
          this.dataUnavailable = true;
          this.error =
            'Loan application data is not available. This may be a known limitation of the Fineract demo server. This is not an issue with our application.';
          return;
        }

        this.buildTimelineEvents(result.loan);
      },
      error: (err: any) => {
        this.loading = false;
        this.dataUnavailable = true;

        if (err?.error?.error === 'upstream_unavailable' || err?.status === 503) {
          this.error =
            'Unable to load loan application details. This is a known limitation of the Fineract demo server (demo.mifos.io) which may be slow or unavailable. This is not an issue with our application.';
        } else if (err?.status === 404) {
          this.error = 'Loan application not found.';
        } else {
          this.error = 'Failed to load application status. This may be a known limitation of the Fineract demo server.';
        }
      }
    });
  }

  buildTimelineEvents(loan: any): void {
    if (!loan) return;

    const events: any[] = [];
    const timeline = loan.timeline || {};
    const transactions = loan.transactions || [];
    const status = loan.status || {};

    // Application submitted event - ONLY if timeline has submittedOnDate
    const submittedDate = this.parseDate(timeline.submittedOnDate || loan.submittedOnDate);
    if (submittedDate) {
      const submittedBy =
        timeline.submittedByFirstname && timeline.submittedByLastname
          ? `${timeline.submittedByFirstname} ${timeline.submittedByLastname}`
          : timeline.submittedByUsername || this.clientProfile?.displayName || 'You';

      events.push({
        event: 'Application Submitted',
        date: submittedDate.date,
        time: submittedDate.time,
        performedBy: submittedBy,
        status: 'Completed'
      });
    }

    // Approved event - ONLY if timeline has approvedOnDate
    const approvedDate = this.parseDate(timeline.approvedOnDate);
    if (approvedDate) {
      const approvedBy =
        timeline.approvedByFirstname && timeline.approvedByLastname
          ? `${timeline.approvedByFirstname} ${timeline.approvedByLastname}`
          : timeline.approvedByUsername || 'Loan Officer';

      events.push({
        event: 'Approved',
        date: approvedDate.date,
        time: approvedDate.time,
        performedBy: approvedBy,
        status: 'Completed'
      });
    }

    // Disbursed event - ONLY if timeline has actualDisbursementDate
    const disbursedDate = this.parseDate(timeline.actualDisbursementDate);
    if (disbursedDate) {
      const disbursedBy =
        timeline.disbursedByFirstname && timeline.disbursedByLastname
          ? `${timeline.disbursedByFirstname} ${timeline.disbursedByLastname}`
          : timeline.disbursedByUsername || 'System';

      events.push({
        event: 'Disbursed',
        date: disbursedDate.date,
        time: disbursedDate.time,
        performedBy: disbursedBy,
        status: 'Completed'
      });
    }

    // Closed event - ONLY if timeline has closedOnDate
    const closedDate = this.parseDate(timeline.closedOnDate);
    if (closedDate) {
      events.push({
        event: 'Closed',
        date: closedDate.date,
        time: closedDate.time,
        performedBy: 'System',
        status: 'Completed'
      });
    }

    // Add transaction-based events - ONLY real transactions
    // Group by type to avoid duplicates
    const transactionEvents = new Map<string, any>();

    transactions.forEach((txn: any) => {
      const txnType = txn.type?.value || txn.type?.code || '';
      const txnDate = this.parseDate(txn.date);

      if (!txnDate) return;

      // Skip disbursement transactions (already covered by timeline)
      if (txnType.toLowerCase().includes('disbursement')) {
        return;
      }

      // Create event key to avoid duplicates
      const eventKey = `${txnType}-${txnDate.date}`;

      if (!transactionEvents.has(eventKey)) {
        let eventName = txnType;
        // Format transaction type names
        if (txnType.toLowerCase().includes('repayment')) {
          eventName = 'Repayment Received';
        } else if (txnType.toLowerCase().includes('charge')) {
          eventName = 'Charge Applied';
        } else if (txnType.toLowerCase().includes('waive')) {
          eventName = 'Interest Waived';
        } else if (txnType.toLowerCase().includes('write')) {
          eventName = 'Written Off';
        }

        transactionEvents.set(eventKey, {
          event: eventName,
          date: txnDate.date,
          time: txnDate.time,
          performedBy: txn.madeOnDate ? 'System' : 'System',
          status: 'Completed'
        });
      }
    });

    // Add transaction events to main events array
    transactionEvents.forEach((event) => {
      events.push(event);
    });

    // Add current status event ONLY if status indicates pending and no other events exist
    const statusId = status.id || (typeof status === 'number' ? status : null);
    const isPendingApproval = statusId === 100 || status.pendingApproval === true;

    if (isPendingApproval && events.length === 1) {
      // Only submitted, add pending approval status
      const lastEvent = events[events.length - 1];
      events.push({
        event: 'Pending Approval',
        date: lastEvent.date,
        time: lastEvent.time,
        performedBy: 'Loan Officer',
        status: 'In Progress'
      });
    }

    // Sort events by date and time
    this.timelineEvents = events.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
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

  getAppliedDate(loan: any): any {
    // Try to get submitted date from various possible fields
    // Note: The loans list endpoint may not include this, so we show N/A if not available
    return loan.submittedOnDate || loan.timeline?.submittedOnDate || loan.appliedDate || null;
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
    // Use the most recent timeline date as last modified
    const timeline = loan.timeline || {};
    const dates = [
      timeline.actualDisbursementDate,
      timeline.approvedOnDate,
      timeline.submittedOnDate,
      loan.lastModifiedDate
    ].filter(Boolean);

    if (dates.length === 0) return 'N/A';

    // Get the most recent date
    const mostRecent = dates.reduce((latest, current) => {
      const latestDate = this.parseDate(latest);
      const currentDate = this.parseDate(current);
      if (!latestDate) return current;
      if (!currentDate) return latest;
      return new Date(latestDate.date + ' ' + latestDate.time) > new Date(currentDate.date + ' ' + currentDate.time)
        ? latest
        : current;
    });

    const parsed = this.parseDate(mostRecent);
    return parsed?.time || 'N/A';
  }
}
