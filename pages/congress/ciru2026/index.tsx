import { CIRU2026_PROGRAMME, CIRU2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

const CIRU2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(CIRU2026_PROGRAMME);
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
    return <Loader src="/logos/ciru-logo.png" alt="Cargando..." size={256} />;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No hay datos disponibles</p>;

  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      title: "AGENDA",
      subtitle: "CIRU 2026",
      footerText: "CIRU 2026  •  AGENDA OFICIAL",
      roomOrder: ["Sala Mansa"],
      facultyEndpoint: CIRU2026_FACULTY,
      accentColor: [27, 59, 95],
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1B3B5F] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#14304C] active:scale-95 transition-all">
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={CIRU2026_FACULTY}
        primaryColor="#1B3B5F"
        neutralText
        headerBarColors={["#1B3B5F", "#F5921F", "#29A98C"]}
        lightAccentBg="#EAF3F1"
        headerImages={[
          {
            src: "/portadas/ciru2026/cabezal-ciru2026.png",
            alt: "76º Congreso Uruguayo de Cirugía 2026",
            className: "h-20 md:h-32 w-auto object-contain flex-shrink-0",
          },
        ]}
      />
    </div>
  );
};

export default CIRU2026;
