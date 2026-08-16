import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  History,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  ArrowRight,
  Layers,
  Server,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Box,
} from 'lucide-react';
import { ConfigVariable, Environment, ProjectApp } from '../types/config';

interface VariableRowProps {
  variable: ConfigVariable;
  environmentName: string;
  environments: Environment[];
  app?: ProjectApp;
  apps?: ProjectApp[];
  onOpenHistory: (variable: ConfigVariable) => void;
  onEdit: (variable: ConfigVariable) => void;
  onDelete: (variableId: string) => void;
  onCopyToOtherEnv: (targetEnvId: string, variableKey: string, value: string) => void;
}

export const VariableRow: React.FC<VariableRowProps> = ({
  variable,
  environmentName,
  environments,
  app,
  apps,
  onOpenHistory,
  onEdit,
  onDelete,
  onCopyToOtherEnv,
}) => {
  const targetApp = app || (apps ? apps.find((a) => a.id === variable.appId) : undefined);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showCopyMenu, setShowCopyMenu] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'auth & security':
      case 'auth':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'payments':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'network':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'observability':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-[#1C1C1F] text-[#A1A1AA] border-[#27272A]';
    }
  };

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

  const displayValue = !variable.isSecret || isRevealed ? variable.value : '••••••••••••••••••••••••';

  return (
    <div
      id={`var-row-${variable.id}`}
      className="p-3.5 bg-[#121214] hover:bg-[#1C1C1F] border border-[#27272A] rounded-xl transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
    >
      {/* Left: Key & Category & App Tag */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            variable.isSecret
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'bg-[#1C1C1F] text-[#71717A] border border-[#27272A]'
          }`}
          title={variable.isSecret ? 'Encrypted Secret' : 'Public Variable'}
        >
          {variable.isSecret ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-indigo-400 tracking-tight select-all">
              {variable.key}
            </span>

            {/* Application Identifier Badge (env > app hierarchy) */}
            {targetApp && (
              <span
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#1C1C1F] text-[#E4E4E7] border border-[#27272A] flex items-center gap-1.5"
                title={`Application: ${targetApp.name} (${targetApp.slug})`}
              >
                {getAppIcon(targetApp.icon)}
                <span>{targetApp.name}</span>
              </span>
            )}

            <span
              className={`px-2 py-0.2 text-[10px] font-medium rounded-full border ${getCategoryColor(
                variable.category
              )}`}
            >
              {variable.category}
            </span>
          </div>

          {variable.description ? (
            <p className="text-[11px] text-[#71717A] truncate mt-0.5">{variable.description}</p>
          ) : (
            <p className="text-[10px] text-[#52525B] mt-0.5">
              Modified by {variable.updatedBy.split('@')[0]} • {new Date(variable.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Masked / Unmasked Value Display */}
      <div className="flex items-center gap-2 flex-1 max-w-md bg-[#09090B] p-2 rounded-lg border border-[#27272A]">
        <div
          className={`font-mono text-xs truncate flex-1 select-all ${
            variable.isSecret && !isRevealed ? 'text-[#71717A] tracking-widest' : 'text-[#E4E4E7]'
          }`}
          title={variable.value}
        >
          {displayValue}
        </div>

        {variable.isSecret && (
          <button
            id={`toggle-reveal-${variable.id}`}
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-1 rounded hover:bg-[#1C1C1F] text-[#71717A] hover:text-[#E4E4E7] transition shrink-0"
            title={isRevealed ? 'Mask secret' : 'Reveal secret'}
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          id={`copy-var-${variable.id}`}
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-[#1C1C1F] text-[#71717A] hover:text-[#E4E4E7] transition shrink-0"
          title="Copy value to clipboard"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Right: History & Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        {/* Crucial: History trigger button */}
        <button
          id={`history-btn-${variable.id}`}
          type="button"
          onClick={() => onOpenHistory(variable)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] text-indigo-400 hover:text-indigo-300 border border-[#27272A] hover:border-indigo-500/50 transition text-xs font-mono font-medium shadow-sm"
          title={`View full version history and rollback for ${variable.key} (${variable.history.length} versions)`}
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>v.{variable.currentVersion} History</span>
        </button>

        {/* Copy to Other Environment Dropdown */}
        <div className="relative">
          <button
            id={`copy-to-env-btn-${variable.id}`}
            type="button"
            onClick={() => setShowCopyMenu(!showCopyMenu)}
            className="p-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] text-[#71717A] hover:text-[#E4E4E7] text-xs border border-[#27272A] transition"
            title="Duplicate to another environment"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {showCopyMenu && (
            <div className="absolute right-0 bottom-full mb-1 z-20 w-44 bg-[#121214] border border-[#27272A] rounded-lg shadow-2xl p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[#52525B] uppercase tracking-wider">
                Sync to Env
              </div>
              {environments
                .filter((e) => e.name !== environmentName)
                .map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => {
                      onCopyToOtherEnv(env.id, variable.key, variable.value);
                      setShowCopyMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F] rounded-md flex items-center justify-between"
                  >
                    <span>{env.name}</span>
                    <ArrowRight className="w-3 h-3 text-[#71717A]" />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button
          id={`edit-var-${variable.id}`}
          type="button"
          onClick={() => onEdit(variable)}
          className="p-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white text-xs border border-[#27272A] transition"
          title="Edit variable value or settings"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              id={`confirm-del-${variable.id}`}
              type="button"
              onClick={() => onDelete(variable.id)}
              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] text-[10px] transition border border-[#27272A]"
            >
              No
            </button>
          </div>
        ) : (
          <button
            id={`del-var-${variable.id}`}
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-rose-950/30 text-[#71717A] hover:text-rose-400 text-xs transition"
            title="Delete variable"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
