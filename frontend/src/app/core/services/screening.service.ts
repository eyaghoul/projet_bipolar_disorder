import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ScreeningService {
  constructor(private http: HttpClient) {}

  runScreening(answers: Record<string, number>) {
    return this.http.post<any>(`${API}/screening/run`, { answers });
  }

  getHistory(patientId: string) {
    return this.http.get<any[]>(`${API}/screening/${patientId}/history`);
  }

  submitQuestionnaire(answers: Record<string, number>) {
    return this.http.post<any>(`${API}/questionnaire/submit`, { answers });
  }
}
