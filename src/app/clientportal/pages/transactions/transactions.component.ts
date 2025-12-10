/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: false
})
export class ClientportalTransactionsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  transactions: any[] = [];
  summary: any = null;

  // Filters
  searchQuery: string = '';
  transactionType: string = 'all';
  loanAccount: string = 'all';

  // Available options for dropdowns
  transactionTypes: string[] = [
    'All Types',
    'Repayment',
    'Disbursement',
    'Processing Fee',
    'Late Fee'
  ];
  loanAccounts: any[] = [];
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

    // Load loans first to populate loan account dropdown
    this.authService.loans().subscribe({
      next: (loansResult: any) => {
        this.loanAccounts = [
          { value: 'all', label: 'All Loans' },
          ...(loansResult.loans || []).map((loan: any) => ({
            value: loan.accountNo || loan.id, // Use accountNo to match with transactions
            label: loan.accountNo || `Loan ${loan.id}`
          }))

        ];

        // Then load transactions
        this.loadTransactions();
      },
      error: () => {
        this.loanAccounts = [{ value: 'all', label: 'All Loans' }];
        this.loadTransactions();
      }
    });
  }

  private allTransactions: any[] = [];

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    this.authService.transactions().subscribe({
      next: (result: any) => {
        this.loading = false;
        this.allTransactions = result.transactions || [];
        this.transactions = this.applyFilters(this.allTransactions);
        // Calculate summary from FILTERED transactions, not all transactions
        this.calculateSummary(this.transactions);
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load transactions data.';
        }
      }
    });
  }

  applyFilters(transactions: any[]): any[] {
    let filtered = [...transactions];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (txn) =>
          (txn.reference && txn.reference.toLowerCase().includes(query)) ||
          (txn.description && txn.description.toLowerCase().includes(query)) ||
          (txn.type && txn.type.toLowerCase().includes(query))
      );
    }

    // Transaction type filter
    if (this.transactionType !== 'all') {
      filtered = filtered.filter((txn) => txn.type && txn.type.toLowerCase() === this.transactionType.toLowerCase());
    }

    // Loan account filter
    if (this.loanAccount !== 'all') {
      filtered = filtered.filter((txn) => txn.accountNo && txn.accountNo.toString() === this.loanAccount.toString());
    }

    return filtered;
  }

  onFilterChange(): void {
    // Re-apply filters to already loaded transactions
    this.transactions = this.applyFilters(this.allTransactions);
    // Recalculate summary from filtered transactions
    this.calculateSummary(this.transactions);
  }

  calculateSummary(transactions: any[]): void {
    const totalTransactions = transactions.length;
    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach((txn) => {
      const amount = Math.abs(txn.amount || 0);
      const type = (txn.type || '').toLowerCase();

      // Credit: Money coming IN to the client (Disbursement - bank gives money)
      // Debit: Money going OUT from the client (Repayment, Fees - client pays money)

      if (type === 'disbursement') {
        // Disbursement = bank gives money to client = Credit
        totalCredit += amount;
      } else if (type === 'repayment' || type.includes('fee') || type.includes('charge')) {
        // Repayment, Fees, Charges = client pays money = Debit
        totalDebit += amount;
      } else {
        // For other types, check the sign of the original amount
        // Positive = money in (credit), Negative = money out (debit)
        if ((txn.amount || 0) > 0) {
          totalCredit += amount;
        } else {
          totalDebit += amount;
        }
      }
    });

    // Remaining: From client's perspective, how much they still owe
    // Remaining = Total Credit (received) - Total Debit (paid back)
    const remaining = totalCredit - totalDebit;

    this.summary = {
      totalTransactions,
      totalCredit,
      totalDebit,
      remaining
    };
  }

  getStatus(status: any): string {
    if (typeof status === 'string') {
      return status;
    }
    return status?.value || status?.code || 'Success';
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  downloadStatement(): void {
    this.authService.downloadTransactionsStatement(this.searchQuery, this.transactionType, this.loanAccount).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename with filter info
        let filename = `transaction_statement_${new Date().toISOString().split('T')[0]}`;
        if (this.loanAccount !== 'all') {
          const selectedAccount = this.loanAccounts.find((acc) => acc.value === this.loanAccount);
          if (selectedAccount) {
            filename += `_${selectedAccount.label.replace(/\s+/g, '_')}`;
          }
        }
        filename += '.csv';

        link.download = filename;
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

  isCredit(type: string, amount: number): boolean {
    // Credit: Money coming IN to the client (Disbursement - bank gives money)
    // Debit: Money going OUT from the client (Repayment, Fees - client pays)
    const typeLower = (type || '').toLowerCase();
    return typeLower === 'disbursement';
  }
}
