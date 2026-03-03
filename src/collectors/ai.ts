import { createHash } from 'node:crypto';
import path from 'node:path';
import { CATALOG_VERSION } from '../catalog/v1';
import { loadAiBaseline, saveAiBaseline } from '../core/cache';
import { AiAssessment, AiBaseline, LocalProjectContext, ProjectProfile } from '../types';
import { safeReadText } from '../utils/files';

export const DEFAULT_OPENROUTER_MODEL = 'gpt-oss-120b';

interface AiCollectionInput {
  repoPath: string;
  repoIdentifier: string;
  fingerprint: string;
  criteriaIds: string[];
  local: LocalProjectContext;
  profile: ProjectProfile;
  enabled: boolean;
  apiKey?: string;
  model?: string;
}

interface AiCollectionOutput {
  assessments: Record<string, AiAssessment>;
  cacheKey: string;
  model: string;
  fromCache: boolean;
  warning?: string;
}

function computeCacheKey(repoIdentifier: string, fingerprint: string, model: string): string {
  const input = `${repoIdentifier}::${fingerprint}::${CATALOG_VERSION}::${model}`;
  return createHash('sha256').update(input).digest('hex');
}

function extractJsonObject(input: string): string | null {
  const first = input.indexOf('{');
  const last = input.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  return input.slice(first, last + 1);
}

function normalizeStatus(value: string): 'pass' | 'fail' | 'unverified' {
  const low = value.toLowerCase();
  if (low === 'pass' || low === 'fail' || low === 'unverified') {
    return low;
  }
  return 'unverified';
}

async function buildPromptContext(local: LocalProjectContext, profile: ProjectProfile): Promise<string> {
  const readmeText = local.readmePath
    ? await safeReadText(path.join(local.rootPath, local.readmePath))
    : '';

  const trimmedReadme = readmeText.slice(0, 4_000);

  return JSON.stringify(
    {
      profile,
      filesSample: local.files.slice(0, 150),
      workflows: local.workflowFiles,
      scripts: local.scripts,
      readmeExcerpt: trimmedReadme,
    },
    null,
    2,
  );
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  criteriaIds: string[],
  contextJson: string,
): Promise<Record<string, AiAssessment>> {
  const systemPrompt =
    'You evaluate repository readiness criteria. Respond only valid JSON with key "assessments" as an array. No markdown.';

  const userPrompt = [
    'Evaluate ONLY the criteria listed below.',
    `criteria: ${criteriaIds.join(', ')}`,
    'Output JSON schema:',
    '{"assessments":[{"id":"string","status":"pass|fail|unverified","reason":"string","evidence":["string"]}]}',
    'Use concise reasons and 1-3 evidence items.',
    'Repository context:',
    contextJson,
  ].join('\n\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/agentable/cli',
      'X-Title': 'agentable',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = body.choices?.[0]?.message?.content ?? '';
  const jsonPart = extractJsonObject(content);
  if (!jsonPart) {
    throw new Error('OpenRouter response did not contain valid JSON object.');
  }

  const parsed = JSON.parse(jsonPart) as {
    assessments?: Array<{ id?: string; status?: string; reason?: string; evidence?: unknown }>;
  };

  const out: Record<string, AiAssessment> = {};
  for (const item of parsed.assessments ?? []) {
    const id = item.id?.trim();
    if (!id || !criteriaIds.includes(id)) {
      continue;
    }

    const evidence = Array.isArray(item.evidence)
      ? item.evidence.map((v) => String(v)).slice(0, 3)
      : [];

    out[id] = {
      id,
      status: normalizeStatus(item.status ?? 'unverified'),
      reason: (item.reason ?? 'AI assessment unavailable.').slice(0, 280),
      evidence,
    };
  }

  return out;
}

export async function collectAiAssessments(input: AiCollectionInput): Promise<AiCollectionOutput> {
  const model = input.model || DEFAULT_OPENROUTER_MODEL;
  const cacheKey = computeCacheKey(input.repoIdentifier, input.fingerprint, model);

  const cached = await loadAiBaseline(cacheKey);
  if (cached) {
    return {
      assessments: cached.assessments,
      cacheKey,
      model,
      fromCache: true,
    };
  }

  if (!input.enabled || !input.apiKey || input.criteriaIds.length === 0) {
    return {
      assessments: {},
      cacheKey,
      model,
      fromCache: false,
      warning: 'AI disabled or missing OpenRouter API key in local config; AI-assisted criteria remain unverified.',
    };
  }

  try {
    const context = await buildPromptContext(input.local, input.profile);
    const assessments = await callOpenRouter(input.apiKey, model, input.criteriaIds, context);

    const baseline: AiBaseline = {
      key: cacheKey,
      fingerprint: input.fingerprint,
      model,
      createdAt: new Date().toISOString(),
      assessments,
    };

    await saveAiBaseline(baseline);

    return {
      assessments,
      cacheKey,
      model,
      fromCache: false,
    };
  } catch (error) {
    return {
      assessments: {},
      cacheKey,
      model,
      fromCache: false,
      warning: `AI request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
