import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

describe('LoginComponent', () => {
  let authServiceMock: { login: ReturnType<typeof vi.fn> };
  let notificationMock: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let loginSubject: Subject<boolean>;

  function setup() {
    loginSubject = new Subject<boolean>();
    authServiceMock = { login: vi.fn().mockReturnValue(loginSubject.asObservable()) };
    notificationMock = { error: vi.fn(), success: vi.fn() };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('form validation', () => {
    it('should start invalid with empty fields', () => {
      const fixture = setup();
      expect(fixture.componentInstance.loginForm.invalid).toBe(true);
    });

    it('should NOT call authService.login when the form is invalid', () => {
      const fixture = setup();
      fixture.componentInstance.onSubmit();

      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitted invalid', () => {
      const fixture = setup();
      const { loginForm } = fixture.componentInstance;

      expect(loginForm.get('username')?.touched).toBe(false);

      fixture.componentInstance.onSubmit();

      expect(loginForm.get('username')?.touched).toBe(true);
      expect(loginForm.get('password')?.touched).toBe(true);
    });
  });

  describe('onSubmit — valid form', () => {
    function fillValidForm(fixture: ReturnType<typeof setup>) {
      fixture.componentInstance.loginForm.setValue({ username: 'monark', password: 'abc123' });
    }

    it('should set isSubmitting to true immediately, before the response arrives', () => {
      const fixture = setup();
      fillValidForm(fixture);

      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.isSubmitting()).toBe(true);

      loginSubject.next(true);
    });

    it('should call authService.login with the entered credentials', () => {
      const fixture = setup();
      fillValidForm(fixture);

      fixture.componentInstance.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith('monark', 'abc123');
      loginSubject.next(true);
    });

    it('should navigate to /dashboard and clear isSubmitting on successful login', () => {
      const fixture = setup();
      fillValidForm(fixture);
      fixture.componentInstance.onSubmit();

      loginSubject.next(true);

      expect(fixture.componentInstance.isSubmitting()).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(notificationMock.error).not.toHaveBeenCalled();
    });

    it('should show an error and NOT navigate when login false (wrong password)', () => {
      const fixture = setup();
      fillValidForm(fixture);
      fixture.componentInstance.onSubmit();

      loginSubject.next(false);

      expect(fixture.componentInstance.isSubmitting()).toBe(false);
      expect(notificationMock.error).toHaveBeenCalledWith('Invalid username or password');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should show an error and clear isSubmitting if the request fails', () => {
      const fixture = setup();
      fillValidForm(fixture);
      fixture.componentInstance.onSubmit();

      loginSubject.error(new Error('Network error'));

      expect(fixture.componentInstance.isSubmitting()).toBe(false);
      expect(notificationMock.error).toHaveBeenCalledWith('Login failed. Please try again.');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('goToRegister', () => {
    it('should navigate to /register', () => {
      const fixture = setup();
      fixture.componentInstance.goToRegister();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/register']);
    });
  });
});