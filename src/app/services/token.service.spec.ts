import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenService } from './token.service';
import { JwtPayload } from '../models/jwt-payload.model';
import { User } from '../models/user.model';

describe('TokenService', () => {
  let service: TokenService;

  const NOW = new Date('2026-01-01T00:00:00.000Z').getTime();

  const mockUser: User = {
    id: 1,
    username: 'monark',
    password: 'irrelevant-here',
    role: 'employee',
    fullName: 'Monark Bhardwaj',
    email: 'monark@test.com',
    department: 'IT',
    dateJoined: '2026-01-01',
    status: 'active'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('token storage', () => {
    it('should return null when no access or refresh token is stored', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should store and retrieve the access token independently of the refresh token', () => {
      service.setAccessToken('access-value');
      service.setRefreshToken('refresh-value');

      expect(service.getAccessToken()).toBe('access-value');
      expect(service.getRefreshToken()).toBe('refresh-value');
    });

    it('should clear both tokens', () => {
      service.setAccessToken('access-value');
      service.setRefreshToken('refresh-value');

      service.clearTokens();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('buildToken / decodePayload round trip', () => {
    const payload: JwtPayload = { sub: 'monark', role: 'admin', name: 'Monark', iat: 1000, exp: 2000 };

    it('should produce a three-part, dot-separated string', () => {
      const token = service.buildToken(payload);
      expect(token.split('.').length).toBe(3);
    });

    it('should produce base64url-safe segments, with no +, /, or = characters', () => {
      const token = service.buildToken(payload);
      const [header, body] = token.split('.');

      expect(header).not.toMatch(/[+/=]/);
      expect(body).not.toMatch(/[+/=]/);
    });

    it('should decode back to exactly the original payload', () => {
      const token = service.buildToken(payload);
      expect(service.decodePayload(token)).toEqual(payload);
    });

    it('should round-trip correctly for payloads of different lengths (padding edge cases)', () => {

      const payloads: JwtPayload[] = [
        { sub: 'a', iat: 1, exp: 2 },
        { sub: 'ab', iat: 1, exp: 2 },
        { sub: 'abc', iat: 1, exp: 2 },
        { sub: 'abcd', iat: 1, exp: 2 }
      ];

      for (const p of payloads) {
        expect(service.decodePayload(service.buildToken(p))).toEqual(p);
      }
    });
  });

  describe('decodePayload — invalid input', () => {
    it('should return null for a null token', () => {
      expect(service.decodePayload(null)).toBeNull();
    });

    it('should return null for a token with the wrong number of parts', () => {
      expect(service.decodePayload('only.two')).toBeNull();
      expect(service.decodePayload('way.too.many.parts')).toBeNull();
    });

    it('should return null for a token whose payload segment is not valid base64/JSON', () => {
      expect(service.decodePayload('header.###notbase64###.sig')).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return false for a null token', () => {
      expect(service.isTokenValid(null)).toBe(false);
    });

    it('should return true when the token\'s exp is in the future', () => {
      const token = service.buildToken({ sub: 'x', iat: 0, exp: Math.floor(NOW / 1000) + 60 });
      expect(service.isTokenValid(token)).toBe(true);
    });

    it('should return false when the token\'s exp is in the past', () => {
      const token = service.buildToken({ sub: 'x', iat: 0, exp: Math.floor(NOW / 1000) - 60 });
      expect(service.isTokenValid(token)).toBe(false);
    });

    it('should return false when the token has no exp claim at all', () => {
      const token = service.buildToken({ sub: 'x', iat: 0 } as JwtPayload);
      expect(service.isTokenValid(token)).toBe(false);
    });
  });

  describe('issueTokensFor', () => {
    const ACCESS_LIFETIME = 15 * 60 * 1000;
    const REFRESH_LIFETIME = 7 * 24 * 60 * 60 * 1000;

    it('should include role and name on the access token', () => {
      const { access } = service.issueTokensFor(mockUser, ACCESS_LIFETIME, REFRESH_LIFETIME);
      const payload = service.decodePayload(access);

      expect(payload?.sub).toBe(mockUser.username);
      expect(payload?.role).toBe(mockUser.role);
      expect(payload?.name).toBe(mockUser.fullName);
    });

    it('should NOT include role or name on the refresh token', () => {
      const { refresh } = service.issueTokensFor(mockUser, ACCESS_LIFETIME, REFRESH_LIFETIME);
      const payload = service.decodePayload(refresh);

      expect(payload?.sub).toBe(mockUser.username);
      expect(payload?.role).toBeUndefined();
      expect(payload?.name).toBeUndefined();
    });
  });
});