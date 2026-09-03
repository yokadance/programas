import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProgrammeData, Session, AgendaTheme } from "@/type/type";
import { Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";
import SessionDetailModal from "./SessionDetailModal";
import BottomNav from "./BottomNav";
import { generateAgendaPDF, isBreak, parseDate } from "@/utils/generateAgendaPDF";

// --- Layout constants ---
const DEFAULT_PX_PER_MIN = 2;
const TIME_COL_W = 52;
const HEADER_H = 44;
const HOUR_LABEL_OFFSET = 8;
const DESKTOP_ROOM_W = 175;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Tamaño de letra único para todas las tarjetas del cronograma (evita que
// bloques de la misma duración se vean con tipografías distintas). Sólo se
// reduce como último recurso, cuando ni siquiera el crecimiento seguro de la
// tarjeta (hasta el inicio de la próxima sesión de la sala) alcanza.
const FIXED_TITLE_FONT = 11;
const FIXED_TITLE_LINE_H = 13;
const TITLE_FONT_FALLBACKS = [11, 10, 9, 8];

function estimateLines(title: string, widthPx: number, fontSize: number): number {
  const avgCharWidth = fontSize * 0.58;
  const charsPerLine = Math.max(4, Math.floor(widthPx / avgCharWidth));
  return Math.max(1, Math.ceil(title.length / charsPerLine));
}

function fitTitleFont(
  title: string,
  widthPx: number,
  availableH: number,
): { fontSize: number; lineHeight: number; lines: number } {
  let fallback = { fontSize: 8, lineHeight: 10, lines: 1 };
  for (const fontSize of TITLE_FONT_FALLBACKS) {
    const lineHeight = fontSize + 2;
    const lines = estimateLines(title, widthPx, fontSize);
    fallback = { fontSize, lineHeight, lines };
    if (lines * lineHeight <= availableH) return fallback;
  }
  return fallback; // ninguno entró perfecto: usar el más chico como mejor esfuerzo
}


const defaultTheme: AgendaTheme = {
  primaryBg: "bg-blue-600",
  primaryText: "text-blue-700",
  titleText: "text-blue-900",
  iconColor: "text-blue-500",
  lightBg: "bg-blue-50",
  lightBorder: "border-blue-100",
  badgeText: "text-blue-800",
  headerBg: "bg-blue-50",
  chairIconColor: "text-blue-400",
};

type AgendaCalendarProps = {
  data: ProgrammeData;
  facultyEndpoint?: string;
  sessionEndpoint?: (sessionId: string) => string;
  theme?: Partial<AgendaTheme>;
  agendaHref?: string;
  speakersHref?: string;
  /** Logo chico mostrado junto al selector de días (ver `headerImages` para un cabezal ancho con texto). */
  logoSrc?: string;
  /**
   * Cabezal a todo el ancho, arriba del selector de días — pensado para banners
   * con logo + fecha/sede/organizador (donde `logoSrc` a 40px de alto queda
   * ilegible). Si se pasa, reemplaza a `logoSrc`.
   */
  headerImages?: { src: string; alt: string; className?: string }[];
  pdfOptions?: import("@/utils/generateAgendaPDF").GeneratePDFOptions;
  /** Alto de cada minuto en px. Reducir para achicar visualmente las franjas horarias. */
  pxPerMin?: number;
  /**
   * Títulos (regex) que deben mostrarse dentro de su propia sala en vez de
   * como banda transversal (ej: coffee break, tiempo libre). El resto de los
   * títulos detectados por `isBreak` se siguen mostrando como transversales,
   * abarcando únicamente las salas donde efectivamente existe esa sesión.
   */
  roomScopedBreakPattern?: RegExp;
  /** Texto de aviso mostrado arriba del todo (ej: "Programa preliminar, sujeto a cambios"). */
  preliminaryNotice?: string;
  /**
   * Colores (hex) asignados round-robin a cada sala, en el orden de `roomsOrdered`
   * (que respeta `pdfOptions.roomOrder` cuando está presente). Permite distinguir
   * salas de un vistazo sin depender de un único color de tema.
   */
  roomColors?: string[];
  /** Nombres de disertantes/moderadores en negro en el modal de detalle, en vez del color del tema. */
  neutralText?: boolean;
  /** En el modal de detalle, separa Chair (Presidente-Moderador/a) y Co-Chair (Secretario/a) en vez de un único "Modera". */
  splitChairRoles?: boolean;
  /** Muestra el campo `Session_Type` de SL entre el horario y el título de cada tarjeta. */
  showSessionType?: boolean;
  /** Oculta el badge de "N charlas" que se muestra debajo del título de cada tarjeta. */
  hideTalkCountBadge?: boolean;
  /** Muestra horario de inicio y fin ("HH:MM – HH:MM") en la tarjeta en vez de solo el inicio. */
  showTimeRange?: boolean;
  /**
   * Reglas de color por contenido de la sesión (tipo, duración, etc.), evaluadas
   * en orden — la primera que matchee define el color de la tarjeta. Tiene
   * prioridad sobre `roomColors`; si ninguna matchea, se usa `roomColors` (si
   * está) o el theme por defecto.
   */
  cardColorRules?: { test: (session: Session) => boolean; color: string }[];
  /**
   * Sesiones cuyo `Session_Type` (o título, si no hay tipo) matchea este patrón
   * se dibujan como una única franja a todo el ancho de la grilla (todas las
   * salas), sin importar en qué sala esté cargada en SL — pensado para eventos
   * que pausan todo el congreso (posters, cocktails, cenas, coffee breaks,
   * conferencias plenarias). La franja va DEBAJO de las tarjetas de sesiones
   * reales: donde una sala tiene una sesión real en simultáneo, esa sesión se
   * ve encima y la franja no la tapa.
   */
  fullWidthPattern?: RegExp;
};

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  data,
  facultyEndpoint,
  sessionEndpoint,
  theme: themeProp,
  agendaHref,
  speakersHref,
  logoSrc,
  pdfOptions,
  pxPerMin,
  roomScopedBreakPattern,
  preliminaryNotice,
  roomColors,
  neutralText,
  splitChairRoles,
  showSessionType,
  hideTalkCountBadge,
  showTimeRange,
  cardColorRules,
  fullWidthPattern,
}) => {
  const theme: AgendaTheme = { ...defaultTheme, ...themeProp };
  const PX_PER_MIN = pxPerMin ?? DEFAULT_PX_PER_MIN;

  const isFullWidthBreak = useCallback(
    (session: Session) =>
      fullWidthPattern?.test(session.Session_Type || session.Session_Title || "") ?? false,
    [fullWidthPattern],
  );
  const isRoomScopedBreak = useCallback(
    (title: string) => roomScopedBreakPattern?.test(title) ?? false,
    [roomScopedBreakPattern],
  );
  const isTransversalBreak = useCallback(
    (title: string) => isBreak(title) && !isRoomScopedBreak(title),
    [isRoomScopedBreak],
  );

  const days = Object.keys(data.Programme.Days);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // --- Responsive room column width ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setContainerW(el.clientWidth));
    obs.observe(el);
    setContainerW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const isMobile = containerW > 0 && containerW < 768;

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollX(scrollRef.current.scrollLeft);
  }, []);

  // --- Sessions for selected day ---
  const allSessions: Session[] = Object.values(
    data.Programme.Days[selectedDay].Session_Groups,
  ).flatMap((g) => g.Sessions);

  const roomsOrdered = (() => {
    const rooms = Array.from(
      new Set(allSessions.map((s) => s.Session_Location?.trim() || "General"))
    );
    const order = pdfOptions?.roomOrder;
    if (order && order.length > 0) {
      return rooms.sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b, "es", { sensitivity: "base" });
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    return rooms.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  })();

  const getRoomColor = useCallback(
    (room: string): string | undefined => {
      if (!roomColors || roomColors.length === 0) return undefined;
      const idx = roomsOrdered.indexOf(room);
      if (idx === -1) return undefined;
      return roomColors[idx % roomColors.length];
    },
    [roomColors, roomsOrdered],
  );

  const getCardColor = useCallback(
    (session: Session, room: string): string | undefined => {
      const rule = cardColorRules?.find((r) => r.test(session));
      if (rule) return rule.color;
      return getRoomColor(room);
    },
    [cardColorRules, getRoomColor],
  );

  const roomColW = (() => {
    if (!containerW) return DESKTOP_ROOM_W;
    if (isMobile) return containerW - TIME_COL_W;
    // Desktop: fill available width, minimum 220px per column
    const available = containerW - TIME_COL_W;
    const dynamic = Math.floor(available / roomsOrdered.length);
    return Math.max(220, dynamic);
  })();

  // --- Transversal breaks: group same title+horario, abarcando sólo las
  // salas donde esa sesión realmente existe (ej: cocktail que no ocurre en
  // todas las salas queda acotado a las columnas correspondientes) ---
  const transversalGroups = (() => {
    const groups = new Map<
      string,
      { session: Session; minIdx: number; maxIdx: number }
    >();
    const indicesByKey = new Map<string, number[]>();
    allSessions
      .filter((s) => isTransversalBreak(s.Session_Title) && !isFullWidthBreak(s))
      .forEach((s) => {
        const room = s.Session_Location?.trim() || "General";
        const idx = roomsOrdered.indexOf(room);
        if (idx === -1) return;
        const key = `${s.Session_Title}|${s.Session_Start_Time}|${s.Session_End_Time}`;
        if (!groups.has(key)) groups.set(key, { session: s, minIdx: idx, maxIdx: idx });
        const list = indicesByKey.get(key) ?? [];
        list.push(idx);
        indicesByKey.set(key, list);
      });
    // Partir en tramos contiguos: una franja que solo ocupa algunas salas no
    // debe dibujarse como una única barra corrida que tape a las salas
    // intermedias donde esa franja no existe (ej: coffee/posters en sala 1 y 3
    // pero no en la 2, mientras en la 2 sigue habiendo una sesión real).
    const segments: { session: Session; minIdx: number; maxIdx: number }[] = [];
    groups.forEach(({ session }, key) => {
      const sorted = [...new Set(indicesByKey.get(key) ?? [])].sort((a, b) => a - b);
      let runStart = sorted[0];
      let prev = sorted[0];
      for (let i = 1; i <= sorted.length; i++) {
        const cur = sorted[i];
        if (cur === undefined || cur !== prev + 1) {
          segments.push({ session, minIdx: runStart, maxIdx: prev });
          if (cur !== undefined) runStart = cur;
        }
        prev = cur;
      }
    });
    return segments;
  })();

  // --- Full-width breaks: una franja por (título+horario), a todo el ancho
  // de la grilla sin importar en qué sala(s) esté cargada la sesión en SL.
  // Va debajo de las tarjetas reales (se dibuja antes en el DOM, sin z-index
  // propio) para que una sesión real concurrente en otra sala se siga viendo. ---
  const fullWidthGroups = (() => {
    const groups = new Map<string, Session>();
    allSessions.filter(isFullWidthBreak).forEach((s) => {
      const key = `${s.Session_Title}|${s.Session_Start_Time}|${s.Session_End_Time}`;
      if (!groups.has(key)) groups.set(key, s);
    });
    return Array.from(groups.values());
  })();

  // --- Scroll arrows ---
  const totalScrollW = TIME_COL_W + roomsOrdered.length * roomColW;
  const showLeft = scrollX > 4;
  const showRight = containerW > 0 && scrollX < totalScrollW - containerW - 4;

  const scrollBy = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * roomColW, behavior: "smooth" });
  };

  // --- Time range ---
  const allMinutes = allSessions.flatMap((s) => [
    timeToMinutes(s.Session_Start_Time),
    timeToMinutes(s.Session_End_Time),
  ]);
  const rawMin = Math.min(...allMinutes);
  const rawMax = Math.max(...allMinutes);
  const baseMin = Math.floor(rawMin / 60) * 60;
  const endMin = Math.ceil(rawMax / 60) * 60;
  const gridH = (endMin - baseMin) * PX_PER_MIN;

  const hours: number[] = [];
  for (let t = baseMin; t <= endMin; t += 60) hours.push(t);

  // --- All days sessions (used by PDF) ---
  const allDaysSessions = days.map((day) => {
    const dateStr = data.Programme.Days[day].Date_String;
    const date = parseDate(dateStr);
    const sessions: Session[] = Object.values(
      data.Programme.Days[day].Session_Groups,
    )
      .flatMap((g) => g.Sessions)
      .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));
    return { day, date, sessions };
  });

  // --- PDF generation ---
  const handlePrint = useCallback(async () => {
    await generateAgendaPDF(data, pdfOptions ?? {});
  }, [data, pdfOptions]);

  return (
    <div
      className="flex flex-col bg-gray-50 agenda-screen"
      style={{ height: "100dvh" }}>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .agenda-screen { display: none !important; }
          .agenda-print  { display: block !important; }
        }
        .agenda-print { display: none; }

        @keyframes pulse-arrow {
          0%, 100% { opacity: 1;     transform: translateY(-50%) scale(1); }
          50%       { opacity: 0.55; transform: translateY(-50%) scale(0.88); }
        }
        .arrow-pulse { animation: pulse-arrow 1.4s ease-in-out infinite; }

        @media print {
          body { margin: 0; font-family: sans-serif; }
          .agenda-print { padding: 24px; }
          .print-day-title {
            font-size: 16px; font-weight: 700; margin: 24px 0 8px;
            padding-bottom: 4px; border-bottom: 2px solid #7B1535; color: #7B1535;
          }
          .print-session {
            margin-bottom: 12px; padding: 8px 10px;
            border-left: 3px solid #E8C4CE; page-break-inside: avoid;
          }
          .print-session-header {
            font-size: 11px; color: #666; margin-bottom: 2px;
          }
          .print-session-title {
            font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px;
          }
          .print-chair { font-size: 11px; color: #7B1535; margin-bottom: 4px; }
          .print-presentation {
            font-size: 11px; color: #444; padding: 2px 0 2px 12px;
            border-left: 1px solid #ddd; margin-left: 4px;
          }
          .print-presentation-time { color: #7B1535; font-weight: 600; margin-right: 4px; }
        }
      `}</style>

      {/* ── Hidden print view ── */}
      <div className="agenda-print">
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          Agenda
        </h1>
        {allDaysSessions.map(({ day, date, sessions }) => (
          <div key={day}>
            <div className="print-day-title">
              {date.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            {sessions.map((s) => (
              <div key={s.Session_Id} className="print-session">
                <div className="print-session-header">
                  {s.Session_Start_Time} – {s.Session_End_Time}
                  {s.Session_Location ? ` · ${s.Session_Location}` : ""}
                </div>
                <div className="print-session-title">{s.Session_Title}</div>
                {s.Session_Chair && (
                  <div className="print-chair">Modera: {s.Session_Chair}</div>
                )}
                {s.Presentations?.map((p, i) => (
                  <div key={i} className="print-presentation">
                    {p.Start_Time && p.Start_Time !== "00:00" && (
                      <span className="print-presentation-time">
                        {p.Start_Time}
                      </span>
                    )}
                    {p.Presentation_Title}
                    {p.AllSpeakers?.length > 0 && (
                      <span style={{ color: "#888" }}>
                        {" — "}
                        {p.AllSpeakers.map((sp) => sp.Full_Name).join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Aviso de programa preliminar ── */}
      {preliminaryNotice && (
        <div className="flex-shrink-0 flex items-center justify-center py-1 bg-amber-100 border-b border-amber-200">
          <span className="text-[10px] font-bold tracking-wide text-amber-800 uppercase">
            {preliminaryNotice}
          </span>
        </div>
      )}

      {/* ── Day selector ── */}
      <div className="flex-shrink-0 flex items-center bg-white shadow-sm border-b border-gray-100">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-1">
          {days.map((day) => {
            const date = parseDate(data.Programme.Days[day].Date_String);
            const isSelected = selectedDay === day;
            const monthLabel = date
              .toLocaleDateString("es-ES", { month: "short" })
              .toUpperCase();
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedSession(null);
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 ${
                  isSelected
                    ? `${theme.primaryBg} text-white shadow-md scale-105`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={{ width: 64, height: 68 }}>
                <span className="text-[10px] font-bold opacity-75 tracking-wider">
                  {monthLabel}
                </span>
                <span className="text-2xl font-extrabold leading-none">
                  {date.getDate()}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 opacity-90" />
                )}
              </button>
            );
          })}
        </div>
        {logoSrc && (
          <img
            src={logoSrc}
            alt="logo"
            className="flex-shrink-0 h-[68px] w-auto object-contain pr-3"
          />
        )}
      </div>

      {/* ── SALAS bar ── */}
      <div
        className={`flex-shrink-0 flex items-center justify-center py-1 ${theme.primaryBg}`}>
        <span className="text-[10px] font-bold tracking-widest text-white uppercase opacity-90">
          Salas
        </span>
      </div>

      {/* ── Calendar grid + arrows ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Left arrow */}
        {showLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="arrow-pulse absolute left-0 top-1/2 z-50 flex items-center justify-center w-8 h-12 bg-white/90 shadow-md rounded-r-xl border border-gray-200"
            style={{ marginLeft: TIME_COL_W }}>
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Right arrow */}
        {showRight && (
          <button
            onClick={() => scrollBy(1)}
            className="arrow-pulse absolute right-0 top-1/2 z-50 flex items-center justify-center w-8 h-12 bg-white/90 shadow-md rounded-l-xl border border-gray-200">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="h-full overflow-auto"
          id="calendar-scroll"
          onScroll={handleScroll}>
          <div
            style={{ minWidth: TIME_COL_W + roomsOrdered.length * roomColW }}>
            {/* ── Sticky header: room names ── */}
            <div className="sticky top-0 z-30">
              <div className="flex" style={{ height: HEADER_H }}>
                <div
                  className={`flex-shrink-0 sticky left-0 z-40 ${theme.headerBg} border-b border-r border-gray-200`}
                  style={{ width: TIME_COL_W }}>
                  <div className="flex items-center justify-center h-full">
                    <Clock
                      className={`w-4 h-4 ${theme.iconColor} opacity-60`}
                    />
                  </div>
                </div>
                {roomsOrdered.map((room) => {
                  const roomColor = getRoomColor(room);
                  return (
                    <div
                      key={room}
                      className={`flex-shrink-0 flex items-center justify-center px-2 border-b border-r last:border-r-0 border-gray-200 ${roomColor ? "" : theme.headerBg}`}
                      style={{
                        width: roomColW,
                        ...(roomColor
                          ? {
                              backgroundColor: `${roomColor}1A`,
                              borderTop: `3px solid ${roomColor}`,
                            }
                          : {}),
                      }}>
                      <span
                        className={`text-[11px] font-bold ${roomColor ? "text-gray-800" : theme.primaryText} text-center uppercase tracking-wide leading-tight`}>
                        {room}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Content: time + sessions ── */}
            <div className="flex relative">
              <div
                className="flex-shrink-0 sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
                style={{ width: TIME_COL_W }}>
                <div className="relative" style={{ height: gridH }}>
                  {hours.map((t) => (
                    <div
                      key={t}
                      className="absolute w-full flex justify-end pr-2"
                      style={{
                        top:
                          (t - baseMin) * PX_PER_MIN -
                          (t === baseMin ? 0 : HOUR_LABEL_OFFSET),
                      }}>
                      <span className="text-[10px] font-semibold text-gray-400 tabular-nums">
                        {String(Math.floor(t / 60)).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms container */}
              <div className="flex flex-1 relative">
                {/* Full-width breaks layer: se pinta primero (sin z-index propio)
                    para quedar debajo de las tarjetas reales de cada sala. */}
                {fullWidthGroups.map((session) => {
                  const start = timeToMinutes(session.Session_Start_Time);
                  const end = timeToMinutes(session.Session_End_Time);
                  const top = (start - baseMin) * PX_PER_MIN;
                  const spanWidth = roomsOrdered.length * roomColW - 8;
                  const height = Math.max((end - start) * PX_PER_MIN, 36);
                  const availableForTitle = height - 4 - 24;
                  const fit = fitTitleFont(session.Session_Title, spanWidth - 12, availableForTitle);
                  // Si `cardColorRules` distingue este tipo de sesión (ej: Conferencias
                  // Plenarias), se respeta ese color en vez del ámbar genérico de break.
                  const ruleColor = cardColorRules?.find((r) => r.test(session))?.color;
                  return (
                    <button
                      key={session.Session_Id}
                      onClick={() => setSelectedSession(session)}
                      className={`absolute z-[5] rounded-xl text-left overflow-hidden transition-all duration-150 active:scale-95 hover:shadow-lg hover:brightness-95 shadow-md border ${ruleColor ? "bg-white" : "bg-amber-50 border-amber-200"}`}
                      style={{
                        left: 4,
                        width: spanWidth,
                        top: top + 2,
                        height: height - 4,
                        ...(ruleColor
                          ? { borderColor: `${ruleColor}55`, borderLeft: `3px solid ${ruleColor}` }
                          : {}),
                      }}>
                      <div className="p-1.5 flex flex-col items-center justify-center h-full">
                        <span
                          className={`text-[10px] font-bold leading-none mb-0.5 ${ruleColor ? "" : "text-amber-600"}`}
                          style={ruleColor ? { color: ruleColor } : undefined}>
                          {showTimeRange
                            ? `${session.Session_Start_Time} – ${session.Session_End_Time}`
                            : session.Session_Start_Time}
                        </span>
                        <span
                          className={`font-semibold text-center cursor-pointer hover:underline ${ruleColor ? "text-gray-800" : "text-amber-900"}`}
                          style={{ fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
                          {session.Session_Title}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {roomsOrdered.map((room) => {
                  const roomSessions = allSessions
                    .filter(
                      (s) =>
                        !isTransversalBreak(s.Session_Title) &&
                        !isFullWidthBreak(s) &&
                        (s.Session_Location?.trim() || "General") === room,
                    )
                    .sort(
                      (a, b) =>
                        timeToMinutes(a.Session_Start_Time) -
                        timeToMinutes(b.Session_Start_Time),
                    );
                  // Próximo inicio en la misma sala: tope seguro para poder
                  // agrandar una tarjeta sin invadir la siguiente sesión.
                  const nextStartById = new Map<string, number>();
                  roomSessions.forEach((s, i) => {
                    const next = roomSessions[i + 1];
                    nextStartById.set(
                      s.Session_Id,
                      next ? timeToMinutes(next.Session_Start_Time) : endMin,
                    );
                  });
                  return (
                    <div
                      key={room}
                      className="flex-shrink-0 border-r last:border-r-0 border-gray-200"
                      style={{ width: roomColW }}>
                      <div
                        className="relative bg-white"
                        style={{ height: gridH }}>
                        {hours.map((t) => (
                          <div
                            key={t}
                            className="absolute w-full border-t border-gray-100"
                            style={{ top: (t - baseMin) * PX_PER_MIN }}
                          />
                        ))}
                        {hours.slice(0, -1).map((t) => (
                          <div
                            key={`${t}-half`}
                            className="absolute w-full border-t border-gray-50"
                            style={{ top: (t - baseMin + 30) * PX_PER_MIN }}
                          />
                        ))}
                        {roomSessions.map((session) => {
                          const roomColor = getCardColor(session, room);
                          const start = timeToMinutes(session.Session_Start_Time);
                          const end = timeToMinutes(session.Session_End_Time);
                          const top = (start - baseMin) * PX_PER_MIN;
                          const titleWidthPx = roomColW - 20; // inset-x-1 + padding
                          const hasPresentations =
                            (session.Presentations?.length ?? 0) > 0;
                          const sessionTypeLabel =
                            showSessionType && session.Session_Type?.trim()
                              ? session.Session_Type.trim()
                              : null;
                          const SESSION_TYPE_H = sessionTypeLabel ? 13 : 0;

                          // Alto natural (según duración) y alto deseado para que el
                          // título entre completo con la tipografía fija (uniforme).
                          const naturalH = (end - start) * PX_PER_MIN;
                          const linesAtFixedFont = estimateLines(
                            session.Session_Title,
                            titleWidthPx,
                            FIXED_TITLE_FONT,
                          );
                          const neededH =
                            14 /* padding */ +
                            14 /* fila de horario */ +
                            SESSION_TYPE_H +
                            linesAtFixedFont * FIXED_TITLE_LINE_H +
                            (hasPresentations && !hideTalkCountBadge ? 17 : 0);
                          // Tope: no invadir la siguiente sesión de la misma sala.
                          const maxSafeH =
                            (nextStartById.get(session.Session_Id)! - start) *
                            PX_PER_MIN;
                          // El tope nunca debe superar maxSafeH (invadiría la
                          // siguiente sesión): un piso de 36 aquí, en vez de en
                          // el propio maxSafeH, generaba superposición visual
                          // cuando dos sesiones de la misma sala están a menos
                          // de 36px de distancia (franjas cortas y seguidas).
                          const height = Math.min(
                            Math.max(naturalH, 36, neededH),
                            Math.max(maxSafeH, 16),
                          );

                          const availableForTitle = height - 4 - 28 - SESSION_TYPE_H;
                          const fit = fitTitleFont(
                            session.Session_Title,
                            titleWidthPx,
                            availableForTitle,
                          );
                          const titleBlockH = fit.lines * fit.lineHeight;
                          const showBadge =
                            !hideTalkCountBadge &&
                            hasPresentations &&
                            availableForTitle - titleBlockH >= 14;
                          // Breaks (coffee, almuerzo, tiempo libre, etc.) no abren el modal:
                          // no tienen contenido propio que mostrar en el detalle.
                          const isBreakSession =
                            isBreak(session.Session_Title) ||
                            isRoomScopedBreak(session.Session_Title);
                          if (isBreakSession) {
                            return (
                              <div
                                key={session.Session_Id}
                                className="absolute inset-x-1 z-10 rounded-xl overflow-hidden shadow-sm bg-amber-50 border border-amber-200"
                                style={{ top: top + 2, height: height - 4 }}>
                                <div className="p-1.5 flex flex-col items-center justify-center h-full">
                                  <span className="text-[10px] font-bold leading-none mb-0.5 text-amber-600">
                                    {showTimeRange
                                      ? `${session.Session_Start_Time} – ${session.Session_End_Time}`
                                      : session.Session_Start_Time}
                                  </span>
                                  <span
                                    className="font-semibold text-amber-900 text-center"
                                    style={{ fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
                                    {session.Session_Title}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={session.Session_Id}
                              onClick={() => setSelectedSession(session)}
                              className={`absolute inset-x-1 z-10 rounded-xl text-left overflow-hidden transition-all duration-150 active:scale-95 hover:shadow-lg hover:brightness-95 shadow-sm ${roomColor ? "bg-white border" : `${theme.lightBg} border ${theme.lightBorder}`}`}
                              style={{
                                top: top + 2,
                                height: height - 4,
                                ...(roomColor
                                  ? {
                                      borderColor: `${roomColor}55`,
                                      borderLeft: `3px solid ${roomColor}`,
                                    }
                                  : {}),
                              }}>
                              <div className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                                <span
                                  className={`text-[10px] font-bold leading-none mb-0.5 ${roomColor ? "text-gray-500" : theme.primaryText}`}>
                                  {showTimeRange
                                    ? `${session.Session_Start_Time} – ${session.Session_End_Time}`
                                    : session.Session_Start_Time}
                                </span>
                                {sessionTypeLabel && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wide leading-none mb-0.5 text-gray-400">
                                    {sessionTypeLabel}
                                  </span>
                                )}
                                <span
                                  className={`font-semibold ${roomColor ? "text-gray-800" : theme.titleText} cursor-pointer hover:underline`}
                                  style={{ fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
                                  {session.Session_Title}
                                </span>
                                {showBadge && (
                                  <span
                                    className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium opacity-80 ${roomColor ? "text-gray-500" : theme.badgeText}`}>
                                    <Users className="w-2.5 h-2.5" />
                                    {session.Presentations.length} charla
                                    {session.Presentations.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Transversal breaks layer */}
                {transversalGroups.map(({ session, minIdx, maxIdx }) => {
                    const start = timeToMinutes(session.Session_Start_Time);
                    const end = timeToMinutes(session.Session_End_Time);
                    const top = (start - baseMin) * PX_PER_MIN;
                    const spanWidth = (maxIdx - minIdx + 1) * roomColW - 8;
                    const height = Math.max((end - start) * PX_PER_MIN, 36);
                    const availableForTitle = height - 4 - 24;
                    const fit = fitTitleFont(session.Session_Title, spanWidth - 12, availableForTitle);
                    return (
                      <button
                        key={`${session.Session_Id}-${minIdx}`}
                        onClick={() => setSelectedSession(session)}
                        className="absolute rounded-xl text-left overflow-hidden transition-all duration-150 active:scale-95 hover:shadow-lg hover:brightness-95 shadow-md bg-amber-50 border border-amber-200 z-10"
                        style={{
                          left: minIdx * roomColW + 4,
                          width: spanWidth,
                          top: top + 2,
                          height: height - 4,
                        }}>
                        <div className="p-1.5 flex flex-col items-center justify-center h-full">
                          <span className="text-[10px] font-bold leading-none mb-0.5 text-amber-600">
                            {showTimeRange
                              ? `${session.Session_Start_Time} – ${session.Session_End_Time}`
                              : session.Session_Start_Time}
                          </span>
                          <span
                            className="font-semibold text-amber-900 text-center cursor-pointer hover:underline"
                            style={{ fontSize: fit.fontSize, lineHeight: `${fit.lineHeight}px` }}>
                            {session.Session_Title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom nav ── */}
      {agendaHref && speakersHref && (
        <BottomNav
          agendaHref={agendaHref}
          speakersHref={speakersHref}
          primaryBg={theme.primaryBg}
          primaryText={theme.primaryText}
          onPrint={handlePrint}
        />
      )}

      {/* ── Session detail modal ── */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          theme={theme}
          facultyEndpoint={facultyEndpoint}
          sessionEndpoint={sessionEndpoint}
          onClose={() => setSelectedSession(null)}
          neutralText={neutralText}
          splitChairRoles={splitChairRoles}
        />
      )}
    </div>
  );
};

export default AgendaCalendar;
