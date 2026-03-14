import { CC2026_PROGRAMME, CLATPU2026_PROGRAMME } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { CC2026_FACULTY } from "@/http/api";

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
  if (!data) return <p>No hay datos disponibles, data undefinded</p>;
  return (
    <>
      <AgendaTable
        data={data}
        facultyEndpoint={CC2026_FACULTY}
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
    </>
  );
};

export default CLATPU2026;
