import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  isSubmitting = signal(false);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);
  const { username, password } = this.loginForm.getRawValue();

  this.authService.login(username!, password!).subscribe({
    next: () => {
      this.isSubmitting.set(false);
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.isSubmitting.set(false);
      if (err.status === 401) {
        this.notification.error('Invalid username or password');
      } else if (err.status === 403) {
        this.notification.error('Your account is inactive');
      } else {
        this.notification.error('Login failed. Please try again.');
      }
    }
  });
}

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}