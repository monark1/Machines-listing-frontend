import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../services/sales.service';
import { MachineService } from '../services/machine.service';
import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import { SalesRecord } from '../models/sales-record.model';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.css'
})
export class SalesListComponent {
  salesService = inject(SalesService);
  private machineService = inject(MachineService);

  searchTerm = signal('');
  sortField = signal<'region' | 'revenue' | 'saleDate' | 'dealerName'>('saleDate');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = 5;

  filteredSales = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    let result = this.salesService.sales();
    if (term) {
      result = result.filter(s =>
        s.region.toLowerCase().includes(term) || s.dealerName.toLowerCase().includes(term) ||
        s.saleDate.toLowerCase().includes(term) || s.quantitySold.toString().includes(term) ||
        s.revenue.toString().includes(term) || this.getMachineName(s.machineId).toLowerCase().includes(term)
      );
    }
    return [...result].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      const aCompare = typeof av === 'string' ? av.toLowerCase() : av;
      const bCompare = typeof bv === 'string' ? bv.toLowerCase() : bv;

      if (aCompare < bCompare) return -1 * dir;
      if (aCompare > bCompare) return 1 * dir;
      return 0;
    });
  });

  pagedSales = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSales().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSales().length / this.pageSize)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  ngOnInit(): void {
    this.salesService.loadSales();
    this.machineService.loadMachines(); 
  }

  getMachineName(machineId: number): string {
    return this.machineService.machines().find(m => m.id === machineId)?.name ?? 'Unknown';
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  toggleSort(field: 'region' | 'revenue' | 'saleDate' | 'dealerName'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  exportToPdf(): void {
  const doc = new jsPDF();
  doc.text('Sales Report', 14, 15);

  const columns: { label: string; getValue: (m: SalesRecord) => string | number }[] = [
      { label: 'Machine', getValue: m => this.getMachineName(m.machineId) },
      { label: 'Region', getValue: m => m.region },
      { label: 'Qty Sold', getValue: m => m.quantitySold },
      { label: 'Revenue', getValue: s => s.revenue },
      { label: 'Sale Date', getValue: m => m.saleDate },
      { label: 'Dealer', getValue: m => m.dealerName }
    ];

  autoTable(doc, {
    startY: 20,
    head: [columns.map(c => c.label)],
    body: this.filteredSales().map(m => columns.map(c => c.getValue(m)))
  });

  doc.save('sales-report.pdf');
}

exportToCsv(): void {
  const rows = this.filteredSales();
  const header = ['Machine', 'Region', 'Qty Sold', 'Revenue', 'Sale Date', 'Dealer'];
  const csvRows = rows.map(s => [
    this.getMachineName(s.machineId), s.region, s.quantitySold, s.revenue, s.saleDate, s.dealerName
  ].join(','));
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