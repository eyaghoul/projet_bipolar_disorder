import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(filters: { role?: string; plan?: string; status?: string } = {}) {
    let params = new HttpParams();
    if (filters.role)   params = params.set('role', filters.role);
    if (filters.plan)   params = params.set('plan', filters.plan);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<any[]>(`${API}/admin/users`, { params });
  }

  updateUser(id: string, body: any) {
    return this.http.put<any>(`${API}/admin/users/${id}`, body);
  }

  deleteUser(id: string) {
    return this.http.delete(`${API}/admin/users/${id}`);
  }

  getAuditLogs(limit = 100) {
    return this.http.get<any[]>(`${API}/admin/audit-logs?limit=${limit}`);
  }

  getModelStats() {
    return this.http.get<any>(`${API}/admin/model-stats`);
  }
}
