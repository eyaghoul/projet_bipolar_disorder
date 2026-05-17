import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card fade-in-up">
        <div class="auth-logo">
          <app-logo [size]="72"></app-logo>
          <div class="brand-name">BIPOLAR GUIDE</div>
        </div>
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
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(96, 89, 247, 0.1);
      text-align: center;
    }
    .auth-logo {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; margin-bottom: 20px;
    }
    .brand-name {
      font-size: 15px; font-weight: 800; letter-spacing: 0.1em;
      background: linear-gradient(135deg, #6059f7, #8c61ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    h1 { margin-bottom: 8px; font-size: 24px; }
    .auth-sub { color: var(--text-secondary); margin-bottom: 32px; font-size: 15px; }
    .auth-form { text-align: left; margin-bottom: 24px; }
    .auth-footer { color: var(--text-muted); font-size: 14px; }
    .auth-footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
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
