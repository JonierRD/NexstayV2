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

function getAssistantBridge(): NonNullable<Window['sapay']>['askAssistant'] {
  const askAssistant = window.sapay?.askAssistant;
  if (!askAssistant) {
    throw new Error('El asistente no está disponible en esta versión de la aplicación.');
  }
  return askAssistant;
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
  const askAssistant = getAssistantBridge();
  return askAssistant({ messages: pendingMessages, pageContext });
}