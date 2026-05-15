import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class MoodService {
  constructor(private http: HttpClient) {}

  getLogs(patientId: string) {
    return this.http.get<any[]>(`${API}/mood-log/${patientId}`);
  }

  createLog(log: { date: string; mood: number; sleep: number; energy: number; irritability: number; notes?: string }) {
    return this.http.post<any>(`${API}/mood-log`, log);
  }
}
