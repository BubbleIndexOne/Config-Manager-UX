import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudUpload,
  RotateCcw,
  CheckCircle2,
  X,
  Shield,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { CloudSnapshot, Environment, ConfigVariable } from '../types/config';
import { UI_TIMINGS } from '../constants';

interface CloudSyncModalProps {
  snapshots: CloudSnapshot[];
  environments: Environment[];
  variablesByEnv: Record<string, ConfigVariable[]>;
  onClose: () => void;
  onCreateSnapshot: (label: string) => Promise<void>;
  onRestoreSnapshot: (snapshotId: string) => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  snapshots,
  environments,
  variablesByEnv,
  onClose,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  const [snapshotLabel, setSnapshotLabel] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalVarsCount = (Object.values(variablesByEnv) as ConfigVariable[][]).reduce(
    (acc: number, list: ConfigVariable[]) => acc + (list?.length || 0),
    0
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    setIsCreating(true);
    setStatusMessage(null);
    try {
      await onCreateSnapshot(snapshotLabel);
      setStatusMessage({
        type: 'success',
        text: `Cloud checkpoint "${snapshotLabel}" captured and synchronized safely.`,
      });
      setSnapshotLabel('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create cloud snapshot.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (snap: CloudSnapshot) => {
    if (
      !window.confirm(
        `Are you sure you want to restore the entire cloud snapshot "${snap.label}"? This will rollback all environments to this exact point in time.`
      )
    ) {
      return;
    }
    setRestoringId(snap.id);
    setStatusMessage(null);
    try {
      await onRestoreSnapshot(snap.id);
      setStatusMessage({
        type: 'success',
        text: `Successfully restored snapshot "${snap.label}" across all environments!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Restore failed.' });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <AnimatePresence>
      <div id="cloud-sync-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                  Cloud State & Multi-Env Backup Checkpoints
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Global cluster snapshots with full multi-environment rollback capabilities
                </p>
              </div>
            </div>

            <button
              id="close-cloud-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-[#1C1C1F] text-[#71717A] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#121214]">
            {/* Live Status Bar */}
            <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E4E4E7]">Cloud Sync Daemon Active</div>
                  <div className="text-[11px] text-[#71717A]">
                    Managing {environments.length} environments • {totalVarsCount} total parameters
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                Encrypted & Synced
              </div>
            </div>

            {/* Create Snapshot Form */}
            <form onSubmit={handleCreate} className="p-5 rounded-xl bg-[#09090B] border border-[#27272A] space-y-3">
              <div className="text-xs font-bold text-[#E4E4E7] flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-indigo-400" />
                Create Named Cloud Checkpoint
              </div>
              <p className="text-xs text-[#71717A]">
                Take an atomic snapshot across all environments before performing major release deployments or key rotations.
              </p>

              <div className="flex gap-2">
                <input
                  id="snapshot-label-input"
                  type="text"
                  required
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="e.g. Pre-v3.0 Production Release / Q3 Database Migration"
                  className="flex-1 px-3 py-2 text-xs bg-[#1C1C1F] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
                <button
                  id="create-snapshot-btn"
                  type="submit"
                  disabled={isCreating || !snapshotLabel.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition flex items-center gap-2 shadow-sm"
                >
                  {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Checkpoint
                </button>
              </div>
            </form>

            {/* Feedback notification */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </motion.div>
            )}

            {/* Snapshot List */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] flex items-center justify-between">
                <span>Saved Cloud Snapshots ({snapshots.length})</span>
                <span className="text-[11px] font-normal text-[#71717A]">1-click full restore</span>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center bg-[#09090B] border border-[#27272A] rounded-xl text-[#71717A] text-xs">
                  No snapshots captured yet. Create one above to establish your first baseline checkpoint.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#3F3F46] transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[#E4E4E7] flex items-center gap-2">
                          <span>{snap.label}</span>
                          <span className="text-[10px] text-indigo-400 bg-[#1C1C1F] px-1.5 py-0.5 rounded border border-[#27272A] font-mono">
                            {snap.id.substring(0, 12)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#71717A] flex items-center gap-3">
                          <span>{new Date(snap.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>By: {snap.author}</span>
                          <span>•</span>
                          <span>
                            {snap.environmentCount} envs ({snap.variableCount} vars)
                          </span>
                        </div>
                      </div>

                      <button
                        id={`restore-snapshot-${snap.id}`}
                        type="button"
                        disabled={restoringId === snap.id}
                        onClick={() => handleRestore(snap)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#27272A] disabled:opacity-50 text-amber-400 rounded-md text-xs font-medium border border-[#27272A] transition"
                      >
                        {restoringId === snap.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore State
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Automated checksum validation ensures zero data loss during snapshot rollbacks
            </span>
            <button
              id="close-cloud-footer-btn"
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
