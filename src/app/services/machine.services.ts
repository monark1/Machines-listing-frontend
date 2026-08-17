import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Machine, MachineDraft } from '../models/machine.model';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly API_URL = 'http://localhost:3000/machines';

  machines = signal<Machine[]>([]);

  constructor(private http: HttpClient) { }


  getMachine(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.API_URL}/${id}`);
  }

  addMachine(machine: MachineDraft): Observable<Machine> {
  const nextId = this.machines().length
    ? Math.max(...this.machines().map(m => m.id)) + 1
    : 1;

  const payload = { ...machine, id: nextId };

  return this.http.post<Machine>(this.API_URL, payload).pipe(
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
