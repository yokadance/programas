import { GINE2026_PROGRAMME, GINE2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

const GINE2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(GINE2026_PROGRAMME);
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
    return <Loader src="/logos/gine-logo.png" alt="Cargando..." size={256} />;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No hay datos disponibles</p>;

  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      title: "AGENDA",
      subtitle: "GINECOLOGÍA 2026",
      footerText: "GINECOLOGÍA 2026  •  AGENDA OFICIAL",
      roomOrder: ["Auditorio 3", "Auditorio 4", "Jagüel 1", "Jagüel 2", "Foyer"],
      facultyEndpoint: GINE2026_FACULTY,
      accentColor: [207, 47, 129],
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#CF2F81] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#A8266A] active:scale-95 transition-all">
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={GINE2026_FACULTY}
        primaryColor="#CF2F81"
        neutralText
        headerImages={[
          {
            src: "/portadas/gine2026/cabezal-gine2026.png",
            alt: "Congreso Uruguayo de Ginecología y Obstetricia 2026",
            className: "h-20 md:h-32 w-auto object-contain flex-shrink-0",
          },
        ]}
      />
    </div>
  );
};

export default GINE2026;
