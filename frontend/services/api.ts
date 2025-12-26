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
      // If just booking status, simple JSON is fine, but we might have files.
      // Let's stick to FormData for consistency if we expect files.
      const formData = new FormData();

      Object.keys(data).forEach(key => {
        if (key !== 'attachmentFiles' && key !== 'visit_treatments') {
          if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        }
      });

      if (data.attachmentFiles && data.attachmentFiles.length > 0) {
        data.attachmentFiles.forEach((file: File) => {
          formData.append('files', file);
        });
      }

      // Handle treatments array for Booking (rare) or generic usage
      // DRF list handling in FormData: 'visit_treatments[0]treatmentId' etc is complex.
      // Better to use JSON payload if no files, OR allow `visit_treatments` to be a JSON string?
      // For now, assuming Booking Create uses simple status/fee and no complex nested lists.

      const headers = data.attachmentFiles?.length ? { 'Content-Type': 'multipart/form-data' } : {};

      // Toggle: If no files, use JSON?
      if (!data.attachmentFiles || data.attachmentFiles.length === 0) {
        return (await client.post('/visits/', data)).data;
      }

      const res = await client.post('/visits/', formData, { headers });
      return res.data;
    },
    update: async (id: string, data: any): Promise<Visit> => {
      const hasFiles = data.attachmentFiles && data.attachmentFiles.length > 0;

      if (!hasFiles) {
        return (await client.patch(`/visits/${id}/`, data)).data;
      }

      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'attachmentFiles' && key !== 'visit_treatments') {
          if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        }
      });

      if (data.attachmentFiles) {
        data.attachmentFiles.forEach((file: File) => {
          formData.append('files', file);
        });
      }

      // If we have treatments (list of objects) and files mixed (FormData), it's messy.
      // Workaround: Send treatments as a JSON string field and parse in backend?
      // OR: Backend view `perform_update` might be tricky.
      // Solution: Send JSON for data updates first, then upload files separately?
      // OR: Just assume Doctor workflow = JSON update for clinical data + Separate API for files?
      // Let's try sending standard JSON if possible.
      // Actually `visit_treatments` is the main thing.

      // NOTE: If using FormData, you CAN append JSON string like formData.append('data', JSON.stringify(data)).
      // But our backend Serializer expects direct fields.

      // Let's fallback to: if update contains complex nested data (treatments), use JSON.
      // If it contains files, we might need 2 requests or a smarter backend.
      // Given user needs: Doctor logs diagnosis (text), treatments (list), and maybe files.
      // Let's prioritize JSON for the treatments logic. If files are needed, maybe add them separately?
      // OR: Just use JSON. We can use base64 for files? No, expensive.

      // Current decision: Use JSON for update.
      // What if files?
      // Let's check if we can skip file upload in "Update" for now or handle it via a separate endpoint?
      // API.ts: `update` will try JSON.

      return (await client.patch(`/visits/${id}/`, data)).data;
    },
    uploadAttachment: async (id: string, file: File): Promise<void> => {
      const formData = new FormData();
      formData.append('file', file);
      await client.post(`/visits/${id}/upload_attachment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
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