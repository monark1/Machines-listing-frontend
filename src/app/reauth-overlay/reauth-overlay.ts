import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reauth-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reauth-overlay.html'
})
export class ReauthOverlayComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isSubmitting = signal(false);
  errorMessage = signal('');

  passwordForm = this.fb.group({
    password: ['', Validators.required]
  });

  onVerify(): void {
    if (this.passwordForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const password = this.passwordForm.value.password!;
    this.authService.reAuthenticate(password).subscribe({
      next: success => {
        this.isSubmitting.set(false);
        if (success) {
          this.passwordForm.reset();
        } else {
          this.errorMessage.set('Incorrect password. Please try again.');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Something went wrong. Please try again.');
      }
    });
  }

  onSignOut(): void {
    this.authService.logout();
  }
}