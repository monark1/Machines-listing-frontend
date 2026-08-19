import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MachineService } from '../services/machine.services';
import { SalesService } from '../services/sales.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  authService = inject(AuthService);
  private machineService = inject(MachineService);
  private salesService = inject(SalesService);
  private userService = inject(UserService);
  private router = inject(Router);

  allUsers = signal<User[]>([]);

  role = computed(() => this.authService.getRole());
  userName = computed(() => this.authService.getUserName());

  
  totalMachines = computed(() => this.machineService.machines().length);
  activeMachines = computed(() => this.machineService.machines().filter(m => m.status === 'active').length);

  
  totalRevenue = computed(() =>
    this.salesService.sales().reduce((sum, s) => sum + s.revenue, 0)
  );
  totalSalesCount = computed(() => this.salesService.sales().length);

  
  totalEmployees = computed(() => this.allUsers().filter(u => u.role === 'employee').length);
  activeEmployees = computed(() => this.allUsers().filter(u => u.role === 'employee' && u.status === 'active').length);

  ngOnInit(): void {
    this.machineService.loadMachines();

    if (this.role() === 'stakeholder' || this.role() === 'admin') {
      this.salesService.loadSales();
    }

    if (this.role() === 'admin') {
      this.userService.getAllUsers().subscribe(users => this.allUsers.set(users));
    }
  }
  goToMachines(): void {
    this.router.navigate(['/machines']);
  }
  goToSales(): void {
    this.router.navigate(['/sales']);
  }
  goToEmployees(): void {
    this.router.navigate(['/employees']);
  }
}