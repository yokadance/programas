import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProgrammeData, Session, AgendaTheme } from "@/type/type";
import { Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";
import SessionDetailModal from "./SessionDetailModal";
import BottomNav from "./BottomNav";
import { generateAgendaPDF, isBreak, parseDate } from "@/utils/generateAgendaPDF";

// --- Layout constants ---
const PX_PER_MIN = 2;
const TIME_COL_W = 52;
const HEADER_H = 44;
const HOUR_LABEL_OFFSET = 8;
const DESKTOP_ROOM_W = 175;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
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
  theme?: Partial<AgendaTheme>;
  agendaHref?: string;
  speakersHref?: string;
  logoSrc?: string;
};

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  data,
  facultyEndpoint,
  theme: themeProp,
  agendaHref,
  speakersHref,
  logoSrc,
}) => {
  const theme: AgendaTheme = { ...defaultTheme, ...themeProp };

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

  const roomsOrdered: string[] = [];
  allSessions.forEach((s) => {
    const loc = s.Session_Location?.trim() || "General";
    if (!roomsOrdered.includes(loc)) roomsOrdered.push(loc);
  });

  const roomColW = (() => {
    if (!containerW) return DESKTOP_ROOM_W;
    if (isMobile) return containerW - TIME_COL_W;
    // Desktop: fill available width, minimum 220px per column
    const available = containerW - TIME_COL_W;
    const dynamic = Math.floor(available / roomsOrdered.length);
    return Math.max(220, dynamic);
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
    await generateAgendaPDF(data, {
      coverImagePath: "/portadas/portada-cc.jpg",
      title: "AGENDA",
      subtitle: "42° Congreso Uruguayo de Cardiología  •  CardioSUC 2026",
      filename: "agenda-cardiosuc2026.pdf",
      footerText: "CARDIOSUC 2026  •  AGENDA OFICIAL",
    });
  }, [data]);

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
            className="flex-shrink-0 h-10 w-auto object-contain pr-3"
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
                {roomsOrdered.map((room) => (
                  <div
                    key={room}
                    className={`flex-shrink-0 flex items-center justify-center px-2 border-b border-r last:border-r-0 border-gray-200 ${theme.headerBg}`}
                    style={{ width: roomColW }}>
                    <span
                      className={`text-[11px] font-bold ${theme.primaryText} text-center uppercase tracking-wide leading-tight`}>
                      {room}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Content: time + sessions ── */}
            <div className="flex">
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

              {roomsOrdered.map((room) => {
                const roomSessions = allSessions.filter(
                  (s) => (s.Session_Location?.trim() || "General") === room,
                );
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
                        const start = timeToMinutes(session.Session_Start_Time);
                        const end = timeToMinutes(session.Session_End_Time);
                        const top = (start - baseMin) * PX_PER_MIN;
                        const height = Math.max((end - start) * PX_PER_MIN, 36);
                        const breakSession = isBreak(session.Session_Title);
                        const hasPresentations =
                          (session.Presentations?.length ?? 0) > 0;
                        return (
                          <button
                            key={session.Session_Id}
                            onClick={() => setSelectedSession(session)}
                            className={`absolute inset-x-1 rounded-xl text-left overflow-hidden transition-all duration-150 active:scale-95 hover:brightness-95 shadow-sm ${
                              breakSession
                                ? "bg-amber-50 border border-amber-200"
                                : `${theme.lightBg} border ${theme.lightBorder}`
                            }`}
                            style={{ top: top + 2, height: height - 4 }}>
                            <div className="p-1.5 flex flex-col h-full">
                              <span
                                className={`text-[10px] font-bold leading-none mb-0.5 ${breakSession ? "text-amber-600" : theme.primaryText}`}>
                                {session.Session_Start_Time}
                              </span>
                              <span
                                className={`text-[11px] font-semibold leading-tight flex-1 ${breakSession ? "text-amber-900" : "text-gray-800"} line-clamp-4`}>
                                {session.Session_Title}
                              </span>
                              {hasPresentations && height > 50 && (
                                <span
                                  className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${theme.badgeText} opacity-80`}>
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
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default AgendaCalendar;
