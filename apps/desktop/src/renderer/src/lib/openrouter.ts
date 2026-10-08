export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PageContext = {
  pageName: string;
  userRole: 'ADMIN' | 'RECEPTION' | 'CLEANING';
  appName: string;
  pageSummary: string;
};

function getAssistantBridge(): NonNullable<Window['sapay']>['askAssistant'] {
  const askAssistant = window.sapay?.askAssistant;
  if (!askAssistant) {
    throw new Error('El asistente no está disponible en esta versión de la aplicación.');
  }
  return askAssistant;
}

import { findRoute } from '../routes/routeAccess';

export function buildPageContext(
  pageName: string,
  userRole: 'ADMIN' | 'RECEPTION' | 'CLEANING'
): PageContext {
  const route = findRoute(pageName);
  return {
    pageName,
    userRole,
    appName: 'SAPAY Hotel',
    pageSummary: route?.meta.assistantSummary ?? 'Módulo de la aplicación SAPAY Hotel.'
  };
}

export async function askOpenRouter(
  pendingMessages: ChatMessage[],
  pageContext: PageContext
): Promise<string> {
  const askAssistant = getAssistantBridge();
  return askAssistant({ messages: pendingMessages, pageContext });
}