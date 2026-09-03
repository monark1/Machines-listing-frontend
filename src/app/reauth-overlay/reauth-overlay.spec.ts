import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { ReauthOverlayComponent } from './reauth-overlay';
import { AuthService } from '../services/auth.service';

describe('ReauthOverlayComponent', () => {
  let authServiceMock: any;
  let reAuthSubject: Subject<boolean>;
  
  beforeEach(async () => {
    vi.clearAllMocks();

    reAuthSubject = new Subject<boolean>();
    authServiceMock = {
      reAuthenticate: vi.fn().mockReturnValue(reAuthSubject.asObservable()),
      logout: vi.fn(),
      reAuthNeeded: signal(true),
      getUserName: vi.fn().mockReturnValue('Monark')
    };

    await TestBed.configureTestingModule({
      imports: [ReauthOverlayComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(ReauthOverlayComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should start invalid with an empty password', () => {
      const { component } = setup();
      expect(component.passwordForm.invalid).toBe(true);
    });

    it('should NOT call reAuthenticate() when the form is invalid', () => {
      const { component } = setup();
      component.onVerify();

      expect(authServiceMock.reAuthenticate).not.toHaveBeenCalled();
    });
  });

  describe('onVerify — valid form', () => {
    function fillValidForm(component: ReauthOverlayComponent) {
      component.passwordForm.setValue({ password: 'secret123' });
    }

    it('should set isSubmitting true and clear any prior error immediately', () => {
      const { component } = setup();
      component.errorMessage.set('leftover error from before');
      fillValidForm(component);

      component.onVerify();

      expect(component.isSubmitting()).toBe(true);
      expect(component.errorMessage()).toBe('');

      reAuthSubject.next(true);
    });

    it('should call reAuthenticate with the entered password', () => {
      const { component } = setup();
      fillValidForm(component);

      component.onVerify();

      expect(authServiceMock.reAuthenticate).toHaveBeenCalledWith('secret123');
      reAuthSubject.next(true);
    });

    it('should reset the form and clear isSubmitting on successful re-auth', () => {
      const { component } = setup();
      fillValidForm(component);
      component.onVerify();

      reAuthSubject.next(true);

      expect(component.isSubmitting()).toBe(false);
      expect(component.passwordForm.value.password).toBeNull();
      expect(component.errorMessage()).toBe('');
    });

    it('should show an error and keep isSubmitting false when the password is wrong', () => {
      const { component } = setup();
      fillValidForm(component);
      component.onVerify();

      reAuthSubject.next(false);

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBe('Incorrect password. Please try again.');
      expect(component.passwordForm.value.password).toBe('secret123');
    });

    it('should show a generic error if the request itself fails', () => {
      const { component } = setup();
      fillValidForm(component);
      component.onVerify();

      reAuthSubject.error(new Error('network error'));

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBe('Something went wrong. Please try again.');
    });
  });

  describe('onSignOut', () => {
    it('should call authService.logout', () => {
      const { component } = setup();
      component.onSignOut();

      expect(authServiceMock.logout).toHaveBeenCalled();
    });
  });
});