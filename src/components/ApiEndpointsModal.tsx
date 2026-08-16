import React, { useState } from 'react';
import {
  X,
  Code2,
  Play,
  Copy,
  Check,
  Server,
  Layers,
  FileCode,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Environment, ProjectApp } from '../types/config';

interface ApiEndpointsModalProps {
  isOpen: boolean;
  environments: Environment[];
  apps: ProjectApp[];
  onClose: () => void;
}

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  category: 'Configuration' | 'Environments' | 'Apps' | 'Variables' | 'Git Sync' | 'Cloud Snapshots' | 'System';
  summary: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: any;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'get-config',
    method: 'GET',
    path: '/api/config',
    category: 'Configuration',
    summary: 'Full Configuration Bundle',
    description: 'Retrieves all environments, applications, scoped variables, Git config, and snapshot backups in a single payload.',
  },
  {
    id: 'get-environments',
    method: 'GET',
    path: '/api/environments',
    category: 'Environments',
    summary: 'List Environments',
    description: 'Returns all deployment environments (Development, Staging, QA, Production, Preview).',
  },
  {
    id: 'post-environments',
    method: 'POST',
    path: '/api/environments',
    category: 'Environments',
    summary: 'Create Environment',
    description: 'Provisions a new deployment environment and initializes its isolated variable store.',
    defaultBody: {
      name: 'Sandbox UAT',
      description: 'User acceptance testing sandbox',
      color: 'amber',
    },
  },
  {
    id: 'get-apps',
    method: 'GET',
    path: '/api/apps',
    category: 'Apps',
    summary: 'List Scoped Applications',
    description: 'Fetches microservices and client apps configured for variable scoping.',
  },
  {
    id: 'post-apps',
    method: 'POST',
    path: '/api/apps',
    category: 'Apps',
    summary: 'Register New Application',
    description: 'Registers a new microservice or frontend app in the workspace.',
    defaultBody: {
      name: 'Payment Webhook Service',
      slug: 'payment-webhook',
      description: 'Processes incoming Stripe & billing events',
      icon: 'Server',
      color: 'emerald',
    },
  },
  {
    id: 'get-variables-all',
    method: 'GET',
    path: '/api/variables',
    category: 'Variables',
    summary: 'Get All Variables by Environment',
    description: 'Returns dictionary of all environment variables mapped by environment ID.',
  },
  {
    id: 'get-variables-env',
    method: 'GET',
    path: '/api/variables/{envId}',
    category: 'Variables',
    summary: 'Get Variables for Environment',
    description: 'Retrieves active key-value variables, categories, masking state, and version histories for a target environment.',
    defaultParams: {
      envId: 'env_dev',
    },
  },
  {
    id: 'post-variables',
    method: 'POST',
    path: '/api/variables',
    category: 'Variables',
    summary: 'Create / Update Variable with Audit',
    description: 'Saves or updates an environment variable, automatically bumping version and recording change audit logs.',
    defaultBody: {
      envId: 'env_dev',
      variable: {
        appId: 'app_core_api',
        key: 'REDIS_CONNECTION_TIMEOUT',
        value: '5000',
        isSecret: false,
        category: 'Database',
        description: 'Redis client connection timeout in milliseconds',
      },
      changeReason: 'Adjusted connection timeout for network spike tolerance',
      author: 'anshuman.singh@dev.local',
    },
  },
  {
    id: 'post-rollback',
    method: 'POST',
    path: '/api/variables/rollback',
    category: 'Variables',
    summary: 'Rollback Variable Revision',
    description: 'Rolls back a variable to a previous audited version state without deleting history.',
    defaultBody: {
      envId: 'env_dev',
      variableId: 'var_dev_db_01',
      targetVersion: 1,
      reason: 'Reverted to initial stable connection string',
    },
  },
  {
    id: 'post-git-sync',
    method: 'POST',
    path: '/api/git/sync',
    category: 'Git Sync',
    summary: 'Execute Git Secret Sync',
    description: 'Pushes environment variables to GitHub or Bitbucket repository secrets or committed .env files.',
    defaultBody: {
      provider: 'github',
      repoOwner: 'anshuman-singh',
      repoName: 'infra-cloud-secrets',
      branch: 'main',
      envCode: 'development',
      action: 'push',
      syncTarget: 'repo_secrets',
      variables: [
        { key: 'PORT', value: '3000', isSecret: false },
        { key: 'NODE_ENV', value: 'development', isSecret: false },
      ],
    },
  },
  {
    id: 'post-cloud-snapshot',
    method: 'POST',
    path: '/api/cloud/snapshot',
    category: 'Cloud Snapshots',
    summary: 'Create Cloud Snapshot Checkpoint',
    description: 'Takes an immutable point-in-time snapshot backup of the complete environment state.',
    defaultBody: {
      label: 'Manual Backup Baseline',
      author: 'anshuman.singh@dev.local',
    },
  },
  {
    id: 'get-cloud-snapshots',
    method: 'GET',
    path: '/api/cloud/snapshots',
    category: 'Cloud Snapshots',
    summary: 'List Cloud Snapshots',
    description: 'Retrieves all point-in-time snapshot backup records.',
  },
  {
    id: 'get-health',
    method: 'GET',
    path: '/api/health',
    category: 'System',
    summary: 'System Health Check',
    description: 'Returns operational health status and server timestamp.',
  },
];

