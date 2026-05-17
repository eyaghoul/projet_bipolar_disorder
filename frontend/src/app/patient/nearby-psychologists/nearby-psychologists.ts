import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ConnectionService } from '../../core/services/connection.service';
import { NotificationService } from '../../core/services/notification.service';

/* ── Static display metadata enrichment (UI-only, no API change) ── */
const SPECIALTIES = ['Psychiatrist']; // All are psychiatrists
const RATINGS     = [4.9, 4.7, 4.8, 4.6, 5.0, 4.5, 4.8, 4.7, 4.9, 4.6];
const REVIEWS     = [128, 74, 96, 53, 211, 38, 87, 62, 143, 49];

@Component({
  selector: 'app-nearby-psychologists',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══════════════════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════════════════ -->
    <div class="page-wrapper">
      <div class="page-header-row fade-in-up">
        <div>
          <h1 class="page-title">Discover Specialists</h1>
          <p class="page-sub">Find and connect with mental health professionals near you</p>
        </div>
        <button *ngIf="isPremium" class="btn-nearby" (click)="showLocationPrompt = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          Find Nearby
        </button>
      </div>

      <!-- Filter chips -->
      <div class="filter-row fade-in-up">
        <button class="chip" [class.chip-active]="activeFilter === f"
                *ngFor="let f of filters"
                (click)="setFilter(f)">{{ f }}</button>
      </div>

      <!-- ══════════════════════════════════════════════════════
           GRID
      ══════════════════════════════════════════════════════ -->
      <div class="pro-grid" *ngIf="!loading">
        <div class="pro-card fade-in-up"
             *ngFor="let doc of displayProviders; let i = index; trackBy: trackByIndex"
             [class.card-connected]="doc.connection_status === 'approved'"
             [class.card-rejected]="doc.connection_status === 'rejected'">

          <!-- ── Top row: avatar + available badge ── -->
          <div class="card-top">
            <div class="avatar-sq">{{ getInitials(doc.name) }}</div>
            <span class="avail-badge">● Available</span>
          </div>

          <!-- ── Doctor info ── -->
          <div class="card-body">
            <div class="name-row">
              <h3 class="doc-name">{{ doc.name }}</h3>
              <span class="verified-icon" *ngIf="doc.verified" title="Verified">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#6059f7"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              </span>
            </div>

            <!-- Specialty badge -->
            <span class="specialty-badge">{{ getSpecialty(i) }}</span>

            <!-- Metadata rows -->
            <div class="meta-list">
              <!-- Rating -->
              <div class="meta-row">
                <span class="meta-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </span>
                <span class="meta-text">
                  <strong>{{ getRating(i) }}</strong>
                  <span class="meta-dim">({{ getReviews(i) }} reviews)</span>
                </span>
              </div>

              <!-- Distance -->
              <div class="meta-row" *ngIf="doc.distance !== undefined">
                <span class="meta-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6059f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span class="meta-text">{{ doc.distance }} km away · {{ doc.city }}</span>
              </div>

              <!-- City (when no distance) -->
              <div class="meta-row" *ngIf="doc.distance === undefined && doc.city">
                <span class="meta-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6059f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span class="meta-text">{{ doc.city }}</span>
              </div>
            </div>
          </div>

          <!-- ── Divider ── -->
          <div class="card-divider"></div>

          <!-- ── Footer: ONE dynamic button ── -->
          <div class="card-footer">
            
            <!-- Main Connect Button -->
            <button class="btn-connect" 
                    [ngClass]="getButtonClass(doc.connection_status)"
                    [disabled]="isButtonDisabled(doc.connection_status)"
                    (click)="handleButtonClick(doc)">
              
              <!-- Loading spinner for pending state -->
              <svg *ngIf="doc.connection_status === 'pending'" 
                   class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              
              <!-- Success checkmark for approved -->
              <svg *ngIf="doc.connection_status === 'approved'" 
                   width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              
              <!-- Button text -->
              {{ getButtonText(doc.connection_status) }}
            </button>

            <!-- Status message -->
            <p class="status-message" *ngIf="getStatusMessage(doc.connection_status)">
              {{ getStatusMessage(doc.connection_status) }}
            </p>

            <!-- Try Again button (only for rejected) -->
            <button *ngIf="doc.connection_status === 'rejected'" 
                    class="btn-retry"
                    (click)="retryConnection(doc)">
              Try Again
            </button>

          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="displayProviders.length === 0 && !loading">
        <div class="empty-art">🔍</div>
        <h3>No Professionals Found</h3>
        <p>Try a different filter or check back soon.</p>
      </div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           LOCATION MODAL
      ══════════════════════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="showLocationPrompt">
        <div class="modal-card fade-in-up">
          <div class="modal-art">📍</div>
          <h2>Access Location?</h2>
          <p>We'll use your GPS to find doctors in your city for immediate support.</p>
          <div class="flex flex-col gap-2 mt-4">
            <button class="btn btn-primary w-full" (click)="requestLocation()">Yes, Find Nearby</button>
            <button class="btn btn-secondary w-full" (click)="showLocationPrompt = false">Maybe Later</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Header ─────────────────────────────────────────────── */
    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 1.75rem; font-weight: 800;
      color: var(--text-primary); margin: 0 0 4px 0;
    }
    .page-sub { font-size: 0.9375rem; color: var(--text-muted); margin: 0; }

    .btn-nearby {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 10px;
      background: var(--primary); color: #fff;
      font-size: 13px; font-weight: 600;
      border: none; cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-nearby:hover { background: var(--primary-hover); transform: translateY(-1px); }

    /* ── Filter chips ────────────────────────────────────────── */
    .filter-row {
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-bottom: 28px;
    }
    .chip {
      padding: 6px 16px; border-radius: 100px;
      font-size: 13px; font-weight: 600;
      background: #fff; color: var(--text-secondary);
      border: 1.5px solid var(--border-color);
      cursor: pointer; transition: all 0.18s;
    }
    .chip:hover { border-color: var(--primary); color: var(--primary); }
    .chip-active {
      background: rgba(96, 89, 247, 0.1);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* ── Grid ────────────────────────────────────────────────── */
    .pro-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* ── Card base ───────────────────────────────────────────── */
    .pro-card {
      background: #fff;
      border: 1.5px solid var(--border-color);
      border-radius: 18px;
      overflow: hidden;
      display: flex; flex-direction: column;
      transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
    }
    .pro-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(96, 89, 247, 0.13);
      border-color: rgba(96, 89, 247, 0.35);
    }

    /* Connected state */
    .card-connected {
      border-color: rgba(96, 89, 247, 0.5) !important;
      background: rgba(96, 89, 247, 0.02);
    }
    /* Rejected state */
    .card-rejected {
      border-color: rgba(211, 47, 47, 0.3) !important;
      background: rgba(211, 47, 47, 0.01);
    }

    /* ── Card top ────────────────────────────────────────────── */
    .card-top {
      padding: 20px 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    /* Avatar: 52px rounded square, purple tint bg, dark initial */
    .avatar-sq {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: #EEEDFE;
      color: #3C3489;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px;
      flex-shrink: 0;
    }

    /* Available badge */
    .avail-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 100px;
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      font-size: 11px; font-weight: 700;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }

    /* ── Card body ───────────────────────────────────────────── */
    .card-body { padding: 14px 20px 16px; flex: 1; }

    .name-row {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 8px;
    }
    .doc-name { font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary); }
    .verified-icon { display: flex; align-items: center; flex-shrink: 0; }

    /* Specialty badge */
    .specialty-badge {
      display: inline-block;
      padding: 3px 10px; border-radius: 100px;
      background: rgba(140, 97, 255, 0.1);
      color: #6059f7;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 14px;
    }

    /* Metadata rows */
    .meta-list { display: flex; flex-direction: column; gap: 7px; }
    .meta-row  { display: flex; align-items: center; gap: 8px; }
    .meta-icon { display: flex; align-items: center; flex-shrink: 0; width: 16px; }
    .meta-text { font-size: 13px; color: var(--text-secondary); }
    .meta-dim  { color: var(--text-muted); margin-left: 3px; }

    /* ── Divider ─────────────────────────────────────────────── */
    .card-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0 20px;
    }

    /* ── Card footer ─────────────────────────────────────────── */
    .card-footer { padding: 16px 20px 20px; }

    /* Main dynamic button */
    .btn-connect {
      width: 100%;
      padding: 11px 16px;
      border-radius: 10px;
      font-size: 14px; font-weight: 700;
      border: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.2s;
      position: relative;
    }

    /* Button states */
    .btn-idle {
      background: var(--primary); color: #fff;
    }
    .btn-idle:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(96, 89, 247, 0.35);
    }

    .btn-pending {
      background: var(--secondary); color: #fff;
      cursor: not-allowed;
    }

    .btn-approved {
      background: #4CAF50; color: #fff;
      cursor: default;
    }

    .btn-rejected {
      background: #F44336; color: #fff;
      cursor: default;
    }

    /* Spinner animation */
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 
      from { transform: rotate(0deg); } 
      to { transform: rotate(360deg); } 
    }

    /* Status message */
    .status-message {
      font-size: 12px;
      text-align: center;
      margin: 8px 0 0;
      line-height: 1.4;
    }

    /* Try again button */
    .btn-retry {
      width: 100%;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px; font-weight: 600;
      background: rgba(96, 89, 247, 0.1);
      color: var(--primary);
      border: 1px solid rgba(96, 89, 247, 0.3);
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.2s;
    }
    .btn-retry:hover {
      background: rgba(96, 89, 247, 0.15);
      border-color: var(--primary);
    }

    /* ── Empty / loading ─────────────────────────────────────── */
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-art   { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }

    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Location modal ──────────────────────────────────────── */
    .modal-card {
      background: var(--card-bg); border: 1px solid var(--border-color);
      border-radius: 24px; padding: 32px; max-width: 400px; width: 90%;
      text-align: center; box-shadow: 0 20px 60px rgba(96, 89, 247, 0.15);
    }
    .modal-art { font-size: 56px; margin-bottom: 16px; }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 640px) {
      .page-header-row { flex-direction: column; gap: 12px; }
      .pro-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class NearbyPsychologistsComponent implements OnInit {
  auth        = inject(AuthService);
  http        = inject(HttpClient);
  connService = inject(ConnectionService);
  notif       = inject(NotificationService);
  cdr         = inject(ChangeDetectorRef);

  /** All providers from API — never mutated directly */
  private allProviders: any[] = [];

  /** What the template actually iterates — rebuilt only on filter change or data load */
  displayProviders: any[] = [];

  loading            = false;
  showLocationPrompt = false;
  nearbyCity         = '';
  activeFilter       = 'All';

  readonly filters = ['All', 'Psychiatrist', 'Telehealth', 'Available today'];

  get isPremium() { return this.auth.currentUser()?.plan === 'premium'; }

  /** trackBy index — guarantees the same DOM node is reused even when status changes */
  trackByIndex(index: number): number { return index; }

  setFilter(f: string) {
    this.activeFilter = f;
    this.rebuildDisplay();
  }

  private rebuildDisplay() {
    if (this.activeFilter === 'All' || this.activeFilter === 'Available today') {
      this.displayProviders = this.allProviders;
    } else {
      this.displayProviders = this.allProviders.filter(
        (_, i) => this.getSpecialty(i) === this.activeFilter
      );
    }
  }

  ngOnInit() { this.fetchAllProviders(); }

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getSpecialty(i: number): string { return 'Psychiatrist'; } // All are psychiatrists
  getRating(i: number):    number { return RATINGS[i % RATINGS.length]; }
  getReviews(i: number):   number { return REVIEWS[i % REVIEWS.length]; }

  fetchAllProviders() {
    this.loading = true;
    this.http.get<any[]>('/api/v1/reports/platform-professionals').subscribe({
      next: (res) => {
        // Normalise connection_status on every doc so it's always a clean string
        this.allProviders = res.map(d => ({
          ...d,
          connection_status: (d.connection_status && d.connection_status !== 'null')
            ? d.connection_status : 'none'
        }));
        this.rebuildDisplay();
        this.loading = false;
      },
      error: () => { this.notif.error('Failed to load providers'); this.loading = false; }
    });
  }

  requestLocation() {
    this.showLocationPrompt = false;
    if (!navigator.geolocation) { this.notif.error('Geolocation not supported'); return; }
    this.loading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => this.findNearby(pos.coords.latitude, pos.coords.longitude),
      ()    => { this.notif.error('Location access denied'); this.loading = false; }
    );
  }

  findNearby(lat: number, lng: number) {
    this.http.get<any>(`/api/v1/doctors/nearby?latitude=${lat}&longitude=${lng}`).subscribe({
      next: (res) => {
        this.allProviders = (res.doctors || []).map((d: any) => ({
          ...d,
          connection_status: (d.connection_status && d.connection_status !== 'null')
            ? d.connection_status : 'none'
        }));
        this.nearbyCity = res.city;
        this.rebuildDisplay();
        this.loading = false;
        if (!this.allProviders.length) this.notif.info(`No nearby providers found in ${res.city}`);
      },
      error: () => { this.notif.error('Failed to find nearby doctors'); this.loading = false; }
    });
  }

  connect(doc: any) {
    const doctorId = doc.id || doc._id;
    
    if (!doctorId) {
      this.notif.error('Invalid doctor ID');
      return;
    }

    // Update status immediately
    doc.connection_status = 'pending';

    this.connService.requestConnection(doctorId).subscribe({
      next: () => {
        this.notif.success('Connection request sent');
      },
      error: (err: any) => {
        // Revert status on error
        doc.connection_status = 'none';
        const errorMsg = err.error?.detail || err.message || 'Request failed';
        this.notif.error(errorMsg);
        console.error('Connection request failed:', err);
      }
    });
  }

  // ── Dynamic Button Methods ──────────────────────────────────

  getButtonClass(status: string): string {
    switch (status) {
      case 'pending': return 'btn-pending';
      case 'approved': return 'btn-approved';
      case 'rejected': return 'btn-rejected';
      default: return 'btn-idle';
    }
  }

  getButtonText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending...';
      case 'approved': return 'Connected';
      case 'rejected': return 'Refused';
      default: return 'Connect Now';
    }
  }

  getStatusMessage(status: string): string {
    switch (status) {
      case 'pending': return 'Waiting for doctor\'s response...';
      case 'approved': return 'Your connection with the doctor is now active';
      case 'rejected': return 'This provider is currently unavailable';
      default: return '';
    }
  }

  isButtonDisabled(status: string): boolean {
    return status === 'pending' || status === 'approved' || status === 'rejected';
  }

  handleButtonClick(doc: any) {
    if (doc.connection_status === 'none') {
      this.connect(doc);
    }
    // For other states, button is disabled so this won't be called
  }

  retryConnection(doc: any) {
    // Reset to idle state and try again
    doc.connection_status = 'none';
    // Small delay to show the state change, then auto-click
    setTimeout(() => {
      this.connect(doc);
    }, 100);
  }
}
