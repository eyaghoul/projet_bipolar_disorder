import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LogoComponent } from '../../shared/components/logo/logo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LogoComponent, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card fade-in-up">
        <div class="auth-logo">
          <app-logo [size]="72"></app-logo>
          <div class="brand-name">BIPOLAR GUIDE</div>
        </div>
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

    <!-- Premium Required Modal -->
    <div class="modal-overlay" *ngIf="showPremiumModal" (click)="closePremiumModal()">
      <div class="modal-card fade-in-up" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closePremiumModal()">&times;</button>
        
        <div class="modal-icon">⭐</div>
        <h2>Premium Account Required</h2>
        <p class="modal-description">
          Professional accounts require a premium subscription to access advanced features including:
        </p>
        
        <ul class="premium-features">
          <li>
            <span class="feature-icon">👥</span>
            <span>Manage multiple patients</span>
          </li>
          <li>
            <span class="feature-icon">📊</span>
            <span>Access detailed analytics and reports</span>
          </li>
          <li>
            <span class="feature-icon">📝</span>
            <span>Create clinical notes</span>
          </li>
          <li>
            <span class="feature-icon">🔔</span>
            <span>Receive patient alerts</span>
          </li>
          <li>
            <span class="feature-icon">💼</span>
            <span>Professional dashboard tools</span>
          </li>
        </ul>

        <div class="pricing-highlight">
          <div class="price">$9.99<span>/month</span></div>
          <div class="price-note">Cancel anytime · Secure payment</div>
        </div>

        <button id="go-premium-btn" class="btn btn-primary btn-lg w-full" 
                (click)="goToPremium()">
          Upgrade to Premium
        </button>
        
        <button class="btn-text" (click)="closePremiumModal()">
          Maybe later
        </button>
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

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 16px; right: 16px;
      background: none;
      border: none;
      font-size: 28px;
      color: var(--text-muted);
      cursor: pointer;
      width: 32px; height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .modal-close:hover {
      background: rgba(96, 89, 247, 0.1);
      color: var(--primary);
    }
    .modal-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .modal-card h2 {
      font-size: 24px;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    .modal-description {
      color: var(--text-secondary);
      font-size: 15px;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .premium-features {
      list-style: none;
      text-align: left;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .premium-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      color: var(--text-primary);
    }
    .feature-icon {
      font-size: 20px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(96, 89, 247, 0.1);
      border-radius: 8px;
      flex-shrink: 0;
    }
    .pricing-highlight {
      background: linear-gradient(135deg, rgba(96, 89, 247, 0.1), rgba(140, 97, 255, 0.1));
      border: 1px solid rgba(96, 89, 247, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .price {
      font-size: 36px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 4px;
    }
    .price span {
      font-size: 16px;
      color: var(--text-secondary);
      font-weight: 400;
    }
    .price-note {
      color: var(--text-muted);
      font-size: 13px;
    }
    .btn-text {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 14px;
      cursor: pointer;
      padding: 8px;
      margin-top: 12px;
      transition: color 0.2s;
    }
    .btn-text:hover {
      color: var(--text-primary);
    }
  `],
})
export class RegisterComponent {
  name = ''; email = ''; password = ''; role = 'patient'; loading = false;
  showPremiumModal = false;
  auth = inject(AuthService);
  notif = inject(NotificationService);
  router = inject(Router);

  submit() {
    if (!this.name || !this.email || !this.password) return;
    
    // Check if user is trying to register as a professional
    if (this.role === 'professional') {
      // Store registration data temporarily
      sessionStorage.setItem('pending_registration', JSON.stringify({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role
      }));
      // Show premium modal
      this.showPremiumModal = true;
      return;
    }

    // For patient registration, proceed normally
    this.performRegistration();
  }

  performRegistration() {
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

  goToPremium() {
    // Navigate to upgrade page with registration context
    this.router.navigate(['/auth/upgrade'], { 
      queryParams: { context: 'doctor_registration' } 
    });
  }

  closePremiumModal() {
    this.showPremiumModal = false;
    // Clear pending registration data
    sessionStorage.removeItem('pending_registration');
  }
}
