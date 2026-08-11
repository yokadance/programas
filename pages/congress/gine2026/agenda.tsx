import {
  GINE2026_PROGRAMME,
  GINE2026_FACULTY,
  GINE2026_SESSION,
} from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const GINE2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(GINE2026_PROGRAMME);
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
      <Loader src="/logos/gine-logo.png" alt="Cargando agenda..." size={200} />
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data)
    return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={GINE2026_FACULTY}
      sessionEndpoint={GINE2026_SESSION}
      agendaHref="/congress/gine2026/agenda"
      speakersHref="/congress/gine2026/speakers"
      logoSrc="/logos/gine-logo.png"
      preliminaryNotice="Programa preliminar"
      pdfOptions={{
        title: "AGENDA",
        subtitle: "GINECOLOGÍA 2026",
        footerText: "GINECOLOGÍA 2026  •  AGENDA OFICIAL",
        roomOrder: ["Auditorio 3", "Auditorio 4", "Jagüel 1", "Jagüel 2", "Foyer"],
        facultyEndpoint: GINE2026_FACULTY,
        accentColor: [207, 47, 129],
      }}
      roomScopedBreakPattern={/coffee|caf[eé]|tiempo libre/i}
      roomColors={["#CF2F81", "#5DC0CC", "#A94A95", "#D25420"]}
      neutralText
      splitChairRoles
      theme={{
        primaryBg: "bg-[#CF2F81]",
        primaryText: "text-[#CF2F81]",
        titleText: "text-[#A94A95]",
        iconColor: "text-[#CF2F81]",
        lightBg: "bg-[#FDEAF3]",
        lightBorder: "border-[#F5C4DE]",
        badgeText: "text-[#D25420]",
        headerBg: "bg-[#FDEAF3]",
        chairIconColor: "text-[#5DC0CC]",
      }}
    />
  );
};

export default GINE2026Agenda;
