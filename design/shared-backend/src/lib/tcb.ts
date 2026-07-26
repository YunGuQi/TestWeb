import tcb from '@cloudbase/node-sdk';

let app: any;
let db: any;

export let __reloadMockData = () => { console.log('Not in local mock mode'); };

try {
  const initConfig: any = { env: 'test-backend-d8grj1s21652da209' };
  
  if (process.env.TCB_SECRET_ID && process.env.TCB_SECRET_KEY) {
    initConfig.secretId = process.env.TCB_SECRET_ID;
    initConfig.secretKey = process.env.TCB_SECRET_KEY;
  }
  
  app = tcb.init(initConfig);
  
  const isLocalNoSecret = !process.env.TCB_SECRET_ID && process.env.NODE_ENV !== 'production';
  
  if (isLocalNoSecret) {
    console.log('[TCB Mock] Local dev without secrets. DB calls will be mocked.');
    
    let mockCodes: any[] = [];
    
    __reloadMockData = () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const csvPath = path.join(process.cwd(), 'src', 'config', 'activation_codes.csv');
        if (fs.existsSync(csvPath)) {
          const content = fs.readFileSync(csvPath, 'utf-8');
          const lines = content.split('\n');
          let newCodes: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts.length >= 4) {
              let codeStr = parts[0].replace('\uFEFF', '').trim();
              // Preserve existing if present to avoid losing devices
              const existing = mockCodes.find(c => c._id === codeStr);
              if (existing) {
                newCodes.push({
                  ...existing,
                  testId: parts[1] === '通用' ? '' : parts[1],
                  maxUses: parseInt(parts[2]) || 3,
                  isDisabled: parts[3] === '已禁用'
                });
              } else {
                newCodes.push({
                  id: codeStr,
                  _id: codeStr,
                  code: codeStr,
                  testId: parts[1] === '通用' ? '' : parts[1],
                  maxUses: parseInt(parts[2]) || 3,
                  isDisabled: parts[3] === '已禁用',
                  devices: [],
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
          // Merge old codes not in CSV but added dynamically? 
          // For simplicity, we just replace with CSV + preserved state
          mockCodes = newCodes;
          console.log(`[TCB Mock] Reloaded ${mockCodes.length} codes from activation_codes.csv`);
        }
      } catch (e) {
        console.error('[TCB Mock] Failed to read CSV', e);
      }
    };

    // Initial load
    __reloadMockData();
    db = {
      collection: (name: string) => {
        if (name === 'ActivationCode') {
          return {
            get: async () => ({ data: mockCodes }),
            where: (condition: any) => {
              let filtered = mockCodes;
              if (condition.code) {
                filtered = filtered.filter(c => c.code === condition.code);
              }
              if (condition._id && condition._id.$in) {
                filtered = filtered.filter(c => condition._id.$in.includes(c._id));
              }
              return {
                get: async () => ({ data: filtered }),
                update: async (updates: any) => { return { updated: 1 }; },
                remove: async () => {
                  if (condition._id && condition._id.$in) {
                    const toDelete = condition._id.$in;
                    const initialLen = mockCodes.length;
                    // Use standard splice or assign back (since mockCodes is let)
                    mockCodes = mockCodes.filter(c => !toDelete.includes(c._id));
                    return { deleted: initialLen - mockCodes.length };
                  }
                  return { deleted: 0 };
                }
              };
            },
            orderBy: () => ({ limit: () => ({ get: async () => ({ data: mockCodes }) }) }),
            doc: (id: string) => ({
              get: async () => {
                const item = mockCodes.find(c => c._id === id);
                return { data: item ? [item] : [] };
              },
              update: async (updates: any) => {
                const idx = mockCodes.findIndex(c => c._id === id);
                if (idx > -1) {
                  mockCodes[idx] = { ...mockCodes[idx], ...updates };
                  return { updated: 1 };
                }
                return { updated: 0 };
              }
            })
          };
        }
        return {
          get: async () => ({ data: [] }),
          where: () => ({ 
            remove: async () => ({ deleted: 0 }),
            update: async () => ({ updated: 1 }),
            get: async () => ({ data: [] })
          }),
          orderBy: () => ({ limit: () => ({ get: async () => ({ data: [] }) }) }),
          add: async () => ({ id: 'mock-id' })
        };
      },
      command: { in: (val: any) => ({ $in: val }), inc: (val: number) => val }
    };
  } else {
    db = app.database();
  }
} catch (e: any) {
  console.error("TCB INIT ERROR:", e);
  db = {
    collection: () => ({ get: async () => ({ data: [] }) }),
    command: {}
  };
}

export { app, db };
