import { ProgrammeData, Session } from "@/type/type";
import React, { useState } from "react";

type AgendaTableProps = {
  data: ProgrammeData;
};

const AgendaTable: React.FC<AgendaTableProps> = ({ data }) => {
  const days = Object.keys(data.Programme.Days);
  const [selectedDay, setSelectedDay] = useState(days[0]);

  const sessions: Session[] = Object.values(
    data.Programme.Days[selectedDay].Session_Groups
  )
    .flatMap((group) => group.Sessions)
    .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Botones de días */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-full font-medium ${
              selectedDay === day
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}>
            {new Date(data.Programme.Days[day].Date_String).toLocaleDateString(
              "es-ES",
              {
                weekday: "short",
                day: "2-digit",
                month: "short",
              }
            )}
          </button>
        ))}
      </div>

      {/* Tabla de agenda */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto shadow-md">
          <thead className="bg-blue-100">
            <tr>
              <th className="border px-4 py-2 text-left">Hora</th>
              <th className="border px-4 py-2 text-left">Sesión</th>
              <th className="border px-4 py-2 text-left">Ubicación</th>
              <th className="border px-4 py-2 text-left">Oradores</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr key={index} className="hover:bg-blue-50">
                <td className="border px-4 py-2 whitespace-nowrap">
                  {session.Session_Start_Time} - {session.Session_End_Time}
                </td>
                <td className="border px-4 py-2">
                  <div className="font-semibold">{session.Session_Title}</div>
                  <div className="text-sm text-gray-600">
                    {session.Session_Type}
                  </div>
                </td>
                <td className="border px-4 py-2">{session.Session_Location}</td>
                <td className="border px-4 py-2 space-y-2">
                  {session.Presentations?.[0]?.AllSpeakers?.map((spk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {spk.Image01 && (
                        <img
                          src={spk.Image01}
                          alt={spk.Full_Name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span>{spk.Full_Name}</span>
                    </div>
                  )) || <span>{session.Session_Chair || "—"}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgendaTable;
