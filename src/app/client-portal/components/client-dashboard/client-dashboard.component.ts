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

  constructor(
    private route: ActivatedRoute,
    private clientApi: ClientApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('clientId');
    const clientId = idParam ?? '';
    if (!clientId) {
      this.error = 'Unable to load client data';
      return;
    }

    forkJoin({
      client: this.clientApi.getClient(clientId),
      accounts: this.clientApi.getClientAccounts(clientId)
    }).subscribe({
      next: ({ client, accounts }) => {
        this.client = client;
        this.accounts = accounts;
        this.loanAccounts = accounts?.loanAccounts ?? accounts?.loans ?? [];
      },
      error: () => {
        this.error = 'Unable to load client data';
      }
    });
  }

  formatAmount(value: any): string {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '';
  }

  formatDate(value: any): string {
    if (!value) return 'No due date';
    if (Array.isArray(value)) {
      const [
        y,
        m,
        d
      ] = value;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
  }

  nextDueDate(loan: any): string {
    const date = loan?.timeline?.nextRepaymentDate ?? loan?.nextDueDate;
    return this.formatDate(date);
  }

  accountNumber(loan: any): string {
    return loan?.accountNo ?? loan?.clientAccountNo ?? '';
  }

  outstandingAmount(loan: any): any {
    return loan?.summary && loan.summary.totalOutstanding != null ? loan.summary.totalOutstanding : loan?.outstanding;
  }
}
