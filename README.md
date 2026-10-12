# SAPAY

## Sistema de administración hotelera

![SAPAY - Administración hotelera](https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85)

SAPAY es un sistema de administración hotelera diseñado para centralizar y facilitar las operaciones internas de un establecimiento. Permite gestionar huéspedes, clientes, habitaciones, reservas, hospedajes, pagos y diferentes procesos administrativos desde una sola aplicación.

El proyecto busca mejorar la organización de la información, reducir los errores manuales y facilitar el trabajo del personal de administración y recepción mediante una interfaz intuitiva, organizada y funcional.

## Tabla de contenido

- [¿Qué es SAPAY?](#-qué-es-sapay)
- [Objetivo del proyecto](#-objetivo-del-proyecto)
- [Características principales](#-características-principales)
- [Módulos del sistema](#-módulos-del-sistema)
- [Gestión de hospedajes](#️-gestión-de-hospedajes)
- [Gestión de habitaciones](#-gestión-de-habitaciones)
- [Gestión de huéspedes y clientes](#-gestión-de-huéspedes-y-clientes)
- [Gestión de usuarios y permisos](#-gestión-de-usuarios-y-permisos)
- [Arquitectura del sistema](#️-arquitectura-del-sistema)
- [Tecnologías del proyecto](#-tecnologías-del-proyecto)
- [Seguridad](#️-seguridad)
- [Beneficios](#-beneficios)
- [Enfoque local y autonomía](#-enfoque-local-y-autonomía)
- [Estado del proyecto](#-estado-del-proyecto)

---

## 🏨 ¿Qué es SAPAY?

SAPAY es una aplicación de escritorio enfocada en la administración interna de establecimientos hoteleros. Su propósito es ofrecer una herramienta centralizada para controlar la información y las operaciones cotidianas del hotel.

A diferencia de una página web destinada a los clientes, SAPAY está pensado para ser utilizado por el administrador, recepción y personal autorizado.

El sistema permite organizar los registros de clientes, consultar la disponibilidad de habitaciones, registrar ingresos y salidas, controlar los hospedajes y administrar los movimientos económicos relacionados con cada estancia.

La aplicación está orientada a un entorno local, buscando que la administración del hotel no dependa de contratar servicios de alojamiento web o suscripciones mensuales.

## 🎯 Objetivo del proyecto

Desarrollar un sistema de administración hotelera que permita gestionar de forma eficiente, segura y organizada los procesos operativos de un hotel, centralizando la información y facilitando la toma de decisiones administrativas.

### Objetivos específicos

- Digitalizar el registro de huéspedes y clientes.
- Organizar las habitaciones según su disponibilidad y estado.
- Registrar y controlar los hospedajes y reservas.
- Facilitar el seguimiento de las fechas de entrada y salida.
- Calcular los valores de las estancias de acuerdo con las tarifas aplicadas.
- Registrar pagos, anticipos y cargos adicionales.
- Administrar ventas, inventario, lavandería y parqueadero.
- Administrar usuarios y permisos de acceso.
- Mantener un historial de las operaciones realizadas.
- Facilitar la consulta de información administrativa.

## 🚀 Características principales

![Habitación de hotel](https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80)

### Administración centralizada

La información del hotel se organiza dentro de una misma aplicación, evitando la necesidad de mantener registros dispersos en diferentes archivos o documentos físicos.

### Control de habitaciones

Permite consultar la información de las habitaciones y conocer su estado para facilitar la organización de la recepción y la asignación de hospedajes.

### Registro de hospedajes

Facilita el registro de cada estancia, asociando al huésped con una habitación, una fecha de ingreso, una tarifa y la información económica correspondiente.

### Control financiero

Permite organizar los valores asociados a un hospedaje, incluyendo el alojamiento, los anticipos, los pagos y los cargos adicionales registrados.

### Operación complementaria

Incluye módulos para ventas, inventario, lavandería, parqueadero, reservas y auditoría, de forma que los servicios relacionados puedan mantenerse conectados con los clientes y hospedajes.

### Funcionamiento local

El proyecto está orientado a ejecutarse en el computador del hotel, con el objetivo de reducir la dependencia de servicios externos y costos recurrentes de infraestructura.

## 🧩 Módulos del sistema

| Módulo | Función principal |
| --- | --- |
| Panel principal | Resumen general de la operación hotelera y accesos rápidos. |
| Habitaciones | Estados, tarifas, disponibilidad y mantenimiento. |
| Huéspedes | Hospedajes activos, salidas e historial de estancias. |
| Clientes | Directorio, datos personales e historial relacionado. |
| Reservas | Registro, consulta, confirmación y seguimiento de reservas. |
| Hospedajes | Check-in, noches, pagos, cargos y check-out. |
| Recepción | Ingreso de huéspedes y asignación de habitaciones. |
| Ventas | Venta de productos a huéspedes y clientes externos. |
| Inventario | Productos, existencias, categorías y alertas de stock. |
| Lavandería | Órdenes, prendas, estados y tarifas del servicio. |
| Parqueadero | Ingresos, salidas, clientes, vehículos y tarifas. |
| Auditoría | Historial de cambios y operaciones relevantes. |
| Semanario | Organización de turnos del personal de recepción. |
| Configuración | Preferencias generales y administración de usuarios. |

## 🛏️ Gestión de hospedajes

La gestión de hospedajes permite controlar el proceso desde el ingreso del huésped hasta el registro de su salida.

### Registro de ingreso

Al registrar un hospedaje, el sistema permite asociar al huésped con una habitación y almacenar los datos necesarios para administrar su estancia.

La fecha de salida puede ser desconocida al momento del ingreso. Por ello, la lógica de cálculo distingue entre el tiempo transcurrido y las noches cobrables.

### Cálculo de noches

- La primera noche se registra al realizar el check-in.
- La hora de corte configurada es la 1:00 p. m. en la zona horaria de Colombia.
- Exactamente a la hora de corte se cobra la noche anterior.
- Después de la hora de corte se suma la noche correspondiente al nuevo día superado.
- El check-out real detiene la acumulación de noches.
- La tarifa aplicada al hospedaje se conserva para mantener la consistencia del cálculo.

### Cálculo del alojamiento

El valor del alojamiento se obtiene multiplicando la tarifa por noche por el número de noches cobradas.

> **Total del alojamiento = Tarifa por noche × Noches cobradas**

Por ejemplo, si la tarifa es de $80.000 y se cobran 3 noches:

> **$80.000 × 3 = $240.000**

### Control de pagos y cargos adicionales

El balance del hospedaje puede contemplar otros movimientos económicos registrados durante la estancia.

> **Saldo = Alojamiento + Cargos adicionales − Anticipos − Pagos**

Los cargos adicionales pueden incluir conceptos como lavandería, consumos de ventas u otros servicios registrados en el sistema.

## 🏢 Gestión de habitaciones

![Interior de una habitación hotelera](https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80)

El control de habitaciones permite organizar la disponibilidad del establecimiento y consultar la información de cada espacio.

La administración contempla:

- Identificación individual.
- Clasificación por tipo.
- Configuración de tarifas.
- Consulta del estado actual.
- Asociación con hospedajes.
- Control de disponibilidad.
- Registro de mantenimiento.

La información de ocupación se sincroniza con los hospedajes registrados para evitar asignaciones incompatibles.

## 👤 Gestión de huéspedes y clientes

SAPAY centraliza los datos de los huéspedes y clientes para facilitar su registro y consulta durante los procesos de recepción.

La organización de la información permite identificar a cada persona, consultar sus datos y asociarla con hospedajes, ventas o movimientos de parqueadero cuando corresponda.

Los datos contemplados incluyen:

- Número de identificación o cédula.
- Nombre y apellido.
- Teléfono.
- Ciudad de origen y destino.
- Profesión.
- Notas adicionales.
- Historial de hospedajes y servicios relacionados.

## 🔐 Gestión de usuarios y permisos

SAPAY contempla diferentes perfiles de acceso para separar las responsabilidades dentro del hotel.

| Perfil | Responsabilidad |
| --- | --- |
| Administrador | Gestiona la configuración, usuarios y funciones administrativas autorizadas. |
| Recepción | Realiza las operaciones de atención y gestión hotelera permitidas. |
| Limpieza | Consulta habitaciones y utiliza las funciones de lavandería autorizadas. |

La separación de permisos busca que cada usuario acceda únicamente a las funciones correspondientes a su rol. Estos controles se complementan con autenticación y validación de permisos en las operaciones protegidas.

## ⚙️ Arquitectura del sistema

SAPAY está organizado como un monorepo con componentes diferenciados para la interfaz, la lógica de negocio y el almacenamiento de información.

```text
Usuario
  |
  v
Aplicación de escritorio Electron + React
  |
  v
API NestJS
  |
  v
Prisma
  |
  v
Base de datos PostgreSQL
```

Estructura principal:

```text
SAPAY/
├── apps/
│   ├── api/          Backend REST con NestJS
│   └── desktop/      Aplicación Electron con React
├── packages/
│   └── database/     Esquema, migraciones y cliente Prisma
├── package.json
└── README.md
```

## 💻 Tecnologías del proyecto

| Tecnología | Propósito |
| --- | --- |
| TypeScript | Tipado estático y organización del código. |
| React | Construcción de la interfaz de usuario. |
| Electron | Ejecución de la aplicación como programa de escritorio. |
| Tailwind CSS | Estilización de la interfaz. |
| NestJS | Desarrollo de la API y la lógica del backend. |
| PostgreSQL | Sistema de gestión de bases de datos relacionales. |
| Prisma | Acceso y gestión de los datos de la aplicación. |
| JWT, Passport y bcrypt | Autenticación y protección de credenciales. |
| Lucide React | Iconos de la interfaz. |

## 🛡️ Seguridad

La seguridad es fundamental para una aplicación que administra información de huéspedes y operaciones del hotel.

Entre las medidas aplicadas o contempladas se encuentran:

- Autenticación de usuarios.
- Contraseñas almacenadas mediante hash seguro.
- Control de acceso por roles.
- Validación de datos de entrada.
- Restricción de operaciones según los permisos del usuario.
- Protección de información administrativa.
- Registro de operaciones relevantes mediante auditoría.
- Copias de seguridad periódicas de la base de datos.

No se deben subir archivos `.env`, contraseñas ni credenciales al repositorio. El archivo `.gitignore` excluye dependencias, archivos generados y configuraciones locales.

## 📊 Beneficios de SAPAY

- **Organización:** concentra los registros en una aplicación.
- **Eficiencia:** facilita las tareas diarias de recepción.
- **Control:** permite consultar habitaciones, clientes y hospedajes.
- **Seguimiento financiero:** organiza valores, anticipos, pagos y cargos.
- **Trazabilidad:** facilita el seguimiento de las operaciones registradas.
- **Seguridad:** diferencia las responsabilidades de los usuarios.
- **Autonomía tecnológica:** está orientado a funcionar localmente.
- **Mantenibilidad:** utiliza una estructura modular para facilitar futuras mejoras.

## 🌐 Enfoque local y autonomía

SAPAY está diseñado para operar desde el computador del hotel, sin requerir una página pública para que los clientes realicen reservas.

El enfoque contempla minimizar los costos recurrentes y mantener la información bajo el control del establecimiento. Para una operación completamente local, todos los componentes necesarios deben estar disponibles en el equipo o en la red local, incluida la base de datos y cualquier servicio interno requerido.

## 📈 Estado del proyecto

SAPAY se encuentra en desarrollo activo. Los módulos principales de operación hotelera están implementados y continúan recibiendo mejoras de funcionalidad, consistencia de datos y experiencia de usuario.

Antes de desplegar una nueva versión, se recomienda ejecutar:

```bash
npm run typecheck
npm run build
```

## 🏁 Conclusión

SAPAY busca transformar la administración cotidiana de un hotel mediante una aplicación de escritorio que centralice la información y facilite los procesos internos.

Su enfoque combina la gestión de habitaciones, clientes, huéspedes, hospedajes y operaciones administrativas en un entorno organizado, con especial atención al control de la información y la autonomía tecnológica.

---

**SAPAY — Administración hotelera más organizada, eficiente y segura.**

Proyecto de software para la gestión interna de establecimientos hoteleros.
