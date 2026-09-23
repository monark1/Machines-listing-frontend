import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TokenService } from './token.service';
import { SessionTimerService } from './session-timer.service';
import { User } from '../models/user.model';
import { HttpContext, HttpClient } from '@angular/common/http';
import { EXPIRY_CHECK } from '../interceptors/http-context-tokens';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private sessionTimer = inject(SessionTimerService);
  private router = inject(Router);

  reAuthNeeded = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.isAuthenticated.set(this.isLoggedIn());
    this.startSessionTimer();
  }

  login(username: string, password: string): Observable<void> {
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/login`,
      { username, password }
    ).pipe(
      tap(({ accessToken, refreshToken }) => {
        this.tokenService.storeTokens(accessToken, refreshToken);
        this.isAuthenticated.set(true);
      }),
      map(() => void 0)
    );
  }

  reAuthenticate(password: string): Observable<boolean> {
    const username = this.getUsernameFromToken();
    if (!username) return of(false);

    const context = new HttpContext().set(EXPIRY_CHECK, true);

    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/login`,
      { username, password }, { context }).pipe(
        map(({ accessToken, refreshToken }) => {
          this.tokenService.setAccessToken(accessToken);
          this.tokenService.setRefreshToken(refreshToken);
          this.reAuthNeeded.set(false);
          return true;
        }),
        catchError(() => of(false))
      );
  }

  logout(): void {
    this.sessionTimer.clear();
    this.tokenService.clearTokens();
    this.isAuthenticated.set(false);
    this.reAuthNeeded.set(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.tokenService.isTokenValid(this.tokenService.getAccessToken());
  }

  isRefreshTokenValid(): boolean {
    return this.tokenService.isTokenValid(this.tokenService.getRefreshToken());
  }

  getRole(): User['role'] | null {
    const role = this.tokenService.decodePayload(this.tokenService.getAccessToken())?.role;
    return role === 'admin' || role === 'stakeholder' || role === 'employee' ? role : null;
  }

  getUserName(): string | null {
    return this.tokenService.decodePayload(this.tokenService.getAccessToken())?.name ?? null;
  }

  private getUsernameFromToken(): string | null {
    return this.tokenService.decodePayload(this.tokenService.getRefreshToken())?.sub ?? null;
  }

  private startSessionTimer(): void {
    const payload = this.tokenService.decodePayload(this.tokenService.getAccessToken());
    if (!payload?.exp) return;
    this.sessionTimer.start(payload.exp * 1000, () => this.handleExpiry());
  }

  private handleExpiry(): void {
    if (this.isRefreshTokenValid()) {
      this.reAuthNeeded.set(true);
    } else {
      this.logout();
    }
  }
}