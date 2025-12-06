import { Patient, Visit, User } from '../types';

// Mock Data
const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    age: 45,
    sex: 'Male',
    address: '123 Temple Road, Indiranagar',
    regNo: 'SD-2023-001',
    firstVisitDate: '2023-01-15',
    bloodGroup: 'O+',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    mobile: '9123456780',
    age: 32,
    sex: 'Female',
    address: '45 Green Park, JP Nagar',
    regNo: 'SD-2023-045',
    firstVisitDate: '2023-03-22',
    bloodGroup: 'B+',
  },
  {
    id: '3',
    name: 'Amit Patel',
    mobile: '8888888888',
    age: 58,
    sex: 'Male',
    address: '78 Market St, Whitefield',
    regNo: 'SD-2023-099',
    firstVisitDate: '2023-06-10',
    bloodGroup: 'A+',
  },
];

const MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    patientId: '1',
    date: '2023-01-15',
    doctorName: 'Dr. A. Rao',
    clinicalHistory: 'Joint pain in knees, difficulty walking.',
    diagnosis: 'Sandhigata Vata (Osteoarthritis)',
    treatmentPlan: 'Janu Basti, Mahanarayana Taila massage.',
    investigations: 'X-Ray Knee AP/Lat',
    notes: 'Patient advised to avoid cold foods.',
  },
  {
    id: 'v2',
    patientId: '1',
    date: '2023-02-15',
    doctorName: 'Dr. A. Rao',
    clinicalHistory: 'Pain reduced by 40%.',
    diagnosis: 'Sandhigata Vata',
    treatmentPlan: 'Continue medication. Gentle yoga.',
    investigations: '-',
  },
  {
    id: 'v3',
    patientId: '2',
    date: '2023-03-22',
    doctorName: 'Dr. S. Nair',
    clinicalHistory: 'Severe migraine, nausea.',
    diagnosis: 'Ardhavabhedaka (Migraine)',
    treatmentPlan: 'Nasya Karma, Pathyadi Khada.',
    investigations: 'BP Check: 130/80',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      if (email.includes('admin')) {
        return { id: 'u1', name: 'Admin User', email, role: 'admin', avatar: 'https://i.pravatar.cc/150?u=1' };
      } else if (email.includes('doctor')) {
        return { id: 'u2', name: 'Dr. Ananya Rao', email, role: 'doctor', avatar: 'https://i.pravatar.cc/150?u=2' };
      } else {
        return { id: 'u3', name: 'Reception Desk', email, role: 'reception', avatar: 'https://i.pravatar.cc/150?u=3' };
      }
    },
  },
  patients: {
    search: async (query: string): Promise<Patient[]> => {
      await delay(500);
      if (!query) return MOCK_PATIENTS;
      const lowerQ = query.toLowerCase();
      return MOCK_PATIENTS.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQ) ||
          p.mobile.includes(lowerQ) ||
          p.regNo.toLowerCase().includes(lowerQ)
      );
    },
    getById: async (id: string): Promise<Patient | undefined> => {
      await delay(400);
      return MOCK_PATIENTS.find((p) => p.id === id);
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      await delay(800);
      const newPatient = { ...data, id: Math.random().toString(36).substr(2, 9) };
      MOCK_PATIENTS.unshift(newPatient); // Add to beginning
      return newPatient;
    },
  },
  visits: {
    getByPatientId: async (patientId: string): Promise<Visit[]> => {
      await delay(500);
      return MOCK_VISITS.filter((v) => v.patientId === patientId).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    create: async (data: Omit<Visit, 'id'>): Promise<Visit> => {
      await delay(800);
      const newVisit = { ...data, id: Math.random().toString(36).substr(2, 9) };
      MOCK_VISITS.push(newVisit);
      return newVisit;
    },
  },
  dashboard: {
    getStats: async () => {
        await delay(600);
        return [
            { name: 'Total Patients', value: '1,240', change: '+12%', changeType: 'positive' },
            { name: 'Visits Today', value: '45', change: '+5%', changeType: 'positive' },
            { name: 'New Registrations', value: '8', change: '-2%', changeType: 'negative' },
            { name: 'Pending Reports', value: '3', changeType: 'neutral' },
        ];
    }
  }
};