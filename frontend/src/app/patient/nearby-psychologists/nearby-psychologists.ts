import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ConnectionService } from '../../core/services/connection.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-nearby-psychologists',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="flex justify-between items-center mb-6 fade-in-up">
        <div>
          <h1 class="text-3xl font-bold">Discover Specialists</h1>
          <p class="text-muted">Find and connect with mental health professionals</p>
        </div>
        <button *ngIf="isPremium" class="btn btn-primary" (click)="showLocationPrompt = true">
          🎯 Find Nearby
        </button>
      </div>

      <div class="grid-container" *ngIf="!loading">
        <div class="pro-card fade-in-up" *ngFor="let doc of providers">
          <div class="card-inner">
            <div class="card-top">
              <div class="avatar-md">{{ getInitials(doc.name) }}</div>
              <div class="dist-pill" *ngIf="doc.distance !== undefined">
                {{ doc.distance }} km away
              </div>
            </div>
            
            <div class="card-content">
              <div class="flex items-center gap-1 mb-1">
                <h3>{{ doc.name }}</h3>
                <span class="v-badge" *ngIf="doc.verified">✓</span>
              </div>
              
              <div class="loc-box">
                <div class="loc-item">
                  <span class="loc-icon">📍</span>
                  <span class="loc-text">{{ doc.city }}</span>
                </div>
                <div class="loc-item mt-1" *ngIf="doc.address">
                  <span class="loc-icon">🏠</span>
                  <span class="loc-text address">{{ doc.address }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn btn-primary w-full" 
                      [disabled]="doc.connection_status === 'pending' || doc.connection_status === 'approved'"
                      (click)="connect(doc.id)">
                {{ doc.connection_status === 'approved' ? '✓ Connected' : 
                   doc.connection_status === 'pending' ? 'Request Pending' : 'Connect Now' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="providers.length === 0 && !loading">
        <div class="empty-art">🔍</div>
        <h3>No Professionals Found</h3>
        <p>Try searching in a different area or checking back soon.</p>
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner-blue"></div>
      </div>

      <!-- Location Prompt -->
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
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .pro-card {
      background: #2D2D2D;
      border: 1px solid #404040;
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pro-card:hover {
      transform: translateY(-8px);
      border-color: #1976D2;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .card-inner { display: flex; flex-direction: column; height: 100%; }

    .card-top {
      padding: 24px 24px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .avatar-md {
      width: 52px; height: 52px; border-radius: 16px;
      background: #1976D2; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px;
    }
    .dist-pill {
      background: rgba(25, 118, 210, 0.1);
      color: #1976D2;
      padding: 6px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(25, 118, 210, 0.2);
    }

    .card-content { padding: 0 24px 20px; flex-grow: 1; }
    .card-content h3 { margin: 0; font-size: 18px; font-weight: 700; }
    .v-badge {
      background: #1976D2; color: #fff; width: 16px; height: 16px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800;
    }

    .loc-box { margin-top: 16px; }
    .loc-item { display: flex; gap: 8px; align-items: flex-start; }
    .loc-icon { font-size: 14px; opacity: 0.8; }
    .loc-text { font-size: 14px; color: #B0B0B0; font-weight: 500; }
    .loc-text.address { 
      font-size: 13px; color: #757575; 
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .card-footer { padding: 0 24px 24px; }
    
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-art { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
    
    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner-blue {
      width: 32px; height: 32px; border: 4px solid #383838; border-top-color: #1976D2;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-card {
      background: #2D2D2D; border: 1px solid #404040;
      border-radius: 24px; padding: 32px; max-width: 400px; width: 90%;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .modal-art { font-size: 56px; margin-bottom: 16px; }
  `]
})
export class NearbyPsychologistsComponent implements OnInit {
  auth = inject(AuthService);
  http = inject(HttpClient);
  connService = inject(ConnectionService);
  notif = inject(NotificationService);

  providers: any[] = [];
  loading = false;
  showLocationPrompt = false;
  nearbyCity: string = '';

  get isPremium() {
    return this.auth.currentUser()?.plan === 'premium';
  }

  ngOnInit() {
    this.fetchAllProviders();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  fetchAllProviders() {
    this.loading = true;
    this.http.get<any[]>('/api/v1/reports/platform-professionals').subscribe({
      next: (res) => {
        this.providers = res;
        this.loading = false;
      },
      error: () => {
        this.notif.error('Failed to load providers');
        this.loading = false;
      }
    });
  }

  requestLocation() {
    this.showLocationPrompt = false;
    if (!navigator.geolocation) {
      this.notif.error('Geolocation not supported');
      return;
    }

    this.loading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.findNearby(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        this.notif.error('Location access denied');
        this.loading = false;
      }
    );
  }

  findNearby(lat: number, lng: number) {
    this.http.get<any>(`/api/v1/doctors/nearby?latitude=${lat}&longitude=${lng}`).subscribe({
      next: (res) => {
        this.providers = res.doctors;
        this.nearbyCity = res.city;
        this.loading = false;
        if (this.providers.length === 0) {
          this.notif.info(`No nearby providers found in ${res.city}`);
        }
      },
      error: () => {
        this.notif.error('Failed to find nearby doctors');
        this.loading = false;
      }
    });
  }

  connect(doctorId: string) {
    this.connService.requestConnection(doctorId).subscribe({
      next: () => {
        this.notif.success('Connection request sent');
        const doc = this.providers.find(p => p.id === doctorId);
        if (doc) doc.connection_status = 'pending';
      },
      error: (err: any) => this.notif.error(err.error?.detail || 'Request failed')
    });
  }
}
