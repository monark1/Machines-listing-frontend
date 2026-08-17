import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./register/register').then(m => m.RegisterComponent) },

  { path: 'dashboard', canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },

  { path: 'machines', canActivate: [authGuard],
    loadComponent: () => import('./machine-list/machine-list').then(m => m.MachineListComponent) },

  { path: 'machines/add', canActivate: [authGuard, roleGuard], data: { roles: ['admin'] },
    loadComponent: () => import('./machine-form/machine-form').then(m => m.MachineFormComponent) },

  { path: 'machines/:id/edit', canActivate: [authGuard, roleGuard], data: { roles: ['admin'] },
    loadComponent: () => import('./machine-form/machine-form').then(m => m.MachineFormComponent) },

  { path: 'sales', canActivate: [authGuard, roleGuard], data: { roles: ['stakeholder', 'admin'] },
    loadComponent: () => import('./sales-list/sales-list').then(m => m.SalesListComponent) },

  { path: 'employees', canActivate: [authGuard, roleGuard], data: { roles: ['admin'] },
    loadComponent: () => import('./employee-list/employee-list').then(m => m.EmployeeListComponent) },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];