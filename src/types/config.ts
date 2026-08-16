export type EnvironmentCode = 'development' | 'staging' | 'qa' | 'production' | 'preview';

export interface Environment {
  id: string;
  name: string;
  code: EnvironmentCode;
  color: string; // e.g. 'emerald', 'amber', 'purple', 'rose', 'blue'
  description: string;
  isLocked?: boolean;
  cloudSyncEnabled: boolean;
  lastSyncedAt?: string;
}

export interface ProjectApp {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // 'Globe' | 'Server' | 'Shield' | 'CreditCard' | 'Cpu' | 'Database'
  color?: string;
  createdAt?: string;
}

export type ChangeType =
  | 'create'
  | 'update_value'
  | 'toggle_secret'
  | 'rename'
  | 'rollback'
  | 'imported'
  | 'git_sync';

export interface VariableHistoryEntry {
  id: string;
  version: number;
  value: string;
  isSecret: boolean;
  timestamp: string;
  author: string;
  changeType: ChangeType;
  reason?: string;
  previousValue?: string;
  category?: string;
}

export interface ConfigVariable {
  id: string;
  appId: string; // Project / Application identifier (env > app)
  key: string;
  value: string;
  isSecret: boolean;
  category: string;
  description?: string;
  updatedAt: string;
  updatedBy: string;
  currentVersion: number;
  history: VariableHistoryEntry[];
}

export type GitProvider = 'github' | 'bitbucket';

export type GitSyncTarget = 'env_file' | 'repo_secrets' | 'actions_vars' | 'deployment_env';

export interface GitIntegrationConfig {
  provider: GitProvider;
  connected: boolean;
  accountName: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  token?: string;
  syncTarget: GitSyncTarget;
  targetFileName?: string; // e.g. .env.production
  autoSyncOnSave?: boolean;
  autoSyncOnCommit?: boolean;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage?: string;
  lastSyncTime?: string;
  lastCommitSha?: string;
}

export interface CloudSnapshot {
  id: string;
  timestamp: string;
  label: string;
  environmentCount: number;
  variableCount: number;
  author: string;
  data: {
    environments: Environment[];
    apps?: ProjectApp[];
    variablesByEnv: Record<string, ConfigVariable[]>;
  };
}

export interface SecurityIssue {
  key: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export interface SecurityAuditResult {
  securityScore: number;
  summary: string;
  issues: SecurityIssue[];
  analyzedAt: string;
  modelUsed?: string;
}

export interface GitSyncLog {
  id: string;
  timestamp: string;
  provider: GitProvider;
  repo: string;
  branch: string;
  environment: string;
  action: 'push' | 'pull' | 'webhook_sync';
  status: 'success' | 'failed';
  variablesCount: number;
  commitSha?: string;
  message: string;
  author: string;
}
