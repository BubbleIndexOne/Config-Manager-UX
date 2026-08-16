import {
  Server,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Box,
  Layers,
} from 'lucide-react';

/**
 * Storage keys used across local storage and cache layers
 */
export const STORAGE_KEYS = {
  ENVIRONMENTS: 'cloudenv_environments_v3',
  APPS: 'cloudenv_apps_v3',
  VARIABLES: 'cloudenv_variables_v3',
  GIT_CONFIG: 'cloudenv_git_config_v3',
  GIT_SYNC_LOGS: 'cloudenv_git_logs_v3',
  SNAPSHOTS: 'cloudenv_cloud_snapshots_v3',
} as const;

/**
 * Default entity IDs and filter literals
 */
export const DEFAULT_ENV_ID = 'env_dev';
export const DEFAULT_APP_ID = 'app_core_api';
export const ALL_FILTER_VALUE = 'all';

/**
 * Default author strings for audit logs and history entries
 */
export const DEFAULT_AUTHOR = 'anshuman.singh@dev.local';
export const IMPORT_DAEMON_AUTHOR = 'import.daemon@cloudenv.io';
export const DEVOPS_AUTHOR = 'devops.ci@pipeline.com';
export const SECURITY_AUTHOR = 'sarah.connor@sec.io';

/**
 * Standard configuration categories
 */
export const COMMON_CATEGORIES = [
  'General',
  'Database',
  'Auth & Security',
  'Payments',
  'Network',
  'Observability',
  'Storage & CDN',
  'AI / ML Models',
  'Messaging & SMS',
  'Feature Flags',
] as const;

/**
 * Visual styling classes mapped to configuration category names
 */
export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  database: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'auth & security': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  auth: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  payments: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  network: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  observability: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'storage & cdn': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'ai / ml models': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  'ai generated': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  default: 'bg-[#1C1C1F] text-[#A1A1AA] border-[#27272A]',
};

/**
 * Environment status dot indicator colors
 */
export const ENV_CODE_DOT_COLORS: Record<string, string> = {
  production: 'bg-rose-500',
  staging: 'bg-amber-500',
  qa: 'bg-purple-500',
  preview: 'bg-cyan-500',
  development: 'bg-emerald-500',
  default: 'bg-emerald-500',
};

/**
 * Available service and application icons
 */
export const AVAILABLE_APP_ICONS = [
  { name: 'Server', label: 'Backend / API', icon: Server },
  { name: 'Globe', label: 'Web / Frontend', icon: Globe },
  { name: 'Shield', label: 'Auth / Security', icon: Shield },
  { name: 'CreditCard', label: 'Billing / Payments', icon: CreditCard },
  { name: 'Cpu', label: 'Worker / Engine', icon: Cpu },
  { name: 'Database', label: 'Database / Cache', icon: Database },
  { name: 'Box', label: 'Service / Microservice', icon: Box },
  { name: 'Layers', label: 'Shared / Core', icon: Layers },
] as const;

/**
 * Available color themes for applications and badges
 */
export const APP_COLOR_OPTIONS = [
  { name: 'indigo', label: 'Indigo', borderClass: 'border-indigo-500', textClass: 'text-indigo-400' },
  { name: 'cyan', label: 'Cyan', borderClass: 'border-cyan-500', textClass: 'text-cyan-400' },
  { name: 'purple', label: 'Purple', borderClass: 'border-purple-500', textClass: 'text-purple-400' },
  { name: 'emerald', label: 'Emerald', borderClass: 'border-emerald-500', textClass: 'text-emerald-400' },
  { name: 'amber', label: 'Amber', borderClass: 'border-amber-500', textClass: 'text-amber-400' },
  { name: 'rose', label: 'Rose', borderClass: 'border-rose-500', textClass: 'text-rose-400' },
] as const;

/**
 * Export and Import supported formats
 */
export const EXPORT_FORMAT_OPTIONS = [
  { id: 'dotenv', label: '.env File (Dotenv)', extension: '.env', mime: 'text/plain' },
  { id: 'json', label: 'JSON Key-Value Payload', extension: '.json', mime: 'application/json' },
  { id: 'yaml', label: 'Kubernetes ConfigMap / YAML', extension: '.yaml', mime: 'text/yaml' },
  { id: 'docker', label: 'Docker Compose Environment Format', extension: '.docker.env', mime: 'text/plain' },
  { id: 'shell', label: 'Bash / Zsh Export Script', extension: '.sh', mime: 'text/x-sh' },
] as const;

/**
 * Variable import collision resolution options
 */
export const COLLISION_STRATEGIES = [
  { id: 'overwrite', label: 'Overwrite Existing Keys', desc: 'Replace conflicting variables with imported values' },
  { id: 'merge', label: 'Skip Existing (Safe Merge)', desc: 'Keep existing values and only add new parameters' },
] as const;

/**
 * Git integration providers and sync targets
 */
export const GIT_PROVIDERS = [
  { id: 'github', label: 'GitHub Actions & Secrets' },
  { id: 'bitbucket', label: 'Bitbucket Pipelines' },
] as const;

export const GIT_SYNC_TARGETS = [
  { id: 'repo_env', label: 'Git Repository .env.<environment> file' },
  { id: 'branch_dotenv', label: 'Branch root .env standard file' },
  { id: 'repo_secrets', label: 'Encrypted Repository Actions Secrets' },
] as const;

/**
 * Security audit & template generator configuration
 */
export const AI_CONFIG = {
  MODEL_NAME: 'Security Rules Engine',
  EPHEMERAL_NOTICE: 'Audit engine evaluates local rule heuristics without data retention',
  DEFAULT_PROMPT_PRESET: 'Next.js 15, PostgreSQL, Redis, Stripe, and NextAuth',
} as const;

/**
 * UI Timing constants
 */
export const UI_TIMINGS = {
  CLIPBOARD_TIMEOUT_MS: 1500,
  SUCCESS_DISMISS_MS: 1200,
  TOAST_DURATION_MS: 3000,
} as const;
