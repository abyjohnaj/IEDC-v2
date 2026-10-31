import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mentorClinicService } from './mentorClinicService';
import * as supabaseClientModule from './supabaseClient';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('mentorClinicService - Office Hours & Booking System', () => {
  beforeEach(() => {
    storageMap.clear();
    localStorage.clear();
    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(null);
  });

  it('fetches mentors along with their scheduled clinic slots', async () => {
    const mentors = await mentorClinicService.fetchMentorsWithSlots();
    expect(mentors.length).toBeGreaterThan(0);
    expect(mentors[0]).toHaveProperty('fullName');
    expect(mentors[0]).toHaveProperty('department');
    expect(mentors[0]).toHaveProperty('expertise');
    expect(Array.isArray(mentors[0].slots)).toBe(true);
  });

  it('books an open clinic slot successfully', async () => {
    const mentors = await mentorClinicService.fetchMentorsWithSlots();
    const availableSlot = mentors.flatMap(m => m.slots).find(s => !s.isBooked);
    expect(availableSlot).toBeDefined();

    const bookRes = await mentorClinicService.bookClinicSlot(
      availableSlot!.id,
      'Reviewing IoT hardware schematics and KTU IP disclosure requirements',
      'idea-agridrone-01'
    );

    expect(bookRes.success).toBe(true);
    expect(bookRes.bookingId).toBeDefined();

    // Verify bookings can be fetched
    const bookings = await mentorClinicService.fetchUserBookings('local-user');
    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings[0].slotId).toBe(availableSlot!.id);
  });

  it('prevents double booking on an already booked slot', async () => {
    const mentors = await mentorClinicService.fetchMentorsWithSlots();
    const availableSlot = mentors.flatMap(m => m.slots).find(s => !s.isBooked);
    expect(availableSlot).toBeDefined();

    const res1 = await mentorClinicService.bookClinicSlot(availableSlot!.id, 'First booking');
    expect(res1.success).toBe(true);

    const res2 = await mentorClinicService.bookClinicSlot(availableSlot!.id, 'Double booking attempt');
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('already been booked');
  });
});
