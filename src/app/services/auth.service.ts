import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import { SessionTimerService } from './session-timer.service';
import { User } from '../models/user.model';
import { HttpContext } from '@angular/common/http';
import { EXPIRY_CHECK } from '../interceptors/http-context-tokens';

const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private sessionTimer = inject(SessionTimerService);
  private router = inject(Router);

  reAuthNeeded = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);

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
 
    const context = new HttpContext().set(EXPIRY_CHECK, true);
 
    return this.userService.findByUsername(username, context).pipe(
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

  private issueTokens(user: User): void {
    const { access, refresh } = this.tokenService.issueTokensFor(user, ACCESS_TOKEN_LIFETIME_MS, REFRESH_TOKEN_LIFETIME_MS);

    this.tokenService.setAccessToken(access);
    this.tokenService.setRefreshToken(refresh);
    this.isAuthenticated.set(true);
    this.startSessionTimer();
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