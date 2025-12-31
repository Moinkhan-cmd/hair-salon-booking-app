export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  loyaltyPoints: number;
  visitHistory: Appointment[];
  preferredBarberId?: string;
}

export interface Service {
  id: string;
  name: string;
  name_gu?: string;
  name_hi?: string;
  price: number;
  duration: number; // in minutes
  description: string;
  image: string;
  category: 'hair' | 'beard' | 'face' | 'combo';
  isPopular?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  specialization: string;
  experience: string; // e.g. "5 years"
  image: string;
  isAvailable: boolean;
  rating: number;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  services: Service[];
  barberId: string | null; // null means "Any Professional"
  date: string; // ISO Date string YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  discount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  createdAt: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export type Language = 'en' | 'gu' | 'hi';
