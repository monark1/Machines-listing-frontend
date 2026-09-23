import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = `${API_BASE_URL}/users`;

  private http = inject(HttpClient);

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.API_URL, user);
  }

  updateUserStatus(id: number, status: 'active' | 'inactive'): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}`, { status });
  }

  isUsernameTaken(username: string): Observable<boolean> {
    return this.http.get<{ taken: boolean }>(
      `${this.API_URL}/check-username/${username}`
    ).pipe(map(res => res.taken));
  }
}