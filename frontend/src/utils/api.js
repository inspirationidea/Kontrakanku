const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Perform a fetch request with automatic auth header injection
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('kontrakanku_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine if payload is FormData (don't set Content-Type in that case)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Defensively parse response (some endpoints may return empty body or non-JSON)
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (response.status !== 204) {
    if (isJson) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        const text = await response.text();
        data = text ? { message: text } : null;
      } catch {
        data = null;
      }
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      (typeof data === 'string' ? data : null) ||
      response.statusText ||
      'Something went wrong';
    throw new Error(message);
  }

  return data;
};

export const api = {
  auth: {
    register: (name, email, password, phone) => 
      request('/auth/register', {
        method: 'POST',
        body: { name, email, password, phone },
      }),
      
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
      
    getMe: () => 
      request('/auth/me', {
        method: 'GET',
      }),
      
    uploadKtp: (formData) => 
      request('/auth/upload-ktp', {
        method: 'POST',
        body: formData, // FormData instance
      }),
      
    verifyUserKtp: (userId, isVerified) =>
      request(`/auth/verify/${userId}`, {
        method: 'POST',
        body: { isVerified },
      }),

    getAll: () => request('/auth/users', { method: 'GET' }),
    getAllAdmins: () => request('/auth/admins', { method: 'GET' }),
    createAdmin: (data) => request('/auth/admins', { method: 'POST', body: data }),
    getGlobalStats: () => request('/auth/global-stats', { method: 'GET' }),

    adminCreate: (formData) => request('/auth/users', { method: 'POST', body: formData }), // FormData

    updateProfile: (name, phone) =>
      request('/auth/profile', { method: 'PUT', body: { name, phone } }),

    uploadAvatar: (formData) =>
      request('/auth/upload-avatar', { method: 'POST', body: formData }),

    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),

    forgotPassword: (email) =>
      request('/auth/forgot-password', { method: 'POST', body: { email } }),

    resetPassword: (email, otp, newPassword) =>
      request('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword } }),

    verifyKtp: (userId, isVerified, reason) =>
      request(`/auth/verify/${userId}`, { method: 'POST', body: { isVerified, reason } }),
  },

  notifications: {
    getAll: () => request('/auth/notifications', { method: 'GET' }),
    markRead: (id) => request(`/auth/notifications/${id}/read`, { method: 'PATCH' }),
  },

  complaints: {
    getAll: () => request('/complaints', { method: 'GET' }),
    create: (formData) => request('/complaints', { method: 'POST', body: formData }),
    updateStatus: (id, status, adminNote) =>
      request(`/complaints/${id}/status`, { method: 'PATCH', body: { status, adminNote } }),
  },

  settings: {
    getPaymentAccounts: () => request('/settings/payment-accounts', { method: 'GET' }),
    savePaymentAccounts: (accounts) =>
      request('/settings/payment-accounts', { method: 'PUT', body: { accounts } }),
  },

  stats: {
    monthly: () => request('/payments/stats/monthly', { method: 'GET' }),
  },

  properties: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.minPrice) query.append('minPrice', params.minPrice);
      if (params.maxPrice) query.append('maxPrice', params.maxPrice);
      
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request(`/properties${queryString}`, {
        method: 'GET',
      });
    },

    getById: (id) => 
      request(`/properties/${id}`, {
        method: 'GET',
      }),

    create: (formData) => 
      request('/properties', {
        method: 'POST',
        body: formData, // FormData
      }),

    update: (id, formData) => 
      request(`/properties/${id}`, {
        method: 'PUT',
        body: formData, // FormData
      }),

    delete: (id) => 
      request(`/properties/${id}`, {
        method: 'DELETE',
      }),

    uploadPhotos: (id, formData) => 
      request(`/properties/${id}/photos`, {
        method: 'POST',
        body: formData, // FormData
      }),
  },

  units: {
    create: (propertyId, data) => 
      request(`/properties/${propertyId}/units`, {
        method: 'POST',
        body: data,
      }),

    update: (unitId, data) =>
      request(`/units/${unitId}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (unitId) =>
      request(`/units/${unitId}`, { method: 'DELETE' }),
  },

  bookings: {
    create: (formData) => 
      request('/bookings', {
        method: 'POST',
        body: formData, // FormData
      }),

    getAll: (status = '') => {
      const query = status ? `?status=${status}` : '';
      return request(`/bookings${query}`, {
        method: 'GET',
      });
    },

    getById: (id) => 
      request(`/bookings/${id}`, {
        method: 'GET',
      }),

    updateStatus: (id, status, reason) =>
      request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: { status, ...(reason ? { reason } : {}) },
      }),

    cancel: (id) => 
      request(`/bookings/${id}/cancel`, {
        method: 'POST',
      }),
  },

  payments: {
    getByBooking: (bookingId) => 
      request(`/payments/${bookingId}`, {
        method: 'GET',
      }),

    createTransaction: (bookingId, method) => 
      request('/payments/create', {
        method: 'POST',
        body: { bookingId, method },
      }),

    confirmManual: (paymentId) => 
      request(`/payments/${paymentId}/confirm`, {
        method: 'POST',
      }),

    triggerWebhook: (payload) =>
      request('/payments/webhook', {
        method: 'POST',
        body: payload,
        headers: { 'x-webhook-secret': 'kontrakanku-webhook-secret-2026' },
      }),
  },
};
