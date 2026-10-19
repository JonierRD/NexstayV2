import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  ConciergeBell,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Shirt,
  ShoppingCart,
  Users,
  X
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import FondoLogin from '../assets/login/FondoLogin.png';
import Logo from '../assets/login/Logo.png';

type LandingPageProps = {
  onLogin: () => void;
};

const hotelServices = [
  {
    icon: BedDouble,
    title: 'Habitaciones y hospedaje',
    description: 'Consulta la disponibilidad y organiza cada habitación para una estancia cómoda.'
  },
  {
    icon: ConciergeBell,
    title: 'Recepción y atención',
    description: 'Acompaña llegadas, asignaciones y la atención diaria de cada huésped.'
  },
  {
    icon: CalendarCheck,
    title: 'Reservas y estancias',
    description: 'Mantén el control de reservas, fechas de ingreso, salida y estados.'
  },
  {
    icon: Car,
    title: 'Parqueadero',
    description: 'Lleva un registro organizado del parqueadero asociado a huéspedes y clientes.'
  }
];

const platformFeatures = [
  { icon: Users, title: 'Huéspedes y clientes', description: 'Información, historial y seguimiento en un solo lugar.' },
  { icon: BedDouble, title: 'Habitaciones y operación', description: 'Estados, disponibilidad, mantenimiento y estancias.' },
  { icon: CalendarCheck, title: 'Reservas y estancias', description: 'Organiza fechas, disponibilidad y confirmaciones.' },
  { icon: ShoppingCart, title: 'Consumos y ventas', description: 'Registra ventas y consumos vinculados a la operación.' },
  { icon: Package, title: 'Inventario', description: 'Controla productos, existencias y alertas de bajo stock.' },
  { icon: Car, title: 'Parqueadero', description: 'Gestiona registros asociados a huéspedes y clientes.' },
  { icon: Shirt, title: 'Lavandería', description: 'Da seguimiento a órdenes, estados y servicios de ropa.' },
  { icon: Settings, title: 'Configuración', description: 'Adapta los datos del hotel, políticas y preferencias del sistema.' },
  { icon: LayoutDashboard, title: 'Vista general', description: 'Revisa las métricas y accesos importantes de la jornada.' }
];

