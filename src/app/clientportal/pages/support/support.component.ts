/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  standalone: false
})
export class ClientportalSupportComponent implements OnInit {
  issueType: string = '';
  subject: string = '';
  message: string = '';
  loading = false;

  // Loan Officer Info (fetched from backend)
  loanOfficer = {
    name: 'Loading...',
    employeeId: 'N/A',
    phone: 'N/A',
    email: 'N/A'
  };

  // Branch Info (fetched from backend)
  branchInfo = {
    name: 'Loading...',
    code: 'N/A',
    address: 'Loading...',
    workingHours: 'Mon - Sat: 9:00 AM - 6:00 PM'
  };

  // Contact Info
  contactInfo = {
    tollFree: '1800-XXX-XXXX',
    email: 'support@mfi.com',
    responseTime: 'Within 24 hours'
  };

  issueTypes = [
    'Select issue type',
    'Loan Inquiry',
    'Payment Issue',
    'Account Problem',
    'Document Request',
    'General Question',
    'Complaint'
  ];
  clientProfile: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClientProfile();
    this.loadSupportData();
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

  loadSupportData(): void {
    this.loading = true;
    this.authService.support().subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result.loanOfficer) {
          this.loanOfficer = result.loanOfficer;
        }
        if (result.branchInfo) {
          this.branchInfo = result.branchInfo;
        }
        if (result.contactInfo) {
          this.contactInfo = result.contactInfo;
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to load support data:', err);
        // Keep default values on error
      }
    });
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  submitRequest(): void {
    if (!this.issueType || this.issueType === 'Select issue type') {
      alert('Please select an issue type');
      return;
    }
    if (!this.subject.trim()) {
      alert('Please enter a subject');
      return;
    }
    if (!this.message.trim()) {
      alert('Please enter a message');
      return;
    }

    // In a real system, this would call the backend
    console.log('Submitting request:', {
      issueType: this.issueType,
      subject: this.subject,
      message: this.message
    });

    alert('Your request has been submitted successfully. We will get back to you soon.');

    // Reset form
    this.issueType = '';
    this.subject = '';
    this.message = '';
  }

  contactOfficer(): void {
    // In a real system, this could open email client or phone dialer
    window.location.href = `mailto:${this.loanOfficer.email}`;
  }
}
