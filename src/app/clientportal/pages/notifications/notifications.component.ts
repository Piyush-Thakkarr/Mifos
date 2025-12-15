/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false
})
export class ClientportalNotificationsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  notifications: any[] = [];
  unreadCount = 0;
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

    this.authService.notifications().subscribe({
      next: (result: any) => {
        this.loading = false;
        this.notifications = result.notifications || [];
        this.unreadCount = this.notifications.filter((n) => !n.read).length;
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to load notifications.';
        }
      }
    });
  }

  markAllAsRead(): void {
    this.authService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
        this.unreadCount = 0;
      },
      error: (err: any) => {
        console.error('Failed to mark all as read:', err);
      }
    });
  }

  markAsRead(notificationId: number): void {
    this.authService.markNotificationRead(notificationId).subscribe({
      next: () => {
        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification) {
          notification.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      },
      error: (err: any) => {
        console.error('Failed to mark as read:', err);
      }
    });
  }

  deleteNotification(notificationId: number): void {
    this.authService.deleteNotification(notificationId).subscribe({
      next: () => {
        const index = this.notifications.findIndex((n) => n.id === notificationId);
        if (index !== -1) {
          if (!this.notifications[index].read) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
          this.notifications.splice(index, 1);
        }
      },
      error: (err: any) => {
        console.error('Failed to delete notification:', err);
        alert('Failed to delete notification. Please try again.');
      }
    });
  }

  getNotificationIcon(type: string): string {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('emi') || typeLower.includes('due')) {
      return '📅';
    } else if (typeLower.includes('payment') || typeLower.includes('received')) {
      return '✅';
    } else if (typeLower.includes('updated') || typeLower.includes('account')) {
      return 'ℹ️';
    } else if (typeLower.includes('message') || typeLower.includes('message')) {
      return '💬';
    } else if (typeLower.includes('document') || typeLower.includes('verification')) {
      return '⚠️';
    }
    return '🔔';
  }

  getNotificationIconClass(type: string): string {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('emi') || typeLower.includes('due')) {
      return 'icon-emi';
    } else if (typeLower.includes('payment') || typeLower.includes('received')) {
      return 'icon-success';
    } else if (typeLower.includes('updated') || typeLower.includes('account')) {
      return 'icon-info';
    } else if (typeLower.includes('message')) {
      return 'icon-message';
    } else if (typeLower.includes('document') || typeLower.includes('verification')) {
      return 'icon-warning';
    }
    return 'icon-default';
  }

  formatDate(date: any): string {
    if (!date) return '—';
    if (typeof date === 'string') {
      return date;
    }
    return String(date);
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }
}
