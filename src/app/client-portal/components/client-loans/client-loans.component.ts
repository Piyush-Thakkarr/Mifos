import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ClientApiService } from '../../services/client-api.service';

@Component({
    selector: 'mifosx-client-loans',
    templateUrl: './client-loans.component.html',
    styleUrls: ['./client-loans.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class ClientLoansComponent implements OnInit {
    loans: any[] = [];
    error: string | null = null;
    clientId: string = '';

    constructor(
        private route: ActivatedRoute,
        private clientApi: ClientApiService
    ) { }

    ngOnInit(): void {
        // Get clientId from parent route params
        const idParam = this.route.parent?.snapshot.paramMap.get('clientId') ||
            this.route.snapshot.paramMap.get('clientId');
        this.clientId = idParam ?? '';

        if (!this.clientId) {
            this.error = 'Unable to load loans';
            return;
        }

        this.fetchLoans();
    }

    fetchLoans(): void {
        this.clientApi.getClientAccounts(this.clientId).subscribe({
            next: (data) => {
                this.loans = Array.isArray(data?.loans) ? data.loans :
                    Array.isArray(data) ? data : [];
            },
            error: (err) => {
                console.error('Loans fetch error:', err);
                this.error = 'Unable to load loans';
            }
        });
    }

    getTotalLoans(): number {
        return this.loans.length;
    }

    getActiveLoans(): number {
        return this.loans.filter(loan =>
            loan.statusCode?.includes('active')
        ).length;
    }

    getTotalDisbursed(): number {
        return this.loans.reduce((sum, loan) =>
            sum + (loan.principal || 0), 0
        );
    }

    getTotalOutstanding(): number {
        return this.loans.reduce((sum, loan) =>
            sum + (loan.principalOutstanding || 0), 0
        );
    }

    getProgress(loan: any): number {
        if (!loan.principal || loan.principal === 0) return 0;
        const paid = loan.principal - (loan.principalOutstanding || 0);
        return Math.round((paid / loan.principal) * 100);
    }

    formatAmount(amount: any): string {
        if (amount === null || amount === undefined) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    getStatusClass(statusCode: string): string {
        if (statusCode?.includes('active')) return 'active';
        if (statusCode?.includes('pending')) return 'pending';
        if (statusCode?.includes('approved')) return 'approved';
        if (statusCode?.includes('closed')) return 'closed';
        return 'default';
    }
}
