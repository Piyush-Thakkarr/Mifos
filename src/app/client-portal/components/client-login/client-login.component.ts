import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mifosx-client-login',
  templateUrl: './client-login.component.html',
  styleUrls: ['./client-login.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ClientLoginComponent {
  // CLIENT-PORTAL: Minimal, isolated client login state
  username = '';
  password = '';
  error: string | null = null;

  constructor(private router: Router) {}

  // CLIENT-PORTAL: Minimal, isolated login handler (no shared services/state)
  login(): void {
    if (this.username === 'client' && this.password === 'password') {
      this.error = null;
      // Navigate within Client Portal lazy module
      this.router.navigate([
        '/client-login',
        'client-dashboard',
        1
      ]);
    } else {
      this.error = 'Wrong credentials';
    }
  }
}
