export type Role = 'admin' | 'doctor' | 'reception';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  mobile: string;
  altMobile?: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  address: string;
  regNo: string;
  firstVisitDate: string;
  bloodGroup?: string;
  registration_document?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  clinicalHistory: string;
  diagnosis: string;
  treatmentPlan: string;
  investigations: string;
  notes?: string;
  attachments?: string[]; // URLs/Names of files
}

export interface Treatment {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Stat {
  name: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}