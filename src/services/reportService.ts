import { HackathonTeam, IdeaBoxSubmission, RegistrationSubmission } from '../types';
import { AdminKYCItem } from './supabaseClient';

/**
 * Sanitizes a cell value to prevent Formula Injection (CWE-1236 / CSV Injection)
 * when opened in spreadsheet software (Excel, Google Sheets, LibreOffice).
 * If the value begins with '=', '+', '-', '@', '\t', or '\r', a leading apostrophe
 * is prepended to neutralize formula execution.
 * RFC-4180 internal quotes are doubled and the entire string is wrapped in quotes.
 */
export function sanitizeCSVField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // Neutralize dangerous spreadsheet prefixes: =, +, -, @, \t, \r (even if preceded by spaces)
  const isDangerous = /^[=+\-@\t\r]/.test(str) || /^[ \f\v]+[=+\-@\t\r]/.test(str);
  const safeStr = isDangerous ? `'${str}` : str;
  return `"${safeStr.replace(/"/g, '""')}"`;
}

export const reportService = {
  // 1. Generate CSV for Hackathon Teams & Submissions
  generateHackathonReportCSV(teams: HackathonTeam[]): string {
    const headers = [
      'Team Name',
      'Hackathon',
      'Track',
      'Team Leader',
      'Leader Email',
      'Member Count',
      'Members List',
      'Open Team',
      'Roles Needed',
      'Discord Link',
      'WhatsApp Link',
      'GitHub Org',
      'Submission Status',
      'Project Title',
      'Tech Stack',
      'GitHub Repo',
      'Demo Video',
      'Live Demo',
      'Total Score / 100',
      'Innovation',
      'Technical',
      'Presentation',
      'Feasibility',
      'Admin Feedback',
      'Reviewed By'
    ];

    const rows = teams.map(t => {
      const leader = t.members.find(m => m.isLeader) || t.members[0];
      const membersStr = t.members.map(m => `${m.name} (${m.roleInTeam})`).join('; ');
      const sub = t.projectSubmission;

      return [
        sanitizeCSVField(t.name),
        sanitizeCSVField(t.hackathonTitle),
        sanitizeCSVField(t.track),
        sanitizeCSVField(leader ? leader.name : 'N/A'),
        sanitizeCSVField(leader ? leader.email : 'N/A'),
        sanitizeCSVField(t.members.length),
        sanitizeCSVField(membersStr),
        sanitizeCSVField(t.isOpen ? 'Yes (Open)' : 'No (Closed)'),
        sanitizeCSVField(t.rolesNeeded.join(', ')),
        sanitizeCSVField(t.discordInviteUrl || 'None'),
        sanitizeCSVField(t.whatsappGroupUrl || 'None'),
        sanitizeCSVField(t.githubOrgUrl || 'None'),
        sanitizeCSVField(sub ? sub.status.toUpperCase() : 'NO SUBMISSION'),
        sanitizeCSVField(sub?.projectTitle || 'N/A'),
        sanitizeCSVField(sub?.techStack ? sub.techStack.join(', ') : 'N/A'),
        sanitizeCSVField(sub?.githubUrl || 'N/A'),
        sanitizeCSVField(sub?.demoVideoUrl || 'N/A'),
        sanitizeCSVField(sub?.liveDemoUrl || 'N/A'),
        sanitizeCSVField(sub?.score?.total ?? 'Unscored'),
        sanitizeCSVField(sub?.score?.innovation ?? 'N/A'),
        sanitizeCSVField(sub?.score?.technical ?? 'N/A'),
        sanitizeCSVField(sub?.score?.presentation ?? 'N/A'),
        sanitizeCSVField(sub?.score?.feasibility ?? 'N/A'),
        sanitizeCSVField(sub?.adminFeedback || 'Pending Feedback'),
        sanitizeCSVField(sub?.reviewedBy || 'N/A')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // 2. Generate CSV for IdeaBox Innovations
  generateIdeaBoxReportCSV(ideas: IdeaBoxSubmission[]): string {
    const headers = [
      'Idea ID',
      'Title',
      'Domain',
      'Current Stage',
      'Author Name',
      'Author Role',
      'Department',
      'Author Email',
      'Upvotes Count',
      'Comments Count',
      'Estimated Budget',
      'Status',
      'Admin Rating (1-5)',
      'Assigned Incubator Track',
      'Admin Feedback',
      'Reviewed By',
      'Submitted Date'
    ];

    const rows = ideas.map(idea => {
      return [
        sanitizeCSVField(idea.id),
        sanitizeCSVField(idea.title),
        sanitizeCSVField(idea.domain),
        sanitizeCSVField(idea.stage),
        sanitizeCSVField(idea.authorName),
        sanitizeCSVField(idea.authorRole),
        sanitizeCSVField(idea.authorDepartment || 'N/A'),
        sanitizeCSVField(idea.authorEmail),
        sanitizeCSVField(idea.upvotes),
        sanitizeCSVField(idea.commentsCount),
        sanitizeCSVField(idea.estimatedBudget || 'N/A'),
        sanitizeCSVField(idea.status),
        sanitizeCSVField(idea.adminRating || 'Not Rated'),
        sanitizeCSVField(idea.incubatorTrackAssigned || 'Unassigned'),
        sanitizeCSVField(idea.adminFeedback || 'No Feedback Provided Yet'),
        sanitizeCSVField(idea.adminReviewedBy || 'N/A'),
        sanitizeCSVField(new Date(idea.createdAt).toLocaleDateString())
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // 3. Generate CSV for Event Registrations & Attendee List
  generateRegistrationsReportCSV(registrations: RegistrationSubmission[]): string {
    const headers = [
      'Registration ID',
      'Type',
      'Event Name',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Semester',
      'Status',
      'Registration Reason / Pitch',
      'Submission Timestamp'
    ];

    const rows = registrations.map(reg => {
      return [
        sanitizeCSVField(reg.id || 'N/A'),
        sanitizeCSVField(reg.type),
        sanitizeCSVField(reg.eventName || 'General Innovation'),
        sanitizeCSVField(reg.fullName),
        sanitizeCSVField(reg.email),
        sanitizeCSVField(reg.phone || 'N/A'),
        sanitizeCSVField(reg.department || 'N/A'),
        sanitizeCSVField(reg.semester || 'N/A'),
        sanitizeCSVField(reg.status || 'Pending'),
        sanitizeCSVField(reg.overviewReason || ''),
        sanitizeCSVField(reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'N/A')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // 4. Generate CSV for KYC Verification Compliance
  generateKYCReportCSV(kycList: AdminKYCItem[]): string {
    const headers = [
      'User ID',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Semester',
      'College Roll ID',
      'KYC Status',
      'Document Type',
      'Document ID Number',
      'Document File Name',
      'Institution',
      'Submitted At',
      'Verified At',
      'Admin Remarks / Reason'
    ];

    const rows = kycList.map(item => {
      return [
        sanitizeCSVField(item.userId),
        sanitizeCSVField(item.fullName),
        sanitizeCSVField(item.email),
        sanitizeCSVField(item.phone || 'N/A'),
        sanitizeCSVField(item.department),
        sanitizeCSVField(item.semester),
        sanitizeCSVField(item.collegeId),
        sanitizeCSVField(item.status.toUpperCase()),
        sanitizeCSVField(item.docType),
        sanitizeCSVField(`•••• •••• ${item.docNumberLast4 || (item.docNumber ? item.docNumber.replace(/\s+/g, '').slice(-4) : '****')}`),
        sanitizeCSVField(item.docFileName || 'N/A'),
        sanitizeCSVField(item.institution || 'BMCE'),
        sanitizeCSVField(item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'),
        sanitizeCSVField(item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : 'N/A'),
        sanitizeCSVField(item.adminRemarks || item.rejectionReason || '')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // 5. Generate RFC-4180 CSV for Hackathon Official Rankings
  generateHackathonRankingsCSV(
    rankings: Array<{ rank: number; teamName: string; track: string; projectTitle?: string; totalScore: number; judgesCount: number }>, 
    hackathonTitle?: string
  ): string {
    const headers = [
      'Rank',
      'Team Name',
      'Track',
      'Project Title',
      'Weighted Aggregate Score',
      'Judges Scored',
      'Hackathon'
    ];

    const rows = rankings.map(r => [
      sanitizeCSVField(r.rank),
      sanitizeCSVField(r.teamName),
      sanitizeCSVField(r.track),
      sanitizeCSVField(r.projectTitle || 'N/A'),
      sanitizeCSVField(r.totalScore.toFixed(2)),
      sanitizeCSVField(r.judgesCount),
      sanitizeCSVField(hackathonTitle || 'BMCE Hackathon')
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  },

  // 6. Generate RFC-4180 CSV for Judge Evaluation Score Sheets
  generateJudgeScoreSheetCSV(scoreSheets: Array<{
    teamName: string;
    track: string;
    judgeName: string;
    criterionName: string;
    weight: number;
    score: number;
    feedback?: string;
  }>): string {
    const headers = [
      'Team Name',
      'Track',
      'Judge Name',
      'Criterion',
      'Criterion Weight',
      'Score (1-10)',
      'Weighted Score',
      'Judge Qualitative Remarks'
    ];

    const rows = scoreSheets.map(s => {
      const weighted = (s.score * s.weight).toFixed(2);
      return [
        sanitizeCSVField(s.teamName),
        sanitizeCSVField(s.track),
        sanitizeCSVField(s.judgeName),
        sanitizeCSVField(s.criterionName),
        sanitizeCSVField(s.weight),
        sanitizeCSVField(s.score),
        sanitizeCSVField(weighted),
        sanitizeCSVField(s.feedback || '')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // Trigger browser download for generated CSV
  downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
