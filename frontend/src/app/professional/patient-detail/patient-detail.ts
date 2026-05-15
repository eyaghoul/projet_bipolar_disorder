import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PatientsService } from '../../core/services/patients.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfidenceGaugeComponent],
  template: `
    <div class="page-wrapper" *ngIf="patient">
      <div class="page-header flex justify-between items-center fade-in-up">
        <div>
          <h1 class="mb-1">{{ patient.name }}</h1>
          <p class="text-muted">{{ patient.email }} · Enrolled {{ patient.createdAt | date }}</p>
        </div>
        <div class="badge badge-premium" *ngIf="patient.plan === 'premium'">⭐ Premium Patient</div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs fade-in-up">
        <button [class.active]="tab === 'ai'" (click)="tab = 'ai'">AI Assessments</button>
        <button [class.active]="tab === 'mood'" (click)="tab = 'mood'">Mood History</button>
        <button [class.active]="tab === 'notes'" (click)="tab = 'notes'">Clinical Notes</button>
      </div>

      <!-- AI Assessments Tab -->
      <div *ngIf="tab === 'ai'" class="fade-in-up">
        <div *ngFor="let s of screenings" class="card mb-4">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="mb-1">Assessment on {{ s.createdAt | date:'medium' }}</h3>
              <div class="badge" [class.badge-red]="s.binary_label === 'Bipolar'" [class.badge-green]="s.binary_label !== 'Bipolar'">
                {{ s.binary_label }}
              </div>
              <div class="badge badge-indigo ml-2" *ngIf="s.multiclass_label">{{ s.multiclass_label }}</div>
            </div>
            <app-confidence-gauge [score]="s.confidence" [type]="s.binary_label === 'Bipolar' ? 'high' : 'low'"></app-confidence-gauge>
          </div>
          
          <div class="divider"></div>
          <h4>Professional Feedback Loop</h4>
          <p class="text-muted mb-2" style="font-size:0.875rem">Submit label corrections to improve future model retraining.</p>
          <div class="flex gap-2 items-center">
            <select class="form-control" style="width:200px" [(ngModel)]="feedbackData[s.id]">
              <option value="">Select correction...</option>
              <option value="Not Bipolar">Not Bipolar</option>
              <option value="Depressive Episode">Depressive Episode</option>
              <option value="Bipolar Type I">Bipolar Type I</option>
              <option value="Bipolar Type II">Bipolar Type II</option>
            </select>
            <button class="btn btn-secondary" [disabled]="!feedbackData[s.id]" (click)="submitFeedback(s.id)">Submit Correction</button>
          </div>
        </div>
        <p *ngIf="screenings.length === 0" class="text-muted">No assessments found.</p>
      </div>

      <!-- Mood History Tab -->
      <div *ngIf="tab === 'mood'" class="fade-in-up">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Mood (1-10)</th>
                <th>Sleep (h)</th>
                <th>Energy</th>
                <th>Irritability</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of moodLogs">
                <td>{{ m.date }}</td>
                <td class="font-bold text-teal">{{ m.mood }}</td>
                <td>{{ m.sleep }}</td>
                <td>{{ m.energy }}</td>
                <td>{{ m.irritability }}</td>
                <td class="text-muted">{{ m.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Clinical Notes Tab -->
      <div *ngIf="tab === 'notes'" class="grid-2 fade-in-up">
        <div>
          <div *ngFor="let n of notes" class="card mb-3">
            <div class="text-muted" style="font-size:0.8rem;margin-bottom:0.5rem">
              Session: {{ n.sessionDate | date }} | Written: {{ n.createdAt | date:'short' }}
            </div>
            <p>{{ n.content }}</p>
          </div>
          <p *ngIf="notes.length === 0" class="text-muted">No notes found.</p>
        </div>
        
        <div class="card" style="align-self: flex-start">
          <h3 class="mb-3">Add New Note</h3>
          <form (ngSubmit)="saveNote()">
            <div class="form-group">
              <label class="form-label">Session Date</label>
              <input type="date" class="form-control" [(ngModel)]="newNote.sessionDate" name="date" required />
            </div>
            <div class="form-group">
              <label class="form-label">Note Content</label>
              <textarea class="form-control" [(ngModel)]="newNote.content" name="content" required></textarea>
            </div>
            <button class="btn btn-primary w-100" type="submit">Save Note</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
    .tabs button { background: none; border: none; padding: 0.75rem 1rem; color: var(--text-secondary); font-size: 1rem; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: var(--transition); }
    .tabs button:hover { color: var(--text-primary); }
    .tabs button.active { color: var(--teal); border-bottom-color: var(--teal); }
    .ml-2 { margin-left: 0.5rem; }
    .w-100 { width: 100%; justify-content: center; }
  `]
})
export class PatientDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  svc = inject(PatientsService);
  notif = inject(NotificationService);

  patientId = '';
  patient: any;
  tab = 'ai';
  
  screenings: any[] = [];
  moodLogs: any[] = [];
  notes: any[] = [];

  feedbackData: Record<string, string> = {};
  newNote = { sessionDate: new Date().toISOString().split('T')[0], content: '' };

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('id')!;
    this.loadPatient();
    this.loadData();
  }

  loadPatient() {
    this.svc.get(this.patientId).subscribe(res => this.patient = res);
  }

  loadData() {
    this.svc.getScreeningHistory(this.patientId).subscribe(res => {
      this.screenings = res;
      res.forEach((s: any) => this.feedbackData[s.id] = '');
    });
    this.svc.getMoodLogs(this.patientId).subscribe(res => this.moodLogs = res);
    this.svc.getNotes(this.patientId).subscribe(res => this.notes = res);
  }

  saveNote() {
    if (!this.newNote.content) return;
    this.svc.createNote({ patientId: this.patientId, ...this.newNote }).subscribe({
      next: () => {
        this.notif.success('Note saved');
        this.newNote.content = '';
        this.loadData(); // reload notes
      }
    });
  }

  submitFeedback(screeningId: string) {
    const label = this.feedbackData[screeningId];
    if (!label) return;
    this.svc.submitFeedback(screeningId, label, 'Corrected via dashboard').subscribe({
      next: () => {
        this.notif.success('Feedback submitted successfully');
        this.feedbackData[screeningId] = '';
      }
    });
  }
}