export const ApiEndpointsModal: React.FC<ApiEndpointsModalProps> = ({
  isOpen,
  environments,
  apps,
  onClose,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [paramEnvId, setParamEnvId] = useState<string>(environments[0]?.id || 'env_dev');
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].defaultBody || {}, null, 2)
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Configuration', 'Environments', 'Apps', 'Variables', 'Git Sync', 'Cloud Snapshots', 'System'];

  const filteredEndpoints = ENDPOINTS.filter(
    (e) => activeCategory === 'All' || e.category === activeCategory
  );

  const getResolvedPath = (endpoint: EndpointDef) => {
    let p = endpoint.path;
    if (p.includes('{envId}')) {
      p = p.replace('{envId}', paramEnvId);
    }
    return p;
  };

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setResponseStatus(null);
    setResponseTime(null);
    setResponseData(null);
    if (ep.defaultBody) {
      setRequestBodyText(JSON.stringify(ep.defaultBody, null, 2));
    } else {
      setRequestBodyText('');
    }
  };

  const handleExecuteRequest = async () => {
    setIsExecuting(true);
    const startTime = performance.now();
    const url = getResolvedPath(selectedEndpoint);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT'].includes(selectedEndpoint.method) && requestBodyText.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(requestBodyText));
        } catch {
          options.body = requestBodyText;
        }
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(json);
      } else {
        const txt = await res.text();
        setResponseData({ raw: txt });
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const generateCurl = () => {
    const url = `${window.location.origin}${getResolvedPath(selectedEndpoint)}`;
    if (selectedEndpoint.method === 'GET') {
      return `curl -X GET "${url}" \\
  -H "Accept: application/json"`;
    }
    return `curl -X ${selectedEndpoint.method} "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBodyText.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div
      id="api-endpoints-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#121214] border border-[#27272A] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#E4E4E7]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#FAFAFA]">REST API Explorer & Endpoints</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OpenAPI 3.1 Live
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Interact directly with backend endpoints for environments, apps, variables, and cloud sync.
              </p>
            </div>
          </div>
          <button
            id="close-api-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-2 border-b border-[#27272A] bg-[#141416] flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap font-medium ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C1F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modal Body: Left Endpoint List + Right Interactive Tester */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Endpoint Selector Sidebar */}
          <div className="md:col-span-5 border-r border-[#27272A] bg-[#0E0E10] overflow-y-auto max-h-[460px] p-3 space-y-1.5">
            {filteredEndpoints.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              const methodColor =
                ep.method === 'GET'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : ep.method === 'POST'
                  ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-lg border transition flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-[#1C1C1F] border-indigo-500/50 shadow-sm'
                      : 'bg-[#141416] border-[#27272A]/70 hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 ${methodColor}`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs text-[#E4E4E7] truncate">{ep.path}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] truncate">{ep.summary}</div>
                </button>
              );
            })}
          </div>

          {/* Request & Response Workbench */}
          <div className="md:col-span-7 p-5 overflow-y-auto max-h-[460px] flex flex-col gap-4 bg-[#121214]">
            {/* Active Endpoint Banner */}
            <div className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${
                      selectedEndpoint.method === 'GET'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : selectedEndpoint.method === 'POST'
                        ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-xs text-white font-semibold">
                    {getResolvedPath(selectedEndpoint)}
                  </span>
                </div>
                <button
                  id="execute-api-req-btn"
                  type="button"
                  onClick={handleExecuteRequest}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-sm"
                >
                  <Play className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
              <p className="text-xs text-[#A1A1AA]">{selectedEndpoint.description}</p>
            </div>

            {/* Path Parameters if applicable */}
            {selectedEndpoint.path.includes('{envId}') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Path Parameter: {'{envId}'}</label>
                <select
                  value={paramEnvId}
                  onChange={(e) => setParamEnvId(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Request Body Editor for POST/PUT */}
            {['POST', 'PUT'].includes(selectedEndpoint.method) && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#A1A1AA]">Request Payload (JSON)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setRequestBodyText(JSON.stringify(selectedEndpoint.defaultBody || {}, null, 2))
                    }
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Reset Template
                  </button>
                </div>
                <textarea
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  rows={6}
                  className="w-full bg-[#0E0E10] font-mono text-xs text-[#E4E4E7] border border-[#27272A] rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Live Response Panel */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#A1A1AA]">Live Response</span>
                  {responseStatus !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {responseStatus} {responseStatus === 200 ? 'OK' : ''}
                    </span>
                  )}
                  {responseTime !== null && (
                    <span className="text-[10px] text-[#71717A] font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {responseTime}ms
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-white transition"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied cURL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3 min-h-[120px] max-h-[220px] overflow-auto font-mono text-xs">
                {responseData ? (
                  <pre className="text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-[#52525B] gap-1">
                    <Server className="w-5 h-5 opacity-40" />
                    <span>Click "Send Request" to test this endpoint live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#27272A] bg-[#141416] flex items-center justify-between text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Express Dev Server on port 3000</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
