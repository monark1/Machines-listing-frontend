import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeListComponent {
  private userService = inject(UserService);
  private notification = inject(NotificationService);

  allUsers = signal<User[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  sortField = signal<keyof User>('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  employees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    let result = this.allUsers().filter(u => u.role === 'employee');

    if (term) {
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term) || u.status.toLowerCase().includes(term) || u.dateJoined.includes(term)
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

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: users => {
        this.allUsers.set(users);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  toggleSort(field: keyof User): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate';

    if (!confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.notification.success(`${user.fullName} ${action}d`);
        this.loadEmployees(); 
      },
      error: () => this.notification.error('Could not update status')
    });
  }
}