import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  findByUsername(username: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}?username=${username}`);
  }

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
    return this.http.get<User[]>(`${this.API_URL}?username=${username}`).pipe(
      map(users => users.length > 0)
    );
  }
}