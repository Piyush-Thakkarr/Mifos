import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'mifosx-client-notifications',
    templateUrl: './client-notifications.component.html',
    styleUrls: ['./client-notifications.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class ClientNotificationsComponent implements OnInit {
    notifications: any[] = [];
    clientId: string = '';

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        const idParam = this.route.parent?.snapshot.paramMap.get('clientId') ||
            this.route.snapshot.paramMap.get('clientId');
        this.clientId = idParam ?? '';

        this.loadMockNotifications();
    }

    loadMockNotifications(): void {
        this.notifications = [
            {
                id: 1,
                type: 'payment',
                title: 'EMI Payment Due',
                message: 'Your EMI of ₹2,000 is due on 20th Dec 2025',
                date: new Date('2025-12-04'),
                read: false,
                icon: 'fa-credit-card',
                color: 'orange'
            },
            {
                id: 2,
                type: 'success',
                title: 'Payment Received',
                message: 'Your payment of ₹2,000 has been successfully processed',
                date: new Date('2025-11-20'),
                read: true,
                icon: 'fa-check-circle',
                color: 'green'
            },
            {
                id: 3,
                type: 'info',
                title: 'Loan Approved',
                message: 'Your loan application has been approved',
                date: new Date('2025-01-01'),
                read: true,
                icon: 'fa-info-circle',
                color: 'blue'
            }
        ];
    }

    markAsRead(notification: any): void {
        notification.read = true;
    }

    markAllAsRead(): void {
        this.notifications.forEach(n => n.read = true);
    }

    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    formatDate(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;

        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
