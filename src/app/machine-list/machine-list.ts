import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MachineService } from '../services/machine.services';
import { AuthService } from '../services/auth.service';
import { Machine } from '../models/machine.model';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './machine-list.html',
  styleUrl: './machine-list.css'
})
export class MachineListComponent {
  machineService = inject(MachineService); 
  private authService = inject(AuthService);

  searchTerm = signal('');
  sortField = signal<keyof Machine>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  pageSize = 5;

  isAdmin = computed(() => this.authService.getRole() === 'admin');

  filteredMachines = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    let result = this.machineService.machines();

    if (term) {
      result = result.filter(m => m.name.toLowerCase().includes(term));
    }

    return [...result].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  });

  pagedMachines = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredMachines().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredMachines().length / this.pageSize));
  });

  ngOnInit(): void {
    this.machineService.loadMachines();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1); 
  }

  toggleSort(field: keyof Machine): void {
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

  onDelete(id: number): void {
    if (!confirm('Delete this machine?')) return;
    this.machineService.deleteMachine(id).subscribe();
  }
}