import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../services/sales.service';
import { MachineService } from '../services/machine.service';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { SalesRecord } from '../models/sales-record.model';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.css',
})
export class SalesListComponent implements OnInit {
  salesService = inject(SalesService);
  private machineService = inject(MachineService);

  searchTerm = signal('');
  sortField = signal<'machineName' | 'region' | 'revenue' | 'saleDate' | 'dealerName'>('saleDate');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = 5;

  private searchInput$ = new Subject<string>();

  pageNumbers = computed(() =>
    Array.from({ length: this.salesService.totalPages() }, (_, i) => i + 1)
  );

  ngOnInit(): void {
    this.machineService.loadMachines({ pageSize: 100 }); 
    this.fetch();
    this.searchInput$.pipe(debounceTime(300)).subscribe((term) => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.fetch();
    });
  }

  private fetch(): void {
    this.salesService.loadSales({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchTerm() || undefined,
      sort: this.sortField(),
      order: this.sortDirection(),
    });
  }

  getMachineName(machineId: number): string {
    return this.machineService.machines().find((m) => m.id === machineId)?.name ?? 'Unknown';
  }

  onSearchChange(term: string): void {
    this.searchInput$.next(term);
  }

  toggleSort(field: 'machineName' | 'region' | 'revenue' | 'saleDate' | 'dealerName'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.fetch();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.salesService.totalPages()) return;
    this.currentPage.set(page);
    this.fetch();
  }

  exportToPdf(): void {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 15);
    const columns: { label: string; getValue: (m: SalesRecord) => string | number }[] = [
      { label: 'Machine', getValue: (m) => this.getMachineName(m.machineId) },
      { label: 'Region', getValue: (m) => m.region },
      { label: 'Qty Sold', getValue: (m) => m.quantitySold },
      { label: 'Revenue', getValue: (s) => s.revenue },
      { label: 'Sale Date', getValue: (m) => m.saleDate },
      { label: 'Dealer', getValue: (m) => m.dealerName },
    ];
    autoTable(doc, {
      startY: 20,
      head: [columns.map((c) => c.label)],
      body: this.salesService.sales().map((m) => columns.map((c) => c.getValue(m))),
    });
    doc.save('sales-report.pdf');
  }

  exportToCsv(): void {
    const rows = this.salesService.sales();
    const header = ['Machine', 'Region', 'Qty Sold', 'Revenue', 'Sale Date', 'Dealer'];
    const csvRows = rows.map((s) =>
      [this.getMachineName(s.machineId), s.region, s.quantitySold, s.revenue, s.saleDate, s.dealerName].join(',')
    );
    const csvContent = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}