import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCode,
  Download,
  Upload,
  Copy,
  Check,
  X,
  Boxes,
  Server,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Box,
  Layers,
} from 'lucide-react';
import { ConfigVariable, ProjectApp } from '../types/config';
import {
  DEFAULT_APP_ID,
  ALL_FILTER_VALUE,
  UI_TIMINGS,
  EXPORT_FORMAT_OPTIONS,
  COLLISION_STRATEGIES,
} from '../constants';

interface ImportExportModalProps {
  environmentName: string;
  apps: ProjectApp[];
  variables: ConfigVariable[];
  initialAppId?: string;
  onClose: () => void;
  onImportVariables: (
    imported: Array<{ appId: string; key: string; value: string; isSecret: boolean; category?: string; description?: string }>,
    strategy: 'overwrite' | 'merge'
  ) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  environmentName,
  apps,
  variables,
  initialAppId,
  onClose,
  onImportVariables,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [filterAppId, setFilterAppId] = useState<string>(initialAppId || ALL_FILTER_VALUE);
  const [importTargetAppId, setImportTargetAppId] = useState<string>(
    initialAppId && initialAppId !== ALL_FILTER_VALUE ? initialAppId : apps[0]?.id || DEFAULT_APP_ID
  );
  const [exportFormat, setExportFormat] = useState<
    'dotenv' | 'dotenv_example' | 'json' | 'k8s_secret' | 'docker_compose' | 'shell_export'
  >('dotenv');

  const [importRawText, setImportRawText] = useState<string>('');
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [copied, setCopied] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  // Filter variables if an app is selected
  const activeVars = filterAppId === 'all' ? variables : variables.filter((v) => v.appId === filterAppId);

  // Generate exported content based on format
  const generateExportText = () => {
    switch (exportFormat) {
      case 'dotenv':
        return activeVars
          .map((v) => {
            const app = apps.find((a) => a.id === v.appId);
            const appTag = app ? ` [App: ${app.name}]` : '';
            return `# ${v.description || v.category || 'Config'}${appTag}\n${v.key}=${v.value}`;
          })
          .join('\n\n');

      case 'dotenv_example':
        return activeVars
          .map((v) => {
            const valPlaceholder = v.isSecret ? `<YOUR_${v.key}_HERE>` : v.value;
            const app = apps.find((a) => a.id === v.appId);
            const appTag = app ? ` [App: ${app.name}]` : '';
            return `# ${v.description || v.category || 'Config'}${appTag}${v.isSecret ? ' (Secret required)' : ''}\n${v.key}=${valPlaceholder}`;
          })
          .join('\n\n');

      case 'json':
        const obj: Record<string, any> = {};
        activeVars.forEach((v) => {
          obj[v.key] = v.value;
        });
        return JSON.stringify(obj, null, 2);

      case 'k8s_secret':
        const b64Data = activeVars
          .map((v) => `  ${v.key}: ${btoa(unescape(encodeURIComponent(v.value)))}`)
          .join('\n');
        return `apiVersion: v1
kind: Secret
metadata:
  name: ${environmentName.toLowerCase()}-config-secrets
type: Opaque
data:
${b64Data}`;

      case 'docker_compose':
        const dockerLines = activeVars.map((v) => `      - ${v.key}=${v.value}`).join('\n');
        return `version: '3.8'
services:
  app:
    image: myapp:latest
    environment:
${dockerLines}`;

      case 'shell_export':
        return activeVars.map((v) => `export ${v.key}="${v.value.replace(/"/g, '\\"')}"`).join('\n');

      default:
        return '';
    }
  };

