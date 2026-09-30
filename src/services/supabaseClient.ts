import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ForumDiscussion, RegistrationSubmission, EventItem } from '../types';
import { initialForumDiscussions } from '../data/forumData';
import { initialEventsData } from '../data/eventsData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://quxwzqcbuksxxgpprztw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eHd6cWNidWtzeHhncHByenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDY4NDUsImV4cCI6MjEwNDk4Mjg0NX0.P_NWWDiY8yWgmYpSq2ExWhjNad872EwsZGo7td20DLs';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabase) {
    try {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch (err) {
      console.warn('Supabase initialization failed, running with local offline state:', err);
    }
  }
  return supabase;
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'recently';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

// ==========================================
// Forum Operations
// ==========================================

export async function fetchDiscussions(): Promise<ForumDiscussion[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: threads, error: threadErr } = await sb
        .from('forum_discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!threadErr && threads && threads.length > 0) {
        const { data: comments } = await sb
          .from('forum_comments')
          .select('*')
          .order('created_at', { ascending: true });

        const commentsMap: Record<string, any[]> = {};
        (comments || []).forEach(c => {
          if (!commentsMap[c.discussion_id]) commentsMap[c.discussion_id] = [];
          commentsMap[c.discussion_id].push({
            id: c.id,
            author: c.author,
            avatar: c.avatar,
            time: formatRelativeTime(c.created_at),
            text: c.text
          });
        });

        return threads.map(t => ({
          id: t.id,
          authorName: t.author_name,
          authorRole: t.author_role,
          authorAvatar: t.author_avatar,
          channel: t.channel,
          title: t.title,
          excerpt: t.excerpt,
          rolesNeeded: t.roles_needed || [],
          timestamp: formatRelativeTime(t.created_at),
          upvotes: t.upvotes || 0,
          comments: commentsMap[t.id] || []
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch discussions error, using local fallback:', err);
    }
  }

  // Local fallback
  const cached = localStorage.getItem('iedc-forum-discussions');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return initialForumDiscussions;
}

export async function createDiscussion(discussion: Omit<ForumDiscussion, 'id' | 'timestamp' | 'upvotes' | 'comments'>): Promise<ForumDiscussion> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('forum_discussions')
        .insert([{
          title: discussion.title,
          channel: discussion.channel,
          excerpt: discussion.excerpt,
          author_name: discussion.authorName,
          author_role: discussion.authorRole,
          author_avatar: discussion.authorAvatar,
          roles_needed: discussion.rolesNeeded || [],
          upvotes: 0
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          authorName: data.author_name,
          authorRole: data.author_role,
          authorAvatar: data.author_avatar,
          channel: data.channel,
          title: data.title,
          excerpt: data.excerpt,
          rolesNeeded: data.roles_needed || [],
          timestamp: 'Just now',
          upvotes: 0,
          comments: []
        };
      }
    } catch (err) {
      console.warn('Supabase create discussion error, using local state:', err);
    }
  }

  // Local state fallback
  const newThread: ForumDiscussion = {
    ...discussion,
    id: `thread-${Date.now()}`,
    timestamp: 'Just now',
    upvotes: 0,
    comments: []
  };

  const existing = await fetchDiscussions();
  const updated = [newThread, ...existing];
  localStorage.setItem('iedc-forum-discussions', JSON.stringify(updated));
  return newThread;
}

export async function addComment(discussionId: string, comment: { author: string; avatar: string; text: string }): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('forum_comments').insert([{
        discussion_id: discussionId,
        author: comment.author,
        avatar: comment.avatar,
        text: comment.text
      }]);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase add comment error:', err);
    }
  }

  // Local fallback
  const existing = await fetchDiscussions();
  const updated = existing.map(t => {
    if (t.id === discussionId) {
      return {
        ...t,
        comments: [
          ...t.comments,
          {
            ...comment,
            time: 'Just now'
          }
        ]
      };
    }
    return t;
  });
  localStorage.setItem('iedc-forum-discussions', JSON.stringify(updated));
  return true;
}

export async function upvoteDiscussion(discussionId: string, newCount: number): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb
        .from('forum_discussions')
        .update({ upvotes: newCount })
        .eq('id', discussionId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase upvote error:', err);
    }
  }

  // Local fallback
  const existing = await fetchDiscussions();
  const updated = existing.map(t => t.id === discussionId ? { ...t, upvotes: newCount } : t);
  localStorage.setItem('iedc-forum-discussions', JSON.stringify(updated));
  return true;
}

