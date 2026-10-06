import { LACANO2026_PROGRAMME, LACANO2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const LACANO2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(LACANO2026_PROGRAMME);
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
    return <Loader src="/loader/logolacano.png" alt="Cargando agenda..." size={200} />;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data) return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={LACANO2026_FACULTY}
      agendaHref="/congress/lacano2026/agenda"
      speakersHref="/congress/lacano2026/speakers"
      logoSrc="/loader/logolacano.png"
      pdfOptions={{
        coverImagePath: "/portadas/portada-lacano.jpg",
        title: "AGENDA",
        subtitle: "LACANO 2026",
        filename: "agenda-lacano2026.pdf",
        footerText: "LACANO 2026  •  AGENDA OFICIAL",
        roomOrder: [],
      }}
      theme={{
        primaryBg: "bg-[#1C3057]",
        primaryText: "text-[#1C3057]",
        titleText: "text-[#142444]",
        iconColor: "text-[#1C3057]",
        lightBg: "bg-[#EEF1F7]",
        lightBorder: "border-[#B8C4D8]",
        badgeText: "text-[#142444]",
        headerBg: "bg-[#EEF1F7]",
        chairIconColor: "text-[#E8861A]",
      }}
    />
  );
};

export default LACANO2026Agenda;
