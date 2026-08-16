import React from 'react';
import {
  Shield,
  Cloud,
  FolderGit2,
  Layers,
  Sparkles,
  Download,
  Plus,
  Code2,
} from 'lucide-react';
import { GitIntegrationConfig } from '../types/config';

interface HeaderProps {
  activeView: 'list' | 'matrix';
  gitConfig: GitIntegrationConfig;
  cloudSyncActive: boolean;
  totalVariables: number;
  onToggleView: (view: 'list' | 'matrix') => void;
  onOpenGitModal: () => void;
  onOpenCloudModal: () => void;
  onOpenAIModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenNewVariableModal: () => void;
  onOpenApiModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  gitConfig,
  cloudSyncActive,
  totalVariables,
  onToggleView,
  onOpenGitModal,
  onOpenCloudModal,
  onOpenAIModal,
  onOpenImportExportModal,
  onOpenNewVariableModal,
  onOpenApiModal,
}) => {
  return (
    <header className="border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-sm">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#E4E4E7] tracking-tight">ConfigFlow</h1>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
              PRO
            </span>
          </div>
          <p className="text-xs text-[#71717A]">
            Environment Variables & Secret Version Control
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View Toggle (List vs Cross-Environment Matrix) */}
        <div className="flex bg-[#121214] p-1 rounded-lg border border-[#27272A]">
          <button
            id="view-toggle-list"
            type="button"
            onClick={() => onToggleView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
              activeView === 'list'
                ? 'bg-[#27272A] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <span>Environment View</span>
          </button>
          <button
            id="view-toggle-matrix"
            type="button"
            onClick={() => onToggleView('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
              activeView === 'matrix'
                ? 'bg-[#27272A] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matrix & Drift</span>
          </button>
        </div>

        {/* REST API Endpoints Explorer */}
        <button
          id="api-endpoints-header-btn"
          type="button"
          onClick={onOpenApiModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-[#E4E4E7] text-xs font-medium border border-indigo-500/30 transition shadow-sm"
          title="Interactive REST API Explorer & Spec"
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Endpoints API</span>
          <span className="px-1 py-0.2 text-[9px] font-mono bg-indigo-500/20 text-indigo-300 rounded">REST</span>
        </button>

        {/* Cloud Sync Status & Snapshot Trigger */}
        <button
          id="cloud-sync-header-btn"
          type="button"
          onClick={onOpenCloudModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-[#E4E4E7] text-xs font-medium border border-[#27272A] transition"
          title="Cloud State & Snapshots"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Cloud Sync</span>
        </button>

        {/* GitHub / Bitbucket Sync Hub */}
        <button
          id="git-sync-header-btn"
          type="button"
          onClick={onOpenGitModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-[#E4E4E7] text-xs font-medium border border-[#27272A] transition"
          title={`Git Integration: ${gitConfig.repoOwner}/${gitConfig.repoName}`}
        >
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">
            {gitConfig.provider === 'github' ? 'GitHub' : 'Bitbucket'} Sync
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        </button>

        {/* AI Security Copilot */}
        <button
          id="ai-audit-header-btn"
          type="button"
          onClick={onOpenAIModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
          title="AI Security & Configuration Audit"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Auditor</span>
        </button>

        {/* Import & Export */}
        <button
          id="import-export-header-btn"
          type="button"
          onClick={onOpenImportExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-[#E4E4E7] text-xs font-medium border border-[#27272A] transition"
          title="Import and Export configurations"
        >
          <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <span className="hidden sm:inline">Import/Export</span>
        </button>

        {/* Add New Variable */}
        <button
          id="new-variable-header-btn"
          type="button"
          onClick={onOpenNewVariableModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Variable</span>
        </button>
      </div>
    </header>
  );
};
