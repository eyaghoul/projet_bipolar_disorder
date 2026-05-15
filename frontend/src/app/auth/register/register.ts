import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card fade-in-up">
        <div class="auth-logo">🧠</div>
        <h1>Create Account</h1>
        <p class="auth-sub">Join BipolarGuide — free to start</p>

        <form (ngSubmit)="submit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Full name</label>
            <input id="reg-name" class="form-control" type="text"
                   [(ngModel)]="name" name="name" placeholder="Your name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input id="reg-email" class="form-control" type="email"
                   [(ngModel)]="email" name="email" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input id="reg-password" class="form-control" type="password"
                   [(ngModel)]="password" name="password" placeholder="Min. 8 characters" minlength="8" required />
          </div>
          <div class="form-group">
            <label class="form-label">I am a…</label>
            <select id="reg-role" class="form-control" [(ngModel)]="role" name="role">
              <option value="patient">Patient (self-assessment)</option>
              <option value="professional">Mental Health Professional</option>
            </select>
          </div>
          <button id="reg-submit" class="btn btn-primary w-full mt-2" type="submit"
                  [disabled]="loading">
            {{ loading ? 'Creating account...' : 'Create Free Account' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/auth/login">Sign in</a>
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
    .auth-footer { color: #757575; font-size: 14px; }
    .auth-footer a { color: #1976D2; text-decoration: none; font-weight: 600; }
  `],
})
export class RegisterComponent {
  name = ''; email = ''; password = ''; role = 'patient'; loading = false;
  auth = inject(AuthService);
  notif = inject(NotificationService);

  submit() {
    if (!this.name || !this.email || !this.password) return;
    this.loading = true;
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => { this.notif.success('Account created!'); this.auth.redirectToDashboard(); },
      error: (e) => { 
        let errorMsg = 'Registration failed';
        if (e.status === 422 && Array.isArray(e.error?.detail)) {
          errorMsg = e.error.detail.map((err: any) => `${err.loc.join('.')} : ${err.msg}`).join(', ');
        } else if (e.error?.detail) {
          errorMsg = typeof e.error.detail === 'string' ? e.error.detail : JSON.stringify(e.error.detail);
        }
        this.notif.error(errorMsg); 
        this.loading = false; 
      },
    });
  }
}
