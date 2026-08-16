import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  History,
  GitCommit,
  User,
  Clock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  FileDiff,
  Lock,
  Unlock,
} from 'lucide-react';
import { ConfigVariable, VariableHistoryEntry } from '../types/config';

interface VariableHistoryModalProps {
  variable: ConfigVariable;
  environmentName: string;
  onClose: () => void;
  onRollback: (variableId: string, targetVersion: number) => void;
}

export const VariableHistoryModal: React.FC<VariableHistoryModalProps> = ({
  variable,
  environmentName,
  onClose,
  onRollback,
}) => {
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(variable.currentVersion);
  const [showMaskedValues, setShowMaskedValues] = useState<boolean>(false);
  const [confirmRollbackVer, setConfirmRollbackVer] = useState<number | null>(null);

  // Sorted latest first
  const historyList = [...variable.history].sort((a, b) => b.version - a.version);

  const selectedEntry =
    variable.history.find((h) => h.version === selectedVersionNum) ||
    variable.history[variable.history.length - 1];

  const handleRollbackClick = (ver: number) => {
    if (confirmRollbackVer === ver) {
      onRollback(variable.id, ver);
      setConfirmRollbackVer(null);
      onClose();
    } else {
      setConfirmRollbackVer(ver);
    }
  };

  const renderValueDisplay = (val: string, isSecret: boolean) => {
    if (isSecret && !showMaskedValues) {
      return '••••••••••••••••••••••••';
    }
    return val;
  };

  return (
    <AnimatePresence>
      <div id="variable-history-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#E4E4E7]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#27272A] bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#E4E4E7]">
                    History: <span className="font-mono text-indigo-400">{variable.key}</span>
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
                    {environmentName}
                  </span>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Review complete revision audit trail, inspect diffs, and rollback to any previous state
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="toggle-reveal-history-secrets-btn"
                type="button"
                onClick={() => setShowMaskedValues(!showMaskedValues)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1C1F] hover:bg-[#27272A] text-xs font-medium text-[#A1A1AA] hover:text-white border border-[#27272A] transition"
              >
                {showMaskedValues ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-[#71717A]" />}
                {showMaskedValues ? 'Mask Secrets' : 'Reveal Secrets'}
              </button>

              <button
                id="close-history-modal-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-md hover:bg-[#1C1C1F] text-[#71717A] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Split View */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#27272A]">
            {/* Timeline Left Panel (5 Cols) */}
            <div className="md:col-span-5 p-6 overflow-y-auto max-h-[60vh] md:max-h-[68vh] space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#52525B]">
                Version Revisions ({historyList.length})
              </div>

              <div className="space-y-6">
                {historyList.map((entry) => {
                  const isCurrent = entry.version === variable.currentVersion;
                  const isSelected = entry.version === selectedVersionNum;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedVersionNum(entry.version)}
                      className={`relative pl-8 border-l-2 cursor-pointer transition ${
                        isCurrent
                          ? 'border-indigo-500/60'
                          : isSelected
                          ? 'border-[#3F3F46]'
                          : 'border-transparent'
                      }`}
                    >
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-[#121214] ${
                          isCurrent
                            ? 'bg-indigo-500'
                            : isSelected
                            ? 'bg-[#E4E4E7]'
                            : 'bg-[#27272A]'
                        }`}
                      />

                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-indigo-400' : 'text-[#E4E4E7]'
                            }`}
                          >
                            v.{entry.version}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                              Active
                            </span>
                          )}
                          {entry.changeType === 'rollback' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                              Rollback
                            </span>
                          )}
                        </div>

                        {!isCurrent && (
                          <button
                            id={`rollback-btn-v${entry.version}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollbackClick(entry.version);
                            }}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded transition ${
                              confirmRollbackVer === entry.version
                                ? 'bg-amber-600 text-white font-bold'
                                : 'text-indigo-400 hover:text-indigo-300 hover:underline'
                            }`}
                          >
                            {confirmRollbackVer === entry.version ? 'Confirm Rollback?' : 'Rollback to here'}
                          </button>
                        )}
                      </div>

                      <div className="bg-[#1C1C1F] p-2.5 rounded-md border border-[#27272A] text-xs font-mono mb-1 truncate text-[#A1A1AA]">
                        {renderValueDisplay(entry.value, entry.isSecret)}
                      </div>

                      <div className="text-[10px] text-[#71717A] flex items-center gap-2">
                        <span>{entry.reason}</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diff & Inspection Right Panel (7 Cols) */}
            <div className="md:col-span-7 p-6 overflow-y-auto max-h-[60vh] md:max-h-[68vh] bg-[#09090B] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#E4E4E7] flex items-center gap-2">
                      <FileDiff className="w-4 h-4 text-indigo-400" />
                      Inspecting Revision v.{selectedEntry?.version}
                    </h3>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      Committed on {new Date(selectedEntry?.timestamp || '').toLocaleString()} by {selectedEntry?.author}
                    </p>
                  </div>

                  {selectedEntry?.version !== variable.currentVersion && (
                    <button
                      id="inspect-rollback-action-btn"
                      type="button"
                      onClick={() => handleRollbackClick(selectedEntry.version)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {confirmRollbackVer === selectedEntry.version ? 'Confirm Rollback' : `Rollback to v.${selectedEntry.version}`}
                    </button>
                  )}
                </div>

                {/* Value Inspector */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#A1A1AA]">Revision Value:</div>
                  <div className="p-3.5 rounded-lg bg-[#121214] border border-[#27272A] font-mono text-xs text-[#E4E4E7] break-all select-all">
                    {renderValueDisplay(selectedEntry?.value || '', selectedEntry?.isSecret || false)}
                  </div>
                </div>

                {/* Diff against active current value */}
                {selectedEntry?.version !== variable.currentVersion && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-[#A1A1AA]">
                      Diff vs. Current Active Value (v.{variable.currentVersion}):
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300">
                        <span className="text-[10px] text-rose-500 uppercase font-bold block mb-1">
                          Current Active (v.{variable.currentVersion})
                        </span>
                        <div className="break-all">{renderValueDisplay(variable.value, variable.isSecret)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300">
                        <span className="text-[10px] text-emerald-500 uppercase font-bold block mb-1">
                          Selected Revision (v.{selectedEntry.version})
                        </span>
                        <div className="break-all">{renderValueDisplay(selectedEntry.value, selectedEntry.isSecret)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Audit note */}
              <div className="p-3.5 rounded-lg bg-[#121214] border border-[#27272A] text-xs text-[#71717A] flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Every change to <span className="font-mono text-indigo-400">{variable.key}</span> is hashed and recorded with zero destructive overwrites.
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs">
            <span className="text-[#71717A]">
              Revision ID: <code className="text-[#A1A1AA]">{selectedEntry?.id}</code>
            </span>
            <button
              id="close-history-footer-btn"
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
