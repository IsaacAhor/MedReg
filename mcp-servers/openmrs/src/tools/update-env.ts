/**
 * Update .env MCP Tool (safe, line-based)
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const UpdateEnvSchema = z.object({
  file: z.string().optional().describe('Path to env file, default frontend/.env.local'),
  updates: z.record(z.string()).describe('Key-value pairs to set'),
  create: z.boolean().optional().default(true).describe('Create file if missing'),
});

export type UpdateEnvInput = z.infer<typeof UpdateEnvSchema>;

export interface UpdateEnvResult {
  success: boolean;
  file?: string;
  updated?: Record<string, string>;
  added?: string[];
  changed?: string[];
  error?: string;
}

function resolveEnvPath(provided?: string): string {
  if (provided) return path.resolve(provided);
  const repoRoot = process.env.MEDREG_REPO_ROOT || path.resolve(__dirname, '../../../..');
  return path.join(repoRoot, 'frontend', '.env.local');
}

export async function updateEnv(input: UpdateEnvInput): Promise<UpdateEnvResult> {
  try {
    const filePath = resolveEnvPath(input.file);
    const exists = fs.existsSync(filePath);
    if (!exists && !input.create) {
      return { success: false, error: `Env file not found: ${filePath}` };
    }

    let content = exists ? fs.readFileSync(filePath, 'utf-8') : '';
    const lines = content.length > 0 ? content.split(/\r?\n/) : [];
    const map = new Map<string, string>();

    // Preserve comments and order by reconstructing later
    const keyLineIndex = new Map<string, number>();
    lines.forEach((line, idx) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) {
        keyLineIndex.set(m[1], idx);
        map.set(m[1], m[2]);
      }
    });

    const added: string[] = [];
    const changed: string[] = [];

    Object.entries(input.updates).forEach(([k, v]) => {
      const safeV = String(v);
      if (keyLineIndex.has(k)) {
        const i = keyLineIndex.get(k)!;
        lines[i] = `${k}=${safeV}`;
        if (map.get(k) !== safeV) changed.push(k);
      } else {
        lines.push(`${k}=${safeV}`);
        added.push(k);
      }
    });

    const newContent = lines.length ? lines.join('\n') + '\n' : Object.entries(input.updates).map(([k,v]) => `${k}=${v}`).join('\n') + '\n';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return { success: true, file: filePath, updated: input.updates, added, changed };
  } catch (error: any) {
    return { success: false, error: `Failed to update env: ${error.message}` };
  }
}

