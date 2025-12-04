import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';

@Component({
  selector: 'mifosx-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class LoanDetailsComponent implements OnInit {
  // CLIENT-PORTAL: Local-only state
  loan: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private loanApi: LoanApiService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('loanId');
    const loanId = idParam ?? '';
    if (!loanId) {
      this.error = 'Unable to load loan details';
      return;
    }
    this.loading = true;
    this.loanApi.getLoan(loanId).subscribe({
      next: (loan) => {
        console.log('Loan details received:', loan);
        this.loan = loan;
        this.loading = false;
      },
      error: (err) => {
        console.error('Loan details error:', err);
        this.error = 'Unable to load loan details';
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
