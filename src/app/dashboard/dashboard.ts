import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MachineService } from '../services/machine.service';
import { SalesService } from '../services/sales.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Machine } from '../models/machine.model';
import { SalesRecord } from '../models/sales-record.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit{
  authService = inject(AuthService);
  private machineService = inject(MachineService);
  private salesService = inject(SalesService);
  private userService = inject(UserService);
  private router = inject(Router);

  allUsers = signal<User[]>([]);
  allMachines = signal<Machine[]>([]);
  allSales = signal<SalesRecord[]>([]);

  role = computed(() => this.authService.getRole());
  userName = computed(() => this.authService.getUserName());

  
  totalMachines = computed(() => this.allMachines().length);
  activeMachines = computed(() => this.allMachines().filter(m => m.status === 'active').length);

  totalRevenue = computed(() => this.allSales().reduce((sum, s) => sum + s.revenue, 0));
  totalSalesCount = computed(() => this.allSales().length);

  
  totalEmployees = computed(() => this.allUsers().filter(u => u.role === 'employee').length);
  activeEmployees = computed(() => this.allUsers().filter(u => u.role === 'employee' && u.status === 'active').length);

  ngOnInit(): void {
    this.machineService.getAllMachines().subscribe(machines => this.allMachines.set(machines));

    if (this.role() === 'stakeholder' || this.role() === 'admin') {
      this.salesService.getAllSales().subscribe(sales => this.allSales.set(sales));
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