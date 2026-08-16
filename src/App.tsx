import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Lock,
  Plus,
  CheckCircle2,
  FileCode,
  Layers,
} from 'lucide-react';
import {
  Environment,
  ProjectApp,
  ConfigVariable,
  GitIntegrationConfig,
  GitSyncLog,
  CloudSnapshot,
} from './types/config';
import {
  getEnvironments,
  getApps,
  getVariablesByEnv,
  getGitConfig,
  getGitSyncLogs,
  getCloudSnapshots,
  createEnvironment,
  createApp,
  saveVariable,
  deleteVariable,
  rollbackVariable,
  copyVariableToEnv,
  importVariables,
  updateGitConfig,
  executeGitSync,
  createCloudSnapshot,
  restoreCloudSnapshot,
} from './api';
import {
  DEFAULT_APP_ID,
  DEFAULT_ENV_ID,
  ALL_FILTER_VALUE,
  UI_TIMINGS,
  APP_COLOR_OPTIONS,
} from './constants';
import { Header } from './components/Header';
import { EnvironmentTabs } from './components/EnvironmentTabs';
import { AppTabs } from './components/AppTabs';
import { VariableRow } from './components/VariableRow';
import { VariableHistoryModal } from './components/VariableHistoryModal';
import { GitIntegrationModal } from './components/GitIntegrationModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AISecurityModal } from './components/AISecurityModal';
import { VariableEditModal } from './components/VariableEditModal';
import { EnvironmentMatrixView } from './components/EnvironmentMatrixView';
import { ApiEndpointsModal } from './components/ApiEndpointsModal';

