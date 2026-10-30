import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProjectProvider } from './context/ProjectContext.jsx';
import { Layout } from './components/common/Layout.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { DocumentDetailPage } from './pages/DocumentDetailPage.jsx';
import { ResearchChatPage } from './pages/ResearchChatPage.jsx';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage.jsx';
import { KnowledgeDiscoveryPage } from './pages/KnowledgeDiscoveryPage.jsx';
import { ContradictionsPage } from './pages/ContradictionsPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { ReportDetailPage } from './pages/ReportDetailPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated routes wrapped with Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:id" element={<DocumentDetailPage />} />
              <Route path="/chat" element={<ResearchChatPage />} />
              <Route path="/evidence" element={<EvidenceExplorerPage />} />
              <Route path="/discovery" element={<KnowledgeDiscoveryPage />} />
              <Route path="/contradictions" element={<ContradictionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

