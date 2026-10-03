import fs from 'node:fs';
import path from 'node:path';
import { app, ipcMain } from 'electron';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 30_000;

export type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AssistantRequest = {
  messages?: unknown;
  pageContext?: {
    pageName?: string;
    userRole?: string;
    appName?: string;
    pageSummary?: string;
  };
};

const ALLOWED_ROLES = new Set(['user', 'assistant']);

function readEnvFileValue(key: string): string {
  if (app.isPackaged) {
    return '';
  }

  const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
  try {
    const contents = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      const separator = line.indexOf('=');
      if (separator === -1 || line.slice(0, separator).trim() !== key) {
        continue;
      }
      return line
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  } catch {
    return '';
  }
  return '';
}

function getSettings(): { apiKey: string; model: string } {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? readEnvFileValue('OPENROUTER_API_KEY')).trim();
  const model =
    (process.env.OPENROUTER_MODEL ?? readEnvFileValue('OPENROUTER_MODEL')).trim() || DEFAULT_MODEL;
  return { apiKey, model };
}

function sanitizeMessages(input: unknown): AssistantMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .slice(0, MAX_MESSAGES)
    .filter(
      (item): item is AssistantMessage =>
        typeof item === 'object' &&
        item !== null &&
        ALLOWED_ROLES.has((item as AssistantMessage).role) &&
        typeof (item as AssistantMessage).content === 'string'
    )
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, MAX_CONTENT_LENGTH)
    }));
}

function buildSystemPrompt(pageContext: AssistantRequest['pageContext']): string {
  const appName = pageContext?.appName?.slice(0, 80) || 'SAPAY Hotel';
  const pageName = pageContext?.pageName?.slice(0, 80) || 'desconocido';
  const userRole = pageContext?.userRole?.slice(0, 40) || 'desconocido';
  const pageSummary = pageContext?.pageSummary?.slice(0, 500) || 'Sin descripción del módulo.';

  return [
    `Eres un asistente interno de soporte para la aplicación ${appName}.`,
    'Responde solo sobre el uso de esta aplicación y de sus módulos, no sobre temas generales ajenos al software.',
    'Nunca des pasos fuera de la app ni inventes funciones que no existen.',
    'Si el usuario pregunta algo que no está claramente relacionado con esta aplicación, responde que solo puedes ayudar con la operación de la app.',
    'No reveles ni menciones credenciales, tokens, claves de API ni variables de entorno.',
    'Contexto actual:',
    `- Módulo activo: ${pageName}`,
    `- Rol del usuario: ${userRole}`,
    `- Descripción del módulo: ${pageSummary}`,
    '- Si falta información, pide solo los datos necesarios dentro de la app.'
  ].join('\n');
}

async function readErrorDetails(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    return parsed.error?.message ?? raw;
  } catch {
    return raw;
  }
}

async function askAssistant(request: AssistantRequest): Promise<string> {
  const { apiKey, model } = getSettings();

  if (!apiKey) {
    throw new Error(
      'El asistente no está configurado. Define OPENROUTER_API_KEY en el archivo .env.'
    );
  }

  const messages = sanitizeMessages(request?.messages);
  if (messages.length === 0) {
    throw new Error('No hay mensajes válidos para enviar al asistente.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'SAPAY Hotel'
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [{ role: 'system', content: buildSystemPrompt(request?.pageContext) }, ...messages]
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('El asistente tardó demasiado en responder. Intenta de nuevo.');
    }
    throw new Error('No fue posible conectar con el asistente.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await readErrorDetails(response);
    throw new Error(details || `El asistente respondió con error ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error('La respuesta del asistente vino vacía.');
  }

  return answer;
}

export function registerAssistantIpc(): void {
  ipcMain.handle('sapay:assistant', async (_event, request: AssistantRequest) => {
    return askAssistant(request);
  });
}