import { ALAG2026_PROGRAMME, ALAG2026_FACULTY } from "@/http/api";
import { generateAgendaPDF } from "@/utils/generateAgendaPDF";
import { useEffect, useState } from "react";

type Status = "loading" | "generating" | "done" | "error";

export default function ALAG2026PDF() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const run = async () => {
      try {
        setStatus("loading");
        const res = await fetch(ALAG2026_PROGRAMME);
        if (!res.ok) throw new Error("Error al obtener el programa");
        const data = await res.json();

        setStatus("generating");
        await generateAgendaPDF(data, {
          title: "AGENDA",
          subtitle: "ALAG 2026",
          facultyEndpoint: ALAG2026_FACULTY,
          footerText: "ALAG 2026  •  AGENDA OFICIAL",
          roomOrder: [
            "Ballroom A",
            "Conference",
            "Picasso / Florida",
            "Renoir",
          ],
          excludeDayDates: ["Mon 19 Oct 2026", "Tue 20 Oct 2026"],
        });

        setStatus("done");
      } catch {
        setStatus("error");
      }
    };
    run();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
      {status === "loading" && (
        <>
          <Dots />
          <p className="text-sm text-gray-500 font-medium">
            Cargando programa...
          </p>
        </>
      )}
      {status === "generating" && (
        <>
          <Dots />
          <p className="text-sm text-gray-500 font-medium">Generando PDF...</p>
        </>
      )}
      {status === "done" && (
        <>
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm text-gray-600 font-medium">¡PDF abierto!</p>
          <a
            href="/congress/alag2026/agenda"
            className="mt-2 text-xs font-semibold px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: "#5f95a0" }}>
            Ver agenda
          </a>
        </>
      )}
      {status === "error" && (
        <>
          <svg
            className="w-12 h-12 text-blue-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p className="text-sm text-red-500 font-medium">
            Error al generar el PDF
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-semibold px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: "#5f95a0" }}>
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}

function Dots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full animate-bounce"
          style={{ backgroundColor: "#5f95a0", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
