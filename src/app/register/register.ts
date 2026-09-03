import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/user.model';
import { usernameTakenValidator, strongPasswordValidator } from './validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  isSubmitting = signal(false);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^[a-zA-Z ]+$')]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^(?=.*[a-zA-Z])[a-zA-Z0-9]+$')], [usernameTakenValidator()]],
    password: ['', [Validators.required, Validators.minLength(6), strongPasswordValidator()]],
    confirmPassword: ['', Validators.required],
    department: ['', [Validators.required]]
  }, { validators: this.passwordsMatchValidator });

  private passwordsMatchValidator(group: AbstractControl){
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.registerForm.getRawValue();

    const newUser: Omit<User, 'id'> = {
      username: formValue.username!,
      password: formValue.password!,
      role: 'employee',
      fullName: formValue.fullName!,
      email: formValue.email!,
      department: formValue.department!,
      dateJoined: new Date().toISOString(),
      status: 'active'
    };

    this.userService.register(newUser).subscribe({
      next: () => {
        this.notification.success('Registration successful. Please log in.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Registration failed. Please try again.');
      }
    });
  }
  goToLogin(): void {
  this.router.navigate(['/login']);
}
}