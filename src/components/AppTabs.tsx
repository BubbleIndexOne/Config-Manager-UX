import React, { useState } from 'react';
import {
  Server,
  Globe,
  Shield,
  CreditCard,
  Cpu,
  Database,
  Layers,
  Box,
  Plus,
  X,
  Boxes,
  Trash2,
} from 'lucide-react';
import { ProjectApp } from '../types/config';

interface AppTabsProps {
  apps: ProjectApp[];
  activeAppId?: string;
  selectedAppId?: string;
  appVariableCounts?: Record<string, number>;
  appCounts?: Record<string, number>;
  totalEnvVariables?: number;
  totalCount?: number;
  environmentName?: string;
  onSelectApp: (appId: string) => void;
  onCreateApp: (app: { name: string; slug: string; description: string; icon: string; color: string } | any) => void;
  onDeleteApp?: (appId: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Server', label: 'Backend / API', icon: Server },
  { name: 'Globe', label: 'Web / Frontend', icon: Globe },
  { name: 'Shield', label: 'Auth / Security', icon: Shield },
  { name: 'CreditCard', label: 'Billing / Payments', icon: CreditCard },
  { name: 'Cpu', label: 'Worker / Engine', icon: Cpu },
  { name: 'Database', label: 'Database / Cache', icon: Database },
  { name: 'Box', label: 'Service / Microservice', icon: Box },
  { name: 'Layers', label: 'Shared / Core', icon: Layers },
];

export const AppTabs: React.FC<AppTabsProps> = ({
  apps = [],
  activeAppId,
  selectedAppId,
  appVariableCounts,
  appCounts,
  totalEnvVariables,
  totalCount,
  environmentName,
  onSelectApp,
  onCreateApp,
  onDeleteApp,
}) => {
  const currentActiveId = activeAppId || selectedAppId || 'all';
  const countsMap = appVariableCounts || appCounts || {};
  const totalVars = totalEnvVariables ?? totalCount ?? 0;

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('');
  const [appSlug, setAppSlug] = useState<string>('');
  const [appDescription, setAppDescription] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Server');
  const [selectedColor, setSelectedColor] = useState<string>('indigo');

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAppName(val);
    if (!appSlug || appSlug === appName.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setAppSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    onCreateApp({
      name: appName.trim(),
      slug: appSlug.trim() || appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: appDescription.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });

    setAppName('');
    setAppSlug('');
    setAppDescription('');
    setSelectedIcon('Server');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-2">
      {/* Sub-navigation bar for Applications (env > app hierarchy) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-[#121214] border border-[#27272A]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>Applications:</span>
          </div>

          {/* "All Applications" Tab */}
          <button
            id="app-tab-all"
            type="button"
            onClick={() => onSelectApp('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 border ${
              currentActiveId === 'all'
                ? 'bg-[#27272A] border-[#3F3F46] text-white shadow-sm font-semibold'
                : 'bg-transparent hover:bg-[#1C1C1F] border-transparent text-[#A1A1AA] hover:text-[#E4E4E7]'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>All Applications</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                currentActiveId === 'all' ? 'bg-[#18181B] text-indigo-400' : 'bg-[#1C1C1F] text-[#71717A]'
              }`}
            >
              {totalVars}
            </span>
          </button>

          {/* Individual Project Apps */}
          {apps.map((app) => {
            const isActive = currentActiveId === app.id;
            const count = countsMap?.[app.id] ?? 0;

            return (
              <button
                key={app.id}
                id={`app-tab-${app.id}`}
                type="button"
                onClick={() => onSelectApp(app.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#1C1C1F] border-indigo-500/50 text-white shadow-sm font-semibold'
                    : 'bg-transparent hover:bg-[#1C1C1F] border-transparent text-[#A1A1AA] hover:text-[#E4E4E7]'
                }`}
                title={`${app.name}: ${app.description || ''}`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-[#71717A]'}>
                  {getAppIcon(app.icon)}
                </span>
                <span>{app.name}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                    isActive ? 'bg-[#27272A] text-indigo-400' : 'bg-[#18181B] text-[#71717A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Add App trigger */}
        <button
          id="add-app-btn"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7] border border-[#27272A] text-xs transition"
          title="Create a new Application / Service"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>New App</span>
        </button>
      </div>

      {/* New Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl p-6 space-y-4 text-[#E4E4E7]">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-sm font-semibold text-[#E4E4E7] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-400" />
                Add New Application / Service
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#71717A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">
                  Application Name
                </label>
                <input
                  id="new-app-name-input"
                  type="text"
                  required
                  value={appName}
                  onChange={handleNameChange}
                  placeholder="e.g. Notification Service, Mobile Gateway, Analytics"
                  className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">
                  Slug / Identifier
                </label>
                <input
                  id="new-app-slug-input"
                  type="text"
                  required
                  value={appSlug}
                  onChange={(e) => setAppSlug(e.target.value)}
                  placeholder="e.g. notification-service"
                  className="w-full px-3 py-2 text-xs font-mono bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">
                  Description
                </label>
                <input
                  id="new-app-desc-input"
                  type="text"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="e.g. Twilio/SendGrid email and SMS dispatch daemon"
                  className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-md text-[#E4E4E7] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A1AA] block mb-1">
                  Service Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSel = selectedIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                          isSel
                            ? 'bg-[#1C1C1F] border-indigo-500 text-indigo-400'
                            : 'bg-[#09090B] border-[#27272A] text-[#71717A] hover:border-[#3F3F46]'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] truncate max-w-full">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-[#1C1C1F] text-[#A1A1AA] hover:text-white rounded-md text-xs border border-[#27272A]"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-app-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium"
                >
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
