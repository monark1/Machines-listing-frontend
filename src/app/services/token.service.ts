import { Injectable } from '@angular/core';
import { JwtPayload } from '../models/jwt-payload.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  buildToken(payload: JwtPayload): string {
    const header = { alg: 'none', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.base64UrlEncode('client-side-only');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  decodePayload(token: string | null): JwtPayload | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }

  isTokenValid(token: string | null): boolean {
    const payload = this.decodePayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  issueTokensFor(user: User, accessLifetimeMs: number, refreshLifetimeMs: number): { access: string; refresh: string } {
    const now = Date.now();

    const accessPayload: JwtPayload = {
      sub: user.username,
      role: user.role,
      name: user.fullName,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + accessLifetimeMs) / 1000)
    };

    const refreshPayload: JwtPayload = {
      sub: user.username,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + refreshLifetimeMs) / 1000)
    };

    return {
      access: this.buildToken(accessPayload),
      refresh: this.buildToken(refreshPayload)
    };
  }
}