import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SalesRecord } from '../models/sales-record.model';
import { PaginatedResponse } from '../models/machine.model';
import { API_BASE_URL } from '../config/api.config';

export interface SalesListParams {
  page?: number;
  pageSize?: number;
  region?: string;
  machineId?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly API_URL = `${API_BASE_URL}/salesRecords`;

  sales = signal<SalesRecord[]>([]);
  total = signal(0);
  totalPages = signal(1);
  isLoading = signal(false);

  private http = inject(HttpClient);

  loadSales(params: SalesListParams = {}): void {
    this.isLoading.set(true);

    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 5);

    if (params.region) httpParams = httpParams.set('region', params.region);
    if (params.machineId) httpParams = httpParams.set('machineId', params.machineId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);

    this.http.get<PaginatedResponse<SalesRecord>>(this.API_URL, { params: httpParams }).subscribe({
      next: (res) => {
        this.sales.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}