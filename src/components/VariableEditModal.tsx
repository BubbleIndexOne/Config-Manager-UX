import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Edit3,
  Check,
  Lock,
  Unlock,
  GitCommit,
  Boxes,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Box,
  Layers,
  Server,
} from 'lucide-react';
import { ConfigVariable, ProjectApp } from '../types/config';
import {
  COMMON_CATEGORIES,
  DEFAULT_APP_ID,
  AVAILABLE_APP_ICONS,
} from '../constants';

interface VariableEditModalProps {
  variable: ConfigVariable | null; // null if creating new
  environmentName: string;
  apps: ProjectApp[];
  defaultAppId?: string;
  existingKeys: string[];
  onClose: () => void;
  onSave: (data: {
    appId: string;
    key: string;
    value: string;
    isSecret: boolean;
    category: string;
    description: string;
    reason: string;
  }) => void;
}

export const VariableEditModal: React.FC<VariableEditModalProps> = ({
  variable,
  environmentName,
  apps,
  defaultAppId,
  existingKeys,
  onClose,
  onSave,
}) => {
  const isEditing = !!variable;
  const [selectedAppId, setSelectedAppId] = useState<string>(
    variable?.appId || (defaultAppId && defaultAppId !== 'all' ? defaultAppId : apps[0]?.id || DEFAULT_APP_ID)
  );
  const [key, setKey] = useState<string>(variable?.key || '');
  const [value, setValue] = useState<string>(variable?.value || '');
  const [isSecret, setIsSecret] = useState<boolean>(
    variable?.isSecret ??
      (variable?.key ? variable.key.toUpperCase().includes('SECRET') || variable.key.toUpperCase().includes('KEY') || variable.key.toUpperCase().includes('PASS') : true)
  );
  const [category, setCategory] = useState<string>(variable?.category || 'App Config');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>(variable?.description || '');
  const [reason, setReason] = useState<string>(
    isEditing ? 'Updated variable value' : 'Initial variable configuration'
  );
  const [keyError, setKeyError] = useState<string | null>(null);

  const getAppIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Globe':
        return <Globe className="w-3.5 h-3.5" />;
      case 'Shield':
        return <Shield className="w-3.5 h-3.5" />;
      case 'CreditCard':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'Database':
        return <Database className="w-3.5 h-3.5" />;
      case 'Box':
        return <Box className="w-3.5 h-3.5" />;
      case 'Layers':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Server':
      default:
        return <Server className="w-3.5 h-3.5" />;
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setKey(raw);

    const upper = raw.toUpperCase();
    if (upper.includes('SECRET') || upper.includes('KEY') || upper.includes('PASS') || upper.includes('TOKEN')) {
      setIsSecret(true);
    }

    if (!isEditing && existingKeys.includes(raw.trim())) {
      setKeyError(`A variable with key "${raw.trim()}" already exists in ${environmentName}.`);
    } else {
      setKeyError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = key.trim();
    if (!cleanKey) return;

    if (!isEditing && existingKeys.includes(cleanKey)) {
      setKeyError(`A variable with key "${cleanKey}" already exists.`);
      return;
    }

    const finalCategory = customCategory.trim() || category;

    onSave({
      appId: selectedAppId,
      key: cleanKey,
      value: value,
      isSecret,
      category: finalCategory,
      description: description.trim(),
      reason: reason.trim(),
    });
    onClose();
  };

  const currentSelectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  return (
    <AnimatePresence>
      <div id="variable-edit-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#E4E4E7]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#27272A] bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                {isEditing ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                  {isEditing ? `Edit ${variable.key}` : 'New Environment Variable'}
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
                    {environmentName}
                  </span>
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  {isEditing
                    ? `Creating version v.${variable.currentVersion + 1} with rollback history tracking`
                    : `Configure parameter with immutable revision control`}
                </p>
              </div>
            </div>

            <button
              id="close-edit-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-[#1C1C1F] text-[#71717A] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
            {/* Target Application / Service (env > app hierarchy) */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
              <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Application / Microservice</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {apps.map((app) => {
                  const isSel = selectedAppId === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-2 rounded-lg border text-left transition flex items-center gap-2 ${
                        isSel
                          ? 'bg-[#1C1C1F] border-indigo-500/70 text-white shadow-sm font-semibold'
                          : 'bg-[#121214] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                      }`}
                    >
                      <span className={isSel ? 'text-indigo-400' : 'text-[#71717A]'}>
                        {getAppIcon(app.icon)}
                      </span>
                      <span className="text-xs truncate">{app.name}</span>
                    </button>
                  );
                })}
              </div>
              {currentSelectedApp && currentSelectedApp.description && (
                <p className="text-[10px] text-[#71717A] mt-1 italic">
                  Assigned to {currentSelectedApp.name} ({currentSelectedApp.slug})
                </p>
              )}
            </div>

            {/* Variable Key */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA] flex items-center justify-between">
                <span>Variable Key</span>
                <span className="text-[10px] text-[#71717A] font-normal">SCREAMING_SNAKE_CASE</span>
              </label>
              <input
                id="variable-key-input"
                type="text"
                required
                disabled={isEditing}
                value={key}
                onChange={handleKeyChange}
                placeholder="e.g. DATABASE_URL or STRIPE_SECRET_KEY"
                className={`w-full px-3 py-2 text-xs font-mono bg-[#09090B] border rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 disabled:opacity-60 ${
                  keyError ? 'border-rose-500 text-rose-300' : 'border-[#27272A]'
                }`}
              />
              {keyError && <p className="text-[11px] text-rose-400 mt-1">{keyError}</p>}
            </div>

            {/* Variable Value */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA] flex items-center justify-between">
                <span>Variable Value</span>
                <span className="text-[10px] text-[#71717A] font-normal">Raw string / certificate / URI</span>
              </label>
              <textarea
                id="variable-value-input"
                rows={3}
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Value..."
                className="w-full px-3 py-2 text-xs font-mono bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            {/* Secret Masking Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md ${isSecret ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-[#1C1C1F] text-[#71717A]'}`}>
                  {isSecret ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-medium text-[#E4E4E7]">Mask as Protected Secret</div>
                  <div className="text-[11px] text-[#71717A]">Hides value behind asterisks on dashboard</div>
                </div>
              </div>
              <input
                id="variable-is-secret-checkbox"
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-[#1C1C1F] border-[#27272A] focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA] block">Category / Domain</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setCustomCategory('');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition ${
                      category === cat && !customCategory
                        ? 'bg-[#1C1C1F] text-indigo-400 border-indigo-500/50 font-medium'
                        : 'bg-[#09090B] text-[#71717A] border-[#27272A] hover:border-[#3F3F46]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                id="custom-category-input"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Or type custom category..."
                className="w-full px-3 py-1.5 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA] block">Documentation / Note (Optional)</label>
              <input
                id="variable-description-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Primary production connection pool with 50 replicas"
                className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Commit Message / Reason */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Version Revision Note</span>
              </label>
              <input
                id="variable-reason-input"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Rotated API token after security audit"
                className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#27272A]">
              <button
                id="cancel-edit-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded-md text-xs transition font-medium border border-[#27272A]"
              >
                Cancel
              </button>
              <button
                id="submit-save-variable-btn"
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> {isEditing ? 'Commit Changes' : 'Create Variable'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
