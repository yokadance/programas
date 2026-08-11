import { ALAG2026_FACULTY } from "@/http/api";
import { getCountryLabel } from "@/utils/countryLabel";
import { FacultyData } from "@/type/type";
import React, { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import FacultyModal from "@/components/FacultyModal";
import BottomNav from "@/components/BottomNav";
import { Search } from "lucide-react";

const THEME = {
  primaryBg: "bg-[#083E84]",
  primaryText: "text-[#083E84]",
};

const ALAG2026Speakers: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch(ALAG2026_FACULTY);
        if (!res.ok) {
          setError("Error al obtener los speakers");
          return;
        }
        const data = await res.json();
        const list: FacultyData[] = Array.isArray(data)
          ? data
          : (data.Faculty ?? []);
        list.sort((a, b) =>
          a.Family_Name.localeCompare(b.Family_Name, "es", {
            sensitivity: "base",
          }),
        );
        setFaculty(list);
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.First_Name?.toLowerCase().includes(q) ||
      f.Family_Name?.toLowerCase().includes(q) ||
      f.Country_Name?.toLowerCase().includes(q)
    );
  });

  if (loading)
    return (
      <Loader src="/loader/alag.png" alt="Cargando speakers..." size={256} />
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      {/* Search bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar speaker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#5f95a0]/30"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-10">
            Sin resultados
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((f) => (
              <li key={f.Faculty_Id}>
                <button
                  onClick={() => setSelectedId(f.Faculty_Id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                  <img
                    src={f.Image01 || "/user-avatar.png"}
                    alt={f.First_Name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/user-avatar.png";
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {f.Prefix_Title ? `${f.Prefix_Title} ` : ""}
                      {f.First_Name} {f.Family_Name}
                    </p>
                    {getCountryLabel(f.Country_Name) && (
                      <p className="text-xs text-gray-400 truncate">
                        {getCountryLabel(f.Country_Name)}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav
        agendaHref="/congress/alag2026/agenda"
        speakersHref="/congress/alag2026/speakers"
        primaryBg={THEME.primaryBg}
        primaryText={THEME.primaryText}
      />

      {/* Faculty detail modal */}
      {selectedId && (
        <FacultyModal
          facultyId={selectedId}
          endpointUrl={ALAG2026_FACULTY}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};

export default ALAG2026Speakers;
