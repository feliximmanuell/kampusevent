export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  capacity: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  registeredCount: number;
  remainingSeats: number;
  creator?: { id: string; name: string };
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  createdAt: string;
  event: EventItem;
  user?: { id: string; name: string; email: string };
}

export interface CategoryStat {
  category: string;
  total: number;
}

export interface TopEventStat {
  id: string;
  title: string;
  startsAt: string;
  capacity: number;
  registeredCount: number;
}

export interface Stats {
  totalEvents: number;
  upcomingEvents: number;
  totalStudents: number;
  totalRegistrations: number;
  byCategory: CategoryStat[];
  topEvents: TopEventStat[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
