import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-professional-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Office Settings</h1>
        <p>Manage your office location so patients can find you.</p>
      </div>

      <div class="card fade-in-up" style="max-width: 600px; margin: 0 auto;">
        <h3 class="mb-4">Location Details</h3>
        
        <div class="form-group">
          <label class="form-label">Office Name / Full Name</label>
          <input type="text" class="form-control" [(ngModel)]="profile.name" placeholder="Enter your name">
        </div>

        <div class="form-group">
          <label class="form-label">City</label>
          <input type="text" class="form-control" [(ngModel)]="profile.office_location.city" placeholder="e.g. Tunis">
        </div>

        <div class="form-group">
          <label class="form-label">Full Address</label>
          <textarea class="form-control" [(ngModel)]="profile.office_location.address" placeholder="e.g. 123 Health St, Suite 400" style="min-height: 80px;"></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Latitude</label>
            <input type="number" class="form-control" [(ngModel)]="profile.office_location.latitude" placeholder="e.g. 33.5731">
          </div>
          <div class="form-group">
            <label class="form-label">Longitude</label>
            <input type="number" class="form-control" [(ngModel)]="profile.office_location.longitude" placeholder="e.g. -7.5898">
          </div>
        </div>

        <div class="flex flex-col gap-2 mt-4">
          <button class="btn btn-secondary w-full" (click)="getCurrentLocation()" [disabled]="gettingLocation">
            {{ gettingLocation ? 'Getting Location...' : '🎯 Auto-fill GPS' }}
          </button>
          
          <button class="btn btn-primary w-full" (click)="saveProfile()" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfessionalProfileComponent implements OnInit {
  http = inject(HttpClient);
  notif = inject(NotificationService);

  loading = false;
  saving = false;
  gettingLocation = false;

  profile: any = {
    name: '',
    office_location: {
      city: '',
      address: '',
      latitude: null,
      longitude: null
    }
  };

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.loading = true;
    this.http.get<any>('/api/v1/auth/me').subscribe({
      next: (res) => {
        this.profile.name = res.name;
        if (res.office_location) {
          this.profile.office_location = { ...res.office_location };
        }
        this.loading = false;
      },
      error: () => {
        this.notif.error('Failed to load profile');
        this.loading = false;
      }
    });
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.notif.error('Geolocation not supported');
      return;
    }

    this.gettingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.profile.office_location.latitude = pos.coords.latitude;
        this.profile.office_location.longitude = pos.coords.longitude;
        this.gettingLocation = false;
        this.notif.success('GPS coordinates captured');
      },
      (err) => {
        this.notif.error('Location error: ' + err.message);
        this.gettingLocation = false;
      }
    );
  }

  saveProfile() {
    if (!this.profile.office_location.city) {
      this.notif.error('City is required for filtering');
      return;
    }

    this.profile.office_location.city = this.profile.office_location.city.trim();

    this.saving = true;
    this.http.put('/api/v1/auth/profile', this.profile).subscribe({
      next: () => {
        this.notif.success('Profile updated successfully');
        this.saving = false;
      },
      error: (err) => {
        this.notif.error(err.error?.detail || 'Failed to update profile');
        this.saving = false;
      }
    });
  }
}
