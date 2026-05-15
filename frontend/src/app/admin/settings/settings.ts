import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>System Settings</h1>
        <p>Global platform configuration and toggles.</p>
      </div>

      <div class="card fade-in-up" style="max-width: 600px">
        <h3 class="mb-4">Risk Flag Thresholds</h3>
        
        <div class="form-group mb-4">
          <label class="form-label">Manic Spike Mood Threshold (Default: 8)</label>
          <input type="number" class="form-control" value="8" />
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Rapid Cycling Window (Days, Default: 30)</label>
          <input type="number" class="form-control" value="30" />
        </div>

        <div class="divider"></div>

        <h3 class="mb-4">Features</h3>
        
        <div class="flex items-center gap-2 mb-3">
          <input type="checkbox" id="f1" checked />
          <label for="f1">Enable Premium Subscriptions</label>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <input type="checkbox" id="f2" checked />
          <label for="f2">Enable Google Maps Integration</label>
        </div>

        <button class="btn btn-primary mt-4">Save Configuration</button>
      </div>
    </div>
  `
})
export class SettingsComponent {}
