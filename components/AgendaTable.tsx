import { Authors, ProgrammeData, Session, Speaker } from "@/type/type";
import React, { useState } from "react";
import {
  Clock,
  Mic,
  MapPin,
  UserRound,
  CoffeeIcon,
  Sandwich,
  Utensils,
  Presentation,
  ArrowRight,
  Glasses,
  Martini,
  UtensilsCrossed,
} from "lucide-react";

import parse from "html-react-parser";
import FacultyModal from "./FacultyModal";
import { Author } from "next/dist/lib/metadata/types/metadata-types";

type AgendaTableProps = {
  data: ProgrammeData;
  facultyEndpoint?: string; // Opcional, si se quiere usar otro endpoint
};

const AgendaTable: React.FC<AgendaTableProps> = ({ data, facultyEndpoint }) => {
  const days = Object.keys(data.Programme.Days);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const allSessions: Session[] = Object.values(
    data.Programme.Days[selectedDay].Session_Groups
  )
    .flatMap((group) => group.Sessions)
    .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));

  const uniqueRooms = Array.from(
    new Set(allSessions.map((s) => s.Session_Location).filter(Boolean))
  );

  const sessions = selectedRoom
    ? allSessions.filter((s) => s.Session_Location === selectedRoom)
    : allSessions;

  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("cena"))
      return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
    if (lower.includes("cocktail"))
      return <Martini className="w-4 h-4 text-orange-500" />;
    if (lower.includes("almuerzo"))
      return <Utensils className="w-4 h-4 text-yellow-500" />;
    if (
      lower.includes("coffee") ||
      lower.includes("coffee") ||
      lower.includes("café")
    )
      return <CoffeeIcon className="w-4 h-4 text-amber-900" />;
    return <Presentation className="w-4 h-4 text-blue-500" />;
  };

  const [selectedSpeaker, setSelectedSpeaker] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null
  );

  const openSpeakerModal = (speaker: Speaker) => {
    console.log("Abriendo modal para speaker:", speaker.Faculty_Id);

    setSelectedFacultyId(speaker.Faculty_Id); // o el campo que identifica al speaker para tu API
    setIsModalOpen(true);
  };

  const closeSpeakerModal = () => {
    setSelectedFacultyId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Botones de días */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => {
              setSelectedDay(day);
              setSelectedRoom(null);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
              selectedDay === day
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}>
            {new Date(data.Programme.Days[day].Date_String).toLocaleDateString(
              "es-ES",
              { weekday: "short", day: "2-digit", month: "short" }
            )}
          </button>
        ))}
      </div>

      {/* Filtro por sala */}
      {uniqueRooms.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedRoom(null)}
            className={`px-4 py-1.5 text-sm rounded-full border ${
              selectedRoom === null
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}>
            Todas las salas
          </button>
          {uniqueRooms.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-1.5 text-sm rounded-full border ${
                selectedRoom === room
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}>
              {room}
            </button>
          ))}
        </div>
      )}

      {/* 🖥️ Vista de tabla */}
      <div className="overflow-x-auto rounded-xl shadow-lg ring-1 ring-gray-200 hidden md:block">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-blue-50 text-gray-700 uppercase text-xs tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left">Hora</th>
              <th className="px-4 py-3 text-left">Sesión</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr key={index} className="align-top border-t border-gray-200">
                <td className="px-4 py-4 font-medium text-gray-800 w-32 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {session.Session_Start_Time} - {session.Session_End_Time}
                  </div>
                </td>
                <td className="px-4 py-4 w-3/5">
                  <div className="flex items-center gap-2 mb-1 text-blue-900 font-semibold">
                    <span className="w-4 h-4 text-blue-500 flex-shrink-0">
                      {typeof getIcon(session.Session_Title) === "string"
                        ? getIcon(session.Session_Title)
                        : getIcon(session.Session_Title)}
                    </span>
                    {session.Session_Title}
                  </div>
                  {session.Session_Chair && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <UserRound className="w-4 h-4 mr-2 text-blue-400" />
                      Coordina y modera:
                      <span className="ml-1 text-blue-700 font-medium">
                        {session.Session_Chair}
                      </span>
                    </div>
                  )}
                  <div className="space-y-3 mt-3 px-1">
                    {session.Presentations?.map((presentation, pIdx) => (
                      <div
                        key={pIdx}
                        className={`pl-4 relative ${
                          pIdx !== 0
                            ? "border-t border-gray-100 mt-3 pt-3"
                            : "mt-2"
                        }`}>
                        <div className="relative pl-4">
                          <ArrowRight className="absolute left-0 top-1 w-4 h-4 text-blue-500" />
                          <div className="ml-2 text-sm text-gray-800 font-medium">
                            {presentation.Presentation_Title}
                            <ul className="list-disc list-inside text-xs text-gray-600">
                              {presentation.Abstract.Authors.map(
                                (author: Authors, index: number) => (
                                  <li key={index}>
                                    {author.First_Name} {author.Family_Name} -{" "}
                                    {author.Country_Name} - {author.Company}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <ul className="mt-2 space-y-1 ml-2">
                            {presentation.AllSpeakers.map((spk, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <img
                                  src={spk.Image01 || "/user-avatar.png"}
                                  alt={spk.Full_Name}
                                  className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-300"
                                />
                                <button
                                  onClick={() => openSpeakerModal(spk)}
                                  className="text-sm text-blue-700 hover:underline text-left">
                                  {spk.Full_Name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 w-48 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {session.Session_Location || "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Vista móvil */}
      {/* 📱 Vista móvil */}
      <div className="block md:hidden space-y-4">
        {sessions.map((session, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            {/* Hora */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              {session.Session_Start_Time} - {session.Session_End_Time}
            </div>

            {/* Título con ícono */}
            <div className="flex items-center gap-2 text-base text-gray-900 font-semibold mb-1">
              <span className="w-4 h-4 text-blue-500 flex-shrink-0">
                {getIcon(session.Session_Title)}
              </span>
              {session.Session_Title}
            </div>

            {/* Tipo de sesión */}
            <div className="text-xs text-gray-600 mb-2">
              {session.Session_Type}
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
              <MapPin className="w-4 h-4 text-blue-500" />
              {session.Session_Location || "—"}
            </div>

            {/* Coordinador/Moderador */}
            {session.Session_Chair && (
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-3">
                <UserRound className="w-4 h-4" />
                Coordina y modera: <span>{session.Session_Chair}</span>
              </div>
            )}

            {/* Oradores */}
            <div className="text-sm text-gray-700">
              <span className="font-medium">Oradores:</span>
              <div className="mt-1 space-y-3">
                {session.Presentations?.length ? (
                  session.Presentations.map((presentation, pIdx) => (
                    <div key={pIdx}>
                      <div className="text-sm font-medium text-blue-700 mb-1">
                        {presentation.Presentation_Title}
                      </div>
                      <div className="space-y-2">
                        {presentation.AllSpeakers.map((spk, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img
                              src={spk.Image01 || "/user-avatar.png"}
                              alt={spk.Full_Name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-300"
                            />
                            <button
                              onClick={() => openSpeakerModal(spk)}
                              className="text-blue-700 hover:underline text-left">
                              {spk.Full_Name}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="italic text-gray-500">—</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
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
