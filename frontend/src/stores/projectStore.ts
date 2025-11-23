import { create } from 'zustand';
import api from '@/lib/api';

export type DocumentType = 'docx' | 'pptx';

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  revisions: Revision[];
  comments: Comment[];
  liked?: boolean;
}

export interface Revision {
  id: string;
  content: string;
  prompt: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Project {
  id: string;
  title: string;
  docType: DocumentType;
  topic: string;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  updateSection: (projectId: string, sectionId: string, updates: Partial<Section>) => void;
  addRevision: (projectId: string, sectionId: string, revision: Omit<Revision, 'id' | 'timestamp'>) => void;
  addComment: (projectId: string, sectionId: string, comment: string) => void;
  reorderSections: (projectId: string, sections: Section[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,

  addProject: async (project) => {
    try {
      const res = await api.post('/api/projects/', project);
      const created = res.data;
      // normalize dates
      created.createdAt = new Date(created.created_at || created.createdAt);
      created.updatedAt = new Date(created.updated_at || created.updatedAt);
      // normalize id to string for consistent comparisons in the frontend
      created.id = String(created.id);
      if (Array.isArray(created.sections)) {
    created.sections = created.sections.map((s: any) => ({ ...s, id: String(s.id), revisions: s.revisions || [], comments: s.comments || [] }));
      }
      set((state) => ({ projects: [...state.projects, created] }));
      return created as Project;
    } catch (e) {
      console.error('Failed to create project', e);
      return null;
    }
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date() }
          : state.currentProject,
    }));
  },

  deleteProject: (id) => {
    (async () => {
      try {
        await api.delete(`/api/projects/${id}`);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      } catch (e) {
        console.error('Failed to delete project', e);
      }
    })();
  },

  setCurrentProject: (project) => {
    // If passed project has full data, set directly. If only id provided, fetch from API.
    if (!project) return set({ currentProject: null });
    // If project has sections populated, set directly
    if (project.sections && project.sections.length > 0) {
      set({ currentProject: project });
      return;
    }

    (async () => {
      try {
        const res = await api.get(`/api/projects/${project.id}`);
        const data = res.data;
        // normalize dates
        data.id = String(data.id);
            data.sections = Array.isArray(data.sections)
              ? data.sections.map((s: any) => ({ ...s, id: String(s.id), revisions: s.revisions || [], comments: s.comments || [] }))
              : [];
        data.createdAt = new Date(data.created_at || data.createdAt);
        data.updatedAt = new Date(data.updated_at || data.updatedAt);
        set({ currentProject: data });
      } catch (e) {
        console.error('Failed to fetch project', e);
        set({ currentProject: project });
      }
    })();
  },

  updateSection: (projectId, sectionId, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          sections: p.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updates } : s
          ),
          updatedAt: new Date(),
        };
      }),
      currentProject:
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              sections: state.currentProject.sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date(),
            }
          : state.currentProject,
    }));
  },

  addRevision: (projectId, sectionId, revision) => {
    const newRevision: Revision = {
      ...revision,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    // Persist comment on backend if possible (backend endpoints handle generate/refine flows).
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          sections: p.sections.map((s) =>
            s.id === sectionId
              ? { ...s, revisions: [...s.revisions, newRevision] }
              : s
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  addComment: (projectId, sectionId, text) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
    };

    (async () => {
      try {
        await api.post(`/api/projects/${projectId}/comment`, { section_id: sectionId, text });
      } catch (e) {
        console.error('Failed to persist comment', e);
      }
    })();

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          sections: p.sections.map((s) =>
            s.id === sectionId
              ? { ...s, comments: [...s.comments, newComment] }
              : s
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  reorderSections: (projectId, sections) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, sections, updatedAt: new Date() }
          : p
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, sections, updatedAt: new Date() }
          : state.currentProject,
    }));
  },
  // load projects from backend
  loadProjects: async () => {
    try {
      const res = await api.get('/api/projects/');
      const projects = res.data.map((p: any) => ({
        ...p,
        id: String(p.id),
        sections: Array.isArray(p.sections)
          ? p.sections.map((s: any) => ({ ...s, id: String(s.id), revisions: s.revisions || [], comments: s.comments || [] }))
          : [],
        createdAt: new Date(p.created_at || p.createdAt),
        updatedAt: new Date(p.updated_at || p.updatedAt),
      }));
      set({ projects });
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  },
}));
