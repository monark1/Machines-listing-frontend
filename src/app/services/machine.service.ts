import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Machine, MachineDraft, PaginatedResponse } from '../models/machine.model';
import { API_BASE_URL } from '../config/api.config';

export interface MachineListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly API_URL = `${API_BASE_URL}/machines`;

  machines = signal<Machine[]>([]);
  total = signal(0);
  totalPages = signal(1);
  isLoading = signal(false);

  private http = inject(HttpClient);

  getMachine(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.API_URL}/${id}`);
  }

  addMachine(machine: MachineDraft): Observable<Machine> {
    return this.http.post<Machine>(this.API_URL, machine);
  }

  updateMachine(id: number, machine: MachineDraft): Observable<Machine> {
    return this.http.put<Machine>(`${this.API_URL}/${id}`, machine);
  }

  loadMachines(params: MachineListParams = {}): void {
    this.isLoading.set(true);

    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 5);

    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);

    this.http.get<PaginatedResponse<Machine>>(this.API_URL, { params: httpParams }).subscribe({
      next: (res) => {
        this.machines.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  deleteMachine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
