import { CC2026_PROGRAMME, CC2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaCalendar from "@/components/AgendaCalendar";
import Loader from "@/components/Loader";

const CC2026Agenda: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(CC2026_PROGRAMME);
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
    return <Loader src="/loader/logocc.png" alt="Cargando agenda..." size={200} />;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!data) return <p className="p-6 text-gray-500">No hay datos disponibles</p>;

  return (
    <AgendaCalendar
      data={data}
      facultyEndpoint={CC2026_FACULTY}
      agendaHref="/congress/cc2026/agenda"
      speakersHref="/congress/cc2026/speakers"
      logoSrc="/loader/logo-cc.png"
      theme={{
        primaryBg: "bg-[#7B1535]",
        primaryText: "text-[#7B1535]",
        titleText: "text-[#4A0E22]",
        iconColor: "text-[#7B1535]",
        lightBg: "bg-[#F9EDF1]",
        lightBorder: "border-[#E8C4CE]",
        badgeText: "text-[#5C1028]",
        headerBg: "bg-[#F9EDF1]",
        chairIconColor: "text-[#9B3555]",
      }}
    />
  );
};

export default CC2026Agenda;
