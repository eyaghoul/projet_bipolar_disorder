import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'professional' | 'admin';
  plan: 'free' | 'premium';
  status: string;
  createdAt: string;
}

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this._loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  currentUser = this._user.asReadonly();

  isLoggedIn(): boolean { return !!localStorage.getItem('bg_token'); }
  isPremium(): boolean  { return this._user()?.plan === 'premium'; }

  register(body: { name: string; email: string; password: string; role: string }) {
    return this.http.post<any>(`${API}/auth/register`, body).pipe(
      tap(res => this._saveSession(res))
    );
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${API}/auth/login`, { email, password }).pipe(
      tap(res => this._saveSession(res))
    );
  }

  upgradeToPremium(paymentToken: string) {
    return this.http.post<any>(`${API}/auth/upgrade-to-premium`, { payment_token: paymentToken }).pipe(
      tap(res => this._saveSession(res))
    );
  }

  logout() {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('bg_user');
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  private _saveSession(res: any) {
    localStorage.setItem('bg_token', res.access_token);
    localStorage.setItem('bg_user', JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private _loadUser(): User | null {
    try {
      const raw = localStorage.getItem('bg_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  redirectToDashboard() {
    const role = this._user()?.role;
    if (role === 'patient') this.router.navigate(['/patient/questionnaire']);
    else if (role === 'professional') this.router.navigate(['/professional/patients']);
    else if (role === 'admin') this.router.navigate(['/admin/users']);
  }
}
