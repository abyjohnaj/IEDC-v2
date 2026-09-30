import { ExecomMember, ExecomStructure, User } from '../types';
import { initialExecomData } from '../data/execomData';
import { authService } from './authService';

const EXECOM_STORAGE_KEY = 'iedc_dynamic_execom_data';
const EXECOM_CHANGE_EVENT = 'iedc_execom_data_updated';

function getStoredExecomData(): ExecomStructure {
  try {
    const raw = localStorage.getItem(EXECOM_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXECOM_STORAGE_KEY, JSON.stringify(initialExecomData));
      return initialExecomData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading execom data:', err);
    return initialExecomData;
  }
}

function saveExecomData(data: ExecomStructure): void {
  try {
    localStorage.setItem(EXECOM_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EXECOM_CHANGE_EVENT, { detail: data }));
  } catch (err) {
    console.error('Error saving execom data:', err);
  }
}

export const execomService = {
  subscribe(callback: (data: ExecomStructure) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ExecomStructure>;
      callback(customEvent.detail || getStoredExecomData());
    };
    window.addEventListener(EXECOM_CHANGE_EVENT, handler);
    return () => window.removeEventListener(EXECOM_CHANGE_EVENT, handler);
  },

  getExecomStructure(): ExecomStructure {
    return getStoredExecomData();
  },

  // Appoint or promote a registered student/user into the Execom
  async appointMemberFromProfile(data: {
    userId: string;
    category: 'nodal' | 'leads' | 'coordinators';
    roleTitle: string;
    departmentNotes?: string;
    bio?: string;
    linkedin?: string;
  }): Promise<{ success: boolean; member: ExecomMember }> {
    const users = authService.getAllUsers();
    const candidate = users.find(u => u.id === data.userId);

    if (!candidate) {
      throw new Error('User profile not found.');
    }

    // 1. Update user role in auth database according to leadership track
    let targetRole: any = 'Execom';
    if (data.category === 'nodal') {
      targetRole = candidate.role === 'Admin' ? 'Admin' : 'Faculty';
    } else if (data.category === 'coordinators') {
      targetRole = candidate.role === 'Faculty' ? 'Faculty' : 'Execom';
    }

    await authService.updateProfile(candidate.id, {
      role: targetRole,
      linkedin: data.linkedin || candidate.linkedin
    });

    // 2. Build the Execom member item
    const newMember: ExecomMember = {
      name: candidate.fullName,
      role: data.roleTitle,
      department: data.departmentNotes || `${candidate.department} (${candidate.semester})`,
      avatar: candidate.avatar,
      fallbackAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(candidate.fullName)}`,
      bio: data.bio || candidate.bio,
      linkedin: data.linkedin || candidate.linkedin
    };

    const currentStructure = getStoredExecomData();

    if (data.category === 'nodal') {
      currentStructure.nodalOfficers = [newMember, ...currentStructure.nodalOfficers];
    } else if (data.category === 'leads') {
      currentStructure.studentLeads = [newMember, ...currentStructure.studentLeads];
    } else {
      currentStructure.departmentCoordinators = [newMember, ...currentStructure.departmentCoordinators];
    }

    saveExecomData(currentStructure);
    return { success: true, member: newMember };
  },

  // Remove a member from Execom and optionally revert their user role
  async removeMember(category: 'nodal' | 'leads' | 'coordinators', memberName: string): Promise<boolean> {
    const current = getStoredExecomData();

    if (category === 'nodal') {
      current.nodalOfficers = current.nodalOfficers.filter(m => m.name !== memberName);
    } else if (category === 'leads') {
      current.studentLeads = current.studentLeads.filter(m => m.name !== memberName);
    } else {
      current.departmentCoordinators = current.departmentCoordinators.filter(m => m.name !== memberName);
    }

    saveExecomData(current);

    // If there is a matching user, revert role to Student/Innovator
    const users = authService.getAllUsers();
    const matchedUser = users.find(u => u.fullName.toLowerCase() === memberName.toLowerCase());
    if (matchedUser && matchedUser.role === 'Execom') {
      await authService.updateProfile(matchedUser.id, {
        role: matchedUser.kyc?.status === 'verified' ? 'Innovator' : 'Student'
      });
    }

    return true;
  },

  // Reset to initial preset
  resetToDefaults(): void {
    saveExecomData(initialExecomData);
  }
};
