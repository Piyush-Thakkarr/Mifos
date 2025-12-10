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
export class ClientportalSupportComponent {
  issueType: string = '';
  subject: string = '';
  message: string = '';

  // Loan Officer Info (would come from backend in real system)
  loanOfficer = {
    name: 'Rajesh Kumar',
    employeeId: 'EMP-2024-456',
    phone: '+91 98765 12345',
    email: 'rajesh.kumar@mfi.com'
  };

  // Branch Info (would come from backend in real system)
  branchInfo = {
    name: 'MG Road Branch',
    code: 'MFI-BLR-001',
    address: '123, MG Road, Near City Center, Bangalore, Karnataka - 560001',
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
