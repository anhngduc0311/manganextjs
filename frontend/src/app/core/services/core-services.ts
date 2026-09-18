import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, ReaderSettings, ReaderMode, ReaderTheme } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';
  private http = inject(HttpClient);

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          if (Array.isArray(params[key])) {
            params[key].forEach((val: any) => {
              httpParams = httpParams.append(key, val);
            });
          } else {
            httpParams = httpParams.set(key, params[key]);
          }
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  patch<T>(endpoint: string, body: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
  }
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = computed(() => this.toastsSignal());

  show(type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };
    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(title: string, message?: string) {
    this.show('success', title, message);
  }

  error(title: string, message?: string) {
    this.show('error', title, message);
  }

  info(title: string, message?: string) {
    this.show('info', title, message);
  }

  warning(title: string, message?: string) {
    this.show('warning', title, message);
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSignal = signal<string>('dark');
  public currentTheme = computed(() => this.currentThemeSignal());

  constructor() {
    const saved = localStorage.getItem('truyenkomi-theme') || 'dark';
    this.setTheme(saved);
  }

  setTheme(theme: string) {
    this.currentThemeSignal.set(theme);
    localStorage.setItem('truyenkomi-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  public currentUser = computed(() => this.currentUserSignal());
  public token = computed(() => this.tokenSignal());
  public isLoggedIn = computed(() => !!this.currentUserSignal());
  public isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  public isModerator = computed(() => this.currentUserSignal()?.role === 'ADMIN' || this.currentUserSignal()?.role === 'MODERATOR');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedToken = localStorage.getItem('truyenkomi_token');
      const savedUser = localStorage.getItem('truyenkomi_user');
      if (savedToken && savedUser) {
        this.tokenSignal.set(savedToken);
        this.currentUserSignal.set(JSON.parse(savedUser));
        this.fetchProfile();
      }
    } catch {
      this.clearStorage();
    }
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/login', { identifier, password }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/register', { username, email, password }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout() {
    if (this.tokenSignal()) {
      this.api.post('auth/logout', {}).subscribe({ error: () => {} });
    }
    this.clearStorage();
    this.toast.info('Đã đăng xuất tài khoản.');
  }

  fetchProfile() {
    this.api.get<User>('auth/me').subscribe({
      next: user => {
        this.currentUserSignal.set(user);
        localStorage.setItem('truyenkomi_user', JSON.stringify(user));
      },
      error: () => {
        // Token might be expired
      }
    });
  }

  updateCurrentUser(user: User) {
    this.currentUserSignal.set(user);
    localStorage.setItem('truyenkomi_user', JSON.stringify(user));
  }

  private handleAuthSuccess(res: AuthResponse) {
    this.tokenSignal.set(res.accessToken);
    this.currentUserSignal.set(res.user);
    localStorage.setItem('truyenkomi_token', res.accessToken);
    localStorage.setItem('truyenkomi_refresh_token', res.refreshToken);
    localStorage.setItem('truyenkomi_user', JSON.stringify(res.user));
    this.toast.success('Đăng nhập thành công!', `Chào mừng ${res.user.username}`);
  }

  private clearStorage() {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem('truyenkomi_token');
    localStorage.removeItem('truyenkomi_refresh_token');
    localStorage.removeItem('truyenkomi_user');
  }
}