export default function App() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [apps, setApps] = useState<ProjectApp[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string>(DEFAULT_ENV_ID);
  const [selectedAppId, setSelectedAppId] = useState<string>(ALL_FILTER_VALUE);
  const [variablesByEnv, setVariablesByEnv] = useState<Record<string, ConfigVariable[]>>({});
  const [gitConfig, setGitConfig] = useState<GitIntegrationConfig>({
    provider: 'github',
    connected: true,
    accountName: 'anshuman-singh',
    repoOwner: 'anshuman-singh',
    repoName: 'infra-cloud-secrets',
    branch: 'main',
    syncTarget: 'repo_secrets',
    lastSyncStatus: 'idle',
    cloudSyncEnabled: true,
  } as any);
  const [gitSyncLogs, setGitSyncLogs] = useState<GitSyncLog[]>([]);
  const [cloudSnapshots, setCloudSnapshots] = useState<CloudSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI View & Modal States
  const [activeView, setActiveView] = useState<'list' | 'matrix'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_FILTER_VALUE);

  // Modals state
  const [historyVariable, setHistoryVariable] = useState<{ variable: ConfigVariable; envName: string } | null>(null);
  const [isGitModalOpen, setIsGitModalOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [editingVariable, setEditingVariable] = useState<ConfigVariable | null>(null);
  const [isNewVariableModalOpen, setIsNewVariableModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Load all initial data from api.ts
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [envs, appsData, vars, gitCfg, logs, snaps] = await Promise.all([
          getEnvironments(),
          getApps(),
          getVariablesByEnv(),
          getGitConfig(),
          getGitSyncLogs(),
          getCloudSnapshots(),
        ]);
        setEnvironments(envs);
        setApps(appsData);
        setVariablesByEnv(vars);
        setGitConfig(gitCfg);
        setGitSyncLogs(logs);
        setCloudSnapshots(snaps);
        if (envs.length > 0) {
          setActiveEnvId(envs[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data from API', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, UI_TIMINGS.TOAST_DURATION_MS);
  };

  const activeEnv = environments.find((e) => e.id === activeEnvId) || environments[0] || {
    id: DEFAULT_ENV_ID,
    name: 'Development',
    code: 'development' as const,
    color: 'emerald',
    description: 'Local development',
    cloudSyncEnabled: true,
  };
  const activeVariables = variablesByEnv[activeEnvId] || [];

  // Filter variables by Search, Category, and App
  const filteredVariables = useMemo(() => {
    return activeVariables.filter((v) => {
      const matchSearch =
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === ALL_FILTER_VALUE || v.category === selectedCategory;
      const matchApp = selectedAppId === ALL_FILTER_VALUE || v.appId === selectedAppId;
      return matchSearch && matchCategory && matchApp;
    });
  }, [activeVariables, searchTerm, selectedCategory, selectedAppId]);

  // Unique categories for current env
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeVariables.forEach((v) => {
      if (v.category) set.add(v.category);
    });
    return Array.from(set).sort();
  }, [activeVariables]);

  // Counts for each env
  const variableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    environments.forEach((env) => {
      counts[env.id] = (variablesByEnv[env.id] || []).length;
    });
    return counts;
  }, [environments, variablesByEnv]);

  // Counts for each app within active env
  const appCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    apps.forEach((app) => {
      counts[app.id] = activeVariables.filter((v) => v.appId === app.id).length;
    });
    return counts;
  }, [apps, activeVariables]);

  // Variable Rollback Handler
  const handleRollbackVariable = async (variableId: string, targetVersion: number) => {
    try {
      const updatedVar = await rollbackVariable(activeEnvId, variableId, targetVersion);
      setVariablesByEnv((prev) => ({
        ...prev,
        [activeEnvId]: (prev[activeEnvId] || []).map((v) => (v.id === variableId ? updatedVar : v)),
      }));
      showToast(`Successfully rolled back variable to v.${targetVersion}!`);
    } catch (err: any) {
      showToast(err.message || 'Rollback failed', 'info');
    }
  };

  // Variable Save / Update Handler
  const handleSaveVariable = async (data: {
    key: string;
    value: string;
    appId: string;
    isSecret: boolean;
    category: string;
    description: string;
    reason: string;
  }) => {
    try {
      const savedVar = await saveVariable(
        activeEnvId,
        {
          appId: data.appId,
          key: data.key,
          value: data.value,
          isSecret: data.isSecret,
          category: data.category,
          description: data.description,
          reason: data.reason,
        },
        editingVariable?.id
      );

      const allVars = await getVariablesByEnv();
      setVariablesByEnv(allVars);

      showToast(editingVariable ? `Updated ${data.key}` : `Created ${data.key}`);
      setEditingVariable(null);
      setIsNewVariableModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'info');
    }
  };

  // Delete Variable Handler
  const handleDeleteVariable = async (variableId: string) => {
    await deleteVariable(activeEnvId, variableId);
    setVariablesByEnv((prev) => ({
      ...prev,
      [activeEnvId]: (prev[activeEnvId] || []).filter((v) => v.id !== variableId),
    }));
    showToast('Variable deleted');
  };

  // Copy Value between environments
  const handleCopyValueToEnv = async (
    targetEnvId: string,
    variableKey: string,
    value: string
  ) => {
    try {
      await copyVariableToEnv(activeEnvId, targetEnvId, variableKey, value);
      const allVars = await getVariablesByEnv();
      setVariablesByEnv(allVars);
      const targetEnvObj = environments.find((e) => e.id === targetEnvId);
      showToast(`Synced ${variableKey} to ${targetEnvObj?.name || 'environment'}`);
    } catch (err: any) {
      showToast(err.message || 'Copy failed', 'info');
    }
  };

  // Bulk Import Handler
  const handleImportVariables = async (
    imported: Array<{ appId?: string; key: string; value: string; isSecret: boolean; category?: string; description?: string }>,
    strategy: 'overwrite' | 'merge'
  ) => {
    try {
      const updatedList = await importVariables(activeEnvId, imported, strategy);
      setVariablesByEnv((prev) => ({
        ...prev,
        [activeEnvId]: updatedList,
      }));
      showToast(`Imported ${imported.length} variables into ${activeEnv.name}`);
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'info');
    }
  };

  // AI Generated Stack Application
  const handleApplyAIGenerated = (vars: any[]) => {
    handleImportVariables(vars, 'merge');
  };

  // Create Environment Handler
  const handleCreateEnvironment = async (name: string, description: string) => {
    try {
      const newEnv = await createEnvironment(name, description);
      setEnvironments((prev) => [...prev, newEnv]);
      setActiveEnvId(newEnv.id);
      showToast(`Environment "${name}" initialized`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create environment', 'info');
    }
  };

  // App Creation Handler
  const handleCreateApp = async (
    data: { name: string; slug?: string; description?: string; icon?: string; color?: string } | string,
    description?: string
  ) => {
    let name = '';
    let slug = '';
    let desc = '';
    let icon = 'Server';
    let color = 'indigo';

    if (typeof data === 'string') {
      name = data;
      desc = description || '';
      slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    } else {
      name = data.name;
      slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      desc = data.description || '';
      icon = data.icon || 'Server';
      color = data.color || 'indigo';
    }

    try {
      const newApp = await createApp({ name, slug, description: desc, icon, color });
      setApps((prev) => [...prev, newApp]);
      setSelectedAppId(newApp.id);
      showToast(`App "${name}" created`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create app', 'info');
    }
  };

  // Git Sync Execution
  const handleExecuteGitSync = async (
    action: 'push' | 'pull',
    commitMessage?: string
  ): Promise<{ success: boolean; commitSha?: string; message?: string }> => {
    const res = await executeGitSync({
      provider: gitConfig.provider,
      repoOwner: gitConfig.repoOwner,
      repoName: gitConfig.repoName,
      branch: gitConfig.branch,
      token: gitConfig.token || '',
      environment: activeEnv.name,
      variables: activeVariables,
      action,
      commitMessage,
    });

    const [updatedLogs, updatedCfg] = await Promise.all([getGitSyncLogs(), getGitConfig()]);
    setGitSyncLogs(updatedLogs);
    setGitConfig(updatedCfg);

    showToast(`Pushed to ${gitConfig.provider === 'github' ? 'GitHub' : 'Bitbucket'} (SHA: ${res.commitSha?.substring(0, 7)})`);
    return res;
  };

  // Cloud Snapshot Creation
  const handleCreateCloudSnapshot = async (label: string) => {
    const snap = await createCloudSnapshot(label, 'anshuman.singh@dev.local', {
      environments,
      apps,
      variablesByEnv,
    });
    setCloudSnapshots((prev) => [snap, ...prev]);
    showToast(`Cloud checkpoint "${label}" saved!`);
  };

  // Cloud Snapshot Restore
  const handleRestoreCloudSnapshot = async (snapshotId: string) => {
    const restored = await restoreCloudSnapshot(snapshotId);
    if (restored.environments) setEnvironments(restored.environments);
    if (restored.apps) setApps(restored.apps);
    if (restored.variablesByEnv) setVariablesByEnv(restored.variablesByEnv);
    showToast('Restored cloud snapshot');
  };

  const totalAllEnvsVariables = (Object.values(variablesByEnv) as ConfigVariable[][]).reduce(
    (acc: number, list: ConfigVariable[]) => acc + (list?.length || 0),
    0
  );
  const totalSecretsCount = activeVariables.filter((v) => v.isSecret).length;

  const activeApp = apps.find((a) => a.id === selectedAppId);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7] flex flex-col antialiased">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className="px-4 py-3 bg-[#121214] border border-indigo-500/50 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-[#E4E4E7]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeView={activeView}
        gitConfig={gitConfig}
        cloudSyncActive={true}
        totalVariables={totalAllEnvsVariables}
        onToggleView={setActiveView}
        onOpenGitModal={() => setIsGitModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenNewVariableModal={() => {
          setEditingVariable(null);
          setIsNewVariableModalOpen(true);
        }}
      />

      {/* Main Application Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Layer 1: Environment Switcher Tabs (env) */}
        <EnvironmentTabs
          environments={environments}
          activeEnvId={activeEnvId}
          variableCounts={variableCounts}
          onSelectEnv={setActiveEnvId}
          onCreateEnv={handleCreateEnvironment}
        />

        {activeView === 'matrix' ? (
          /* Cross-Environment Matrix View */
          <EnvironmentMatrixView
            environments={environments}
            apps={apps}
            variablesByEnv={variablesByEnv}
            onCopyValueToEnv={handleCopyValueToEnv}
            onOpenVariableHistory={(v, envName) => setHistoryVariable({ variable: v, envName })}
          />
        ) : (
          /* Single-Environment Variable List View with App-Wise Sub-Separation (env > app) */
          <div className="space-y-5">
            {/* Layer 2: App Tabs (env > app) */}
            <AppTabs
              apps={apps}
              activeAppId={selectedAppId}
              selectedAppId={selectedAppId}
              appVariableCounts={appCounts}
              appCounts={appCounts}
              totalEnvVariables={activeVariables.length}
              totalCount={activeVariables.length}
              environmentName={activeEnv.name}
              onSelectApp={setSelectedAppId}
              onCreateApp={handleCreateApp}
            />

            {/* Environment & App Overview Banner */}
            <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {activeEnv.name}
                  </span>
                  <span className="text-[#52525B]">/</span>
                  <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                    {selectedAppId === 'all' ? (
                      <>
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>All Applications & Services</span>
                      </>
                    ) : (
                      <>
                        <span>{activeApp?.name}</span>
                        <span className="text-xs text-[#71717A] font-mono">({activeApp?.slug})</span>
                      </>
                    )}
                  </h2>
                  {activeEnv.isLocked && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 ml-1">
                      <Lock className="w-3 h-3" /> Locked Production
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71717A]">
                  {selectedAppId === 'all'
                    ? `Viewing consolidated configs across all microservices and apps in ${activeEnv.name}.`
                    : activeApp?.description || `Managing variables isolated to ${activeApp?.name}.`}
                </p>
              </div>

              {/* Quick Stat Pills */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-[#09090B] rounded-lg border border-[#27272A] text-xs">
                  <span className="text-[#52525B] text-[10px] block font-bold uppercase tracking-wider">Filtered Vars</span>
                  <span className="font-semibold text-[#E4E4E7] font-mono">{filteredVariables.length}</span>
                </div>
                <div className="px-3 py-1.5 bg-[#09090B] rounded-lg border border-[#27272A] text-xs">
                  <span className="text-[#52525B] text-[10px] block font-bold uppercase tracking-wider">Secrets</span>
                  <span className="font-semibold text-amber-400 font-mono">
                    {filteredVariables.filter((v) => v.isSecret).length}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-[#09090B] rounded-lg border border-[#27272A] text-xs">
                  <span className="text-[#52525B] text-[10px] block font-bold uppercase tracking-wider">Target Git</span>
                  <span className="font-semibold text-indigo-400 font-mono">
                    {gitConfig.provider === 'github' ? 'GitHub' : 'Bitbucket'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-2.5" />
                <input
                  id="search-variables-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by variable key, description, or category..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#121214] border border-[#27272A] rounded-lg text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-[#121214] px-3 py-2 rounded-lg border border-[#27272A] text-xs text-[#A1A1AA]">
                  <Filter className="w-3.5 h-3.5 text-[#71717A]" />
                  <select
                    id="filter-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs text-[#E4E4E7] focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#121214]">
                      All Categories ({activeVariables.length})
                    </option>
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#121214]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="add-variable-list-btn"
                  type="button"
                  onClick={() => {
                    setEditingVariable(null);
                    setIsNewVariableModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variable
                </button>
              </div>
            </div>

            {/* Variable Rows List */}
            {filteredVariables.length === 0 ? (
              <div className="p-12 text-center bg-[#121214] border border-[#27272A] rounded-xl space-y-3">
                <FileCode className="w-8 h-8 text-[#52525B] mx-auto" />
                <div className="text-sm font-semibold text-[#A1A1AA]">
                  {searchTerm || selectedCategory !== 'all' || selectedAppId !== 'all'
                    ? 'No variables match your current filter'
                    : `No environment variables configured in ${activeEnv.name}`}
                </div>
                <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                  {selectedAppId !== 'all'
                    ? `Create variables specifically for ${activeApp?.name} in the ${activeEnv.name} environment.`
                    : `Add your first variable, import a .env file, or use AI Generator to populate ${activeEnv.name}.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVariable(null);
                    setIsNewVariableModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium"
                >
                  Create Variable
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVariables.map((v) => (
                  <VariableRow
                    key={v.id}
                    variable={v}
                    apps={apps}
                    environmentName={activeEnv.name}
                    environments={environments}
                    onOpenHistory={(targetVar) =>
                      setHistoryVariable({ variable: targetVar, envName: activeEnv.name })
                    }
                    onEdit={(targetVar) => setEditingVariable(targetVar)}
                    onDelete={handleDeleteVariable}
                    onCopyToOtherEnv={handleCopyValueToEnv}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 1. Variable Version History & Rollback Modal */}
      {historyVariable && (
        <VariableHistoryModal
          variable={historyVariable.variable}
          environmentName={historyVariable.envName}
          onClose={() => setHistoryVariable(null)}
          onRollback={handleRollbackVariable}
        />
      )}

      {/* 2. GitHub & Bitbucket Integration Modal */}
      {isGitModalOpen && (
        <GitIntegrationModal
          config={gitConfig}
          syncLogs={gitSyncLogs}
          currentEnvironmentName={activeEnv.name}
          currentEnvironmentCode={activeEnv.code}
          variables={activeVariables}
          onClose={() => setIsGitModalOpen(false)}
          onUpdateConfig={(cfg) => {
            setGitConfig(cfg);
            showToast('Git integration configuration saved');
          }}
          onExecuteSync={handleExecuteGitSync}
        />
      )}

      {/* 3. Cloud Sync & Snapshot Checkpoints Modal */}
      {isCloudModalOpen && (
        <CloudSyncModal
          snapshots={cloudSnapshots}
          environments={environments}
          variablesByEnv={variablesByEnv}
          onClose={() => setIsCloudModalOpen(false)}
          onCreateSnapshot={handleCreateCloudSnapshot}
          onRestoreSnapshot={handleRestoreCloudSnapshot}
        />
      )}

      {/* 4. Import & Export Modal */}
      {isImportExportModalOpen && (
        <ImportExportModal
          environmentName={activeEnv.name}
          variables={activeVariables}
          apps={apps}
          initialAppId={selectedAppId !== 'all' ? selectedAppId : apps[0]?.id}
          onClose={() => setIsImportExportModalOpen(false)}
          onImportVariables={handleImportVariables}
        />
      )}

      {/* 5. AI Security Auditor & Template Generator Modal */}
      {isAIModalOpen && (
        <AISecurityModal
          environmentName={activeEnv.name}
          variables={activeVariables}
          apps={apps}
          initialAppId={selectedAppId !== 'all' ? selectedAppId : apps[0]?.id}
          onClose={() => setIsAIModalOpen(false)}
          onApplyGeneratedVariables={handleApplyAIGenerated}
        />
      )}

      {/* 6. Add / Edit Variable Modal */}
      {(isNewVariableModalOpen || editingVariable) && (
        <VariableEditModal
          variable={editingVariable}
          environmentName={activeEnv.name}
          apps={apps}
          defaultAppId={selectedAppId !== 'all' ? selectedAppId : apps[0]?.id}
          existingKeys={activeVariables.map((v) => v.key)}
          onClose={() => {
            setEditingVariable(null);
            setIsNewVariableModalOpen(false);
          }}
          onSave={handleSaveVariable}
        />
      )}

      {/* 7. REST API Endpoints Explorer Modal */}
      {isApiModalOpen && (
        <ApiEndpointsModal
          isOpen={isApiModalOpen}
          environments={environments}
          apps={apps}
          onClose={() => setIsApiModalOpen(false)}
        />
      )}
    </div>
  );
}
