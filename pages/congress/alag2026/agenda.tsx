import { ALAG2026_PROGRAMME, ALAG2026_FACULTY, ALAG2026_SESSION } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const ALAG2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(ALAG2026_PROGRAMME);
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
      <Loader src="/loader/logocc.png" alt="Cargando agenda..." size={200} />
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data)
    return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={ALAG2026_FACULTY}
      sessionEndpoint={ALAG2026_SESSION}
      agendaHref="/congress/alag2026/agenda"
      speakersHref="/congress/alag2026/speakers"
      logoSrc="/loader/alag.png"
      preliminaryNotice="Programa preliminar"
      pdfOptions={{
        title: "AGENDA",
        subtitle: "ALAG 2026",
        footerText: "ALAG 2026  •  AGENDA OFICIAL",
        roomOrder: [
          "SALA 1",
          "SALA 2",
          "SALA 3",
          "SALA 4",
          "SALA CONFERENCE (PISO 4)",
          "FACULTAD DE CIENCIAS",
          "SESIÓN DE POSTERS",
        ],
        facultyEndpoint: ALAG2026_FACULTY,
        excludeDayDates: ["Mon 19 Oct 2026", "Tue 20 Oct 2026"],
      }}
      // 1 hora = 6 líneas de título (13px c/u): 30 min ~ 3 líneas, 60 min ~ 6 líneas
      pxPerMin={(13 * 6) / 60}
      roomScopedBreakPattern={/coffee|caf[eé]|tiempo libre/i}
      theme={{
        primaryBg: "bg-[#083E84]",
        primaryText: "text-[#3B7EE9]",
        titleText: "text-[#083E84]",
        iconColor: "text-[#3B7EE9]",
        lightBg: "bg-[#FEEFCE]",
        lightBorder: "border-[#F7D649]",
        badgeText: "text-[#7F2996]",
        headerBg: "bg-[#FEEFCE]",
        chairIconColor: "text-[#F5C644]",
      }}
    />
  );
};

export default ALAG2026Agenda;
