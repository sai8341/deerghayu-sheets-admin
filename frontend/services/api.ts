import axios from 'axios';
import { Patient, Visit, User, Stat, Treatment } from '../types';

// Use environment variable or default to local Django server
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({ baseURL: API_URL });

// Automatically add JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      // POST to Django JWT endpoint
      const res = await client.post('/auth/login/', { email, password });

      // Store tokens
      localStorage.setItem('auth_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      // Return user data found in the response
      return {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        avatar: res.data.avatar
      };
    },
  },
  patients: {
    search: async (query: string): Promise<Patient[]> => {
      const res = await client.get(`/patients/?search=${query}`);
      return res.data;
    },
    getById: async (id: string): Promise<Patient | undefined> => {
      try {
        const res = await client.get(`/patients/${id}/`);
        return res.data;
      } catch (e) {
        return undefined;
      }
    },
    create: async (data: any): Promise<Patient> => {
      let payload = data;
      let headers = {};

      if (data.registration_document) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (key === 'registration_document') {
            // Only append if it's a File (not null/undefined)
            if (data[key] instanceof File) {
              formData.append('registration_document', data[key]);
            }
          } else {
            // Convert all other values to string to avoid [object Object] issues
            const val = data[key];
            if (val !== null && val !== undefined) {
              formData.append(key, String(val));
            }
          }
        });
        payload = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      const res = await client.post('/patients/', payload, { headers });
      return res.data;
    },
  },
  visits: {
    getByPatientId: async (patientId: string): Promise<Visit[]> => {
      const res = await client.get(`/visits/?patientId=${patientId}`);
      return res.data;
    },
    create: async (data: any): Promise<Visit> => {
      const formData = new FormData();

      // Append normal fields
      Object.keys(data).forEach(key => {
        if (key !== 'attachmentFiles' && key !== 'attachmentFile') {
          formData.append(key, data[key]);
        }
      });

      // Append files (backend expects 'files')
      if (data.attachmentFiles && data.attachmentFiles.length > 0) {
        data.attachmentFiles.forEach((file: File) => {
          formData.append('files', file);
        });
      }

      const res = await client.post('/visits/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
  },
  treatments: {
    getAll: async (): Promise<Treatment[]> => {
      const res = await client.get('/treatments/');
      return res.data;
    },
    create: async (data: any): Promise<Treatment> => {
      const res = await client.post('/treatments/', data);
      return res.data;
    },
    update: async (id: string, data: any): Promise<Treatment> => {
      const res = await client.patch(`/treatments/${id}/`, data);
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await client.delete(`/treatments/${id}/`);
    }
  },
  users: {
    getAll: async (): Promise<User[]> => {
      const res = await client.get('/users/');
      return res.data;
    },
    create: async (data: any): Promise<User> => {
      const res = await client.post('/users/', data);
      return res.data;
    },
    update: async (id: string, data: any): Promise<User> => {
      const res = await client.patch(`/users/${id}/`, data);
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await client.delete(`/users/${id}/`);
    }
  },
  dashboard: {
    getStats: async (): Promise<{ stats: Stat[]; chartData: any[] }> => {
      const res = await client.get('/dashboard/stats/');
      return res.data;
    }
  }
};