import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

describe('authInterceptor', () => {
  let authServiceMock: any;
  let tokenServiceMock: any;
  let nextMock: ReturnType<typeof vi.fn>;

  const req = new HttpRequest('GET', '/api/machines');

  function runInterceptor() {
    return TestBed.runInInjectionContext(() =>
      authInterceptor(req, nextMock as unknown as HttpHandlerFn)
    );
  }

  beforeEach(() => {
    authServiceMock = {
      isLoggedIn: vi.fn(),
      isRefreshTokenValid: vi.fn(),
      reAuthNeeded: { set: vi.fn() },
      logout: vi.fn()
    };

    tokenServiceMock = {
      getAccessToken: vi.fn()
    };
    nextMock = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: TokenService, useValue: tokenServiceMock }
      ]
    });
  });

  describe('when there is no token at all', () => {
    it('should forward the request unmodified, with no Authorization header', () => {
      tokenServiceMock.getAccessToken.mockReturnValue(null);

      runInterceptor();

      const forwardedReq: HttpRequest<unknown> = nextMock.mock.calls[0][0];
      expect(forwardedReq.headers.has('Authorization')).toBe(false);
    });

    it('should not check isLoggedIn when there is no token to evaluate', () => {
      tokenServiceMock.getAccessToken.mockReturnValue(null);

      runInterceptor();

      expect(authServiceMock.isLoggedIn).not.toHaveBeenCalled();
    });
  });

  describe('when the token is valid', () => {
    beforeEach(() => {
      tokenServiceMock.getAccessToken.mockReturnValue('real-access-token');
      authServiceMock.isLoggedIn.mockReturnValue(true);
    });

    it('should attach the exact token string as the Authorization header', () => {
      runInterceptor();

      const forwardedReq: HttpRequest<unknown> = nextMock.mock.calls[0][0];
      expect(forwardedReq.headers.get('Authorization')).toBe('Bearer real-access-token');
    });

    it('should forward the request to next()', () => {
      runInterceptor();
      expect(nextMock).toHaveBeenCalledTimes(1);
    });

    it('should not trigger reAuthNeeded or logout', () => {
      runInterceptor();

      expect(authServiceMock.reAuthNeeded.set).not.toHaveBeenCalled();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });

  describe('when the token is expired but the refresh token is still valid', () => {
    beforeEach(() => {
      tokenServiceMock.getAccessToken.mockReturnValue('expired-token');
      authServiceMock.isLoggedIn.mockReturnValue(false);
      authServiceMock.isRefreshTokenValid.mockReturnValue(true);
    });

    it('should trigger reAuthNeeded', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(authServiceMock.reAuthNeeded.set).toHaveBeenCalledWith(true);
    });

    it('should NOT call next() — the request must be blocked, not forwarded', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should not call logout in this branch', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });

  describe('when both access token and refresh token are expired', () => {
    beforeEach(() => {
      tokenServiceMock.getAccessToken.mockReturnValue('expired-token');
      authServiceMock.isLoggedIn.mockReturnValue(false);
      authServiceMock.isRefreshTokenValid.mockReturnValue(false);
    });

    it('should call logout', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    });

    it('should NOT call next()', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should not trigger reAuthNeeded in this branch', () => {
      runInterceptor().subscribe({ error: () => {} });
      expect(authServiceMock.reAuthNeeded.set).not.toHaveBeenCalled();
    });
  });
});