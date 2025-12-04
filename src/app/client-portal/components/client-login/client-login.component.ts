import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'mifosx-client-login',
  templateUrl: './client-login.component.html',
  styleUrls: ['./client-login.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ClientLoginComponent {
  // CLIENT-PORTAL: Client login state
  username = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  // CLIENT-PORTAL: Login handler that calls Django backend
  login(): void {
    this.loading = true;
    this.error = null;

    const formData = {
      username: this.username,
      password: this.password
    };

    this.http.post<any>('http://localhost:8000/auth/login', formData, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.loading = false;
          const clientId = response.clientId || 1;
          // Navigate to new portal route structure
          this.router.navigate(['/client-login', 'portal', clientId, 'dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error?.message || 'Login failed. Please try again.';
        }
      });
  }
}
