import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent, FooterComponent } from './components/common/common-components';
import { ToastContainerComponent } from './shared/components/ui-components';
import { ThemeService } from './core/services/core-services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  public themeService = inject(ThemeService); // Initializes theme on app bootstrap

  isReader = false;
  isAdmin = false;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url || '';
        this.isReader = url.includes('/chapter/');
        this.isAdmin = url.startsWith('/admin');
      });
  }
}
