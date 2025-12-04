import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientApiService } from '../../services/client-api.service';

@Component({
  selector: 'mifosx-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ClientDashboardComponent implements OnInit {
  // CLIENT-PORTAL: Local-only state
  client: any = null;
  accounts: any = null;
  loanAccounts: any[] = [];
  error: string | null = null;

  savingsAccounts: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private clientApi: ClientApiService
  ) { }

  ngOnInit(): void {
    // Get clientId from parent route params (portal/:clientId/dashboard)
    const idParam = this.route.parent?.snapshot.paramMap.get('clientId') ||
      this.route.snapshot.paramMap.get('clientId');
    const clientId = idParam ?? '';
    if (!clientId) {
      this.error = 'Unable to load client data';
      console.error('Dashboard: No clientId found in route params');
      return;
    }

    console.log('Dashboard: Fetching data for client', clientId);
    forkJoin({
      client: this.clientApi.getClient(clientId),
      loans: this.clientApi.getClientAccounts(clientId),
      savings: this.clientApi.getClientSavings(clientId)
    }).subscribe({
      next: ({ client, loans, savings }) => {
        console.log('Dashboard: Data received', { client, loans, savings });
        // Extract client details from nested structure
        this.client = client?.details || client;
        // Django /loans endpoint returns { loans: [...] }
        this.loanAccounts = Array.isArray(loans?.loans) ? loans.loans :
          Array.isArray(loans) ? loans : [];
        // Django /savings endpoint returns { savings: [...] }
        this.savingsAccounts = Array.isArray(savings?.savings) ? savings.savings :
          Array.isArray(savings) ? savings : [];
        console.log('Dashboard: Processed data', {
          client: this.client,
          loans: this.loanAccounts,
          savings: this.savingsAccounts
        });
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.error = 'Unable to load client data';
      }
    });
  }

  accountNumber(account: any): string {
    return account?.accountNo || 'N/A';
  }

  formatAmount(amount: any): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }

  outstandingAmount(loan: any): number {
    return loan?.principalOutstanding || 0;
  }

  nextDueDate(loan: any): string {
    if (!loan?.nextDueDate) return '';
    // Format date nicely
    const date = new Date(loan.nextDueDate);
    return isNaN(date.getTime()) ? loan.nextDueDate : date.toLocaleDateString();
  }

  // Helper for summary cards
  getTotalOutstanding(): number {
    return this.loanAccounts.reduce((sum, loan) => sum + (loan.principalOutstanding || 0), 0);
  }

  // Show principal if outstanding is 0 (e.g. for pending loans)
  getDisplayAmount(loan: any): number {
    return loan?.principalOutstanding > 0 ? loan.principalOutstanding : (loan?.principal || 0);
  }

  getTotalSavings(): number {
    return this.savingsAccounts.reduce((sum, acc) => sum + (acc.accountBalance || 0), 0);
  }

  getNextEmiAmount(): number {
    // Placeholder as we don't have next repayment amount in the list view
    return 0;
  }
}
