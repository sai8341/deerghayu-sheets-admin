import { Patient, Visit, User, Stat } from '../types';

// --- MOCK DATA STORE ---

const MOCK_USERS: User[] = [
  { id: '1', name: 'Dr. Sharma', email: 'doctor@hospital.com', role: 'doctor', avatar: 'https://ui-avatars.com/api/?name=Dr+Sharma&background=0D8ABC&color=fff' },
  { id: '2', name: 'Reception Desk', email: 'reception@hospital.com', role: 'reception', avatar: 'https://ui-avatars.com/api/?name=Reception&background=random' },
  { id: '3', name: 'Admin User', email: 'admin@hospital.com', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin&background=random' }
];

let MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Rajesh Kumar', mobile: '9876543210', age: 45, sex: 'Male', address: '123 MG Road, Bangalore', regNo: 'SD-2023-101', firstVisitDate: '2023-01-15', bloodGroup: 'O+' },
  { id: 'p2', name: 'Priya Singh', mobile: '9123456780', age: 32, sex: 'Female', address: '45 Green Park, Delhi', regNo: 'SD-2023-102', firstVisitDate: '2023-02-20', bloodGroup: 'A-' },
  { id: 'p3', name: 'Amit Verma', mobile: '9988776655', age: 28, sex: 'Male', address: '78 High Street, Mumbai', regNo: 'SD-2023-103', firstVisitDate: '2023-03-10' }
];

let MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    patientId: 'p1',
    date: '2023-01-15',
    doctorName: 'Dr. Sharma',
    clinicalHistory: 'Patient complains of lower back pain for 2 weeks. Aggravated by sitting.',
    diagnosis: 'Kati Shoola (Lumbar Spondylosis)',
    treatmentPlan: 'Kati Vasti for 7 days. Sahacharadi Kashayam 15ml BD.',
    investigations: 'X-Ray Lumbar Spine',
    notes: 'Patient advised to avoid heavy lifting.',
    attachments: []
  },
  {
    id: 'v2',
    patientId: 'p2',
    date: '2023-02-20',
    doctorName: 'Dr. Sharma',
    clinicalHistory: 'Severe headache and nausea. Pitta aggravation symptoms.',
    diagnosis: 'Ardhavabhedaka (Migraine)',
    treatmentPlan: 'Nasya therapy. Pathyadi Kadha.',
    investigations: '',
    notes: '',
    attachments: []
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK API IMPLEMENTATION ---

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      
      // Simple mock login logic
      const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
      
      // Store fake tokens
      localStorage.setItem('access_token', 'mock-jwt-token-access');
      localStorage.setItem('refresh_token', 'mock-jwt-token-refresh');
      
      return user;
    },
  },
  patients: {
    search: async (query: string): Promise<Patient[]> => {
      await delay(400);
      if (!query) return MOCK_PATIENTS;
      
      const lowerQ = query.toLowerCase();
      return MOCK_PATIENTS.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.mobile.includes(lowerQ) || 
        p.regNo.toLowerCase().includes(lowerQ)
      );
    },
    getById: async (id: string): Promise<Patient | undefined> => {
      await delay(300);
      return MOCK_PATIENTS.find(p => p.id === id);
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      await delay(800);
      const newPatient: Patient = {
        ...data,
        id: `p${Date.now()}`, // Generate mock ID
      };
      MOCK_PATIENTS = [newPatient, ...MOCK_PATIENTS];
      return newPatient;
    },
  },
  visits: {
    getByPatientId: async (patientId: string): Promise<Visit[]> => {
      await delay(400);
      return MOCK_VISITS.filter(v => v.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create: async (data: any): Promise<Visit> => {
      await delay(1000);
      
      // Handle "File Upload" by creating a fake URL
      let attachmentUrls: string[] = [];
      if (data.attachmentFile) {
         // Create a local object URL to simulate an uploaded file URL
         // In a real app, this would be the URL returned from the server (AWS S3/Cloudinary)
         const fakeUrl = URL.createObjectURL(data.attachmentFile);
         attachmentUrls = [fakeUrl];
      }

      const newVisit: Visit = {
        id: `v${Date.now()}`,
        patientId: data.patientId,
        date: data.date,
        doctorName: data.doctorName,
        clinicalHistory: data.clinicalHistory,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan,
        investigations: data.investigations || '',
        notes: data.notes || '',
        attachments: attachmentUrls
      };

      MOCK_VISITS = [newVisit, ...MOCK_VISITS];
      return newVisit;
    },
  },
  dashboard: {
    getStats: async (): Promise<Stat[]> => {
      await delay(600);
      return [
        { name: 'Total Patients', value: String(MOCK_PATIENTS.length), change: '+12%', changeType: 'positive' },
        { name: 'Visits Today', value: '8', change: '+5%', changeType: 'positive' },
        { name: 'New Registrations', value: '3', change: '-2%', changeType: 'negative' },
        { name: 'Pending Reports', value: '4', changeType: 'neutral' },
      ];
    },
  },
};