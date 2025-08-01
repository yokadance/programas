import { ABU_PROGRAMME } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import AgendaTable from "@/components/AgendaTable";
import Loader from "@/components/Loader";
import { ABU_FACULTY } from "@/http/api";

const ABU2025: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(ABU_PROGRAMME);
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
    return <Loader src="/loader/logoAbu25.png" alt="Cargando..." size={128} />;
  if (error) return <p>Error: {error}</p>;
  console.log("Programa:", data);
  if (!data) return <p>No hay datos disponibles, data undefinded</p>;
  return (
    <>
      <AgendaTable data={data} facultyEndpoint={ABU_FACULTY} />;
    </>
  );
};

export default ABU2025;
