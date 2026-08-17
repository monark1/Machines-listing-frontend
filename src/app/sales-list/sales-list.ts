import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../services/sales.service';
import { MachineService } from '../services/machine.services';
import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list.html'
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
        s.region.toLowerCase().includes(term) || s.dealerName.toLowerCase().includes(term)
      );
    }
    return [...result].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  });

  pagedSales = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSales().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSales().length / this.pageSize)));

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

  autoTable(doc, {
    startY: 20,
    head: [['Machine', 'Region', 'Qty Sold', 'Revenue', 'Sale Date', 'Dealer']],
    body: this.filteredSales().map(s => [
      this.getMachineName(s.machineId), s.region, s.quantitySold, s.revenue, s.saleDate, s.dealerName
    ])
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