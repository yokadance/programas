import { LACANO2026_PROGRAMME, LACANO2026_FACULTY, LACANO2026_ABSTRACTS } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { FileDown } from "lucide-react";

type AbstractEntry = {
  Wab: string;
  Family_Name: string;
  First_Name: string;
};

/** Recorre el ProgrammeData y rellena Abstract.Authors con el nombre
 *  del presentador obtenido desde la API de Abstracts, cuando está vacío. */
function enrichWithAbstracts(
  programme: ProgrammeData,
  abstractsMap: Map<string, string>,
): ProgrammeData {
  const enriched = JSON.parse(JSON.stringify(programme)) as ProgrammeData;
  for (const day of Object.values(enriched.Programme.Days)) {
    for (const group of Object.values(day.Session_Groups)) {
      for (const session of group.Sessions) {
        for (const pres of session.Presentations ?? []) {
          const hasAuthors =
            pres.Abstract?.Authors?.length > 0 ||
            pres.AllSpeakers?.length > 0 ||
            pres.AllSpeakersList?.trim();
          if (hasAuthors) continue;
          const abstractId = pres.Abstract?.Abstract_ID;
          if (!abstractId) continue;
          const name = abstractsMap.get(abstractId);
          if (!name) continue;
          pres.Abstract.Authors = [
            {
              Family_Name: name,
              First_Name: "",
              Author_Number: "1",
              Country_Name: "",
              City: "",
              Address_1: "",
              Address_2: "",
              Address_3: "",
              Address_4: "",
              Country_Code: "",
              Presenting: "1",
              Biography: "",
              Image01: "",
              Company: "",
              AuthorID: "",
            },
          ];
        }
      }
    }
  }
  return enriched;
}

const LACANO2026: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, absRes] = await Promise.all([
          fetch(LACANO2026_PROGRAMME),
          fetch(LACANO2026_ABSTRACTS),
        ]);
        if (!progRes.ok) {
          setError("Error fetching data");
          setLoading(false);
          return;
        }
        const progJson: ProgrammeData = await progRes.json();
        const abstractsMap = new Map<string, string>();
        if (absRes.ok) {
          const absJson: AbstractEntry[] = await absRes.json();
          for (const entry of absJson) {
            const name = entry.Family_Name?.trim();
            if (entry.Wab && name) {
              abstractsMap.set(entry.Wab, name);
            }
          }
        }
        setData(enrichWithAbstracts(progJson, abstractsMap));
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
      <Loader
        src="/loader/logolacano.png"
        alt="Cargando..."
        size={256}
      />
    );
  if (error) return <p>Error: {error}</p>;

  const handleDownloadPDF = async () => {
    if (!data) return;
    await generateAgendaPDF(data, {
      coverImagePath: "/portadas/portada-lacano.jpg",
      title: "AGENDA",
      subtitle: "LACANO 2026",
      filename: "agenda-lacano2026.pdf",
      footerText: "LACANO 2026  •  AGENDA OFICIAL",
      roomOrder: [],
      hideChairLabel: true,
    });
  };

  if (!data) return <p>No hay datos disponibles</p>;
  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg active:scale-95 transition-all"
        style={{ backgroundColor: "#1d407c" }}
      >
        <FileDown className="w-4 h-4" />
        Descargar PDF
      </button>
      <AgendaTable
        data={data}
        facultyEndpoint={LACANO2026_FACULTY}
        primaryColor="#1d407c"
        lightAccentBg="#fef9d9"
        showOnlyFamilyName
        headerImages={[
          {
            src: "/portadas/lacano2026/lacano2026.png",
            alt: "LACANO 2026",
            className: "h-16 md:h-24 w-auto object-contain",
          },
        ]}
      />
    </div>
  );
};

export default LACANO2026;
