import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService } from '../services/machine.service';
import { AuthService } from '../services/auth.service';
import { Machine } from '../models/machine.model';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machine-list.html',
  styleUrl: './machine-list.css',
})
export class MachineListComponent implements OnInit {
  machineService = inject(MachineService);
  private authService = inject(AuthService);
  private router = inject(Router);

  searchTerm = signal('');
  sortField = signal<keyof Machine>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  pageSize = 5;

  private searchInput$ = new Subject<string>();

  isAdmin = computed(() => this.authService.getRole() === 'admin');

  pageNumbers = computed(() =>
    Array.from({ length: this.machineService.totalPages() }, (_, i) => i + 1)
  );

  ngOnInit(): void {
    this.fetch();
    this.searchInput$.pipe(debounceTime(300)).subscribe((term) => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.fetch();
    });
  }

  private fetch(): void {
    this.machineService.loadMachines({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchTerm() || undefined,
      sort: this.sortField(),
      order: this.sortDirection(),
    });
  }

  onSearchChange(term: string): void {
    this.searchInput$.next(term);
  }

  toggleSort(field: keyof Machine): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.fetch();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.machineService.totalPages()) return;
    this.currentPage.set(page);
    this.fetch();
  }

  onDelete(id: number): void {
    if (!confirm('Delete this machine?')) return;
    this.machineService.deleteMachine(id).subscribe(() => this.fetch());
  }

  exportToPdf(): void {
    const doc = new jsPDF();
    doc.text('Machines Report', 14, 15);
    const columns: { label: string; getValue: (m: Machine) => string | number }[] = [
      { label: 'Name', getValue: (m) => m.name },
      { label: 'Category', getValue: (m) => m.category },
      { label: 'Launch Year', getValue: (m) => m.launchYear },
      { label: 'Status', getValue: (m) => m.status },
      { label: 'Unit Price', getValue: (m) => m.unitPrice },
    ];
    autoTable(doc, {
      startY: 20,
      head: [columns.map((c) => c.label)],
      body: this.machineService.machines().map((m) => columns.map((c) => c.getValue(m))),
    });
    doc.save('machines-report.pdf');
  }

  exportToCsv(): void {
    const rows = this.machineService.machines();
    const header = ['Name', 'Category', 'Launch Year', 'Status', 'Unit Price'];
    const csvRows = rows.map((m) => [m.name, m.category, m.launchYear, m.status, m.unitPrice].join(','));
    const csvContent = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'machines-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  goToAdd(): void {
    this.router.navigate(['/machines/add']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/machines', id, 'edit']);
  }
}