export async function deleteDiscussion(discussionId: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('forum_comments').delete().eq('discussion_id', discussionId);
      const { error } = await sb.from('forum_discussions').delete().eq('id', discussionId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  const existing = await fetchDiscussions();
  const updated = existing.filter(t => t.id !== discussionId);
  localStorage.setItem('iedc-forum-discussions', JSON.stringify(updated));
  return true;
}

// ==========================================
// Registrations & Startup Pitches Operations
// ==========================================

export async function submitRegistration(reg: RegistrationSubmission): Promise<{ success: boolean; confirmationToken?: string }> {
  const confirmationToken = `BMCE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('registrations').insert([{
        type: reg.type,
        event_name: reg.eventName || null,
        full_name: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        department: reg.department,
        semester: reg.semester,
        overview_reason: reg.overviewReason,
        status: 'Pending',
        confirmation_token: confirmationToken
      }]);
      if (!error) return { success: true, confirmationToken };
    } catch (err) {
      console.warn('Supabase submit registration error:', err);
    }
  }

  // Local fallback
  const saved = localStorage.getItem('iedc_registrations_store') || '[]';
  const list: RegistrationSubmission[] = JSON.parse(saved);
  list.unshift({
    ...reg,
    id: `reg-${Date.now()}`,
    status: 'Pending',
    created_at: new Date().toISOString()
  });
  localStorage.setItem('iedc_registrations_store', JSON.stringify(list));
  return { success: true, confirmationToken };
}

export async function getRegistrationStatus(token: string): Promise<{ eventName: string; status: string; createdAt: string; attendeeMasked: string } | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('get_registration_status', { p_token: token });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase get registration status error:', err);
    }
  }
  return null;
}

export async function fetchRegistrations(): Promise<RegistrationSubmission[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          type: d.type,
          eventName: d.event_name,
          fullName: d.full_name,
          email: d.email,
          phone: d.phone,
          department: d.department,
          semester: d.semester,
          overviewReason: d.overview_reason,
          status: d.status || 'Pending',
          created_at: d.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch registrations error:', err);
    }
  }

  const saved = localStorage.getItem('iedc_registrations_store') || '[]';
  return JSON.parse(saved);
}

export async function updateRegistrationStatus(id: string, status: 'Pending' | 'Approved' | 'In Review' | 'Rejected'): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb
        .from('registrations')
        .update({ status })
        .eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase update status error:', err);
    }
  }

  const saved = localStorage.getItem('iedc_registrations_store') || '[]';
  const list: RegistrationSubmission[] = JSON.parse(saved);
  const updated = list.map(item => item.id === id ? { ...item, status } : item);
  localStorage.setItem('iedc_registrations_store', JSON.stringify(updated));
  return true;
}

// ==========================================
// Events Operations
// ==========================================

const EVENTS_STORAGE_KEY = 'iedc_events_store';

function dispatchEventsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('iedc-events-updated'));
  }
}

export function getLocalEvents(): EventItem[] {
  if (typeof window === 'undefined') return initialEventsData;
  try {
    const cached = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local events:', err);
  }

  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEventsData));
  } catch (err) {
    console.warn('Error seeding local events:', err);
  }
  return initialEventsData;
}

export async function fetchEvents(): Promise<EventItem[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: EventItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          category: d.category || 'Workshops',
          date: d.date || 'Upcoming 2026',
          status: d.status || 'Upcoming',
          assetImage: d.asset_image || d.assetImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
          fallbackImage: d.fallback_image || d.fallbackImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
          description: d.description || '',
          details: d.details || d.description || '',
          location: d.location || 'IEDC Hub, BMCE'
        }));

        // Merge any local events that might not yet be in remote database
        const local = getLocalEvents();
        const sbIds = new Set(mapped.map(m => m.id));
        const localOnly = local.filter(l => !sbIds.has(l.id));
        const combined = [...localOnly, ...mapped];

        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(combined));
        try { localStorage.setItem('iedc_custom_events', JSON.stringify(combined)); } catch (e) {}
        return combined;
      } else if (!error && data && data.length === 0) {
        // Table is fresh and empty! Seed default catalog into Supabase
        try {
          const toInsert = initialEventsData.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            date: e.date,
            status: e.status,
            asset_image: e.assetImage,
            fallback_image: e.fallbackImage,
            description: e.description,
            details: e.details,
            location: e.location
          }));
          await sb.from('events').insert(toInsert);
        } catch (e) {
          console.warn('Could not seed initial events into Supabase:', e);
        }
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEventsData));
        try { localStorage.setItem('iedc_custom_events', JSON.stringify(initialEventsData)); } catch (e) {}
        return initialEventsData;
      }
    } catch (err) {
      console.warn('Supabase fetch events error:', err);
    }
  }

  return getLocalEvents();
}

export async function createEvent(eventData: Omit<EventItem, 'id'>): Promise<EventItem> {
  const newEvent: EventItem = {
    ...eventData,
    id: `evt-${Date.now()}`
  };

  // 1. Immediately store locally to prevent any latency / race conditions
  const current = getLocalEvents();
  const updated = [newEvent, ...current.filter(e => e.id !== newEvent.id)];
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('iedc_custom_events', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store event in localStorage:', err);
  }

  // 2. Persist to remote Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb
        .from('events')
        .insert([{
          id: newEvent.id,
          title: newEvent.title,
          category: newEvent.category,
          date: newEvent.date,
          status: newEvent.status,
          asset_image: newEvent.assetImage,
          fallback_image: newEvent.fallbackImage,
          description: newEvent.description,
          details: newEvent.details,
          location: newEvent.location
        }]);
      if (error) {
        console.warn('Supabase insert error:', error);
      }
    } catch (err) {
      console.warn('Supabase insert exception:', err);
    }
  }

  dispatchEventsUpdated();
  return newEvent;
}

export async function updateEvent(updatedEvent: EventItem): Promise<boolean> {
  const current = getLocalEvents();
  const updated = current.map(e => e.id === updatedEvent.id ? updatedEvent : e);
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('iedc_custom_events', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update event in localStorage:', err);
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from('events')
        .update({
          title: updatedEvent.title,
          category: updatedEvent.category,
          date: updatedEvent.date,
          status: updatedEvent.status,
          asset_image: updatedEvent.assetImage,
          fallback_image: updatedEvent.fallbackImage,
          description: updatedEvent.description,
          details: updatedEvent.details,
          location: updatedEvent.location
        })
        .eq('id', updatedEvent.id);
    } catch (err) {
      console.warn('Supabase update event error:', err);
    }
  }

  dispatchEventsUpdated();
  return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const current = getLocalEvents();
  const updated = current.filter(e => e.id !== id);
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('iedc_custom_events', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete event from localStorage:', err);
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('events').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete event error:', err);
    }
  }

  dispatchEventsUpdated();
  return true;
}

// ==========================================
// Admin KYC Verification & Approvals
// ==========================================

export interface AdminKYCItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
  collegeId: string;
  avatar: string;
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  docType: string;
  docNumber: string; // Masked value: '•••• •••• 1234'
  docNumberLast4?: string;
  docFileName?: string;
  docFileUrl?: string; // Short-lived signed URL
  docFilePath?: string; // Secure path in kyc-docs
  retentionDeleteAt?: string;
  dob?: string;
  institution?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  adminRemarks?: string;
}

export async function fetchAdminKYCSubmissions(): Promise<AdminKYCItem[]> {
  const list: AdminKYCItem[] = [];
  const sb = getSupabase();

  if (sb) {
    try {
      const { data: kycRows, error } = await sb
        .from('kyc_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && kycRows && kycRows.length > 0) {
        const { data: profiles } = await sb.from('profiles').select('*');
        const profilesMap = new Map<string, any>();
        (profiles || []).forEach(p => profilesMap.set(p.id, p));

        kycRows.forEach(row => {
          const prof = profilesMap.get(row.user_id) || {};
          const last4 = row.doc_number_last4 || (row.doc_number ? row.doc_number.slice(-4) : '****');
          list.push({
            id: row.id,
            userId: row.user_id,
            fullName: row.full_name || prof.full_name || 'Student Member',
            email: prof.email || 'student@bmce.ac.in',
            phone: prof.phone || '',
            department: prof.department || 'Engineering',
            semester: prof.semester || 'Semester 4',
            collegeId: prof.college_id || row.doc_number || '',
            avatar: prof.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.user_id}`,
            status: row.status || 'unverified',
            docType: row.doc_type || 'student_id',
            docNumber: `•••• •••• ${last4}`,
            docNumberLast4: last4,
            docFileName: row.doc_file_name,
            docFilePath: row.doc_file_path,
            docFileUrl: undefined, // Must be opened via short-lived signed URL
            retentionDeleteAt: row.retention_delete_at,
            dob: row.dob,
            institution: row.institution,
            submittedAt: row.submitted_at,
            verifiedAt: row.verified_at,
            rejectionReason: row.rejection_reason,
            adminRemarks: row.admin_remarks
          });
        });
      }
    } catch (err) {
      console.warn('Supabase fetch kyc exception, loading local state:', err);
    }
  }

  // Also include users from local database to ensure demo users and offline registrations appear
  try {
    const raw = localStorage.getItem('iedc_users_database');
    if (raw) {
      const localUsers = JSON.parse(raw);
      localUsers.forEach((u: any) => {
        // avoid duplicates if already loaded from Supabase
        if (!list.some(item => item.userId === u.id)) {
          list.push({
            id: `kyc_${u.id}`,
            userId: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            department: u.department,
            semester: u.semester,
            collegeId: u.collegeId,
            avatar: u.avatar,
            status: u.kyc?.status || 'unverified',
            docType: u.kyc?.docType || 'student_id',
            docNumber: u.kyc?.docNumber || '',
            docFileName: u.kyc?.docFileName,
            docFileUrl: u.kyc?.docFileUrl,
            dob: u.kyc?.dob,
            institution: u.kyc?.institution || 'Baselios Mathews II College of Engineering',
            submittedAt: u.kyc?.submittedAt,
            verifiedAt: u.kyc?.verifiedAt,
            rejectionReason: u.kyc?.rejectionReason,
            adminRemarks: u.kyc?.adminRemarks
          });
        }
      });
    }
  } catch (e) {
    // ignore
  }

  return list;
}

