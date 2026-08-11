import { Authors, ProgrammeData, Session } from "@/type/type";
import { getCountryLabel } from "@/utils/countryLabel";
import React, { useState } from "react";
import { useFacultyTitles } from "@/hooks/useFacultyTitles";
import {
  Clock,
  MapPin,
  UserRound,
  CoffeeIcon,
  Utensils,
  Presentation,
  ArrowRight,
  Martini,
  UtensilsCrossed,
} from "lucide-react";

import FacultyModal from "./FacultyModal";
import { parseDate } from "@/utils/generateAgendaPDF";

const DEFAULT_PRIMARY = "#7B1535";

type HeaderImage = {
  src: string;
  alt: string;
  className?: string;
};

const DEFAULT_HEADER_IMAGES: HeaderImage[] = [
  { src: "/portadas/cc2026/cabe1.png", alt: "CardioSUC", className: "h-9 md:h-14 w-auto object-contain flex-shrink-0" },
  { src: "/portadas/cc2026/cabe2.jpg", alt: "7 al 9 de mayo — Radisson Montevideo", className: "h-7 md:h-10 w-auto object-contain flex-shrink-0" },
  { src: "/portadas/cc2026/cabe3.jpg", alt: "Sociedad Uruguaya de Cardiología", className: "h-9 md:h-14 w-auto object-contain flex-shrink-0" },
];

type AgendaTableProps = {
  data: ProgrammeData;
  facultyEndpoint?: string;
  primaryColor?: string;
  headerImages?: HeaderImage[];
  /**
   * Usa un gris oscuro para el texto (títulos, coordinadores, speakers) en vez
   * de `primaryColor`. Útil cuando `primaryColor` es un tono muy saturado
   * (ej: rosa vivo) que resulta ilegible en bloques largos de texto — el color
   * de marca queda solo en íconos, fondos y badges.
   */
  neutralText?: boolean;
};

const titlePattern = /^(Dr|Dra|Prof|Lic|Mg|PhD)[\.\s]/i;

const getSpeakerName = (
  spk: { Faculty_Id?: string; First_Name: string; Family_Name: string; Full_Name?: string; Prefix_Title?: string },
  titlesMap?: Map<string, string>,
): string => {
  if (titlePattern.test(spk.First_Name?.trim() || "")) {
    return `${spk.First_Name} ${spk.Family_Name}`;
  }
  const prefix = spk.Prefix_Title || (spk.Faculty_Id ? titlesMap?.get(spk.Faculty_Id) : undefined);
  if (prefix) {
    return `${prefix} ${spk.First_Name} ${spk.Family_Name}`;
  }
  if (spk.Full_Name && titlePattern.test(spk.Full_Name.trim())) {
    return spk.Full_Name;
  }
  return `${spk.First_Name} ${spk.Family_Name}`;
};

const formatChairs = (session: Session, titlesMap?: Map<string, string>): string | null => {
  if (session.Session_Faculty?.length > 0) {
    return session.Session_Faculty
      .slice()
      .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
      .map((f) => {
        const alreadyHasTitle = titlePattern.test(f.First_Name?.trim() || "");
        const prefix = !alreadyHasTitle
          ? (f.Prefix_Title || (f.Faculty_Id ? titlesMap?.get(f.Faculty_Id) : undefined) || "")
          : "";
        return `${prefix ? prefix + " " : ""}${f.First_Name} ${f.Family_Name}`.trim();
      })
      .join(", ");
  }
  if (!session.Session_Chair) return null;
  const parts = session.Session_Chair.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  const unique = [...new Set(parts)];
  unique.sort((a, b) => {
    const lastA = a.split(/\s+/).at(-1) ?? a;
    const lastB = b.split(/\s+/).at(-1) ?? b;
    return lastA.localeCompare(lastB, "es", { sensitivity: "base" });
  });
  return unique.join(", ");
};

