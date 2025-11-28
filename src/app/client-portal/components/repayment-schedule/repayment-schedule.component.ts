import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LoanApiService } from '../../services/loan-api.service';

@Component({
  selector: 'mifosx-repayment-schedule',
  templateUrl: './repayment-schedule.component.html',
  styleUrls: ['./repayment-schedule.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class RepaymentScheduleComponent implements OnInit {
  // CLIENT-PORTAL: Local-only state
  loanId: string = '';
  periods: any[] = [];
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
      this.error = 'Unable to load repayment schedule';
      return;
    }
    this.loading = true;
    this.loanApi.getLoan(this.loanId).subscribe({
      next: (loan) => {
        const schedule = loan?.repaymentSchedule;
        this.periods = Array.isArray(schedule?.periods) ? schedule.periods : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load repayment schedule';
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
