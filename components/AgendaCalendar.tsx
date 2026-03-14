import React, { useState } from "react";
import { ProgrammeData, Session } from "@/type/type";
import { AgendaTheme } from "./AgendaTable";
import { Clock, Users } from "lucide-react";
import SessionDetailModal from "./SessionDetailModal";

// --- Layout constants ---
const PX_PER_MIN = 2;        // pixels per minute
const TIME_COL_W = 52;       // px – sticky left column
const ROOM_COL_W = 175;      // px – each room column (scrolls on mobile)
const HEADER_H = 44;         // px – room header row height
const HOUR_LABEL_OFFSET = 8; // px – shift label up from the hour line

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isBreak(title: string): boolean {
  const l = title.toLowerCase();
  return (
    l.includes("coffee") ||
    l.includes("café") ||
    l.includes("almuerzo") ||
    l.includes("lunch") ||
    l.includes("cena") ||
    l.includes("dinner") ||
    l.includes("cocktail") ||
    l.includes("receso") ||
    l.includes("registration") ||
    l.includes("registro")
  );
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
};

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  data,
  facultyEndpoint,
  theme: themeProp,
}) => {
  const theme: AgendaTheme = { ...defaultTheme, ...themeProp };

  const days = Object.keys(data.Programme.Days);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // --- Collect sessions for the selected day ---
  const allSessions: Session[] = Object.values(
    data.Programme.Days[selectedDay].Session_Groups
  ).flatMap((g) => g.Sessions);

  // Rooms: preserve order of first appearance, add "General" bucket for locationless sessions
  const roomsOrdered: string[] = [];
  allSessions.forEach((s) => {
    const loc = s.Session_Location?.trim() || "General";
    if (!roomsOrdered.includes(loc)) roomsOrdered.push(loc);
  });

  // --- Time range ---
  const allMinutes = allSessions.flatMap((s) => [
    timeToMinutes(s.Session_Start_Time),
    timeToMinutes(s.Session_End_Time),
  ]);
  const rawMin = Math.min(...allMinutes);
  const rawMax = Math.max(...allMinutes);
  const baseMin = Math.floor(rawMin / 60) * 60; // round down to full hour
  const endMin = Math.ceil(rawMax / 60) * 60;   // round up to full hour
  const totalMins = endMin - baseMin;
  const gridH = totalMins * PX_PER_MIN;

  // Hour tick marks
  const hours: number[] = [];
  for (let t = baseMin; t <= endMin; t += 60) hours.push(t);

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>

      {/* ── Day selector ── */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto bg-white shadow-sm border-b border-gray-100">
        {days.map((day) => {
          const dateStr = data.Programme.Days[day].Date_String;
          // Parse the date safely (avoid timezone shifts from new Date(dateStr))
          const [year, month, dayNum] = dateStr.split("-").map(Number);
          const date = new Date(year, month - 1, dayNum);
          const isSelected = selectedDay === day;
          const monthLabel = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();
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
              <span className="text-[10px] font-bold opacity-75 tracking-wider">{monthLabel}</span>
              <span className="text-2xl font-extrabold leading-none">{date.getDate()}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 opacity-90" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Calendar grid ── */}
      {/*
        Structure (enables both sticky-left and sticky-top):
          overflow-auto wrapper
            ├─ sticky-top header row (corner + room names)
            └─ content row
                 ├─ sticky-left time column
                 └─ room session columns
      */}
      <div className="flex-1 overflow-auto" id="calendar-scroll">

        {/* min-w: makes the inner div wider than the viewport so horizontal scroll works */}
        <div style={{ minWidth: TIME_COL_W + roomsOrdered.length * ROOM_COL_W }}>

          {/* ── Sticky header row: corner + room names ── */}
          <div
            className="flex sticky top-0 z-30"
            style={{ height: HEADER_H }}>

            {/* Corner cell */}
            <div
              className={`flex-shrink-0 sticky left-0 z-40 ${theme.headerBg} border-b border-r border-gray-200`}
              style={{ width: TIME_COL_W }}>
              <div className="flex items-center justify-center h-full">
                <Clock className={`w-4 h-4 ${theme.iconColor} opacity-60`} />
              </div>
            </div>

            {/* Room headers */}
            {roomsOrdered.map((room) => (
              <div
                key={room}
                className={`flex-shrink-0 flex items-center justify-center px-2 border-b border-r last:border-r-0 border-gray-200 ${theme.headerBg}`}
                style={{ width: ROOM_COL_W }}>
                <span className={`text-[11px] font-bold ${theme.primaryText} text-center uppercase tracking-wide leading-tight`}>
                  {room}
                </span>
              </div>
            ))}
          </div>

          {/* ── Content row: time labels + session columns ── */}
          <div className="flex">

            {/* Sticky time column */}
            <div
              className="flex-shrink-0 sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
              style={{ width: TIME_COL_W }}>
              <div className="relative" style={{ height: gridH }}>
                {hours.map((t) => (
                  <div
                    key={t}
                    className="absolute w-full flex justify-end pr-2"
                    style={{ top: (t - baseMin) * PX_PER_MIN - HOUR_LABEL_OFFSET }}>
                    <span className="text-[10px] font-semibold text-gray-400 tabular-nums">
                      {String(Math.floor(t / 60)).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room session columns */}
            {roomsOrdered.map((room) => {
              const roomSessions = allSessions.filter(
                (s) => (s.Session_Location?.trim() || "General") === room
              );
              return (
                <div
                  key={room}
                  className="flex-shrink-0 border-r last:border-r-0 border-gray-200"
                  style={{ width: ROOM_COL_W }}>
                  <div className="relative bg-white" style={{ height: gridH }}>

                    {/* Hour grid lines */}
                    {hours.map((t) => (
                      <div
                        key={t}
                        className="absolute w-full border-t border-gray-100"
                        style={{ top: (t - baseMin) * PX_PER_MIN }}
                      />
                    ))}

                    {/* Half-hour guide lines */}
                    {hours.slice(0, -1).map((t) => (
                      <div
                        key={`${t}-half`}
                        className="absolute w-full border-t border-gray-50"
                        style={{ top: (t - baseMin + 30) * PX_PER_MIN }}
                      />
                    ))}

                    {/* Session cards */}
                    {roomSessions.map((session) => {
                      const start = timeToMinutes(session.Session_Start_Time);
                      const end = timeToMinutes(session.Session_End_Time);
                      const top = (start - baseMin) * PX_PER_MIN;
                      const height = Math.max((end - start) * PX_PER_MIN, 36);
                      const breakSession = isBreak(session.Session_Title);
                      const hasPresentations = (session.Presentations?.length ?? 0) > 0;

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
                            {/* Start time */}
                            <span className={`text-[10px] font-bold leading-none mb-0.5 ${breakSession ? "text-amber-600" : theme.primaryText}`}>
                              {session.Session_Start_Time}
                            </span>

                            {/* Title */}
                            <span className={`text-[11px] font-semibold leading-tight flex-1 ${breakSession ? "text-amber-900" : "text-gray-800"} line-clamp-4`}>
                              {session.Session_Title}
                            </span>

                            {/* Presentations count badge */}
                            {hasPresentations && height > 50 && (
                              <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${theme.badgeText} opacity-80`}>
                                <Users className="w-2.5 h-2.5" />
                                {session.Presentations.length} charla{session.Presentations.length !== 1 ? "s" : ""}
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
