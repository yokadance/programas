import { NEUMO2026_PROGRAMME, NEUMO2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const NEUMO2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(NEUMO2026_PROGRAMME);
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
      facultyEndpoint={NEUMO2026_FACULTY}
      agendaHref="/congress/neumo2026/agenda"
      speakersHref="/congress/neumo2026/speakers"
      logoSrc="/loader/logo-neumo.webp"
      pdfOptions={{
        title: "AGENDA",
        subtitle: "Neumología 2026",
        footerText: "NEUMO 2026  •  AGENDA OFICIAL",
        roomOrder: ["Ballroom A", "Conference", "Picasso / Florida", "Renoir"],
        facultyEndpoint: NEUMO2026_FACULTY,
      }}
      theme={{
        primaryBg: "bg-[#5f95a0]",
        primaryText: "text-[#5f95a0]",
        titleText: "text-[#3A6970]",
        iconColor: "text-[#5f95a0]",
        lightBg: "bg-[#EBF4F6]",
        lightBorder: "border-[#C5DDE1]",
        badgeText: "text-[#3A6970]",
        headerBg: "bg-[#EBF4F6]",
        chairIconColor: "text-[#7AADB8]",
      }}
    />
  );
};

export default NEUMO2026Agenda;
