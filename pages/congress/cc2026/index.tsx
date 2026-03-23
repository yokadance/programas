import { CC2026_PROGRAMME } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { CC2026_FACULTY } from "@/http/api";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

const CLATPU2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(CC2026_PROGRAMME);
        if (!res.ok) {
          console.error("Error fetching data:", res.statusText);
          setError("Error fetching data");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json); // json.Programme es el objeto principal
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <Loader
        src="/loader/logocc.png"
        alt="Cargando..."
        size={256}
      />
    );
  if (error) return <p>Error: {error}</p>;
  console.log("Programa:", data);
  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      coverImagePath: "/portadas/portada-cc.jpg",
      title: "AGENDA",
      subtitle: "42° Congreso Uruguayo de Cardiología  •  CardioSUC 2026",
      filename: "agenda-cardiosuc2026.pdf",
      footerText: "CARDIOSUC 2026  •  AGENDA OFICIAL",
    });
  };

  if (!data) return <p>No hay datos disponibles, data undefinded</p>;
  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#7B1535] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#5C1028] active:scale-95 transition-all"
      >
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={CC2026_FACULTY}
      />
    </div>
  );
};

export default CLATPU2026;
