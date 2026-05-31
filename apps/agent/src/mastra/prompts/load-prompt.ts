import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROMPTS_DIR = join('src', 'mastra', 'prompts');
const PROMPT_PROBE = 'pm-prd.md';

function resolvePromptsDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));

  if (existsSync(join(moduleDir, PROMPT_PROBE))) {
    return moduleDir;
  }

  let dir = moduleDir;
  for (let depth = 0; depth < 10; depth++) {
    const candidate = join(dir, PROMPTS_DIR);
    if (existsSync(join(candidate, PROMPT_PROBE))) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error(`Unable to locate prompts directory from ${moduleDir}`);
}

const promptsDir = resolvePromptsDir();

export function loadPrompt(filename: string): string {
  const path = join(promptsDir, filename);

  if (!existsSync(path)) {
    throw new Error(`Prompt file not found: ${filename}. Expected at ${path}`);
  }

  return readFileSync(path, 'utf-8');
}
