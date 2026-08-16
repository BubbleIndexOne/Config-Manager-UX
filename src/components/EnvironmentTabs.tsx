import React, { useState } from 'react';
import {
  Lock,
  Plus,
  Layers,
  X,
} from 'lucide-react';
import { Environment } from '../types/config';
import { ENV_CODE_DOT_COLORS } from '../constants';

interface EnvironmentTabsProps {
  environments: Environment[];
  activeEnvId: string;
  variableCounts: Record<string, number>;
  onSelectEnv: (envId: string) => void;
  onCreateEnv: (name: string, description: string) => void;
}

export const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({
  environments,
  activeEnvId,
  variableCounts,
  onSelectEnv,
  onCreateEnv,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEnvName, setNewEnvName] = useState<string>('');
  const [newEnvDesc, setNewEnvDesc] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    onCreateEnv(newEnvName.trim(), newEnvDesc.trim());
    setNewEnvName('');
    setNewEnvDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] pb-3">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold mr-1 hidden sm:inline">
          Environments:
        </span>
        {environments.map((env) => {
          const isActive = env.id === activeEnvId;
          const count = variableCounts[env.id] || 0;
          const dotColor = ENV_CODE_DOT_COLORS[env.code] || 'bg-blue-500';

          return (
            <button
              key={env.id}
              id={`tab-env-${env.id}`}
              type="button"
              onClick={() => onSelectEnv(env.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 border ${
                isActive
                  ? 'bg-[#27272A] border-[#3F3F46] text-white shadow-sm'
                  : 'bg-[#121214] hover:bg-[#1C1C1F] border-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <span>{env.name}</span>

              {env.isLocked && <Lock className="w-3 h-3 text-rose-400 shrink-0" title="Locked environment" />}

              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                  isActive ? 'bg-[#18181B] text-indigo-400' : 'bg-[#1C1C1F] text-[#71717A]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <button
          id="add-environment-btn"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-lg bg-[#121214] hover:bg-[#1C1C1F] text-[#71717A] hover:text-[#E4E4E7] border border-[#27272A] transition"
          title="Add new environment"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New Environment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#E4E4E7] flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Add New Environment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#71717A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Environment Name</label>
                <input
                  id="new-env-name-input"
                  type="text"
                  required
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g. UAT Sandbox / Load Testing / Demo"
                  className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">Description (Optional)</label>
                <input
                  id="new-env-desc-input"
                  type="text"
                  value={newEnvDesc}
                  onChange={(e) => setNewEnvDesc(e.target.value)}
                  placeholder="e.g. Dedicated cluster for partner onboarding"
                  className="w-full px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-[#1C1C1F] text-[#A1A1AA] hover:text-white rounded-md text-xs border border-[#27272A]"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-env-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium"
                >
                  Create Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
