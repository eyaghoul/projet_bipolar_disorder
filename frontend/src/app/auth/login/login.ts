import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card fade-in-up">
        <div class="auth-logo">🧠</div>
        <h1>Welcome Back</h1>
        <p class="auth-sub">Sign in to your BipolarGuide account</p>

        <form (ngSubmit)="submit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input id="login-email" class="form-control" type="email"
                   [(ngModel)]="email" name="email"
                   placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input id="login-password" class="form-control" type="password"
                   [(ngModel)]="password" name="password"
                   placeholder="••••••••" required />
          </div>
          <button id="login-submit" class="btn btn-primary w-full mt-2" type="submit"
                  [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-hint">
          <p><strong>Demo credentials:</strong></p>
          <p>Free Patient: patient_free1&#64;bipolarguide.com</p>
          <p>Premium: patient_premium1&#64;bipolarguide.com</p>
          <p>Professional: pro1&#64;bipolarguide.com</p>
          <p>Password: Patient123! / Pro123!</p>
        </div>

        <p class="auth-footer">
          Don't have an account?
          <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .auth-card {
      background: #2D2D2D;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      text-align: center;
    }
    .auth-logo { font-size: 40px; margin-bottom: 16px; }
    h1 { margin-bottom: 8px; font-size: 24px; }
    .auth-sub { color: #B0B0B0; margin-bottom: 32px; font-size: 15px; }
    .auth-form { text-align: left; margin-bottom: 24px; }
    .demo-hint {
      background: #383838;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      font-size: 13px;
      color: #B0B0B0;
      margin-bottom: 24px;
    }
    .demo-hint strong { color: #1976D2; }
    .demo-hint p { margin-bottom: 4px; }
    .auth-footer { color: #757575; font-size: 14px; }
    .auth-footer a { color: #1976D2; text-decoration: none; font-weight: 600; }
  `],
})
export class LoginComponent {
  email = ''; password = ''; loading = false;
  auth = inject(AuthService);
  notif = inject(NotificationService);

  submit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.notif.success('Welcome back!'); this.auth.redirectToDashboard(); },
      error: (e) => { this.notif.error(e.error?.detail ?? 'Login failed'); this.loading = false; },
    });
  }
}
