import axios from 'axios';
import { Patient, Visit, User, Stat } from '../types';

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
      const res = await client.post('/patients/', data);
      return res.data;
    },
  },
  visits: {
    getByPatientId: async (patientId: string): Promise<Visit[]> => {
      const res = await client.get(`/visits/?patientId=${patientId}`);
      return res.data;
    },
    create: async (data: any): Promise<Visit> => {
      // 1. Create the Visit object
      const visitRes = await client.post('/visits/', data);
      const visitId = visitRes.data.id;

      // 2. If there is a file, upload it to the new Visit
      if (data.attachmentFile) {
          const formData = new FormData();
          formData.append('file', data.attachmentFile);
          await client.post(`/visits/${visitId}/upload_attachment/`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Refresh visit data to get the new attachment URL
          const updated = await client.get(`/visits/${visitId}/`);
          return updated.data;
      }
      return visitRes.data;
    },
  },
  dashboard: {
    getStats: async (): Promise<Stat[]> => {
        // Simple mock stats for now, can be replaced with real backend endpoints later
        return [
            { name: 'Total Patients', value: '100+', change: '+12%', changeType: 'positive' },
            { name: 'Visits Today', value: '12', change: '+5%', changeType: 'positive' },
            { name: 'New Registrations', value: '5', change: '-2%', changeType: 'negative' },
            { name: 'Pending Reports', value: '3', changeType: 'neutral' },
        ];
    }
  }
};