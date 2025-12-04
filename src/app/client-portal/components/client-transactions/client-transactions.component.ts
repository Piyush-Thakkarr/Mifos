import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientApiService } from '../../services/client-api.service';

@Component({
    selector: 'mifosx-client-transactions',
    templateUrl: './client-transactions.component.html',
    styleUrls: ['./client-transactions.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule]
})
export class ClientTransactionsComponent implements OnInit {
    transactions: any[] = [];
    filteredTransactions: any[] = [];
    error: string | null = null;
    clientId: string = '';

    // Filter state
    selectedType: string = 'all';
    selectedPeriod: string = 'all';

    constructor(
        private route: ActivatedRoute,
        private clientApi: ClientApiService
    ) { }

    ngOnInit(): void {
        const idParam = this.route.parent?.snapshot.paramMap.get('clientId') ||
            this.route.snapshot.paramMap.get('clientId');
        this.clientId = idParam ?? '';

        if (!this.clientId) {
            this.error = 'Unable to load transactions';
            return;
        }

        // For now, using mock data since we don't have a transactions endpoint yet
        this.loadMockTransactions();
    }

    loadMockTransactions(): void {
        // Mock transactions data
        this.transactions = [
            {
                id: 1,
                date: new Date('2025-11-20'),
                type: 'credit',
                description: 'Loan Repayment',
                amount: 2000,
                balance: 18000,
                status: 'completed'
            },
            {
                id: 2,
                date: new Date('2025-10-20'),
                type: 'credit',
                description: 'Loan Repayment',
                amount: 2000,
                balance: 20000,
                status: 'completed'
            },
            {
                id: 3,
                date: new Date('2025-01-01'),
                type: 'debit',
                description: 'Loan Disbursement',
                amount: 20000,
                balance: 20000,
                status: 'completed'
            }
        ];
        this.filteredTransactions = [...this.transactions];
    }

    getTotalTransactions(): number {
        return this.transactions.length;
    }

    getTotalCredit(): number {
        return this.transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTotalDebit(): number {
        return this.transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    applyFilters(): void {
        this.filteredTransactions = this.transactions.filter(t => {
            const typeMatch = this.selectedType === 'all' || t.type === this.selectedType;
            // Period filter logic can be added here
            return typeMatch;
        });
    }

    formatAmount(amount: any): string {
        if (amount === null || amount === undefined) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
