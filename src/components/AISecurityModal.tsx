import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Plus,
  Boxes,
  Server,
  Globe,
  Shield,
  CreditCard,
  Database,
  Box,
  Layers,
} from 'lucide-react';
import { ConfigVariable, SecurityAuditResult, ProjectApp } from '../types/config';
import { auditSecurityWithAI, generateStackWithAI, getStackPresets } from '../api';
import { DEFAULT_APP_ID, AI_CONFIG } from '../constants';

interface AISecurityModalProps {
  environmentName: string;
  apps: ProjectApp[];
  variables: ConfigVariable[];
  initialAppId?: string;
  onClose: () => void;
  onApplyGeneratedVariables: (vars: Array<{ appId: string; key: string; value: string; isSecret: boolean; category: string; description: string }>) => void;
}

export const AISecurityModal: React.FC<AISecurityModalProps> = ({
  environmentName,
  apps,
  variables,
  initialAppId,
  onClose,
  onApplyGeneratedVariables,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'generator'>('audit');
  const [selectedAppId, setSelectedAppId] = useState<string>(
    initialAppId && initialAppId !== 'all' ? initialAppId : apps[0]?.id || DEFAULT_APP_ID
  );
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);

  const [stackPrompt, setStackPrompt] = useState<string>('Next.js 15, PostgreSQL, Redis, Stripe, and NextAuth');
  const [stackPresets, setStackPresets] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedVars, setGeneratedVars] = useState<any[] | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  useEffect(() => {
    getStackPresets().then(setStackPresets).catch(() => {});
  }, []);

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

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await auditSecurityWithAI(environmentName, variables);
      setAuditResult(result);
    } catch (err: any) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const generateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stackPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedVars(null);
    setAppliedSuccess(false);
    try {
      const vars = await generateStackWithAI(stackPrompt, environmentName);
      setGeneratedVars(vars || []);
    } catch (err: any) {
      console.error('Template gen failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedVars || generatedVars.length === 0) return;
    const formattedWithApp = generatedVars.map((v) => ({
      appId: selectedAppId,
      key: v.key,
      value: v.value,
      isSecret: v.isSecret ?? true,
      category: v.category || 'AI Generated',
      description: v.description || '',
    }));

    onApplyGeneratedVariables(formattedWithApp);
    setAppliedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Pre-load audit on mount if not yet run
  React.useEffect(() => {
    runAudit();
  }, []);

  const targetAppObj = apps.find((a) => a.id === selectedAppId) || apps[0];

  return (
    <AnimatePresence>
      <div id="ai-security-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                  AI Config Intelligence & Security Auditor
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1C1C1F] text-indigo-400 border border-[#27272A]">
                    {AI_CONFIG.MODEL_NAME}
                  </span>
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Automated vulnerability detection, key entropy validation, and stack generator
                </p>
              </div>
            </div>

            <button
              id="close-ai-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-[#1C1C1F] text-[#71717A] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#27272A] bg-[#09090B] px-6 gap-2 pt-2">
            <button
              id="ai-tab-audit"
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Security & Drift Audit
            </button>
            <button
              id="ai-tab-generator"
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'generator'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Stack Template Generator
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#121214]">
            {activeTab === 'audit' && (
              <div className="space-y-5">
                {isAuditing ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                    <div className="text-sm font-medium text-[#E4E4E7]">Analyzing configuration security posture...</div>
                    <div className="text-xs text-[#71717A]">
                      Evaluating {variables.length} environment parameters for leaks, entropy, and formatting
                    </div>
                  </div>
                ) : auditResult ? (
                  <>
                    {/* Security Score Banner */}
                    <div className="p-5 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs text-[#71717A]">Environment Security Rating</div>
                        <div className="text-2xl font-bold text-[#E4E4E7] flex items-center gap-2">
                          <span
                            className={
                              auditResult.securityScore >= 80
                                ? 'text-emerald-400'
                                : auditResult.securityScore >= 60
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {auditResult.securityScore}/100
                          </span>
                          <span className="text-xs font-normal text-[#71717A]">
                            ({environmentName} environment)
                          </span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] max-w-lg mt-1">{auditResult.summary}</p>
                      </div>

                      <button
                        id="re-audit-btn"
                        type="button"
                        onClick={runAudit}
                        className="px-3.5 py-2 bg-[#1C1C1F] hover:bg-[#27272A] text-xs font-medium text-[#E4E4E7] rounded-md border border-[#27272A] transition flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-audit
                      </button>
                    </div>

                    {/* Detected Issues List */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#52525B]">
                        Evaluated Findings ({auditResult.issues.length})
                      </div>

                      {auditResult.issues.length === 0 ? (
                        <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-white">All security checks passed!</div>
                            <div className="text-emerald-400/80 mt-0.5">
                              No exposed plaintext tokens, weak entropy secrets, or malformed connection strings were found.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {auditResult.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                                issue.severity === 'critical'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                  : issue.severity === 'warning'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                  : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs bg-[#1C1C1F] px-2 py-0.5 rounded border border-[#27272A] text-indigo-400">
                                    {issue.key}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded ${
                                      issue.severity === 'critical'
                                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                                    }`}
                                  >
                                    {issue.severity}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[#E4E4E7] font-medium">{issue.message}</div>
                              <div className="text-[11px] text-[#71717A] italic">
                                Recommendation: {issue.suggestion}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {activeTab === 'generator' && (
              <div className="space-y-6">
                <form onSubmit={generateStack} className="space-y-3">
                  <div className="text-xs font-bold text-[#E4E4E7] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Stack Environment Generator
                  </div>
                  <p className="text-xs text-[#71717A]">
                    Describe your tech stack, third-party services, and deployment target to generate a full production-ready config schema with sensible placeholders.
                  </p>

                  {/* Target Application Selection */}
                  <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Target Application / Service</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {apps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedAppId(app.id)}
                          className={`p-2 rounded-lg border text-left transition flex items-center gap-2 ${
                            selectedAppId === app.id
                              ? 'bg-[#1C1C1F] border-indigo-500 text-white font-semibold'
                              : 'bg-[#121214] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                          }`}
                        >
                          <span className={selectedAppId === app.id ? 'text-indigo-400' : 'text-[#71717A]'}>
                            {getAppIcon(app.icon)}
                          </span>
                          <span className="text-xs truncate">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="stack-description-input"
                      type="text"
                      value={stackPrompt}
                      onChange={(e) => setStackPrompt(e.target.value)}
                      placeholder="e.g. Next.js 15, Supabase, Stripe, OpenAI, Resend, Sentry"
                      className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <div className="flex flex-wrap gap-2">
                      {(stackPresets.length > 0
                        ? stackPresets
                        : ['Next.js + Prisma', 'Django + Redis + Celery', 'Go Microservice + Kafka', 'Stripe + Supabase Auth']
                      ).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStackPrompt(preset)}
                          className="px-2.5 py-1 rounded bg-[#1C1C1F] hover:bg-[#27272A] text-[11px] text-[#A1A1AA] border border-[#27272A] transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    id="generate-stack-btn"
                    type="submit"
                    disabled={isGenerating || !stackPrompt.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate Environment Config Template
                  </button>
                </form>

                {/* Generated preview */}
                {generatedVars && generatedVars.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#52525B]">
                        Generated Configuration ({generatedVars.length} variables for {targetAppObj?.name})
                      </div>
                      <button
                        id="apply-generated-vars-btn"
                        type="button"
                        onClick={handleApply}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Apply to {targetAppObj?.name} in {environmentName}
                      </button>
                    </div>

                    {appliedSuccess && (
                      <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Added generated variables into {targetAppObj?.name} in {environmentName}!
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A] space-y-2 max-h-60 overflow-y-auto">
                      {generatedVars.map((v, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-[#121214] border border-[#27272A] text-xs flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-mono font-semibold text-indigo-400">{v.key}</div>
                            <div className="text-[11px] text-[#71717A]">{v.description || v.category}</div>
                          </div>
                          <div className="text-[#A1A1AA] font-mono text-[11px] max-w-[200px] truncate">
                            {v.isSecret ? '••••••••' : v.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs text-[#71717A]">
            <span>Audit engine uses zero-retention ephemeral inference</span>
            <button
              id="close-ai-footer-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-white font-medium transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


