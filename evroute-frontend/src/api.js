// ============================================
// EVRoute AI — API Client
// All backend calls go through here
// ============================================

const API_BASE = '/api'; // proxied to http://localhost:8000 via vite


function getToken() {
  return localStorage.getItem('evroute_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('evroute_token');
    localStorage.removeItem('evroute_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || `Request failed: ${res.status}`);
  }

  return data;
}

// AUTH

export async function register({ full_name, email, password }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password }),
  });
  localStorage.setItem('evroute_token', data.access_token);
  localStorage.setItem('evroute_user', JSON.stringify(data.user));
  return data;
}

export async function login({ email, password }) {
  const data = await request('/auth/login/json', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('evroute_token', data.access_token);
  localStorage.setItem('evroute_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('evroute_token');
  localStorage.removeItem('evroute_user');
}

export async function getMe() {
  return request('/auth/me');
}

export async function updateMe(data) {
  return request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('evroute_user'));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

// ROUTE PLANNING

export async function planRoute(payload) {
  return request('/routes/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function planRouteGuest(payload) {
  return request('/routes/plan/guest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// HISTORY

export async function getHistory(limit = 20, offset = 0) {
  return request(`/routes/history?limit=${limit}&offset=${offset}`);
}

export async function getRouteDetail(id) {
  return request(`/routes/history/${id}`);
}

export async function markCompleted(id) {
  return request(`/routes/history/${id}/complete`, { method: 'PATCH' });
}

export async function deleteRoute(id) {
  return request(`/routes/history/${id}`, { method: 'DELETE' });
}

// STATIONS

export async function getNearbyStations(lat, lon, radius_km = 10) {
  return request(`/stations/nearby?lat=${lat}&lon=${lon}&radius_km=${radius_km}`);
}

// GEOCODE

export async function geocodeSearch(q) {
  return request(`/geocode/search?q=${encodeURIComponent(q)}`);
}
