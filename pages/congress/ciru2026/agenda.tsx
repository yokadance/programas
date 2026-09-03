import {
  CIRU2026_PROGRAMME,
  CIRU2026_FACULTY,
  CIRU2026_SESSION,
} from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const CIRU2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(CIRU2026_PROGRAMME);
        if (!res.ok) {
          setError("Error al obtener los datos del programa");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <Loader src="/logos/ciru-logo.png" alt="Cargando agenda..." size={200} />
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data)
    return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={CIRU2026_FACULTY}
      sessionEndpoint={CIRU2026_SESSION}
      agendaHref="/congress/ciru2026/agenda"
      speakersHref="/congress/ciru2026/speakers"
      logoSrc="/logos/ciru-logo.png"
      preliminaryNotice="Programa preliminar"
      pdfOptions={{
        title: "AGENDA",
        subtitle: "CIRU 2026",
        footerText: "CIRU 2026  •  AGENDA OFICIAL",
        roomOrder: ["Sala Mansa"],
        facultyEndpoint: CIRU2026_FACULTY,
        accentColor: [27, 59, 95],
      }}
      roomScopedBreakPattern={/coffee|caf[eé]|tiempo libre/i}
      roomColors={["#1B3B5F", "#F5921F", "#29A98C"]}
      neutralText
      splitChairRoles
      showSessionType
      hideTalkCountBadge
      theme={{
        primaryBg: "bg-[#1B3B5F]",
        primaryText: "text-[#1B3B5F]",
        titleText: "text-[#1B3B5F]",
        iconColor: "text-[#29A98C]",
        lightBg: "bg-[#EAF3F1]",
        lightBorder: "border-[#BFE3DA]",
        badgeText: "text-[#F5921F]",
        headerBg: "bg-[#EAF3F1]",
        chairIconColor: "text-[#F5921F]",
      }}
    />
  );
};

export default CIRU2026Agenda;
