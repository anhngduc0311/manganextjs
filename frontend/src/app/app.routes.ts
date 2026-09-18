import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public Client Pages
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'TruyenKomi - Đọc Truyện Tranh Online Miễn Phí Hay Nhất'
  },
  {
    path: 'comics',
    loadComponent: () => import('./pages/comic-list/comic-list.component').then(m => m.ComicListComponent),
    title: 'Danh Sách Truyện Tranh - TruyenKomi'
  },
  {
    path: 'comic/:slug',
    loadComponent: () => import('./pages/comic-detail/comic-detail.component').then(m => m.ComicDetailComponent)
  },
  {
    path: 'comic/:slug/chapter/:chapterNumber',
    loadComponent: () => import('./pages/reader/reader.component').then(m => m.ReaderComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesPageComponent),
    title: 'Tất Cả Thể Loại - TruyenKomi'
  },
  {
    path: 'genres',
    redirectTo: 'categories',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchPageComponent),
    title: 'Tìm Kiếm Truyện Tranh - TruyenKomi'
  },

  // Auth Pages
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent),
    title: 'Đăng Nhập - TruyenKomi'
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent),
    title: 'Đăng Ký Tài Khoản - TruyenKomi'
  },
  {
    path: 'register',
    redirectTo: 'auth/register',
    pathMatch: 'full'
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Quên Mật Khẩu - TruyenKomi'
  },

  // User Protected Pages
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryPageComponent),
    title: 'Lịch Sử Đọc Truyện - TruyenKomi'
  },
  {
    path: 'followed',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/followed/followed.component').then(m => m.FollowedPageComponent),
    title: 'Truyện Đang Theo Dõi - TruyenKomi'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfilePageComponent),
    title: 'Hồ Sơ Cá Nhân - TruyenKomi'
  },

  // Admin Management Pages
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard - TruyenKomi'
      },
      {
        path: 'comics',
        loadComponent: () => import('./pages/admin/admin-comics.component').then(m => m.AdminComicsComponent),
        title: 'Quản Lý Truyện - Admin'
      },
      {
        path: 'comics/:id/chapters',
        loadComponent: () => import('./pages/admin/admin-chapters.component').then(m => m.AdminChaptersComponent),
        title: 'Quản Lý Chương - Admin'
      },
      {
        path: 'genres',
        loadComponent: () => import('./pages/admin/admin-genres.component').then(m => m.AdminGenresComponent),
        title: 'Quản Lý Thể Loại - Admin'
      },
      {
        path: 'comments',
        loadComponent: () => import('./pages/admin/admin-comments.component').then(m => m.AdminCommentsComponent),
        title: 'Kiểm Duyệt Bình Luận - Admin'
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/admin/admin-reports.component').then(m => m.AdminReportsComponent),
        title: 'Báo Lỗi Hệ Thống - Admin'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'Quản Lý Người Dùng - Admin'
      }
    ]
  },

  // Catch-all Redirect
  {
    path: '**',
    redirectTo: ''
  }
];
