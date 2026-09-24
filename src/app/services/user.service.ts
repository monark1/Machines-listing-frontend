import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { API_BASE_URL } from '../config/api.config';
import { PaginatedResponse } from '../models/machine.model';

export interface UserListParams {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: string;
  department?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = `${API_BASE_URL}/users`;
  private http = inject(HttpClient);

  users = signal<User[]>([]);
  total = signal(0);
  totalPages = signal(1);
  isLoading = signal(false);

  getAllUsers(): Observable<User[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', 100);
    return this.http
      .get<PaginatedResponse<User>>(this.API_URL, { params })
      .pipe(map((res) => res.items));
  }

  loadUsers(params: UserListParams = {}): void {
    this.isLoading.set(true);

    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 5);

    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.department) httpParams = httpParams.set('department', params.department);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);

    this.http.get<PaginatedResponse<User>>(this.API_URL, { params: httpParams }).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
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