import {
  GASTRO2026_PROGRAMME,
  GASTRO2026_FACULTY,
  GASTRO2026_SESSION,
} from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const GASTRO2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(GASTRO2026_PROGRAMME);
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
      <Loader
        src="/logos/gastro-logo.png"
        alt="Cargando agenda..."
        size={200}
      />
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data)
    return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={GASTRO2026_FACULTY}
      sessionEndpoint={GASTRO2026_SESSION}
      agendaHref="/congress/gastro2026/agenda"
      speakersHref="/congress/gastro2026/speakers"
      logoSrc="/logos/gastro-logo.png"
      preliminaryNotice="Programa preliminar"
      pdfOptions={{
        title: "AGENDA",
        subtitle: "GASTROENDO 2026",
        footerText: "GASTROENDO 2026  •  AGENDA OFICIAL",
        roomOrder: ["SALA 1", "SALA 2", "SALA 3", "SALA ENTREPISO", "FOYER"],
        facultyEndpoint: GASTRO2026_FACULTY,
        accentColor: [63, 169, 202],
      }}
      roomScopedBreakPattern={/coffee|caf[eé]|tiempo libre/i}
      // Salas con muchas sesiones cortas y seguidas (10 min entre sí): con el
      // valor por defecto (2px/min) las tarjetas quedan sin espacio y se
      // superponen. 5px/min les da lugar sin achicar demasiado el grillado.
      pxPerMin={5}
      roomColors={["#3FA9CA", "#F26527", "#8CC46F", "#F9A237", "#4E6688"]}
      theme={{
        primaryBg: "bg-[#3FA9CA]",
        primaryText: "text-[#3FA9CA]",
        titleText: "text-[#4E6688]",
        iconColor: "text-[#3FA9CA]",
        lightBg: "bg-[#E9F6FA]",
        lightBorder: "border-[#BEE3EE]",
        badgeText: "text-[#F26527]",
        headerBg: "bg-[#E9F6FA]",
        chairIconColor: "text-[#F9A237]",
      }}
    />
  );
};

export default GASTRO2026Agenda;