export function LandingPage({ onLogin }: LandingPageProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="h-screen overflow-y-auto scroll-smooth bg-sapay-50 text-sapay-950">
      <header className="sticky top-0 z-40 border-b border-sapay-300/80 bg-sapay-50/95 shadow-[0_8px_24px_rgba(67,42,27,0.06)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href="#inicio" className="flex items-center gap-3" onClick={closeMenu}>
            <img src={Logo} alt="SAPAY Hotel" className="h-12 w-12 rounded-full bg-white object-contain p-0.5 shadow-sm" />
            <span className="hidden text-sm font-semibold uppercase tracking-[0.22em] text-sapay-1000 sm:block">SAPAY Hotel</span>
          </a>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-sapay-350 text-sapay-900 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-[72px] flex-col gap-1 border-b border-sapay-300 bg-sapay-50 px-5 py-4 shadow-lg md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
            {[
              ['Inicio', '#inicio'],
              ['Sobre el hotel', '#sobre-el-hotel'],
              ['Servicios', '#servicios'],
              ['Funcionalidades', '#funcionalidades']
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu} className="rounded-md px-2 py-2 text-sm font-medium text-sapay-700 transition hover:bg-sapay-150 hover:text-sapay-1000">
                {label}
              </a>
            ))}
            <button type="button" onClick={() => { closeMenu(); onLogin(); }} className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-sapay-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(67,42,27,0.18)] transition hover:bg-sapay-850 md:mt-0">
              Iniciar sesión <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative isolate overflow-hidden bg-sapay-950 text-white">
        <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${FondoLogin})` }} aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(25,13,9,0.98),rgba(54,29,18,0.82)_52%,rgba(25,13,9,0.48))]" aria-hidden="true" />
        <div className="mx-auto grid min-h-[min(700px,calc(100vh-72px))] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#f3c331]">Hospitalidad que fluye</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">Bienvenido a SAPAY Hotel</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/78 sm:text-lg">Una experiencia de hospitalidad, comodidad y organización en un solo lugar. Conoce nuestro hotel y descubre cómo la tecnología facilita la gestión de cada estancia.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#sobre-el-hotel" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f3c331] px-6 py-3 text-sm font-bold text-sapay-1000 transition hover:bg-[#ffd866]">Conocer el hotel <ChevronDown size={17} /></a>
              <button type="button" onClick={onLogin} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18">Iniciar sesión <ArrowRight size={17} /></button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="max-w-sm rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
              <img src={FondoLogin} alt="Interior del hotel" className="h-[390px] w-[330px] rounded-[1.5rem] object-cover" />
              <div className="px-4 pb-3 pt-4"><p className="text-xs uppercase tracking-[0.25em] text-[#f3c331]">SAPAY</p><p className="mt-1 text-sm text-white/80">Un espacio para recibir, organizar y cuidar cada estancia.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre-el-hotel" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-28">
        <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-sapay-700">Sobre SAPAY Hotel</p><h2 className="mt-3 text-3xl font-semibold leading-tight text-sapay-1000 sm:text-4xl">Calidez para el huésped, claridad para el equipo.</h2></div>
        <div className="space-y-5 text-base leading-8 text-sapay-700"><p>SAPAY Hotel busca ofrecer una experiencia organizada y cómoda para sus huéspedes, acompañando cada momento de su estancia con atención y cuidado.</p><p>La plataforma reúne la operación cotidiana del establecimiento para que el equipo pueda trabajar con información clara, procesos ordenados y una visión compartida del hotel.</p><div className="grid gap-3 pt-3 sm:grid-cols-3">{['Hospitalidad', 'Organización', 'Cuidado'].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg border border-sapay-300 bg-white px-4 py-3 text-sm font-semibold text-sapay-900"><Check size={16} className="text-[#bd8615]" />{item}</div>)}</div></div>
      </section>

      <section id="servicios" className="border-y border-sapay-300 bg-sapay-150/70"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.28em] text-sapay-700">Nuestros servicios</p><h2 className="mt-3 text-3xl font-semibold text-sapay-1000 sm:text-4xl">Todo lo esencial, bien conectado.</h2><p className="mt-4 leading-7 text-sapay-700">Servicios presentes en la operación de SAPAY Hotel para acompañar la experiencia de huéspedes y equipo.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{hotelServices.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-xl border border-sapay-300 bg-white p-6 shadow-[0_12px_28px_rgba(67,42,27,0.06)]"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sapay-900 text-[#f3c331]"><Icon size={21} /></div><h3 className="mt-5 text-base font-semibold text-sapay-1000">{title}</h3><p className="mt-2 text-sm leading-6 text-sapay-700">{description}</p></article>)}</div></div></section>

      <section id="funcionalidades" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.28em] text-sapay-700">Funcionalidades de la plataforma</p><h2 className="mt-3 text-3xl font-semibold text-sapay-1000 sm:text-4xl">La operación del hotel, en una sola vista.</h2></div><p className="max-w-sm text-sm leading-6 text-sapay-700">Herramientas para el personal autorizado. El acceso a cada módulo depende del rol dentro de la plataforma.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{platformFeatures.map(({ icon: Icon, title, description }) => <article key={title} className="flex gap-4 rounded-xl border border-sapay-300 bg-sapay-50 p-5 transition hover:-translate-y-0.5 hover:border-sapay-500 hover:shadow-[0_12px_28px_rgba(67,42,27,0.08)]"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sapay-200 text-sapay-900"><Icon size={19} /></div><div><h3 className="text-sm font-semibold text-sapay-1000">{title}</h3><p className="mt-1 text-sm leading-6 text-sapay-700">{description}</p></div></article>)}</div></section>

      <section className="mx-5 mb-16 overflow-hidden rounded-2xl bg-sapay-900 px-6 py-14 text-center text-white shadow-[0_24px_60px_rgba(67,42,27,0.18)] sm:mx-8 sm:px-10 lg:mx-auto lg:max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f3c331]">Acceso para personal autorizado</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">¿Listo para gestionar SAPAY Hotel?</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-white/75">Accede a la plataforma para administrar las operaciones del hotel desde un solo lugar.</p><button type="button" onClick={onLogin} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#f3c331] px-6 py-3 text-sm font-bold text-sapay-1000 transition hover:bg-[#ffd866]">Acceder al sistema <ArrowRight size={17} /></button></section>

      <footer className="border-t border-sapay-300 bg-sapay-150"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10"><div className="flex items-center gap-3"><img src={Logo} alt="SAPAY Hotel" className="h-10 w-10 rounded-full bg-white object-contain p-0.5" /><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sapay-1000">SAPAY Hotel</p><p className="mt-1 text-xs text-sapay-700">Hospitalidad y organización en un solo lugar.</p></div></div><nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-sapay-700"><a href="#inicio" className="hover:text-sapay-1000">Inicio</a><a href="#sobre-el-hotel" className="hover:text-sapay-1000">Sobre el hotel</a><a href="#servicios" className="hover:text-sapay-1000">Servicios</a><a href="#funcionalidades" className="hover:text-sapay-1000">Funcionalidades</a></nav></div></footer>
    </main>
  );
}