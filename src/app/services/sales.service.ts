import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesRecord } from '../models/sales-record.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly API_URL = `${API_BASE_URL}/salesRecords`;

  sales = signal<SalesRecord[]>([]);
  isLoading = signal(false);

  private http = inject(HttpClient);

  loadSales(): void {
    this.isLoading.set(true);
    this.http.get<SalesRecord[]>(this.API_URL).subscribe({
      next: data => {
        this.sales.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}