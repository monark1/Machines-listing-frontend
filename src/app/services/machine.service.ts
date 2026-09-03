import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Machine, MachineDraft } from '../models/machine.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly API_URL = `${API_BASE_URL}/machines`;

  machines = signal<Machine[]>([]);

  constructor(private http: HttpClient) { }


  getMachine(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.API_URL}/${id}`);
  }

  addMachine(machine: MachineDraft): Observable<Machine> {
    return this.http.post<Machine>(this.API_URL, machine).pipe(
      tap(created => this.machines.update(list => [...list, created]))
    );
  }

  updateMachine(id: number, machine: MachineDraft): Observable<Machine> {
    return this.http.put<Machine>(`${this.API_URL}/${id}`, machine).pipe(
      tap(updated => this.machines.update(list => list.map(m => (m.id === id ? updated : m))))
    );
  }

  isLoading = signal(false);

  loadMachines(): void {
    this.isLoading.set(true);
    this.http.get<Machine[]>(this.API_URL).subscribe({
      next: data => {
        this.machines.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  deleteMachine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.machines.update(list => list.filter(m => m.id !== id)))
    );
  }
}
