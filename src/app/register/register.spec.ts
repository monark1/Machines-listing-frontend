import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';

describe('RegisterComponent', () => {
  let userServiceMock: { register: ReturnType<typeof vi.fn>; isUsernameTaken: ReturnType<typeof vi.fn> };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const validFormValue = {
    fullName: 'Monark Bhardwaj',
    email: 'monark@test.com',
    username: 'monark1',
    password: 'Secret1!',
    confirmPassword: 'Secret1!',
    department: 'IT'
  };

  function setup() {
    userServiceMock = {
      register: vi.fn().mockReturnValue(of({ id: 1, ...validFormValue })),
      isUsernameTaken: vi.fn().mockReturnValue(of(false))
    };
    notificationMock = { success: vi.fn(), error: vi.fn() };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('synchronous field validators', () => {
    it('should require fullName and reject numbers/symbols in it', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('fullName')!;

      control.setValue('Monark1');
      expect(control.hasError('pattern')).toBe(true);

      control.setValue('Mo');
      expect(control.hasError('minlength')).toBe(true);

      control.setValue('Monark Bhardwaj');
      expect(control.valid).toBe(true);
    });

    it('should require a valid email format', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('email')!;

      control.setValue('not-an-email');
      expect(control.hasError('email')).toBe(true);

      control.setValue('valid@test.com');
      expect(control.hasError('email')).toBe(false);
    });

    it('should require department to be selected', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('department')!;

      expect(control.hasError('required')).toBe(true);
      control.setValue('IT');
      expect(control.valid).toBe(true);
    });
  });

  describe('strongPasswordValidator', () => {
    it('should flag a password missing an uppercase letter', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('password')!;
      control.setValue('secret1!');
      expect(control.hasError('missingUppercase')).toBe(true);
    });

    it('should flag a password with spaces', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('password')!;
      control.setValue('Secret 1!');
      expect(control.hasError('noSpaces')).toBe(true);
    });

    it('should flag 3+ consecutive repeated characters', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('password')!;
      control.setValue('Secrettt1!');
      expect(control.hasError('consecutiveChars')).toBe(true);
    });

    it('should accept a password meeting every validation', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('password')!;
      control.setValue('Secret1!');
      expect(control.errors).toBeNull();
    });
  });

  describe('passwordsMatchValidator (group-level)', () => {
    it('should flag the group when passwords differ', () => {
      const fixture = setup();
      const { registerForm } = fixture.componentInstance;

      registerForm.get('password')!.setValue('Secret1!');
      registerForm.get('confirmPassword')!.setValue('Different1!');

      expect(registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should clear the group error when passwords match', () => {
      const fixture = setup();
      const { registerForm } = fixture.componentInstance;

      registerForm.get('password')!.setValue('Secret1!');
      registerForm.get('confirmPassword')!.setValue('Secret1!');

      expect(registerForm.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('usernameTakenValidator (async, debounced 500ms)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be in PENDING state immediately after typing, before the debounce fires', () => {
      const fixture = setup();
      const control = fixture.componentInstance.registerForm.get('username')!;

      control.setValue('takenname');

      expect(control.status).toBe('PENDING');
      expect(userServiceMock.isUsernameTaken).not.toHaveBeenCalled();
    });

    it('should mark the username taken after the debounce resolves true', async () => {
      const fixture = setup();
      userServiceMock.isUsernameTaken.mockReturnValue(of(true)); 
      const control = fixture.componentInstance.registerForm.get('username')!;

      control.setValue('takenname');
      await vi.advanceTimersByTimeAsync(500);

      expect(userServiceMock.isUsernameTaken).toHaveBeenCalledWith('takenname');
      expect(control.hasError('usernameTaken')).toBe(true);
    });

    it('should mark the username valid after the debounce resolves false', async () => {
      const fixture = setup();
      userServiceMock.isUsernameTaken.mockReturnValue(of(false)); 
      const control = fixture.componentInstance.registerForm.get('username')!;

      control.setValue('freename');
      await vi.advanceTimersByTimeAsync(500);

      expect(control.hasError('usernameTaken')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should NOT call register when the form is invalid', () => {
      const fixture = setup();
      fixture.componentInstance.onSubmit();

      expect(userServiceMock.register).not.toHaveBeenCalled();
      expect(fixture.componentInstance.registerForm.get('fullName')?.touched).toBe(true);
    });

    it('should register with role hardcoded to employee, regardless of form content', async () => {
      vi.useFakeTimers();
      const fixture = setup();
      fixture.componentInstance.registerForm.setValue(validFormValue);
      await vi.advanceTimersByTimeAsync(500); 
      vi.useRealTimers();

      fixture.componentInstance.onSubmit();

      expect(userServiceMock.register).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'employee', status: 'active' })
      );
    });

    it('should navigate to /login and show success on successful registration', async () => {
      vi.useFakeTimers();
      const fixture = setup();
      fixture.componentInstance.registerForm.setValue(validFormValue);
      await vi.advanceTimersByTimeAsync(500);
      vi.useRealTimers();

      fixture.componentInstance.onSubmit();

      expect(notificationMock.success).toHaveBeenCalledWith('Registration successful. Please log in.');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should reset isSubmitting() and show an error if registration fails', async () => {
      vi.useFakeTimers();
      const fixture = setup();
      fixture.componentInstance.registerForm.setValue(validFormValue);
      await vi.advanceTimersByTimeAsync(500);
      vi.useRealTimers();

      userServiceMock.register.mockReturnValue(throwError(() => new Error('server error')));
      fixture.componentInstance.onSubmit();

      expect(fixture.componentInstance.isSubmitting()).toBe(false);
      expect(notificationMock.error).toHaveBeenCalledWith('Registration failed. Please try again.');
    });
  });

  describe('goToLogin', () => {
    it('should navigate to /login', () => {
      const fixture = setup();
      fixture.componentInstance.goToLogin();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});