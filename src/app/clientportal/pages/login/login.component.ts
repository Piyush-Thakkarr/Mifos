/* eslint-disable @angular-eslint/prefer-standalone */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { timeout, catchError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class ClientportalLoginComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: [
        'client',
        Validators.required
      ],
      password: [
        'password',
        Validators.required
      ]
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    const { username, password } = this.form.value;

    this.authService
      .login(username, password)
      .pipe(
        timeout(30000), // 30 second timeout for login (increased to handle slow Fineract checks)
        catchError((err: any) => {
          this.loading = false;
          if (err?.name === 'TimeoutError') {
            this.error = 'Login request timed out. Please check your connection and try again.';
          } else if (err?.error?.error) {
            this.error = err.error.error;
          } else if (err?.status === 401) {
            this.error = 'Invalid credentials';
          } else {
            this.error = 'Login failed. Please try again.';
          }
          throw err; // Re-throw to prevent further processing
        })
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/clientportal/dashboard']);
        },
        error: () => {
          // Error already handled in catchError
        }
      });
  }

  navigateToMainLogin(): void {
    this.router.navigate(['/login']);
  }
}
