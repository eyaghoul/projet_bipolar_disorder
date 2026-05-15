import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private http: HttpClient) {}

  list(search = '') {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<any[]>(`${API}/patients`, { params });
  }

  get(id: string) { return this.http.get<any>(`${API}/patients/${id}`); }

  getMoodLogs(id: string) { return this.http.get<any[]>(`${API}/patients/${id}/mood-logs`); }

  getScreeningHistory(id: string) { return this.http.get<any[]>(`${API}/screening/${id}/history`); }

  getNotes(id: string) { return this.http.get<any[]>(`${API}/clinical-notes/${id}`); }

  createNote(body: { patientId: string; content: string; sessionDate: string }) {
    return this.http.post<any>(`${API}/clinical-notes`, body);
  }

  getAlerts() { return this.http.get<any[]>(`${API}/alerts`); }

  resolveAlert(id: string) { return this.http.patch(`${API}/alerts/${id}/resolve`, {}); }

  submitFeedback(screeningId: string, correctedLabel: string, comment: string) {
    return this.http.post(`${API}/feedback/${screeningId}`, { correctedLabel, comment });
  }
}
