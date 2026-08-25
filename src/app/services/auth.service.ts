import { Injectable, signal, inject} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from './user.service'; 
import { User } from '../models/user.model';
import { JwtPayload } from '../models/jwt-payload.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal<boolean>(false);
  private readonly ACCESS_TOKEN_KEY = 'access_token';   
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'; 

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  reAuthNeeded = signal<boolean>(false);

  private userService = inject(UserService);
  private router      = inject(Router);

  constructor() {
     this.isAuthenticated.set(this.isLoggedIn());
    this.startSessionTimer();
  }


  login(username: string, password: string): Observable<boolean> {
    return this.userService.findByUsername(username.toLowerCase()).pipe(
      map(users => {
        const match = users.find(u => u.password === password);
        if (!match) return false;
        if (match.status === 'inactive') return false;
        this.issueTokens(match);
        return true;
      }),
      catchError(() => of(false))
    );
  }


  reAuthenticate(password: string): Observable<boolean> {
    const username = this.getUsernameFromToken();
    if (!username) return of(false);

    return this.userService.findByUsername(username).pipe(
      map(users => {
        const match = users.find(u => u.password === password);
        if (!match) return false;
        this.issueTokens(match);
        this.reAuthNeeded.set(false);
        return true;
      }),
      catchError(() => of(false))
    );
  }


  private issueTokens(user: User): void {
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: JwtPayload = {
      sub: user.username,
      role: user.role,
      name: user.fullName,
      iat: now,
      exp: now + 20 * 60
    };

    const refreshPayload: JwtPayload = {
      sub: user.username,
      iat: now,
      exp: now + 7 * 24 * 3600
    };

    localStorage.setItem(this.ACCESS_TOKEN_KEY, this.buildToken(accessPayload));
    localStorage.setItem(this.REFRESH_TOKEN_KEY, this.buildToken(refreshPayload));
     this.isAuthenticated.set(true);
    this.startSessionTimer();
  }


  private buildToken(payload: object): string {
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = this.base64UrlEncode(JSON.stringify(payload));
    const sig = this.base64UrlEncode('client-side-only');
    return `${header}.${body}.${sig}`;
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  decodePayload(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  private getUsernameFromToken(): string | null {
    const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!token) return null;
    return this.decodePayload(token)?.sub ?? null;
  }


  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return this.decodePayload(token)?.role ?? null;
  }

  getUserName(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return this.decodePayload(token)?.name ?? null;
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    return !!payload && payload.exp > Math.floor(Date.now() / 1000);
  }

  isRefreshTokenValid(): boolean {
    const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!token) return false;
    const payload = this.decodePayload(token);
    return !!payload && payload.exp > Math.floor(Date.now() / 1000);
  }


  private startSessionTimer(): void {
    this.clearSessionTimer();
    const token = this.getAccessToken();
    if (!token) return;
    const payload = this.decodePayload(token);
    if (!payload) return;

    const msUntilExpiry = (payload.exp - Math.floor(Date.now() / 1000)) * 1000;
    if (msUntilExpiry <= 0) return;

    this.sessionTimer = setTimeout(() => {
      if (this.isRefreshTokenValid()) {
        this.reAuthNeeded.set(true);
      } else {
        this.logout();
      }
    }, msUntilExpiry);
  }

  private clearSessionTimer(): void {
    if (this.sessionTimer !== null) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }


  private clearSession(): void {
    this.clearSessionTimer();
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  logout(): void {
    this.clearSession();
    this.reAuthNeeded.set(false);
    this.router.navigate(['/login']);
  }
}