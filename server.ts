import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Load initial dataset from mockdata.json
  const mockDataPath = path.join(__dirname, 'src', 'data', 'mockdata.json');
  let initialData: any = {
    environments: [],
    apps: [],
    variablesByEnv: {},
    gitConfig: {},
    gitSyncLogs: [],
    cloudSnapshots: [],
  };

  try {
    if (fs.existsSync(mockDataPath)) {
      initialData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not load mockdata.json on server startup:', err);
  }

  // Server in-memory datastores
  let environments = initialData.environments || [];
  let apps = initialData.apps || [];
  let variablesByEnv: Record<string, any[]> = initialData.variablesByEnv || {};
  let gitConfig = initialData.gitConfig || {
    provider: 'github',
    connected: true,
    accountName: 'anshuman-singh',
    repoOwner: 'anshuman-singh',
    repoName: 'infra-cloud-secrets',
    branch: 'main',
    syncTarget: 'repo_secrets',
    lastSyncStatus: 'idle',
    cloudSyncEnabled: true,
  };
  let gitSyncLogs: any[] = initialData.gitSyncLogs || [];
  let cloudBackupSnapshots: any[] = initialData.cloudSnapshots || [];

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Full Config Bundle: brings environments, apps, variablesByEnv, gitConfig
  app.get('/api/config', (req, res) => {
    res.json({
      success: true,
      data: {
        environments,
        apps,
        variablesByEnv,
        gitConfig,
        gitSyncLogs,
        cloudSnapshots: cloudBackupSnapshots,
      },
    });
  });

  // 3. Environments Endpoints
  app.get('/api/environments', (req, res) => {
    res.json({ success: true, environments });
  });

  app.post('/api/environments', (req, res) => {
    try {
      const { name, description, color } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'Environment name is required' });
      }

      const envCode = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newEnv = {
        id: `env_${envCode}_${Date.now()}`,
        name: String(name).trim(),
        code: envCode,
        color: color || 'cyan',
        description: description ? String(description).trim() : `Configuration environment for ${name}`,
        isLocked: false,
        cloudSyncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
      };

      environments.push(newEnv);
      if (!variablesByEnv[newEnv.id]) {
        variablesByEnv[newEnv.id] = [];
      }

      res.json({ success: true, environment: newEnv });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Project Apps Endpoints
  app.get('/api/apps', (req, res) => {
    res.json({ success: true, apps });
  });

  app.post('/api/apps', (req, res) => {
    try {
      const { name, description, icon, color, slug } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'App name is required' });
      }

      const appSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newApp = {
        id: `app_${appSlug.replace(/-/g, '_')}_${Date.now()}`,
        name: String(name).trim(),
        slug: appSlug,
        description: description ? String(description).trim() : '',
        icon: icon || 'Server',
        color: color || 'indigo',
        createdAt: new Date().toISOString(),
      };

      apps.push(newApp);
      res.json({ success: true, app: newApp });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/apps/:appId', (req, res) => {
    const { appId } = req.params;
    apps = apps.filter((a) => a.id !== appId);
    res.json({ success: true, message: `App ${appId} deleted successfully` });
  });

  // 5. Config Variables Endpoints
  // GET /api/variables?envId=xxx&appId=yyy
  app.get('/api/variables', (req, res) => {
    const { envId, appId } = req.query;

    if (envId && typeof envId === 'string') {
      let list = variablesByEnv[envId] || [];
      if (appId && typeof appId === 'string' && appId !== 'all') {
        list = list.filter((v) => v.appId === appId);
      }
      return res.json({ success: true, variables: list, envId });
    }

    res.json({ success: true, variablesByEnv });
  });

  // GET /api/variables/:envId
  app.get('/api/variables/:envId', (req, res) => {
    const { envId } = req.params;
    const { appId } = req.query;
    let list = variablesByEnv[envId] || [];
    if (appId && typeof appId === 'string' && appId !== 'all') {
      list = list.filter((v) => v.appId === appId);
    }
    res.json({ success: true, envId, variables: list });
  });

  // POST /api/variables (Create or Update with audit trail)
  app.post('/api/variables', (req, res) => {
    try {
      const { envId, variable, changeReason, author } = req.body;
      if (!envId || !variable || !variable.key) {
        return res.status(400).json({ success: false, error: 'envId and variable with key are required' });
      }

      if (!variablesByEnv[envId]) {
        variablesByEnv[envId] = [];
      }

      const envVars = variablesByEnv[envId];
      const existingIdx = envVars.findIndex((v) => v.id === variable.id || v.key === variable.key);
      const timestamp = new Date().toISOString();
      const currentAuthor = author || 'anshuman.singh@dev.local';

      let savedVar: any;

      if (existingIdx >= 0) {
        const existing = envVars[existingIdx];
        const newVersion = (existing.currentVersion || 1) + 1;
        const newHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          version: newVersion,
          value: variable.value,
          isSecret: Boolean(variable.isSecret),
          timestamp,
          author: currentAuthor,
          changeType: 'update_value',
          reason: changeReason || 'Value modified via API',
          previousValue: existing.value,
          category: variable.category || existing.category,
        };

        savedVar = {
          ...existing,
          ...variable,
          currentVersion: newVersion,
          updatedAt: timestamp,
          updatedBy: currentAuthor,
          history: [newHistoryEntry, ...(existing.history || [])],
        };

        envVars[existingIdx] = savedVar;
      } else {
        const newVarId = variable.id || `var_${envId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const initialHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          version: 1,
          value: variable.value,
          isSecret: Boolean(variable.isSecret),
          timestamp,
          author: currentAuthor,
          changeType: 'create',
          reason: changeReason || 'Initial variable creation',
          previousValue: null,
          category: variable.category || 'App Config',
        };

        savedVar = {
          id: newVarId,
          appId: variable.appId || 'app_core_api',
          key: String(variable.key).trim().toUpperCase(),
          value: variable.value || '',
          isSecret: Boolean(variable.isSecret),
          category: variable.category || 'App Config',
          description: variable.description || '',
          updatedAt: timestamp,
          updatedBy: currentAuthor,
          currentVersion: 1,
          history: [initialHistoryEntry],
        };

        envVars.push(savedVar);
      }

      res.json({ success: true, variable: savedVar, envId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/variables/:envId/:variableId
  app.delete('/api/variables/:envId/:variableId', (req, res) => {
    const { envId, variableId } = req.params;
    if (variablesByEnv[envId]) {
      variablesByEnv[envId] = variablesByEnv[envId].filter((v) => v.id !== variableId);
    }
    res.json({ success: true, message: `Variable ${variableId} removed from ${envId}` });
  });

  // POST /api/variables/rollback
  app.post('/api/variables/rollback', (req, res) => {
    try {
      const { envId, variableId, targetVersion, author, reason } = req.body;
      const envVars = variablesByEnv[envId] || [];
      const varItem = envVars.find((v) => v.id === variableId);

      if (!varItem) {
        return res.status(404).json({ success: false, error: 'Variable not found' });
      }

      const targetEntry = varItem.history?.find((h: any) => h.version === targetVersion);
      if (!targetEntry) {
        return res.status(404).json({ success: false, error: `Version ${targetVersion} not found in history` });
      }

      const newVersion = (varItem.currentVersion || 1) + 1;
      const timestamp = new Date().toISOString();
      const rollbackHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        version: newVersion,
        value: targetEntry.value,
        isSecret: targetEntry.isSecret,
        timestamp,
        author: author || 'anshuman.singh@dev.local',
        changeType: 'rollback',
        reason: reason || `Rollback to version v${targetVersion}`,
        previousValue: varItem.value,
        category: targetEntry.category || varItem.category,
      };

      const updatedVar = {
        ...varItem,
        value: targetEntry.value,
        isSecret: targetEntry.isSecret,
        currentVersion: newVersion,
        updatedAt: timestamp,
        updatedBy: author || 'anshuman.singh@dev.local',
        history: [rollbackHistoryEntry, ...(varItem.history || [])],
      };

      const idx = envVars.findIndex((v) => v.id === variableId);
      envVars[idx] = updatedVar;

      res.json({ success: true, variable: updatedVar, envId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/variables/sync-env
  app.post('/api/variables/sync-env', (req, res) => {
    try {
      const { sourceEnvId, targetEnvId, variableId } = req.body;
      const sourceVars = variablesByEnv[sourceEnvId] || [];
      const sourceVar = sourceVars.find((v) => v.id === variableId);

      if (!sourceVar) {
        return res.status(404).json({ success: false, error: 'Source variable not found' });
      }

      if (!variablesByEnv[targetEnvId]) {
        variablesByEnv[targetEnvId] = [];
      }

      const targetVars = variablesByEnv[targetEnvId];
      const existingIdx = targetVars.findIndex((v) => v.key === sourceVar.key && v.appId === sourceVar.appId);
      const timestamp = new Date().toISOString();

      let resultVar: any;
      if (existingIdx >= 0) {
        const existing = targetVars[existingIdx];
        const newVersion = (existing.currentVersion || 1) + 1;
        resultVar = {
          ...existing,
          value: sourceVar.value,
          isSecret: sourceVar.isSecret,
          category: sourceVar.category,
          description: sourceVar.description,
          currentVersion: newVersion,
          updatedAt: timestamp,
          updatedBy: 'Cross-Environment Sync',
          history: [
            {
              id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              version: newVersion,
              value: sourceVar.value,
              isSecret: sourceVar.isSecret,
              timestamp,
              author: 'Cross-Environment Sync',
              changeType: 'sync_environment',
              reason: `Synchronized from ${sourceEnvId}`,
              previousValue: existing.value,
              category: sourceVar.category,
            },
            ...(existing.history || []),
          ],
        };
        targetVars[existingIdx] = resultVar;
      } else {
        resultVar = {
          ...sourceVar,
          id: `var_${targetEnvId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          updatedAt: timestamp,
          updatedBy: 'Cross-Environment Sync',
          currentVersion: 1,
          history: [
            {
              id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              version: 1,
              value: sourceVar.value,
              isSecret: sourceVar.isSecret,
              timestamp,
              author: 'Cross-Environment Sync',
              changeType: 'create',
              reason: `Copied from ${sourceEnvId}`,
              previousValue: null,
              category: sourceVar.category,
            },
          ],
        };
        targetVars.push(resultVar);
      }

      res.json({ success: true, variable: resultVar, targetEnvId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/variables/import
  app.post('/api/variables/import', (req, res) => {
    try {
      const { envId, appId, variables: importedList, strategy, author } = req.body;
      if (!envId || !Array.isArray(importedList)) {
        return res.status(400).json({ success: false, error: 'envId and variables array required' });
      }

      if (!variablesByEnv[envId]) {
        variablesByEnv[envId] = [];
      }

      let envVars = variablesByEnv[envId];
      if (strategy === 'replace') {
        envVars = [];
      }

      const timestamp = new Date().toISOString();
      const currentAuthor = author || 'Import Agent';

      for (const item of importedList) {
        if (!item.key) continue;
        const key = String(item.key).trim().toUpperCase();
        const existingIdx = envVars.findIndex((v) => v.key === key && (!appId || v.appId === appId));

        if (existingIdx >= 0) {
          if (strategy === 'skip') continue;
          // Strategy: merge (overwrite existing values)
          const existing = envVars[existingIdx];
          const newVersion = (existing.currentVersion || 1) + 1;
          envVars[existingIdx] = {
            ...existing,
            value: item.value,
            isSecret: item.isSecret !== undefined ? item.isSecret : existing.isSecret,
            category: item.category || existing.category,
            description: item.description || existing.description,
            currentVersion: newVersion,
            updatedAt: timestamp,
            updatedBy: currentAuthor,
            history: [
              {
                id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                version: newVersion,
                value: item.value,
                isSecret: item.isSecret !== undefined ? item.isSecret : existing.isSecret,
                timestamp,
                author: currentAuthor,
                changeType: 'imported',
                reason: 'Imported via batch synchronization',
                previousValue: existing.value,
                category: item.category || existing.category,
              },
              ...(existing.history || []),
            ],
          };
        } else {
          envVars.push({
            id: `var_${envId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            appId: item.appId || appId || 'app_core_api',
            key,
            value: item.value || '',
            isSecret: Boolean(item.isSecret),
            category: item.category || 'App Config',
            description: item.description || '',
            updatedAt: timestamp,
            updatedBy: currentAuthor,
            currentVersion: 1,
            history: [
              {
                id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                version: 1,
                value: item.value || '',
                isSecret: Boolean(item.isSecret),
                timestamp,
                author: currentAuthor,
                changeType: 'create',
                reason: 'Imported batch variable',
                previousValue: null,
                category: item.category || 'App Config',
              },
            ],
          });
        }
      }

      variablesByEnv[envId] = envVars;
      res.json({ success: true, variables: envVars, count: importedList.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Git Config & Logs
  app.get('/api/git/config', (req, res) => {
    res.json({ success: true, config: gitConfig });
  });

  app.post('/api/git/config', (req, res) => {
    gitConfig = { ...gitConfig, ...req.body };
    res.json({ success: true, config: gitConfig });
  });

  app.get('/api/git/logs', (req, res) => {
    res.json({ success: true, logs: gitSyncLogs });
  });

  // 7. Git Sync Execution API
  app.post('/api/git/sync', async (req, res) => {
    try {
      const { provider, repoOwner, repoName, branch, envCode, commitMessage, variables, syncTarget } = req.body;

      const commitSha = 'commit_' + Math.random().toString(16).substring(2, 10);
      const syncedCount = variables?.length || 0;
      const timestamp = new Date().toISOString();

      await new Promise((r) => setTimeout(r, 400));

      const newLog = {
        id: `sync_${Date.now()}`,
        timestamp,
        provider: provider || 'github',
        environment: envCode || 'Production',
        status: 'success',
        commitSha,
        commitMessage: commitMessage || `Update ${envCode} secrets [skip ci]`,
        variablesCount: syncedCount,
        syncTarget: syncTarget || 'repo_secrets',
        author: 'anshuman.singh@dev.local',
      };

      gitSyncLogs.unshift(newLog);
      if (gitSyncLogs.length > 50) gitSyncLogs = gitSyncLogs.slice(0, 50);

      res.json({
        success: true,
        provider,
        repo: `${repoOwner}/${repoName}`,
        branch,
        commitSha,
        commitMessage: commitMessage || `Update ${envCode} environment variables [skip ci]`,
        syncedCount,
        syncTarget,
        timestamp,
        syncedFile: syncTarget === 'env_file' ? `.env.${envCode.toLowerCase()}` : undefined,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Cloud Snapshots
  app.post('/api/cloud/snapshot', (req, res) => {
    const { label, author, environments: snapEnvs, apps: snapApps, variablesByEnv: snapVars } = req.body;
    const envsObj = (snapVars || variablesByEnv || {}) as Record<string, any[]>;
    const variableCount = Object.values(envsObj).reduce((acc: number, list: any) => acc + (Array.isArray(list) ? list.length : 0), 0);

    const newSnapshot = {
      id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      label: String(label || `Snapshot ${new Date().toLocaleTimeString()}`),
      environmentCount: Object.keys(envsObj).length,
      variableCount: Number(variableCount),
      author: String(author || 'CloudEnv Sync Agent'),
      data: {
        environments: snapEnvs || environments,
        apps: snapApps || apps,
        variablesByEnv: snapVars || variablesByEnv,
      },
    };

    cloudBackupSnapshots.unshift(newSnapshot);
    if (cloudBackupSnapshots.length > 50) {
      cloudBackupSnapshots = cloudBackupSnapshots.slice(0, 50);
    }

    res.json({ success: true, snapshot: newSnapshot, totalSnapshots: cloudBackupSnapshots.length });
  });

  app.get('/api/cloud/snapshots', (req, res) => {
    res.json({ success: true, snapshots: cloudBackupSnapshots });
  });

  app.post('/api/cloud/restore', (req, res) => {
    const { snapshotId } = req.body;
    const found = cloudBackupSnapshots.find((s) => s.id === snapshotId);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Snapshot not found' });
    }

    // Apply restored state to server database
    if (found.data?.environments) environments = found.data.environments;
    if (found.data?.apps) apps = found.data.apps;
    if (found.data?.variablesByEnv) variablesByEnv = found.data.variablesByEnv;

    res.json({ success: true, snapshot: found });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudEnv Config Manager running on http://localhost:${PORT}`);
  });
}

startServer();