const AgendaTable: React.FC<AgendaTableProps> = ({ data, facultyEndpoint, primaryColor, headerImages, neutralText }) => {
  const PRIMARY = primaryColor ?? DEFAULT_PRIMARY;
  const TEXT = neutralText ? "#1F2937" : PRIMARY;
  const resolvedHeaderImages = headerImages ?? DEFAULT_HEADER_IMAGES;
  const titlesMap = useFacultyTitles(facultyEndpoint);
  const days = Object.keys(data.Programme.Days);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSpeakerModal = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setIsModalOpen(true);
  };
  const closeSpeakerModal = () => {
    setSelectedFacultyId(null);
    setIsModalOpen(false);
  };

  const allSessions: Session[] = Object.values(
    data.Programme.Days[selectedDay].Session_Groups,
  )
    .flatMap((group) => group.Sessions)
    .sort((a, b) => {
      const timeComp = a.Session_Start_Time.localeCompare(b.Session_Start_Time);
      if (timeComp !== 0) return timeComp;
      const roomKey = (r: string | null) =>
        !r || r.toLowerCase() === "foyer" ? `0_${r ?? ""}` : `1_${r}`;
      return roomKey(a.Session_Location).localeCompare(roomKey(b.Session_Location), "es", { sensitivity: "base" });
    });

  const uniqueRooms = Array.from(
    new Set(allSessions.map((s) => s.Session_Location).filter(Boolean)),
  ).sort((a, b) => a!.localeCompare(b!, "es", { sensitivity: "base" }));

  const sessions = selectedRoom
    ? allSessions.filter((s) => s.Session_Location === selectedRoom)
    : allSessions;

  const getIcon = (title: string) => {
    const l = title.toLowerCase();
    if (/\bcena\b/.test(l))
      return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
    if (/\bcocktail\b/.test(l))
      return <Martini className="w-4 h-4 text-orange-500" />;
    if (/\balmuerzo\b/.test(l))
      return <Utensils className="w-4 h-4 text-yellow-500" />;
    if (/\bcoffee\b/.test(l) || /\bcafé\b/.test(l))
      return <CoffeeIcon className="w-4 h-4 text-amber-700" />;
    return <Presentation className="w-4 h-4" style={{ color: PRIMARY }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── CABEZAL ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-3 md:gap-6">
          {resolvedHeaderImages.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className={img.className ?? "h-9 md:h-14 w-auto object-contain flex-shrink-0"}
            />
          ))}
        </div>
      </header>

      {/* ── SELECTOR DE DÍAS ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {days.map((day) => {
            const date = parseDate(data.Programme.Days[day].Date_String);
            const isSelected = selectedDay === day;
            const weekday = date
              .toLocaleDateString("es-ES", { weekday: "short" })
              .toUpperCase();
            const dayNum = date.getDate();
            const month = date
              .toLocaleDateString("es-ES", { month: "short" })
              .toUpperCase();
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedRoom(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={
                  isSelected
                    ? {
                        backgroundColor: PRIMARY,
                        color: "white",
                        boxShadow: "0 2px 8px rgba(123,21,53,0.3)",
                      }
                    : { backgroundColor: "#F3F4F6", color: "#374151" }
                }>
                <span className="opacity-70 text-xs">{weekday}</span>
                <span className="text-base font-extrabold leading-none">
                  {dayNum}
                </span>
                <span className="opacity-70 text-xs">{month}</span>
              </button>
            );
          })}
        </div>

        {/* ── FILTRO POR SALA ── */}
        {uniqueRooms.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedRoom(null)}
              className="px-3 py-1 text-xs font-semibold rounded-full border transition-all"
              style={
                selectedRoom === null
                  ? {
                      backgroundColor: PRIMARY,
                      color: "white",
                      borderColor: PRIMARY,
                    }
                  : {
                      backgroundColor: "white",
                      color: "#6B7280",
                      borderColor: "#D1D5DB",
                    }
              }>
              Todas las salas
            </button>
            {uniqueRooms.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className="px-3 py-1 text-xs font-semibold rounded-full border transition-all"
                style={
                  selectedRoom === room
                    ? {
                        backgroundColor: PRIMARY,
                        color: "white",
                        borderColor: PRIMARY,
                      }
                    : {
                        backgroundColor: "white",
                        color: "#6B7280",
                        borderColor: "#D1D5DB",
                      }
                }>
                {room}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Wrapper con márgenes laterales ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 🖥️ Vista de tabla — desktop */}
        <div className="overflow-x-auto rounded-xl shadow-sm ring-1 ring-gray-200 hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead
              className="uppercase text-xs tracking-wider sticky top-0 z-10"
              style={{ backgroundColor: "#F9EDF1", color: TEXT }}>
              <tr>
                <th className="px-4 py-3 text-left font-bold">Hora</th>
                <th className="px-4 py-3 text-left font-bold">Sesión</th>
                <th className="px-4 py-3 text-left font-bold">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr
                  key={index}
                  className="align-top border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-700 w-36 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: PRIMARY }}
                      />
                      <span className="text-xs">
                        {session.Session_Start_Time} –{" "}
                        {session.Session_End_Time}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 w-3/5">
                    <div
                      className="flex items-start gap-2 mb-1 font-semibold"
                      style={{ color: TEXT }}>
                      <span className="mt-0.5 flex-shrink-0">
                        {getIcon(session.Session_Title)}
                      </span>
                      {session.Session_Title}
                    </div>
                    {formatChairs(session, titlesMap) && (
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <UserRound
                          className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"
                          style={{ color: PRIMARY }}
                        />
                        Coordinan:
                        <span
                          className="ml-1 font-medium"
                          style={{ color: TEXT }}>
                          {formatChairs(session, titlesMap)}
                        </span>
                      </div>
                    )}
                    <div className="space-y-3 mt-3 px-1">
                      {session.Presentations?.slice()
                        .sort(
                          (a, b) =>
                            a.Start_Time.localeCompare(b.Start_Time) ||
                            a.Sequence_Number.localeCompare(b.Sequence_Number),
                        )
                        .map((presentation, pIdx) => (
                          <div
                            key={pIdx}
                            className={`pl-4 relative ${pIdx !== 0 ? "border-t border-gray-100 mt-3 pt-3" : "mt-2"}`}>
                            <div className="relative pl-4">
                              {presentation.Presentation_Title && (
                                <ArrowRight
                                  className="absolute left-0 top-1 w-3.5 h-3.5"
                                  style={{ color: PRIMARY }}
                                />
                              )}
                              <div className="ml-2 text-sm text-gray-800 font-medium">
                                {presentation.Start_Time &&
                                  presentation.Start_Time !== "00:00" && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-1 mr-2">
                                      <Clock className="w-3 h-3" />
                                      {presentation.Start_Time}
                                    </span>
                                  )}
                                {presentation.Presentation_Title}
                                {presentation.Abstract.Authors.length > 0 &&
                                  (() => {
                                    const presentingAuthor =
                                      presentation.Abstract.Authors.find(
                                        (a: Authors) => a.Presenting === "1",
                                      ) || presentation.Abstract.Authors[0];
                                    const otherAuthors =
                                      presentation.Abstract.Authors.filter(
                                        (a: Authors) => a !== presentingAuthor,
                                      );
                                    return (
                                      <>
                                        <div
                                          className="mt-2 text-xs font-semibold px-2 py-1 rounded w-fit"
                                          style={{
                                            color: TEXT,
                                            backgroundColor: "#F9EDF1",
                                          }}>
                                          Presentador:{" "}
                                          {presentingAuthor.First_Name}{" "}
                                          {presentingAuthor.Family_Name} –{" "}
                                          {presentingAuthor.Country_Name} –{" "}
                                          {presentingAuthor.Company}
                                        </div>
                                        {otherAuthors.length > 0 && (
                                          <ul className="list-disc list-inside text-xs text-gray-600 mt-2">
                                            {otherAuthors.map(
                                              (
                                                author: Authors,
                                                idx: number,
                                              ) => (
                                                <li key={idx}>
                                                  {author.First_Name}{" "}
                                                  {author.Family_Name} –{" "}
                                                  {author.Country_Name} –{" "}
                                                  {author.Company}
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        )}
                                      </>
                                    );
                                  })()}
                              </div>
                              <ul className="mt-2 space-y-1 ml-2">
                                {presentation.AllSpeakers.slice()
                                  .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
                                  .map((spk, i) => (
                                    <li
                                      key={i}
                                      className="flex items-center gap-2">
                                      <img
                                        src={spk.Image01 || "/user-avatar.png"}
                                        alt={spk.Full_Name}
                                        className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0"
                                      />
                                      <button
                                        onClick={() => openSpeakerModal(spk.Faculty_Id)}
                                        className="text-sm hover:underline text-left font-medium"
                                        style={{ color: TEXT }}>
                                        {(() => {
                                          const name = getSpeakerName(spk, titlesMap);
                                          const country = getCountryLabel(spk.Country_Name);
                                          return country ? `${name} (${country})` : name;
                                        })()}
                                      </button>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 w-44 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: PRIMARY }}
                      />
                      {session.Session_Location || "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Vista móvil */}
        <div className="block md:hidden space-y-4">
          {sessions.map((session, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                <Clock
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: PRIMARY }}
                />
                {session.Session_Start_Time} – {session.Session_End_Time}
              </div>
              <div
                className="flex items-start gap-2 text-base font-semibold mb-1"
                style={{ color: TEXT }}>
                <span className="mt-0.5 flex-shrink-0">
                  {getIcon(session.Session_Title)}
                </span>
                {session.Session_Title}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                <MapPin
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: PRIMARY }}
                />
                {session.Session_Location || "—"}
              </div>
              {formatChairs(session, titlesMap) && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium mb-3"
                  style={{ color: TEXT }}>
                  <UserRound
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: PRIMARY }}
                  />
                  Coordinan: {formatChairs(session, titlesMap)}
                </div>
              )}
              <div className="mt-1 space-y-3">
                {session.Presentations?.length ? (
                  session.Presentations.slice()
                    .sort(
                      (a, b) =>
                        a.Start_Time.localeCompare(b.Start_Time) ||
                        a.Sequence_Number.localeCompare(b.Sequence_Number),
                    )
                    .map((presentation, pIdx) => (
                      <div key={pIdx}>
                        <div
                          className="text-sm font-medium mb-1 ml-2 relative pl-6"
                          style={{ color: TEXT }}>
                          <ArrowRight
                            className="absolute left-0 top-1 w-3.5 h-3.5"
                            style={{ color: PRIMARY }}
                          />
                          {presentation.Start_Time &&
                            presentation.Start_Time !== "00:00" && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-1 mr-2">
                                <Clock className="w-3 h-3" />
                                {presentation.Start_Time}
                              </span>
                            )}
                          {presentation.Presentation_Title}
                        </div>
                        <div className="space-y-2">
                          {presentation.AllSpeakers.slice()
                            .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
                            .map((spk, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 ml-8">
                              <img
                                src={spk.Image01 || "/user-avatar.png"}
                                alt={spk.Full_Name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0"
                              />
                              <button
                                onClick={() => openSpeakerModal(spk.Faculty_Id)}
                                className="text-sm hover:underline text-left font-medium"
                                style={{ color: TEXT }}>
                                {(() => {
                                  const name = getSpeakerName(spk, titlesMap);
                                  const country = getCountryLabel(spk.Country_Name);
                                  return country ? `${name} (${country})` : name;
                                })()}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <span className="italic text-gray-400 text-xs">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* end max-w-6xl wrapper */}
      {isModalOpen && selectedFacultyId && (
        <FacultyModal
          facultyId={selectedFacultyId}
          endpointUrl={facultyEndpoint ?? ""}
          onClose={closeSpeakerModal}
        />
      )}
    </div>
  );
};

export default AgendaTable;
