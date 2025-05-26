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
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
              selectedDay === day
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {new Date(data.Programme.Days[day].Date_String).toLocaleDateString(
              "es-ES",
              { weekday: "short", day: "2-digit", month: "short" }
            )}
          </button>
        ))}
      </div>

      {/* 🖥️ Vista de tabla para escritorio */}
      <div className="overflow-x-auto rounded-xl shadow-lg ring-1 ring-gray-200 hidden md:block">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-blue-50 text-gray-700 uppercase text-xs tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left">Hora</th>
              <th className="px-4 py-3 text-left">Sesión</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3 text-left">Oradores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session, index) => (
              <tr key={index} className="hover:bg-blue-50 transition">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                  {session.Session_Start_Time} - {session.Session_End_Time}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">
                    {session.Session_Title}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {session.Session_Type}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {session.Session_Location}
                </td>
                <td className="px-4 py-3">
                  {session.Presentations?.length ? (
                    <div className="space-y-4">
                      <div className="text-xs text-gray-500 font-medium">
                        Presentación:
                      </div>
                      {session.Presentations.map((presentation, pIdx) => (
                        <div key={pIdx}>
                          <div className="text-sm font-medium text-blue-700 mb-1">
                            {presentation.Presentation_Title}
                          </div>
                          <ul className="space-y-2">
                            {presentation.AllSpeakers.map((spk, i) => (
                              <li key={i} className="flex items-center gap-3">
                                <img
                                  src={spk.Image01 || "/user-avatar.png"}
                                  alt={spk.Full_Name}
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-300"
                                />
                                <span className="text-gray-800">
                                  {spk.Full_Name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">
                      {session.Session_Chair || "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Vista tipo tarjeta para celulares */}
      <div className="block md:hidden space-y-4">
        {sessions.map((session, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
          >
            <div className="text-sm text-gray-500 mb-2">
              {session.Session_Start_Time} - {session.Session_End_Time}
            </div>
            <div className="font-semibold text-gray-900 text-base">
              {session.Session_Title}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {session.Session_Type}
            </div>
            <div className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Ubicación:</span>{" "}
              {session.Session_Location}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Oradores:</span>
              <div className="mt-1 space-y-2">
                {session.Presentations?.length ? (
                  <div className="space-y-4">
                    <span className="font-medium">Presentación:</span>
                    {session.Presentations.map((presentation, pIdx) => (
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
                              <span>{spk.Full_Name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="italic text-gray-500">
                    {session.Session_Chair || "—"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgendaTable;
