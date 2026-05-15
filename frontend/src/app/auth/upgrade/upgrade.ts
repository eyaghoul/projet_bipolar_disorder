import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  template: `
    <div class="page-wrapper">
      <div class="upgrade-hero fade-in-up">
        <div class="hero-badge">⭐ Premium Plan</div>
        <h1>Unlock the Full Picture</h1>
        <p>Get detailed AI insights, nearby provider search, and professional-grade PDF reports.</p>
      </div>

      <div class="plans-grid fade-in-up">
        <!-- Free plan -->
        <div class="plan-card">
          <div class="plan-header">
            <h3>Free</h3>
            <div class="plan-price">$0<span>/month</span></div>
          </div>
          <ul class="plan-features">
            <li>✅ Bipolar / Not Bipolar result</li>
            <li>✅ Confidence score</li>
            <li>✅ 7-day mood tracker</li>
            <li>✅ Basic mental health resources</li>
            <li class="locked">🔒 Detailed subtype classification</li>
            <li class="locked">🔒 Contributing factor explanation</li>
            <li class="locked">🔒 Nearby psychologists map</li>
            <li class="locked">🔒 90-day mood analytics</li>
            <li class="locked">🔒 PDF report export</li>
          </ul>
          <div class="plan-current">Your current plan</div>
        </div>

        <!-- Premium plan -->
        <div class="plan-card premium">
          <div class="plan-badge-top">MOST POPULAR</div>
          <div class="plan-header">
            <h3>Premium ⭐</h3>
            <div class="plan-price">$9.99<span>/month</span></div>
          </div>
          <ul class="plan-features">
            <li>✅ Everything in Free</li>
            <li>✅ Type I / Type II / Depressive Episode</li>
            <li>✅ AI explanation (top 3 factors)</li>
            <li>✅ Nearby psychologists map</li>
            <li>✅ 30 / 90-day mood analytics</li>
            <li>✅ PDF report export</li>
            <li>✅ Longitudinal episode markers</li>
          </ul>
          <button id="upgrade-btn" class="btn btn-primary btn-lg"
                  style="width:100%;justify-content:center;margin-top:auto"
                  (click)="upgrade()" [disabled]="loading">
            {{ loading ? 'Processing…' : 'Upgrade Now — $9.99/mo' }}
          </button>
          <p class="plan-note">Cancel anytime · Secure mock payment</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upgrade-hero { text-align: center; padding: 3rem 0 2rem; }
    .hero-badge { display: inline-block; padding: 0.375rem 1rem; border-radius: 100px; background: rgba(0,180,216,0.15); color: #00b4d8; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
    .upgrade-hero h1 { margin-bottom: 0.75rem; }
    .upgrade-hero p { color: #94a3b8; font-size: 1.125rem; }
    .plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 900px; margin: 0 auto; }
    .plan-card { background: rgba(22,32,50,0.7); border: 1px solid rgba(0,180,216,0.15); border-radius: 24px; padding: 2rem; display: flex; flex-direction: column; }
    .plan-card.premium { border-color: rgba(0,180,216,0.4); box-shadow: 0 0 40px rgba(0,180,216,0.15); position: relative; }
    .plan-badge-top { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg,#00b4d8,#6366f1); color: #fff; padding: 0.25rem 1rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; }
    .plan-header { margin-bottom: 1.5rem; }
    .plan-price { font-size: 2.5rem; font-weight: 800; color: #00b4d8; margin-top: 0.5rem; }
    .plan-price span { font-size: 1rem; color: #94a3b8; font-weight: 400; }
    .plan-features { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; flex: 1; }
    .plan-features li { font-size: 0.9375rem; }
    .plan-features li.locked { color: #475569; }
    .plan-current { text-align: center; color: #64748b; font-size: 0.875rem; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
    .plan-note { text-align: center; color: #64748b; font-size: 0.8125rem; margin-top: 0.75rem; }
    @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr; } }
  `],
})
export class UpgradeComponent {
  loading = false;
  auth = inject(AuthService);
  notif = inject(NotificationService);
  router = inject(Router);

  upgrade() {
    this.loading = true;
    this.auth.upgradeToPremium('mock_token').subscribe({
      next: () => { this.notif.success('🎉 Upgraded to Premium!'); this.router.navigate(['/patient/results']); },
      error: (e) => { this.notif.error(e.error?.detail ?? 'Upgrade failed'); this.loading = false; },
    });
  }
}
