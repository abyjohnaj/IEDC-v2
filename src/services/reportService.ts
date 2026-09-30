import { HackathonTeam, IdeaBoxSubmission, RegistrationSubmission } from '../types';
import { AdminKYCItem } from './supabaseClient';

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
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.hackathonTitle.replace(/"/g, '""')}"`,
        `"${t.track.replace(/"/g, '""')}"`,
        `"${leader ? leader.name.replace(/"/g, '""') : 'N/A'}"`,
        `"${leader ? leader.email : 'N/A'}"`,
        t.members.length,
        `"${membersStr.replace(/"/g, '""')}"`,
        t.isOpen ? 'Yes (Open)' : 'No (Closed)',
        `"${t.rolesNeeded.join(', ')}"`,
        `"${t.discordInviteUrl || 'None'}"`,
        `"${t.whatsappGroupUrl || 'None'}"`,
        `"${t.githubOrgUrl || 'None'}"`,
        sub ? sub.status.toUpperCase() : 'NO SUBMISSION',
        `"${sub?.projectTitle ? sub.projectTitle.replace(/"/g, '""') : 'N/A'}"`,
        `"${sub?.techStack ? sub.techStack.join(', ') : 'N/A'}"`,
        `"${sub?.githubUrl || 'N/A'}"`,
        `"${sub?.demoVideoUrl || 'N/A'}"`,
        `"${sub?.liveDemoUrl || 'N/A'}"`,
        sub?.score?.total ?? 'Unscored',
        sub?.score?.innovation ?? 'N/A',
        sub?.score?.technical ?? 'N/A',
        sub?.score?.presentation ?? 'N/A',
        sub?.score?.feasibility ?? 'N/A',
        `"${sub?.adminFeedback ? sub.adminFeedback.replace(/"/g, '""') : 'Pending Feedback'}"`,
        `"${sub?.reviewedBy ? sub.reviewedBy.replace(/"/g, '""') : 'N/A'}"`
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
        idea.id,
        `"${idea.title.replace(/"/g, '""')}"`,
        `"${idea.domain.replace(/"/g, '""')}"`,
        idea.stage,
        `"${idea.authorName.replace(/"/g, '""')}"`,
        idea.authorRole,
        `"${idea.authorDepartment || 'N/A'}"`,
        idea.authorEmail,
        idea.upvotes,
        idea.commentsCount,
        `"${idea.estimatedBudget || 'N/A'}"`,
        idea.status,
        idea.adminRating || 'Not Rated',
        `"${idea.incubatorTrackAssigned ? idea.incubatorTrackAssigned.replace(/"/g, '""') : 'Unassigned'}"`,
        `"${idea.adminFeedback ? idea.adminFeedback.replace(/"/g, '""') : 'No Feedback Provided Yet'}"`,
        `"${idea.adminReviewedBy || 'N/A'}"`,
        new Date(idea.createdAt).toLocaleDateString()
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
        reg.id || 'N/A',
        reg.type,
        `"${(reg.eventName || 'General Innovation').replace(/"/g, '""')}"`,
        `"${reg.fullName.replace(/"/g, '""')}"`,
        reg.email,
        `"${reg.phone}"`,
        `"${reg.department}"`,
        reg.semester,
        reg.status || 'Pending',
        `"${(reg.overviewReason || '').replace(/"/g, '""')}"`,
        reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'N/A'
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
        item.userId,
        `"${item.fullName.replace(/"/g, '""')}"`,
        item.email,
        `"${item.phone || 'N/A'}"`,
        `"${item.department}"`,
        item.semester,
        `"${item.collegeId}"`,
        item.status.toUpperCase(),
        item.docType,
        `"•••• •••• ${item.docNumberLast4 || (item.docNumber ? item.docNumber.replace(/\s+/g, '').slice(-4) : '****')}"`,
        `"${item.docFileName || 'N/A'}"`,
        `"${item.institution || 'BMCE'}"`,
        item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A',
        item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : 'N/A',
        `"${(item.adminRemarks || item.rejectionReason || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // 5. Generate RFC-4180 CSV for Hackathon Official Rankings
  generateHackathonRankingsCSV(rankings: Array<{ rank: number; teamName: string; track: string; projectTitle?: string; totalScore: number; judgesCount: number }>, hackathonTitle?: string): string {
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
      r.rank,
      `"${r.teamName.replace(/"/g, '""')}"`,
      `"${r.track.replace(/"/g, '""')}"`,
      `"${(r.projectTitle || 'N/A').replace(/"/g, '""')}"`,
      r.totalScore.toFixed(2),
      r.judgesCount,
      `"${(hackathonTitle || 'BMCE Hackathon').replace(/"/g, '""')}"`
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
        `"${s.teamName.replace(/"/g, '""')}"`,
        `"${s.track.replace(/"/g, '""')}"`,
        `"${s.judgeName.replace(/"/g, '""')}"`,
        `"${s.criterionName.replace(/"/g, '""')}"`,
        s.weight,
        s.score,
        weighted,
        `"${(s.feedback || '').replace(/"/g, '""')}"`
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

