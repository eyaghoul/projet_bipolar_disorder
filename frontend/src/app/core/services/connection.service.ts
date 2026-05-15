import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api/v1/connections';

export interface Connection {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  initiated_by: 'patient' | 'doctor';
  requested_at: string;
  responded_at?: string;
  message?: string;
  patient_name?: string;
  doctor_name?: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private http = inject(HttpClient);

  requestConnection(doctorId: string, message?: string): Observable<any> {
    return this.http.post(`${API}/request`, { doctor_id: doctorId, message });
  }

  getMyRequests(): Observable<Connection[]> {
    return this.http.get<Connection[]>(`${API}/my-requests`);
  }

  approveConnection(id: string): Observable<any> {
    return this.http.put(`${API}/${id}/approve`, {});
  }

  rejectConnection(id: string): Observable<any> {
    return this.http.put(`${API}/${id}/reject`, {});
  }

  disconnect(id: string): Observable<any> {
    return this.http.delete(`${API}/${id}`);
  }

  blockDoctor(doctorId: string): Observable<any> {
    return this.http.post(`${API}/${doctorId}/block`, {});
  }
}
