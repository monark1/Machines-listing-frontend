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
      next: success => {
        this.isSubmitting.set(false);
        if (success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.notification.error('Invalid username or password');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Login failed. Please try again.');
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}