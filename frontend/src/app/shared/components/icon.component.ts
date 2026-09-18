import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.class]="className"
      [attr.viewBox]="'0 0 24 24'"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [style.width.px]="size || (className?.includes('w-') ? null : 18)"
      [style.height.px]="size || (className?.includes('h-') ? null : 18)"
    >
      <ng-container [ngSwitch]="name">
        <!-- Sparkles -->
        <g *ngSwitchCase="'sparkles'">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
        </g>

        <!-- Zap -->
        <polygon *ngSwitchCase="'zap'" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />

        <!-- Flame -->
        <path *ngSwitchCase="'flame'" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />

        <!-- BookOpen -->
        <g *ngSwitchCase="'book-open'">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </g>

        <!-- Eye -->
        <g *ngSwitchCase="'eye'">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>

        <!-- EyeOff -->
        <g *ngSwitchCase="'eye-off'">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" x2="22" y1="2" y2="22"/>
        </g>

        <!-- Star -->
        <polygon *ngSwitchCase="'star'" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />

        <!-- Bookmark / Follow -->
        <path *ngSwitchCase="'bookmark'" d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>

        <!-- History -->
        <g *ngSwitchCase="'history'">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        </g>

        <!-- User -->
        <g *ngSwitchCase="'user'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Search -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </g>

        <!-- Menu -->
        <g *ngSwitchCase="'menu'">
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </g>

        <!-- X -->
        <g *ngSwitchCase="'x'">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </g>

        <!-- ChevronLeft -->
        <path *ngSwitchCase="'chevron-left'" d="m15 18-6-6 6-6"/>

        <!-- ChevronRight -->
        <path *ngSwitchCase="'chevron-right'" d="m9 18 6-6-6-6"/>

        <!-- ChevronDown -->
        <path *ngSwitchCase="'chevron-down'" d="m6 9 6 6 6-6"/>

        <!-- ChevronUp -->
        <path *ngSwitchCase="'chevron-up'" d="m18 15-6-6-6 6"/>

        <!-- Sliders / Settings -->
        <g *ngSwitchCase="'sliders'">
          <line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/>
          <line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/>
          <line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/>
          <line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>
        </g>

        <!-- Sun -->
        <g *ngSwitchCase="'sun'">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </g>

        <!-- Moon -->
        <path *ngSwitchCase="'moon'" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>

        <!-- MessageSquare / Comment -->
        <path *ngSwitchCase="'message-square'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>

        <!-- ThumbsUp / Like -->
        <g *ngSwitchCase="'thumbs-up'">
          <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
        </g>

        <!-- Share -->
        <g *ngSwitchCase="'share'">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
        </g>

        <!-- Flag / Report -->
        <g *ngSwitchCase="'flag'">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
        </g>

        <!-- Trash -->
        <g *ngSwitchCase="'trash'">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </g>

        <!-- Plus -->
        <g *ngSwitchCase="'plus'">
          <path d="M5 12h14"/><path d="M12 5v14"/>
        </g>

        <!-- Edit -->
        <g *ngSwitchCase="'edit'">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </g>

        <!-- Shield -->
        <path *ngSwitchCase="'shield'" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>

        <!-- ArrowRight -->
        <g *ngSwitchCase="'arrow-right'">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </g>

        <!-- Lock -->
        <g *ngSwitchCase="'lock'">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </g>

        <!-- Mail -->
        <g *ngSwitchCase="'mail'">
          <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </g>

        <!-- Check -->
        <path *ngSwitchCase="'check'" d="M20 6 9 17l-5-5"/>

        <!-- AlertCircle -->
        <g *ngSwitchCase="'alert-circle'">
          <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
        </g>

        <!-- Bell / Notifications -->
        <g *ngSwitchCase="'bell'">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </g>

        <!-- TrendingUp -->
        <g *ngSwitchCase="'trending-up'">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </g>

        <!-- BarChart -->
        <g *ngSwitchCase="'bar-chart'">
          <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
        </g>

        <!-- LogOut -->
        <g *ngSwitchCase="'log-out'">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
        </g>

        <!-- Maximize -->
        <g *ngSwitchCase="'maximize'">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
        </g>

        <!-- Minimize -->
        <g *ngSwitchCase="'minimize'">
          <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
        </g>

        <!-- Refresh -->
        <g *ngSwitchCase="'refresh'">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
        </g>

        <!-- Upload -->
        <g *ngSwitchCase="'upload'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
        </g>

        <!-- Layers / Layout -->
        <g *ngSwitchCase="'layers'">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </g>

        <!-- Default circle -->
        <circle *ngSwitchDefault cx="12" cy="12" r="10" />
      </ng-container>
    </svg>
  `
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() className = '';
  @Input() size?: number;
}
