import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { NotificationService } from '../services/notification.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeListComponent implements OnInit {
  userService = inject(UserService);
  private notification = inject(NotificationService);

  searchTerm = signal('');
  sortField = signal<keyof User>('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  pageSize = 5;

  private searchInput$ = new Subject<string>();

  pageNumbers = computed(() =>
    Array.from({ length: this.userService.totalPages() }, (_, i) => i + 1)
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
    this.userService.loadUsers({
      page: this.currentPage(),
      pageSize: this.pageSize,
      role: 'employee',
      search: this.searchTerm() || undefined,
      sort: this.sortField(),
      order: this.sortDirection(),
    });
  }

  onSearchChange(term: string): void {
    this.searchInput$.next(term);
  }

  toggleSort(field: keyof User): void {
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
    if (page < 1 || page > this.userService.totalPages()) return;
    this.currentPage.set(page);
    this.fetch();
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate';

    if (!confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.notification.success(`${user.fullName} ${action}d`);
        this.fetch();
      },
      error: () => this.notification.error('Could not update status'),
    });
  }
}