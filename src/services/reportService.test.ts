import { describe, it, expect } from 'vitest';
import { reportService, sanitizeCSVField } from './reportService';
import { HackathonTeam, IdeaBoxSubmission, RegistrationSubmission } from '../types';

describe('reportService - CSV Export & Formula Injection Sanitization (CWE-1236)', () => {
  describe('sanitizeCSVField', () => {
    it('handles null and undefined values safely', () => {
      expect(sanitizeCSVField(null)).toBe('""');
      expect(sanitizeCSVField(undefined)).toBe('""');
    });

    it('wraps standard strings in double quotes', () => {
      expect(sanitizeCSVField('BMCE Student Project')).toBe('"BMCE Student Project"');
      expect(sanitizeCSVField(1234)).toBe('"1234"');
    });

    it('escapes internal quotes per RFC-4180', () => {
      expect(sanitizeCSVField('Project "Alpha"')).toBe('"Project ""Alpha"""');
    });

    it('neutralizes dangerous formula prefixes with a leading single quote', () => {
      // Equals sign
      expect(sanitizeCSVField('=cmd|\' /C calc\'!A0')).toBe('"\'=cmd|\' /C calc\'!A0"');
      expect(sanitizeCSVField('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      
      // Plus sign
      expect(sanitizeCSVField('+12345')).toBe('"\' +12345"'.replace(' ', ''));
      expect(sanitizeCSVField('+HYPERLINK("http://attacker.com")')).toBe('"\' +HYPERLINK(""http://attacker.com"")"'.replace(' ', ''));

      // Minus sign
      expect(sanitizeCSVField('-2+3+cmd|')).toBe('"\' -2+3+cmd|"'.replace(' ', ''));

      // At sign
      expect(sanitizeCSVField('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');

      // Tab and carriage return prefixes
      expect(sanitizeCSVField('\tmalicious')).toBe('"\'\tmalicious"');
      expect(sanitizeCSVField('\rmalicious')).toBe('"\'\rmalicious"');
    });

    it('detects formula injection even with leading whitespace', () => {
      expect(sanitizeCSVField('   =cmd')).toBe('"\'   =cmd"');
    });
  });

  describe('generateIdeaBoxReportCSV', () => {
    it('neutralizes formulas in title, author, and feedback', () => {
      const maliciousIdeas: IdeaBoxSubmission[] = [
        {
          id: 'idea_1',
          title: '=cmd|\' /C calc\'!A0',
          domain: 'AI/ML',
          elevatorPitch: 'Pitch',
          problemStatement: 'Problem',
          proposedSolution: 'Solution',
          techStack: ['Python'],
          stage: 'Ideation',
          targetAudience: 'College Students',
          authorId: 'user_1',
          authorName: '+MaliciousAuthor',
          authorEmail: 'author@bmce.ac.in',
          authorAvatar: '',
          authorRole: 'Student',
          authorDepartment: 'CSE',
          upvotes: 5,
          upvoters: ['user_1'],
          commentsCount: 2,
          comments: [],
          status: 'Pending',
          adminFeedback: '@IMPORTXML("http://evil.com")',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z'
        }
      ];

      const csv = reportService.generateIdeaBoxReportCSV(maliciousIdeas);
      expect(csv).toContain('"\'=cmd|\' /C calc\'!A0"');
      expect(csv).toContain('"\' +MaliciousAuthor"'.replace(' ', ''));
      expect(csv).toContain('"\'@IMPORTXML(""http://evil.com"")"');
      expect(csv.split('\n').length).toBe(2); // Header + 1 row
    });
  });

  describe('generateRegistrationsReportCSV', () => {
    it('neutralizes formula injection in registration pitch and full name', () => {
      const maliciousRegs: RegistrationSubmission[] = [
        {
          id: 'reg_1',
          type: 'Idea',
          eventName: 'Eureka 2026',
          fullName: '-DDE("cmd";"calc";"")',
          email: 'student@bmce.ac.in',
          phone: '+91 9876543210',
          department: 'CSE',
          semester: 'S5',
          overviewReason: '=2+5+cmd|',
          status: 'Pending',
          created_at: '2026-10-01T00:00:00Z'
        }
      ];

      const csv = reportService.generateRegistrationsReportCSV(maliciousRegs);
      expect(csv).toContain('"\' -DDE(""cmd"";""calc"";"""")"'.replace(' ', ''));
      expect(csv).toContain('"\'=2+5+cmd|"');
      expect(csv).toContain('"\' +91 9876543210"'.replace(' ', ''));
    });
  });

  describe('generateHackathonReportCSV', () => {
    it('neutralizes formula injection in team names and submission titles', () => {
      const maliciousTeams: HackathonTeam[] = [
        {
          id: 'team_1',
          hackathonId: 'hack_1',
          hackathonTitle: 'HackBMCE 2026',
          name: '=1+1',
          tagline: 'Coders',
          track: 'Web3',
          maxMembers: 4,
          isOpen: true,
          rolesNeeded: ['Frontend Dev'],
          joinRequests: [],
          inviteCode: 'INV123',
          members: [
            {
              userId: 'u_1',
              name: '@TeamLead',
              email: 'lead@bmce.ac.in',
              roleInTeam: 'Team Lead',
              isLeader: true,
              avatar: '',
              joinedAt: '2026-10-01T00:00:00Z'
            }
          ],
          projectSubmission: {
            projectTitle: '+ExploitApp',
            tagline: 'Exploit tagline',
            track: 'Web3',
            overview: 'Exploit overview',
            techStack: ['React'],
            githubUrl: 'https://github.com/test',
            status: 'submitted',
            score: {
              innovation: 20,
              technical: 25,
              presentation: 20,
              feasibility: 20,
              total: 85
            }
          },
          createdAt: '2026-10-01T00:00:00Z'
        }
      ];

      const csv = reportService.generateHackathonReportCSV(maliciousTeams);
      expect(csv).toContain('"\'=1+1"');
      expect(csv).toContain('"\'@TeamLead"');
      expect(csv).toContain('"\' +ExploitApp"'.replace(' ', ''));
    });
  });
});
