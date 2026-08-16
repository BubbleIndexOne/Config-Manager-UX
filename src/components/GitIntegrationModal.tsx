import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderGit2,
  GitBranch,
  GitPullRequest,
  GitCommit,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  Check,
} from 'lucide-react';
import { GitIntegrationConfig, GitSyncLog, ConfigVariable } from '../types/config';
import { GIT_PROVIDERS, GIT_SYNC_TARGETS, UI_TIMINGS } from '../constants';

interface GitIntegrationModalProps {
  config: GitIntegrationConfig;
  syncLogs: GitSyncLog[];
  currentEnvironmentName: string;
  currentEnvironmentCode: string;
  variables: ConfigVariable[];
  onClose: () => void;
  onUpdateConfig: (newConfig: GitIntegrationConfig) => void;
  onExecuteSync: (action: 'push' | 'pull', commitMessage?: string) => Promise<{ success: boolean; commitSha?: string; message?: string }>;
}

export const GitIntegrationModal: React.FC<GitIntegrationModalProps> = ({
  config,
  syncLogs,
  currentEnvironmentName,
  currentEnvironmentCode,
  variables,
  onClose,
  onUpdateConfig,
  onExecuteSync,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'settings' | 'logs'>('sync');
  const [provider, setProvider] = useState<'github' | 'bitbucket'>(config.provider);
  const [repoOwner, setRepoOwner] = useState<string>(config.repoOwner);
  const [repoName, setRepoName] = useState<string>(config.repoName);
  const [branch, setBranch] = useState<string>(config.branch);
  const [token, setToken] = useState<string>(config.token);
  const [syncTarget, setSyncTarget] = useState<'repo_env' | 'branch_dotenv' | 'repo_secrets'>(config.syncTarget);
  const [autoSyncOnCommit, setAutoSyncOnCommit] = useState<boolean>(config.autoSyncOnCommit);

  const [commitMessage, setCommitMessage] = useState<string>(
    `Sync ${variables.length} parameters from ${currentEnvironmentName} environment`
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; text: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      provider,
      repoOwner,
      repoName,
      branch,
      token,
      syncTarget,
      autoSyncOnCommit,
    });
    setSyncResult({ success: true, text: 'Git integration settings saved successfully.' });
  };

  const handlePush = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await onExecuteSync('push', commitMessage);
      setSyncResult({
        success: true,
        text: `Successfully synced variables to ${provider === 'github' ? 'GitHub' : 'Bitbucket'}! Commit SHA: ${res.commitSha?.substring(0, 7)}`,
      });
    } catch (err: any) {
      setSyncResult({ success: false, text: err.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      <div id="git-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#E4E4E7]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#27272A] bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                  Git Sync Hub
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
                    {provider === 'github' ? 'GitHub' : 'Bitbucket'}
                  </span>
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Synchronize environment variables to GitHub Actions secrets or Bitbucket Pipelines
                </p>
              </div>
            </div>

            <button
              id="close-git-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-[#1C1C1F] text-[#71717A] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#27272A] bg-[#09090B] px-6 gap-2 pt-2">
            <button
              id="git-tab-sync"
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'sync'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Push & Sync
            </button>
            <button
              id="git-tab-settings"
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Repository Settings
            </button>
            <button
              id="git-tab-logs"
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Sync Audit Logs ({syncLogs.length})
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#121214]">
            {activeTab === 'sync' && (
              <div className="space-y-5">
                {/* Repository Connection Card */}
                <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#E4E4E7] flex items-center gap-2">
                        <span>{repoOwner}/{repoName}</span>
                        <span className="text-[10px] text-[#A1A1AA] bg-[#1C1C1F] px-1.5 py-0.2 rounded border border-[#27272A]">
                          branch: {branch}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#71717A]">
                        Target: {syncTarget.replace('_', ' ')} • Active Env: {currentEnvironmentName} ({variables.length} parameters)
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    CONNECTED
                  </span>
                </div>

                {/* Commit Message & Sync Trigger */}
                <div className="p-5 rounded-xl bg-[#09090B] border border-[#27272A] space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#A1A1AA] block">Commit Audit Summary</label>
                    <input
                      id="git-commit-msg-input"
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Summary of variable changes..."
                      className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    id="execute-git-push-btn"
                    type="button"
                    disabled={isSyncing}
                    onClick={handlePush}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                    Push {variables.length} Variables to {provider === 'github' ? 'GitHub' : 'Bitbucket'}
                  </button>
                </div>

                {/* Status message */}
                {syncResult && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                      syncResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{syncResult.text}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Provider Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#A1A1AA] block">Git Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProvider('github')}
                      className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                        provider === 'github'
                          ? 'bg-[#1C1C1F] border-indigo-500 text-white'
                          : 'bg-[#09090B] border-[#27272A] text-[#71717A] hover:text-[#E4E4E7]'
                      }`}
                    >
                      GitHub Actions & Secrets
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('bitbucket')}
                      className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                        provider === 'bitbucket'
                          ? 'bg-[#1C1C1F] border-indigo-500 text-white'
                          : 'bg-[#09090B] border-[#27272A] text-[#71717A] hover:text-[#E4E4E7]'
                      }`}
                    >
                      Bitbucket Pipelines & Deployments
                    </button>
                  </div>
                </div>

                {/* Repo Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Owner / Organization</label>
                    <input
                      type="text"
                      required
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Repository Name</label>
                    <input
                      type="text"
                      required
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Default Branch</label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Access Token / Secret</label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_••••••••••••"
                      className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition shadow-sm"
                  >
                    Save Git Settings
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-2">
                {syncLogs.length === 0 ? (
                  <div className="p-8 text-center bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#71717A]">
                    No sync logs recorded yet.
                  </div>
                ) : (
                  syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-[#E4E4E7] flex items-center gap-2">
                          <span>{log.message}</span>
                          <span className="font-mono text-[10px] text-indigo-400 bg-[#1C1C1F] px-1.5 py-0.2 rounded border border-[#27272A]">
                            {log.commitSha?.substring(0, 7)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#71717A]">
                          {log.environment} • {new Date(log.timestamp).toLocaleString()} • {log.variablesCount} variables
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                        SUCCESS
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs text-[#71717A]">
            <span>OAuth & PAT tokens are encrypted with AES-256</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-white font-medium transition"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
