const API_URL = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    register: async (email, password) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    login: async (email, password) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    me: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
  },

  invoices: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/invoices?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
    getById: async (id) => {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
    upload: async (formData) => {
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData,
      });
      return res.json();
    },
    update: async (id, data) => {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
  },

  duplicates: {
    getAll: async (confirmed = null) => {
      let url = `${API_URL}/duplicates`;
      if (confirmed !== null) url += `?confirmed=${confirmed}`;
      const res = await fetch(url, {
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
    confirm: async (id) => {
      const res = await fetch(`${API_URL}/duplicates/${id}/confirm`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${API_URL}/duplicates/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return res.json();
    },
  },
};

export default api;