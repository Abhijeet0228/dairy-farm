// js/api.js — Centralized API Helper
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

const api = {
  getToken: () => localStorage.getItem('df_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('df_user')) || null; } catch { return null; } },

  headers(withAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (withAuth) { const t = this.getToken(); if (t) h['Authorization'] = `Bearer ${t}`; }
    return h;
  },

  async request(method, endpoint, body = null, isFormData = false) {
    const opts = { method, headers: isFormData ? { Authorization: `Bearer ${this.getToken()}` } : this.headers() };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') throw new Error('Cannot connect to server. Is the backend running?');
      throw err;
    }
  },

  get:    (ep)       => api.request('GET', ep),
  post:   (ep, body) => api.request('POST', ep, body),
  put:    (ep, body) => api.request('PUT', ep, body),
  delete: (ep)       => api.request('DELETE', ep),
  postForm: (ep, fd) => api.request('POST', ep, fd, true),
  putForm:  (ep, fd) => api.request('PUT', ep, fd, true),
};

// Auth helpers
const Auth = {
  _loginPath() {
    // Resolve login path regardless of which subfolder we're in
    const p = window.location.pathname;
    if (p.includes('/admin/') || p.includes('/customer/')) return '../public/login.html';
    return 'login.html';
  },
  login(token, user) {
    localStorage.setItem('df_token', token);
    localStorage.setItem('df_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('df_token');
    localStorage.removeItem('df_user');
    window.location.href = Auth._loginPath();
  },
  requireRole(...roles) {
    const user = api.getUser();
    if (!user || !api.getToken()) { window.location.href = Auth._loginPath(); return false; }
    if (!roles.includes(user.role)) { window.location.href = Auth._loginPath(); return false; }
    return user;
  },
  requireCustomer() { return Auth.requireRole('customer'); },
  requireAdmin()    { return Auth.requireRole('admin', 'staff'); },
};

// Toast notifications
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'success', duration = 3500) {
    this.init();
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const colors = { success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#2563eb' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]};font-size:1.1rem"></i><span style="font-size:0.9rem;flex:1">${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// Utility helpers
const Utils = {
  formatCurrency: (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
  formatDate:     (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
  formatDateTime: (d) => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
  statusBadge(status) {
    const map = {
      pending:'warning', confirmed:'info', processing:'info',
      out_for_delivery:'info', delivered:'success', cancelled:'danger',
      paid:'success', failed:'danger', overdue:'danger', active:'success', inactive:'danger'
    };
    return `<span class="badge badge-${map[status]||'secondary'}">${status.replace(/_/g,' ')}</span>`;
  },
  // Confirm dialog
  confirm(message) { return window.confirm(message); },
  // Show modal
  openModal(id)  { document.getElementById(id).classList.add('open'); },
  closeModal(id) { document.getElementById(id).classList.remove('open'); },
  // Debounce
  debounce(fn, delay = 400) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; },
  // Set page title
  setTitle(t) { document.title = `${t} | Jadhav Dairy`; },
};

// Modal close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
});
