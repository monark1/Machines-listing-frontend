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
  templateUrl: './employee-list.html'
})
export class EmployeeListComponent {
  private userService = inject(UserService);
  private notification = inject(NotificationService);

  allUsers = signal<User[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  employees = computed(() =>
    this.allUsers()
      .filter(u => u.role === 'employee')
      .filter(u => {
        const term = this.searchTerm().trim().toLowerCase();
        if (!term) return true;
        return u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      })
  );

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