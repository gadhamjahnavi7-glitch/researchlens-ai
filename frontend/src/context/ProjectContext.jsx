import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectApi } from '../api/projectApi.js';
import { useAuth } from './AuthContext.jsx';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('researchlens_active_project') || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return [];
    setLoading(true);
    try {
      const res = await projectApi.getProjects();
      setProjects(res.projects || []);

      // If active project is not set or not in list, auto-select first project
      if (res.projects?.length > 0) {
        const exists = res.projects.some(p => p._id === selectedProjectId);
        if (!exists) {
          const firstId = res.projects[0]._id;
          setSelectedProjectId(firstId);
          localStorage.setItem('researchlens_active_project', firstId);
        }
      } else {
        setSelectedProjectId(null);
        localStorage.removeItem('researchlens_active_project');
      }

      setLoading(false);
      return res.projects;
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Unable to load projects');
      setLoading(false);
      return [];
    }
  }, [isAuthenticated, selectedProjectId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProjectId(null);
    }
  }, [isAuthenticated]);

  const selectProject = (id) => {
    setSelectedProjectId(id);
    if (id) {
      localStorage.setItem('researchlens_active_project', id);
    } else {
      localStorage.removeItem('researchlens_active_project');
    }
  };

  const seedSample = async () => {
    setLoading(true);
    try {
      const res = await projectApi.seedSample();
      await fetchProjects();
      if (res.project?._id) {
        selectProject(res.project._id);
      }
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const selectedProject = projects.find(p => p._id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        loading,
        error,
        fetchProjects,
        selectProject,
        seedSample
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

