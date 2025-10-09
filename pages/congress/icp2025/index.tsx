import { ICP_FACULTY, ICP_PROGRAMME } from "@/http/api";
import { ProgrammeData } from "@/type/type";
import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import Loader from "@/components/Loader";
import AgendaTableEn from "@/components/AgendaTableEn";

const ICP2025: React.FC = () => {
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(ICP_PROGRAMME);
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
    return <Loader src="/loader/icplogo.png" alt="Cargando..." size={128} />;
  if (error) return <p>Error: {error}</p>;
  console.log("Programa:", data);
  if (!data) return <p>No hay datos disponibles, data undefinded</p>;
  return (
    <>
      <AgendaTableEn data={data} facultyEndpoint={ICP_FACULTY} />;
    </>
  );
};

export default ICP2025;
