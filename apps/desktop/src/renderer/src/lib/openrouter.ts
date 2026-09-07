export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PageContext = {
  pageName: string;
  userRole: 'ADMIN' | 'RECEPTION';
  appName: string;
  pageSummary: string;
};

function getOpenRouterSettings() {
  const rawApiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  const apiKey = rawApiKey?.trim() ?? '';

  const rawModel = import.meta.env.VITE_OPENROUTER_MODEL as string | undefined;
  const model = (rawModel?.trim() ?? '').trim() || 'openai/gpt-4o-mini';

  const enabled = apiKey.length > 0;

  return {
    apiKey,
    model,
    enabled
  };
}

function getMissingKeyErrorMessage() {
  return [
    'No está configurada la variable VITE_OPENROUTER_API_KEY.',
    'Revisa que el archivo .env en la raíz del proyecto contenga una clave válida de OpenRouter.',
    'Si la acabas de guardar, reinicia la app para recargar el entorno.'
  ].join(' ');
}

const pageContextCatalog: Record<string, string> = {
  dashboard: 'Dashboard general del hotel con métricas de ocupación, ingresos estimados, stock bajo y accesos rápidos a check-in, habitaciones, ventas y atención al cliente.',
  recepcion: 'Recepción: gestión de llegadas, asignación de habitaciones, estados de reservas y atención inmediata del huésped.',
  reservas: 'Reservas: manejo de reservaciones, fechas de ingreso y salida, disponibilidad y confirmaciones.',
  huespedes: 'Huéspedes activos: seguimiento de huéspedes en alojamiento, consumos y cierre de estancia.',
  habitaciones: 'Habitaciones: gestión de tipos, estados, precios, mantenimiento y disponibilidad de habitaciones.',
  clientes: 'Clientes: directorio de clientes, historial de hospedajes, edición de perfiles y eliminación con validación administrativa.',
  ventas: 'Ventas: registro de ventas de tienda, inventario y cierre de consumo por huéspedes o clientes.',
  parqueadero: 'Parqueadero: control de parqueadero mensual y gestión asociada al huésped o cliente.',
  auditoria: 'Auditoría: consulta del historial de movimientos, acciones administrativas y validación del sistema.',
  lavanderia: 'Lavandería: control de órdenes, estados, precios y seguimiento de servicios de ropa.',
  inventario: 'Inventario: control de stock, productos, categorías, ajustes de existencia y alertas por bajo inventario.',
  lavado: 'Lavado tanque: registro y estado de servicios de lavado de tanque.',
  'ingresos-gastos': 'Ingresos y gastos: seguimiento de movimientos financieros del negocio y control de egresos.',
  semanario: 'Semanario: análisis del desempeño semanal del hotel y servicios.',
  aires: 'Aires: control del servicio de aires en habitaciones o áreas.',
  mecato: 'Mecato: gestión de productos y consumos del punto de venta complementario.',
  facturas: 'Facturas: revisión e impresión de comprobantes del negocio.',
  perfil: 'Perfil: visualización de información del usuario y cambio de contraseña.',
  config: 'Configuración: ajustes del sistema y administración general.'
};

export function buildPageContext(pageName: string, userRole: 'ADMIN' | 'RECEPTION'): PageContext {
  return {
    pageName,
    userRole,
    appName: 'SAPAY Hotel',
    pageSummary: pageContextCatalog[pageName] ?? 'Módulo de la aplicación SAPAY Hotel.'
  };
}

export async function askOpenRouter(
  pendingMessages: ChatMessage[],
  pageContext: PageContext
): Promise<string> {
  const { apiKey, model, enabled } = getOpenRouterSettings();

  if (!enabled || !apiKey) {
    throw new Error(getMissingKeyErrorMessage());
  }

  const requestMessages = [
    {
      role: 'system',
      content: `Eres un asistente interno de soporte para la aplicación SAPAY Hotel.
Responde solo sobre el uso de esta aplicación y de sus módulos, no sobre temas generales ajenos al software.
Nunca des pasos fuera de la app ni inventes funciones que no existen.
Si el usuario pregunta algo que no está claramente relacionado con esta aplicación, responde que solo puedes ayudar con la operación de SAPAY Hotel.
Usa el contexto del módulo activo y la información del usuario para responder de forma útil y precisa.
Contexto actual:
- Nombre de la app: ${pageContext.appName}
- Módulo activo: ${pageContext.pageName}
- Rol del usuario: ${pageContext.userRole}
- Descripción del módulo: ${pageContext.pageSummary}
- Restricción: no puedes responder sobre temas ajenos a SAPAY Hotel ni dar información personal o de terceros.
- Si falta información, pide solo los datos necesarios dentro de la app.`
    },
    ...pendingMessages.map((message) => ({
      role: message.role,
      content: message.content
    }))
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
      messages: requestMessages
    })
  });

  if (!response.ok) {
    let details = 'No fue posible contactar al asistente.';

    try {
      const parsed = (await response.json()) as { error?: { message?: string } };
      details = parsed.error?.message ?? details;
    } catch {
      details = await response.text();
    }

    throw new Error(details || 'Error técnico del asistente.');
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
