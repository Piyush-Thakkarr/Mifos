/* eslint-disable @angular-eslint/prefer-standalone */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/clientportal/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else if (err?.status === 401) {
          this.error = 'Invalid credentials';
        } else {
          this.error = 'Login failed. Please try again.';
        }
      }
    });
  }
}
