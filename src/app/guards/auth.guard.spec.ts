import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      isLoggedIn: vi.fn(),
      isRefreshTokenValid: vi.fn(),
      reAuthNeeded: { set: vi.fn() },
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  describe('when the access token is still valid', () => {
    it('allows navigation', () => {
      authServiceMock.isLoggedIn.mockReturnValue(true);

      const result = runGuard();

      expect(result).toBe(true);
    });

    it('does not touch reAuthNeeded or trigger logout', () => {
      authServiceMock.isLoggedIn.mockReturnValue(true);

      runGuard();

      expect(authServiceMock.reAuthNeeded.set).not.toHaveBeenCalled();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });

    it('does not even check the refresh token — no reason to if the access token is valid', () => {
      authServiceMock.isLoggedIn.mockReturnValue(true);

      runGuard();

      expect(authServiceMock.isRefreshTokenValid).not.toHaveBeenCalled();
    });
  });

  describe('when the access token is expired but the refresh token is still valid', () => {
    beforeEach(() => {
      authServiceMock.isLoggedIn.mockReturnValue(false);
      authServiceMock.isRefreshTokenValid.mockReturnValue(true);
    });

    it('blocks navigation', () => {
      const result = runGuard();

      expect(result).toBe(false);
    });

    it('triggers the re-auth overlay by setting reAuthNeeded to true', () => {
      runGuard();

      expect(authServiceMock.reAuthNeeded.set).toHaveBeenCalledWith(true);
    });

    it('does not force a full logout — the whole point is to avoid losing the session', () => {
      runGuard();

      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });

  describe('when both the access token and refresh token are expired', () => {
    beforeEach(() => {
      authServiceMock.isLoggedIn.mockReturnValue(false);
      authServiceMock.isRefreshTokenValid.mockReturnValue(false);
    });

    it('blocks navigation', () => {
      const result = runGuard();

      expect(result).toBe(false);
    });

    it('calls logout() to clear tokens and redirect to /login', () => {
      runGuard();

      expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    });

    it('does not trigger the re-auth overlay', () => {
      runGuard();

      expect(authServiceMock.reAuthNeeded.set).not.toHaveBeenCalled();
    });
  });
});