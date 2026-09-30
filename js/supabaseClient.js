/* Supabase Client Configuration & Live API Integration */

const SUPABASE_URL = 'https://quxwzqcbuksxxgpprztw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eHd6cWNidWtzeHhncHByenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDY4NDUsImV4cCI6MjEwNDk4Mjg0NX0.P_NWWDiY8yWgmYpSq2ExWhjNad872EwsZGo7td20DLs';

let supabaseClient = null;

function isSupabaseConfigured() {
  return Boolean(
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  );
}

function getSupabase() {
  if (!supabaseClient && isSupabaseConfigured()) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }
  return supabaseClient;
}

/**
 * Fetch all discussions from Supabase database along with their comments
 */
async function sbFetchDiscussions() {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: threads, error: threadErr } = await sb
      .from('forum_discussions')
      .select('*')
      .order('created_at', { ascending: false });

    if (threadErr) throw threadErr;
    if (!threads || threads.length === 0) return [];

    const { data: comments, error: commentErr } = await sb
      .from('forum_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (commentErr) console.warn('Could not fetch comments:', commentErr);

    const commentsMap = {};
    (comments || []).forEach(c => {
      if (!commentsMap[c.discussion_id]) commentsMap[c.discussion_id] = [];
      commentsMap[c.discussion_id].push({
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
  } catch (err) {
    console.warn('Supabase fetch failed, utilizing fallback:', err);
    return null;
  }
}

/**
 * Insert a new discussion thread into Supabase
 */
async function sbCreateDiscussion(discussion) {
  const sb = getSupabase();
  if (!sb) return null;

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

    if (error) throw error;

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
  } catch (err) {
    console.warn('Supabase discussion creation error:', err);
    return null;
  }
}

/**
 * Add a comment to a thread in Supabase
 */
async function sbAddComment(discussionId, comment) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('forum_comments')
      .insert([{
        discussion_id: discussionId,
        author: comment.author,
        avatar: comment.avatar,
        text: comment.text
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase comment insert error:', err);
    return null;
  }
}

/**
 * Increment upvote count for a thread in Supabase
 */
async function sbUpvoteDiscussion(discussionId, newCount) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { error } = await sb
      .from('forum_discussions')
      .update({ upvotes: newCount })
      .eq('id', discussionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upvote error:', err);
    return null;
  }
}

/**
 * Submit an Event Registration or Startup Idea Pitch to Supabase
 */
async function sbSubmitRegistration(reg) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('registrations')
      .insert([{
        type: reg.type, // 'Idea' or 'Event'
        event_name: reg.eventName || null,
        full_name: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        department: reg.department,
        semester: reg.semester,
        overview_reason: reg.overviewReason
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase registration insert error:', err);
    return null;
  }
}

/**
 * Fetch all registrations and startup idea pitches from Supabase
 */
async function sbFetchRegistrations() {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch registrations error:', err);
    return null;
  }
}

/**
 * Update registration status (e.g., 'Pending', 'Approved', 'In Review', 'Rejected')
 */
async function sbUpdateRegistrationStatus(id, status) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('registrations')
      .update({ status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase update registration status error:', err);
    return null;
  }
}

/**
 * Delete a discussion thread from Supabase
 */
async function sbDeleteDiscussion(discussionId) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    // Delete comments first if foreign keys are setup
    await sb.from('forum_comments').delete().eq('discussion_id', discussionId);
    
    const { error } = await sb
      .from('forum_discussions')
      .delete()
      .eq('id', discussionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete discussion error:', err);
    return false;
  }
}

/**
 * Delete a single comment from Supabase
 */
async function sbDeleteComment(commentId) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { error } = await sb
      .from('forum_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete comment error:', err);
    return false;
  }
}

/**
 * Utility function to convert ISO timestamps to relative time strings
 */
function formatRelativeTime(isoString) {
  if (!isoString) return 'recently';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

/**
 * Event Operations for Supabase
 */
async function sbFetchEvents() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('events').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch events failed:', err);
    return null;
  }
}

async function sbCreateEvent(eventObj) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('events').insert([eventObj]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase insert event failed:', err);
    return null;
  }
}

async function sbDeleteEvent(eventId) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { error } = await sb.from('events').delete().eq('id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete event failed:', err);
    return false;
  }
}


