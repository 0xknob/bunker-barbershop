// Store global do app. Tudo persistido em localStorage pra sobreviver reload.
// Em produção, esse estado viria do backend (Fase 2 do roadmap).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  date: string;     // ISO yyyy-MM-dd
  time: string;     // HH:mm
  customer: string; // nome do cliente
  createdAt: number;
}

interface BookingState {
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, 'id' | 'createdAt'>) => void;
  removeAppointment: (id: string) => void;

  /** Slots já reservados num dia+barbeiro — usado pra bloquear UI. */
  getBookedSlots: (date: string, barberId: string) => string[];
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (data) => {
        const newAppt: Appointment = {
          ...data,
          id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ appointments: [...s.appointments, newAppt] }));
      },

      removeAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),

      getBookedSlots: (date, barberId) =>
        get()
          .appointments.filter((a) => a.date === date && a.barberId === barberId)
          .map((a) => a.time),
    }),
    {
      name: 'bunker-barbershop:bookings',
      version: 1,
    },
  ),
);