  const exportContent = generateExportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const filenameMap = {
      dotenv: `.env.${environmentName.toLowerCase()}`,
      dotenv_example: `.env.example`,
      json: `config.${environmentName.toLowerCase()}.json`,
      k8s_secret: `secret-${environmentName.toLowerCase()}.yaml`,
      docker_compose: `docker-compose.env.yml`,
      shell_export: `export-${environmentName.toLowerCase()}.sh`,
    };
    const filename = filenameMap[exportFormat] || 'config.env';
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importRawText.trim()) return;

    try {
      const parsedList: Array<{ appId: string; key: string; value: string; isSecret: boolean; category: string; description: string }> = [];

      // Check if JSON
      if (importRawText.trim().startsWith('{')) {
        const jsonParsed = JSON.parse(importRawText);
        Object.entries(jsonParsed).forEach(([k, v]) => {
          const valStr = String(v);
          const isSec = k.toUpperCase().includes('SECRET') || k.toUpperCase().includes('PASSWORD') || k.toUpperCase().includes('KEY') || k.toUpperCase().includes('TOKEN');
          parsedList.push({
            appId: importTargetAppId,
            key: k.trim(),
            value: valStr,
            isSecret: isSec,
            category: 'Imported',
            description: 'Imported from JSON configuration',
          });
        });
      } else {
        // Line-by-line dotenv parser
        const lines = importRawText.split('\n');
        let currentComment = '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('#')) {
            currentComment = trimmed.replace(/^#\s*/, '');
            continue;
          }

          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const rawKey = trimmed.substring(0, eqIdx).replace(/^export\s+/, '').trim();
            let rawVal = trimmed.substring(eqIdx + 1).trim();

            if (
              (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
              (rawVal.startsWith("'") && rawVal.endsWith("'"))
            ) {
              rawVal = rawVal.substring(1, rawVal.length - 1);
            }

            const isSec =
              rawKey.toUpperCase().includes('SECRET') ||
              rawKey.toUpperCase().includes('PASSWORD') ||
              rawKey.toUpperCase().includes('KEY') ||
              rawKey.toUpperCase().includes('TOKEN') ||
              rawKey.toUpperCase().includes('AUTH');

            parsedList.push({
              appId: importTargetAppId,
              key: rawKey,
              value: rawVal,
              isSecret: isSec,
              category: 'Imported',
              description: currentComment || 'Imported from .env',
            });
            currentComment = '';
          }
        }
      }

      if (parsedList.length === 0) {
        setImportStatus('No valid KEY=VALUE pairs found to import.');
        return;
      }

      onImportVariables(parsedList, importStrategy);
      setImportStatus(`Successfully imported ${parsedList.length} variables into ${environmentName}!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportStatus(`Parse error: ${err.message}`);
    }
  };

  return (
    <AnimatePresence>
      <div id="import-export-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#E4E4E7] flex items-center gap-2">
                  Import & Export Engine
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
                    {environmentName}
                  </span>
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Transfer configs via .env, sanitized .env.example, Kubernetes Secrets, Docker Compose, or JSON
                </p>
              </div>
            </div>

            <button
              id="close-import-modal-btn"
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
              id="tab-export-config"
              type="button"
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'export'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Export Formats ({activeVars.length} vars)
            </button>
            <button
              id="tab-import-config"
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-md transition border-b-2 flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'border-indigo-500 text-indigo-400 bg-[#121214]'
                  : 'border-transparent text-[#71717A] hover:text-[#E4E4E7]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Bulk Import
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#121214]">
            {activeTab === 'export' && (
              <div className="space-y-4">
                {/* Application Filter for Export */}
                <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Application Scope for Export</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterAppId('all')}
                      className={`px-2.5 py-1 text-xs rounded-md border transition ${
                        filterAppId === 'all'
                          ? 'bg-[#1C1C1F] text-indigo-400 border-indigo-500/70 font-semibold'
                          : 'bg-[#121214] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                      }`}
                    >
                      All Applications ({variables.length})
                    </button>
                    {apps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setFilterAppId(app.id)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition flex items-center gap-1.5 ${
                          filterAppId === app.id
                            ? 'bg-[#1C1C1F] text-indigo-400 border-indigo-500/70 font-semibold'
                            : 'bg-[#121214] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                        }`}
                      >
                        {getAppIcon(app.icon)}
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format selector buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'dotenv', label: '.env File', desc: 'Standard key=value' },
                    { id: 'dotenv_example', label: '.env.example', desc: 'Sanitized public template' },
                    { id: 'json', label: 'JSON Object', desc: 'Application payload' },
                    { id: 'k8s_secret', label: 'Kubernetes Secret', desc: 'Base64 encoded YAML' },
                    { id: 'docker_compose', label: 'Docker Compose', desc: 'Environment block' },
                    { id: 'shell_export', label: 'Shell Exports', desc: 'export KEY="val"' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id as any)}
                      className={`p-3 rounded-lg border text-left transition ${
                        exportFormat === fmt.id
                          ? 'bg-[#1C1C1F] border-indigo-500 text-white'
                          : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#E4E4E7]">{fmt.label}</div>
                      <div className="text-[10px] text-[#71717A] truncate">{fmt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Preview code block */}
                <div className="relative rounded-lg bg-[#09090B] border border-[#27272A] overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between">
                    <span className="text-[11px] text-[#71717A] font-sans">
                      Export Preview ({exportFormat})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        id="copy-export-content-btn"
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1 bg-[#1C1C1F] hover:bg-[#27272A] text-[#E4E4E7] text-xs rounded-md flex items-center gap-1.5 transition border border-[#27272A]"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        id="download-export-file-btn"
                        type="button"
                        onClick={handleDownload}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md flex items-center gap-1.5 transition shadow-sm font-medium"
                      >
                        <Download className="w-3.5 h-3.5" /> Download File
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 max-h-64 overflow-y-auto text-[#E4E4E7]">
                    {exportContent}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <form onSubmit={handleImportSubmit} className="space-y-4">
                {/* Target Application Selection */}
                <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Assign Imported Variables To Application</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {apps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setImportTargetAppId(app.id)}
                        className={`p-2 rounded-lg border text-left transition flex items-center gap-2 ${
                          importTargetAppId === app.id
                            ? 'bg-[#1C1C1F] border-indigo-500 text-white font-semibold'
                            : 'bg-[#121214] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                      >
                        <span className={importTargetAppId === app.id ? 'text-indigo-400' : 'text-[#71717A]'}>
                          {getAppIcon(app.icon)}
                        </span>
                        <span className="text-xs truncate">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A1A1AA] block">
                    Paste .env or JSON contents
                  </label>
                  <textarea
                    id="import-raw-text-textarea"
                    rows={7}
                    required
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    placeholder={`# Paste .env variables here\nDATABASE_URL=postgresql://...\nAPI_KEY=sk_...\n\n# Or JSON\n{\n  "PORT": "3000"\n}`}
                    className="w-full p-3 font-mono text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#E4E4E7] focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090B] border border-[#27272A] text-xs">
                  <div>
                    <span className="font-medium text-[#E4E4E7] block">Collision Strategy</span>
                    <span className="text-[11px] text-[#71717A]">Handle variables that already exist in {environmentName}</span>
                  </div>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#A1A1AA]">
                      <input
                        type="radio"
                        name="strategy"
                        value="merge"
                        checked={importStrategy === 'merge'}
                        onChange={() => setImportStrategy('merge')}
                        className="text-indigo-600 bg-[#1C1C1F] border-[#27272A]"
                      />
                      <span>Merge & Update</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#A1A1AA]">
                      <input
                        type="radio"
                        name="strategy"
                        value="overwrite"
                        checked={importStrategy === 'overwrite'}
                        onChange={() => setImportStrategy('overwrite')}
                        className="text-indigo-600 bg-[#1C1C1F] border-[#27272A]"
                      />
                      <span>Wipe & Replace</span>
                    </label>
                  </div>
                </div>

                {importStatus && (
                  <div className="p-3 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>{importStatus}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    id="cancel-import-btn"
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded-md text-xs transition border border-[#27272A]"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-import-btn"
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition shadow-sm flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Parse & Import Variables
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between text-xs text-[#71717A]">
            <span>Automatic comment preservation and format validation</span>
            <button
              id="close-import-footer-btn"
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