export async function updateAdminKYCStatus(
  userId: string,
  status: 'verified' | 'rejected' | 'pending' | 'unverified',
  remarks?: string
): Promise<boolean> {
  const sb = getSupabase();
  if (sb && !userId.startsWith('usr_')) {
    try {
      // First attempt privileged SECURITY DEFINER RPC
      const { error: rpcError } = await sb.rpc('admin_review_kyc', {
        p_target_user_id: userId,
        p_new_status: status,
        p_remarks: remarks || (status === 'verified' ? 'Approved by BMCE IEDC Nodal Center.' : 'Administrative review note.')
      });

      if (rpcError) {
        // Fallback for tables prior to RPC migration
        await sb
          .from('kyc_verifications')
          .update({
            status,
            verified_at: status === 'verified' ? new Date().toISOString() : null,
            rejection_reason: status === 'rejected' ? (remarks || 'Document verification failed.') : null,
            admin_remarks: remarks || (status === 'verified' ? 'Approved by BMCE IEDC Nodal Center.' : 'Administrative review note.')
          })
          .eq('user_id', userId);

        if (status === 'verified') {
          await sb.from('user_roles').upsert({ user_id: userId, role: 'Innovator', scope: 'global' });
          await sb.from('profiles').update({ role: 'Innovator' }).eq('id', userId);
        }
      }
    } catch (err) {
      console.warn('Supabase update KYC status error:', err);
    }
  }

  // Update in local users database as well
  try {
    const raw = localStorage.getItem('iedc_users_database');
    if (raw) {
      const localUsers = JSON.parse(raw);
      const updated = localUsers.map((u: any) => {
        if (u.id === userId) {
          return {
            ...u,
            role: status === 'verified' ? 'Innovator' : u.role,
            kyc: {
              ...u.kyc,
              status,
              verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
              rejectionReason: status === 'rejected' ? (remarks || 'Document verification failed.') : undefined,
              adminRemarks: remarks || (status === 'verified' ? 'Approved by BMCE IEDC Nodal Center.' : '')
            }
          };
        }
        return u;
      });
      localStorage.setItem('iedc_users_database', JSON.stringify(updated));

      // Also update currently active session if same user
      const curRaw = localStorage.getItem('iedc_auth_user');
      if (curRaw) {
        const curUser = JSON.parse(curRaw);
        if (curUser.id === userId) {
          curUser.role = status === 'verified' ? 'Innovator' : curUser.role;
          curUser.kyc.status = status;
          curUser.kyc.verifiedAt = status === 'verified' ? new Date().toISOString() : undefined;
          curUser.kyc.rejectionReason = status === 'rejected' ? remarks : undefined;
          curUser.kyc.adminRemarks = remarks;
          localStorage.setItem('iedc_auth_user', JSON.stringify(curUser));
          window.dispatchEvent(new CustomEvent('iedc_auth_state_changed', { detail: { user: curUser } }));
        }
      }
    }
  } catch (e) {
    console.error('Local update KYC error:', e);
  }

  window.dispatchEvent(new CustomEvent('iedc-kyc-updated'));
  return true;
}



