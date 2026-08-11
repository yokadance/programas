import { GASTRO2026_PROGRAMME, GASTRO2026_FACULTY } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

const GASTRO2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(GASTRO2026_PROGRAMME);
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
      <Loader src="/logos/gastro-logo.png" alt="Cargando..." size={256} />
    );
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No hay datos disponibles</p>;

  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      title: "AGENDA",
      subtitle: "GASTROENDO 2026",
      footerText: "GASTROENDO 2026  •  AGENDA OFICIAL",
      roomOrder: ["SALA 1", "SALA 2", "SALA 3", "SALA ENTREPISO", "FOYER"],
      facultyEndpoint: GASTRO2026_FACULTY,
      accentColor: [63, 169, 202],
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#3FA9CA] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#328da8] active:scale-95 transition-all">
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={GASTRO2026_FACULTY}
        primaryColor="#3FA9CA"
        headerImages={[
          {
            src: "/portadas/gastro2026/cabezal-gastro2026.png",
            alt: "GASTROENDO 2026",
            className: "h-20 md:h-32 w-auto object-contain flex-shrink-0",
          },
        ]}
      />
    </div>
  );
};

export default GASTRO2026;
