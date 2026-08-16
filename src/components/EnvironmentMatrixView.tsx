import React, { useState } from 'react';
import {
  Layers,
  Check,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Search,
  Filter,
  Boxes,
  Server,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Box,
} from 'lucide-react';
import { Environment, ConfigVariable, ProjectApp } from '../types/config';

interface EnvironmentMatrixViewProps {
  environments: Environment[];
  apps: ProjectApp[];
  variablesByEnv: Record<string, ConfigVariable[]>;
  onCopyValueToEnv: (targetEnvId: string, variableKey: string, value: string) => void;
  onOpenVariableHistory: (variable: ConfigVariable, envName: string) => void;
}

export const EnvironmentMatrixView: React.FC<EnvironmentMatrixViewProps> = ({
  environments,
  apps,
  variablesByEnv,
  onCopyValueToEnv,
  onOpenVariableHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAllSecrets, setShowAllSecrets] = useState<boolean>(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getAppIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Globe':
        return <Globe className="w-3 h-3 text-cyan-400" />;
      case 'Shield':
        return <Shield className="w-3 h-3 text-purple-400" />;
      case 'CreditCard':
        return <CreditCard className="w-3 h-3 text-emerald-400" />;
      case 'Cpu':
        return <Cpu className="w-3 h-3 text-amber-400" />;
      case 'Database':
        return <Database className="w-3 h-3 text-blue-400" />;
      case 'Box':
        return <Box className="w-3 h-3 text-pink-400" />;
      case 'Layers':
        return <Layers className="w-3 h-3 text-indigo-400" />;
      case 'Server':
      default:
        return <Server className="w-3 h-3 text-indigo-400" />;
    }
  };

  // Collect all unique keys across all environments, mapping key -> appId
  const keyAppMap = new Map<string, string>();
  const allKeysSet = new Set<string>();
  const allCategoriesSet = new Set<string>();

  (Object.values(variablesByEnv) as ConfigVariable[][]).forEach((varList) => {
    (varList || []).forEach((v) => {
      allKeysSet.add(v.key);
      if (v.appId && !keyAppMap.has(v.key)) {
        keyAppMap.set(v.key, v.appId);
      }
      if (v.category) allCategoriesSet.add(v.category);
    });
  });

  const allKeys = Array.from(allKeysSet).sort();
  const allCategories = Array.from(allCategoriesSet).sort();

  // Filter keys by search, application, and category
  const filteredKeys = allKeys.filter((key) => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check app filter
    if (selectedAppId !== 'all') {
      const belongsToApp = (Object.values(variablesByEnv) as ConfigVariable[][]).some((list) =>
        (list || []).some((v) => v.key === key && v.appId === selectedAppId)
      );
      if (!belongsToApp) return false;
    }

    if (selectedCategory === 'all') return matchesSearch;

    // Check if key belongs to this category in any env
    const hasCategory = (Object.values(variablesByEnv) as ConfigVariable[][]).some((list) =>
      (list || []).some((v) => v.key === key && v.category === selectedCategory)
    );
    return matchesSearch && hasCategory;
  });

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Matrix Controls & Summary */}
      <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Cross-Environment Matrix & Drift Inspector
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Compare variables across all {environments.length} environments simultaneously organized by application service.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="matrix-toggle-reveal-secrets"
              type="button"
              onClick={() => setShowAllSecrets(!showAllSecrets)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-xs font-medium text-[#A1A1AA] hover:text-white border border-[#27272A] transition"
            >
              {showAllSecrets ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-[#71717A]" />}
              {showAllSecrets ? 'Mask Secrets' : 'Reveal Values'}
            </button>
          </div>
        </div>

        {/* Application Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#27272A]">
          <span className="text-[11px] font-semibold text-[#71717A] uppercase mr-1 flex items-center gap-1">
            <Boxes className="w-3 h-3 text-indigo-400" /> App Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedAppId('all')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              selectedAppId === 'all'
                ? 'bg-[#27272A] text-white font-medium border border-[#3F3F46]'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            All Apps ({allKeys.length})
          </button>
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedAppId(app.id)}
              className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1.5 ${
                selectedAppId === app.id
                  ? 'bg-[#1C1C1F] text-indigo-400 font-medium border border-indigo-500/50'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
              }`}
            >
              {getAppIcon(app.icon)}
              <span>{app.name}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#27272A]">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-2.5" />
            <input
              id="matrix-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search variable keys..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#71717A]" />
            <select
              id="matrix-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-md text-xs text-[#A1A1AA] focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cross-Environment Matrix Table */}
      <div className="rounded-xl bg-[#121214] border border-[#27272A] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#18181B] border-b border-[#27272A] text-[#71717A] font-bold uppercase tracking-widest text-[10px]">
                <th className="py-3.5 px-4 sticky left-0 bg-[#18181B] z-10 w-72 border-r border-[#27272A]">
                  Variable Key & App ({filteredKeys.length})
                </th>
                {environments.map((env) => (
                  <th key={env.id} className="py-3.5 px-4 min-w-[260px] border-r border-[#27272A] last:border-r-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            env.code === 'production'
                              ? 'bg-rose-500'
                              : env.code === 'staging'
                              ? 'bg-amber-500'
                              : env.code === 'qa'
                              ? 'bg-purple-500'
                              : env.code === 'preview'
                              ? 'bg-cyan-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-[#E4E4E7] font-semibold">{env.name}</span>
                      </div>
                      <span className="text-[10px] text-[#52525B] font-normal">
                        {(variablesByEnv[env.id] || []).length} vars
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] font-mono">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={environments.length + 1} className="py-8 text-center text-[#71717A] font-sans">
                    No matching environment variables found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((key) => {
                  const appId = keyAppMap.get(key);
                  const matchedApp = apps.find((a) => a.id === appId);

                  return (
                    <tr key={key} className="hover:bg-[#1C1C1F] transition group">
                      {/* Variable Key Sticky Header with App Badge */}
                      <td className="py-3 px-4 sticky left-0 bg-[#121214] group-hover:bg-[#1C1C1F] z-10 border-r border-[#27272A]">
                        <div className="space-y-1">
                          <div className="font-semibold text-indigo-400 flex items-center gap-2">
                            <span className="truncate">{key}</span>
                          </div>
                          {matchedApp && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#71717A] font-sans">
                              {getAppIcon(matchedApp.icon)}
                              <span className="truncate">{matchedApp.name}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Environments values cells */}
                      {environments.map((env) => {
                        const envVars = variablesByEnv[env.id] || [];
                        const variable = envVars.find((v) => v.key === key);

                        if (!variable) {
                          return (
                            <td key={env.id} className="py-3 px-4 border-r border-[#27272A] last:border-r-0 bg-rose-500/5">
                              <div className="flex items-center justify-between text-rose-400 text-[11px] font-sans">
                                <span className="flex items-center gap-1.5 italic">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Missing in {env.name}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        const isMasked = variable.isSecret && !showAllSecrets;
                        const displayVal = isMasked ? '••••••••••••' : variable.value;

                        return (
                          <td
                            key={env.id}
                            className="py-3 px-4 border-r border-[#27272A] last:border-r-0 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-[#A1A1AA] font-mono text-[11px] truncate max-w-[180px]" title={variable.value}>
                                  {displayVal}
                                </div>
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(variable.value, `${env.id}-${variable.id}`)}
                                    className="p-1 hover:bg-[#27272A] rounded text-[#71717A] hover:text-white transition"
                                    title="Copy value"
                                  >
                                    {copiedKey === `${env.id}-${variable.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenVariableHistory(variable, env.name)}
                                    className="px-1.5 py-0.5 rounded bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-indigo-400 text-[10px] font-mono transition"
                                    title="View version history and rollback"
                                  >
                                    v.{variable.currentVersion}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

