import { getSupabase } from './supabaseClient';
import { Mentor, MentorClinicSlot, MentorClinicBooking, ClinicType } from '../types';

const LOCAL_CLINIC_SLOTS_KEY = 'iedc_mentor_clinic_slots_store';
const LOCAL_CLINIC_BOOKINGS_KEY = 'iedc_mentor_clinic_bookings_store';

const DEFAULT_MENTORS: Array<Mentor & { slots: MentorClinicSlot[] }> = [
  {
    id: 'm-1',
    userId: 'u-mentor-1',
    fullName: 'Dr. Arun Kumar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    department: 'Computer Science & Engineering',
    expertise: ['AI / ML Architecture', 'Distributed Systems', 'Cloud & Edge'],
    designation: 'Associate Professor & AI Lab Head',
    organization: 'BMCE Kollam',
    bio: 'Guiding research in applied machine learning, neural networks, and scalable cloud architectures.',
    maxActiveIdeas: 5,
    isActive: true,
    slots: [
      {
        id: 'slot-1',
        mentorId: 'm-1',
        mentorName: 'Dr. Arun Kumar',
        mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        mentorDesignation: 'Associate Professor & AI Lab Head',
        mentorExpertise: ['AI / ML Architecture', 'Cloud & Edge'],
        title: 'Weekly AI & System Architecture Review',
        clinicType: 'Technical Architecture',
        startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
        location: 'Computer Lab 3 / Google Meet',
        meetingLink: 'https://meet.google.com/abc-iedc-bmce',
        maxAttendees: 2,
        isBooked: false,
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'm-2',
    userId: 'u-mentor-2',
    fullName: 'Prof. Lakshmi Nair',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    department: 'Electronics & Communication',
    expertise: ['Hardware Prototyping', 'IoT Sensors', 'Patent & Prior Art Search'],
    designation: 'Faculty Nodal Officer, IEDC',
    organization: 'BMCE Kollam',
    bio: 'Overseeing campus IP protection, patent drafting, hardware incubations, and KTU innovation funding.',
    maxActiveIdeas: 6,
    isActive: true,
    slots: [
      {
        id: 'slot-2',
        mentorId: 'm-2',
        mentorName: 'Prof. Lakshmi Nair',
        mentorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        mentorDesignation: 'Faculty Nodal Officer, IEDC',
        mentorExpertise: ['Hardware Prototyping', 'Patent & Prior Art Search'],
        title: 'Hardware & Patent Filing Clinic',
        clinicType: 'Patent & IP',
        startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(),
        location: 'IEDC BMCE Boardroom',
        meetingLink: 'https://meet.google.com/xyz-iedc-patent',
        maxAttendees: 1,
        isBooked: false,
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'm-3',
    userId: 'u-mentor-3',
    fullName: 'Er. Rajesh Pillai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Alumni Network & Startup Advisory',
    expertise: ['Pitch Deck Critique', 'Seed Grant Applications', 'Go-To-Market'],
    designation: 'Founder & CEO, Finverse Labs (BMCE 2018 Alumni)',
    organization: 'Finverse Labs, Infopark Kochi',
    bio: 'Serial entrepreneur and BMCE alumni helping early-stage campus teams raise angel funding and apply for KSUM grants.',
    maxActiveIdeas: 4,
    isActive: true,
    slots: [
      {
        id: 'slot-3',
        mentorId: 'm-3',
        mentorName: 'Er. Rajesh Pillai',
        mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        mentorDesignation: 'Founder & CEO, Finverse Labs',
        mentorExpertise: ['Pitch Deck Critique', 'Seed Grant Applications'],
        title: 'Pitch Deck & KSUM Grant Advisory Session',
        clinicType: 'Pitch Review',
        startTime: new Date(Date.now() + 86400000 * 4).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 4 + 3600000).toISOString(),
        location: 'Virtual / Google Meet',
        meetingLink: 'https://meet.google.com/ksum-pitch-bmce',
        maxAttendees: 1,
        isBooked: false,
        createdAt: new Date().toISOString()
      }
    ]
  }
];

function getLocalSlots(): MentorClinicSlot[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_MENTORS.flatMap(m => m.slots);
    const raw = localStorage.getItem(LOCAL_CLINIC_SLOTS_KEY);
    if (!raw) {
      const allSlots = DEFAULT_MENTORS.flatMap(m => m.slots);
      localStorage.setItem(LOCAL_CLINIC_SLOTS_KEY, JSON.stringify(allSlots));
      return allSlots;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MENTORS.flatMap(m => m.slots);
  }
}

function saveLocalSlots(slots: MentorClinicSlot[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_CLINIC_SLOTS_KEY, JSON.stringify(slots));
  } catch (err) {
    console.warn('Failed to save local slots:', err);
  }
}

function getLocalBookings(): MentorClinicBooking[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_CLINIC_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: MentorClinicBooking[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_CLINIC_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.warn('Failed to save local bookings:', err);
  }
}

export const mentorClinicService = {
  async fetchMentorsWithSlots(): Promise<Array<Mentor & { slots: MentorClinicSlot[] }>> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: mentorsData, error: mentorsErr } = await sb
          .from('mentors')
          .select('*, profiles(full_name, avatar_url, department)');

        const { data: slotsData, error: slotsErr } = await sb
          .from('mentor_clinic_slots')
          .select('*')
          .eq('is_booked', false)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (!mentorsErr && mentorsData && mentorsData.length > 0) {
          return mentorsData.map((m: any) => {
            const mentorSlots = (slotsData || [])
              .filter((s: any) => s.mentor_id === m.id)
              .map((s: any) => ({
                id: s.id,
                mentorId: s.mentor_id,
                mentorName: m.profiles?.full_name || 'Faculty Mentor',
                mentorAvatar: m.profiles?.avatar_url,
                mentorDesignation: m.designation,
                mentorExpertise: m.expertise || [],
                title: s.title,
                clinicType: s.clinic_type as ClinicType,
                startTime: s.start_time,
                endTime: s.end_time,
                location: s.location,
                meetingLink: s.meeting_link,
                maxAttendees: s.max_attendees,
                isBooked: s.is_booked,
                createdAt: s.created_at
              }));

            return {
              id: m.id,
              userId: m.user_id,
              fullName: m.profiles?.full_name || 'Faculty Mentor',
              avatar: m.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              department: m.profiles?.department,
              expertise: m.expertise || [],
              designation: m.designation,
              organization: m.organization,
              bio: m.bio,
              maxActiveIdeas: m.max_active_ideas || 5,
              isActive: m.is_active ?? true,
              slots: mentorSlots
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching mentors from Supabase, using defaults:', err);
      }
    }

    // Local fallback
    const localSlots = getLocalSlots();
    return DEFAULT_MENTORS.map(m => ({
      ...m,
      slots: localSlots.filter(s => s.mentorId === m.id && !s.isBooked)
    }));
  },

  async bookClinicSlot(
    slotId: string,
    agenda: string,
    ideaId?: string
  ): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.rpc('book_mentor_clinic_slot', {
          p_slot_id: slotId,
          p_idea_id: ideaId || null,
          p_agenda: agenda
        });

        if (!error && data?.success) {
          return { success: true, bookingId: data.bookingId };
        } else if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase book clinic slot error, using local fallback:', err);
      }
    }

    // Local Fallback Booking
    const slots = getLocalSlots();
    const slotIndex = slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
      return { success: false, error: 'Clinic slot not found.' };
    }
    if (slots[slotIndex].isBooked) {
      return { success: false, error: 'This session has already been booked.' };
    }

    slots[slotIndex].isBooked = true;
    saveLocalSlots(slots);

    const booking: MentorClinicBooking = {
      id: `booking-${Date.now()}`,
      slotId,
      userId: 'local-user',
      ideaId,
      slot: slots[slotIndex],
      agenda,
      status: 'confirmed',
      actionItems: ['Prepare 5-slide pitch deck', 'Document system architecture block diagram'],
      createdAt: new Date().toISOString()
    };

    const bookings = getLocalBookings();
    saveLocalBookings([booking, ...bookings]);

    return { success: true, bookingId: booking.id };
  },

  async fetchUserBookings(userId: string): Promise<MentorClinicBooking[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('mentor_clinic_bookings')
          .select(`
            *,
            slot:mentor_clinic_slots(*, mentor:mentors(*, profile:profiles(full_name, avatar_url))),
            idea:ideabox_submissions(title)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((b: any) => ({
            id: b.id,
            slotId: b.slot_id,
            userId: b.user_id,
            ideaId: b.idea_id,
            ideaTitle: b.idea?.title,
            slot: b.slot ? {
              id: b.slot.id,
              mentorId: b.slot.mentor_id,
              mentorName: b.slot.mentor?.profile?.full_name || 'Faculty Mentor',
              mentorAvatar: b.slot.mentor?.profile?.avatar_url,
              title: b.slot.title,
              clinicType: b.slot.clinic_type,
              startTime: b.slot.start_time,
              endTime: b.slot.end_time,
              location: b.slot.location,
              meetingLink: b.slot.meeting_link,
              maxAttendees: b.slot.max_attendees,
              isBooked: b.slot.is_booked,
              createdAt: b.slot.created_at
            } : undefined,
            agenda: b.agenda,
            status: b.status,
            mentorNotes: b.mentor_notes,
            actionItems: b.action_items || [],
            createdAt: b.created_at
          }));
        }
      } catch (err) {
        console.warn('Error fetching bookings from Supabase:', err);
      }
    }

    return getLocalBookings();
  }
};
