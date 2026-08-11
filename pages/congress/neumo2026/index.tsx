import { NEUMO2026_PROGRAMME, NEUMO2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

const NEUMO2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(NEUMO2026_PROGRAMME);
        if (!res.ok) {
          setError("Error fetching data");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <Loader src="/loader/logo-neumo.webp" alt="Cargando..." size={256} />
    );
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No hay datos disponibles</p>;

  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      title: "AGENDA",
      subtitle: "Neumología 2026",
      footerText: "NEUMO 2026  •  AGENDA OFICIAL",
      roomOrder: ["Ballroom A", "Conference", "Picasso / Florida", "Renoir"],
      facultyEndpoint: NEUMO2026_FACULTY,
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#5f95a0] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#4a7a84] active:scale-95 transition-all">
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={NEUMO2026_FACULTY}
        primaryColor="#5f95a0"
        headerImages={[
          {
            src: "/loader/logo-neumo.webp",
            alt: "Neumología 2026",
            className: "h-14 md:h-20 w-auto object-contain flex-shrink-0",
          },
        ]}
      />
    </div>
  );
};

export default NEUMO2026;
