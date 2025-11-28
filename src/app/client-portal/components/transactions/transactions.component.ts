import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';

@Component({
  selector: 'mifosx-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class TransactionsComponent implements OnInit {
  // CLIENT-PORTAL: Local-only state
  loanId: string = '';
  transactions: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private loanApi: LoanApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('loanId');
    this.loanId = idParam ?? '';
    if (!this.loanId) {
      this.error = 'Unable to load transactions';
      return;
    }
    this.loading = true;
    this.loanApi.getLoanTransactions(this.loanId).subscribe({
      next: (res) => {
        const list = res?.pageItems ?? res?.transactions ?? res;
        this.transactions = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load transactions';
        this.loading = false;
      }
    });
  }

  formatAmount(value: any): string {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '';
  }

  formatDate(value: any): string {
    if (!value) return '';
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
}
