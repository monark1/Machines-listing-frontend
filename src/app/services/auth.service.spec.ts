import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import { SessionTimerService } from './session-timer.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let userServiceMock: any;
  let tokenServiceMock: any;
  let sessionTimerMock: any;
  let routerMock: any;

  const mockUser: User = {
    id: 1,
    username: 'monark',
    password: 'secret123',
    role: 'employee',
    fullName: 'Monark Bhardwaj',
    email: 'monark@test.com',
    department: 'IT',
    dateJoined: '2026-01-01',
    status: 'active'
  };

  function setup(overrides: Partial<typeof tokenServiceMock> = {}) {
    userServiceMock = {
      findByUsername: vi.fn().mockReturnValue(of([mockUser]))
    };

    tokenServiceMock = {
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue(null),
      setAccessToken: vi.fn(),
      setRefreshToken: vi.fn(),
      clearTokens: vi.fn(),
      decodePayload: vi.fn().mockReturnValue(null),
      isTokenValid: vi.fn().mockReturnValue(false),
      issueTokensFor: vi.fn().mockReturnValue({ access: 'access-token', refresh: 'refresh-token' }),
      ...overrides
    };

    sessionTimerMock = {
      start: vi.fn(),
      clear: vi.fn()
    };

    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: SessionTimerService, useValue: sessionTimerMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    return TestBed.inject(AuthService);
  }

  it('should be created', () => {
    const service = setup();
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize isAuthenticated to false when no valid token exists', () => {
      const service = setup(); 
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should initialize isAuthenticated to true when a valid access token already exists', () => {
      const service = setup({ isTokenValid: vi.fn().mockReturnValue(true) });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should NOT start a timer when there is no access token', () => {
      setup(); 
      expect(sessionTimerMock.start).not.toHaveBeenCalled();
    });

    it('should resume the timer from the existing token\'s exp on construction', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 300;
      setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'monark', exp: futureExp }) });

      expect(sessionTimerMock.start).toHaveBeenCalledWith(futureExp * 1000, expect.any(Function));
    });
  });

  describe('login', () => {
    it('should return false when no user matches the username', () => {
      const service = setup();
      userServiceMock.findByUsername.mockReturnValue(of([]));

      service.login('nobody', 'x').subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('should return false when password does not match', () => {
      const service = setup();
      service.login('monark', 'wrongpassword').subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('should return false for a correct password on an inactive account, without issuing tokens', () => {
      const service = setup();
      userServiceMock.findByUsername.mockReturnValue(of([{ ...mockUser, status: 'inactive' }]));

      service.login('monark', 'secret123').subscribe(result => {
        expect(result).toBe(false);
      });

      expect(tokenServiceMock.setAccessToken).not.toHaveBeenCalled();
    });

    it('should issue tokens and return true on a correct, active login', () => {
      const service = setup();

      service.login('monark', 'secret123').subscribe(result => {
        expect(result).toBe(true);
      });

      expect(tokenServiceMock.issueTokensFor).toHaveBeenCalledWith(
        mockUser,
        15 * 60 * 1000,
        7 * 24 * 60 * 60 * 1000
      );
      expect(tokenServiceMock.setAccessToken).toHaveBeenCalledWith('access-token');
      expect(tokenServiceMock.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false if the lookup request itself fails', () => {
      const service = setup();
      userServiceMock.findByUsername.mockReturnValue(throwError(() => new Error('network error')));

      service.login('monark', 'secret123').subscribe(result => {
        expect(result).toBe(false);
      });
    });
  });

  describe('reAuthenticate', () => {
    it('should return false on a wrong password', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'monark', exp: 999 }) });

      service.reAuthenticate('wrongpassword').subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('should issue new token, clear reAuthNeeded, and return true on a correct password', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'monark', exp: 999 }) });
      service.reAuthNeeded.set(true);

      service.reAuthenticate('secret123').subscribe(result => {
        expect(result).toBe(true);
      });

      expect(tokenServiceMock.setAccessToken).toHaveBeenCalled();
      expect(service.reAuthNeeded()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear the timer, clear tokens, reset both signals, and navigate to /login', () => {
      const service = setup();
      service.isAuthenticated.set(true);
      service.reAuthNeeded.set(true);

      service.logout();

      expect(sessionTimerMock.clear).toHaveBeenCalled();
      expect(tokenServiceMock.clearTokens).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.reAuthNeeded()).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isLoggedIn / isRefreshTokenValid', () => {
    it('should check the access token specifically', () => {
      const service = setup();
      tokenServiceMock.getAccessToken.mockReturnValue('access-value');

      service.isLoggedIn();

      expect(tokenServiceMock.isTokenValid).toHaveBeenCalledWith('access-value');
    });

    it('should check the refresh token specifically, not the access token', () => {
      const service = setup();
      tokenServiceMock.getRefreshToken.mockReturnValue('refresh-value');

      service.isRefreshTokenValid();

      expect(tokenServiceMock.isTokenValid).toHaveBeenCalledWith('refresh-value');
    });
  });

  describe('getRole', () => {
    it('should return the role when it is a valid role', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'x', role: 'admin' }) });
      expect(service.getRole()).toBe('admin');
    });

    it('should return null when the token has no role claim', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'x' }) });
      expect(service.getRole()).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should return the name claim from the access token', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'x', name: 'Monark' }) });
      expect(service.getUserName()).toBe('Monark');
    });

    it('should return null when there is no name claim', () => {
      const service = setup({ decodePayload: vi.fn().mockReturnValue({ sub: 'x' }) });
      expect(service.getUserName()).toBeNull();
    });
  });

  describe('handleExpiry (triggered via the session timer callback)', () => {
    function captureExpiryCallback(): () => void {
      const call = sessionTimerMock.start.mock.calls[0];
      return call[1];
    }

    it('should set reAuthNeeded when the refresh token is still valid on expiry', () => {
      const service = setup({
        decodePayload: vi.fn().mockReturnValue({ sub: 'x', exp: Math.floor(Date.now() / 1000) + 300 }),
        isTokenValid: vi.fn().mockReturnValue(true)
      });

      const onExpire = captureExpiryCallback();
      onExpire();

      expect(service.reAuthNeeded()).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should log out when the refresh token is also invalid on expiry', () => {
      const service = setup({
        decodePayload: vi.fn().mockReturnValue({ sub: 'x', exp: Math.floor(Date.now() / 1000) + 300 }),
        isTokenValid: vi.fn().mockReturnValue(false)
      });

      const onExpire = captureExpiryCallback();
      onExpire();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});