import React, { useState, useEffect } from "react";
import { Session, Speaker, AgendaTheme, Faculty } from "@/type/type";
import { X, Clock, UserRound, MapPin, ArrowRight } from "lucide-react";
import FacultyModal from "./FacultyModal";
import { getCountryLabel } from "@/utils/countryLabel";
import { useFacultyTitles } from "@/hooks/useFacultyTitles";

const titlePattern = /^(Dr|Dra|Prof|Lic|Mg|PhD)[\.\s]/i;

const formatFacultyName = (f: Faculty, titlesMap?: Map<string, string>) => {
  const alreadyHasTitle = titlePattern.test(f.First_Name?.trim() || "");
  const prefix = !alreadyHasTitle
    ? (f.Prefix_Title || (f.Faculty_Id ? titlesMap?.get(f.Faculty_Id) : undefined) || "")
    : "";
  return `${prefix ? prefix + " " : ""}${f.First_Name} ${f.Family_Name}`.trim();
};

const getSpeakerName = (spk: Speaker, titlesMap?: Map<string, string>): string => {
  if (titlePattern.test(spk.First_Name?.trim() || "")) {
    return `${spk.First_Name} ${spk.Family_Name}`;
  }
  const prefix = spk.Prefix_Title || (spk.Faculty_Id ? titlesMap?.get(spk.Faculty_Id) : undefined);
  if (prefix) {
    return `${prefix} ${spk.First_Name} ${spk.Family_Name}`;
  }
  if (spk.Full_Name && titlePattern.test(spk.Full_Name.trim())) {
    return spk.Full_Name;
  }
  return `${spk.First_Name} ${spk.Family_Name}`;
};

const formatNameString = (
  str: string | null | undefined,
  opts: { sort?: boolean } = {},
): string | null => {
  if (!str) return null;
  const parts = str.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  const unique = [...new Set(parts)];
  // Por defecto se alfabetiza (comportamiento histórico del "Modera:" único).
  // Para Chair/Co-Chair separados se respeta el orden de ShockLogic: ahí el
  // orden es intencional (ej: presidente primero), no alfabético.
  if (opts.sort ?? true) {
    unique.sort((a, b) => {
      const lastA = a.split(/\s+/).at(-1) ?? a;
      const lastB = b.split(/\s+/).at(-1) ?? b;
      return lastA.localeCompare(lastB, "es", { sensitivity: "base" });
    });
  }
  return unique.join(", ") || null;
};

const formatChairs = (faculty: Faculty[], chairStr: string | null, titlesMap?: Map<string, string>) => {
  if (faculty && faculty.length > 0) {
    return faculty
      .slice()
      .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
      .map((f) => formatFacultyName(f, titlesMap))
      .join(", ");
  }
  return formatNameString(chairStr);
};

type SessionDetailModalProps = {
  session: Session;
  theme: AgendaTheme;
  facultyEndpoint?: string;
  sessionEndpoint?: (sessionId: string) => string;
  onClose: () => void;
  /** Nombres de disertantes/moderadores en negro en vez del color del tema (mejora legibilidad con temas muy saturados). */
  neutralText?: boolean;
  /**
   * Muestra "Presidente - Moderador/a" (Session_Chair) y "Secretario/a"
   * (Session_CoChair) como líneas separadas, en vez de un único "Modera"
   * que mezcla Session_Faculty/Session_Chair.
   */
  splitChairRoles?: boolean;
};

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  theme,
  facultyEndpoint,
  sessionEndpoint,
  onClose,
  neutralText,
  splitChairRoles,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<Session>(session);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const titlesMap = useFacultyTitles(facultyEndpoint);
  const NAME_COLOR = neutralText ? "text-gray-900" : theme.primaryText;

  useEffect(() => {
    const fetchSessionDetail = async () => {
      if (!sessionEndpoint || sessionDetail.Session_HTML) return;

      setLoadingDetail(true);
      try {
        const response = await fetch(sessionEndpoint(session.Session_Id));
        if (response.ok) {
          const data = await response.json();
          const detail = Array.isArray(data) ? data[0] : data;
          setSessionDetail((prev) => ({ ...prev, Session_HTML: detail?.Session_HTML }));
        }
      } catch (error) {
        console.error("Error fetching session detail:", error);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchSessionDetail();
  }, [session.Session_Id, sessionEndpoint, sessionDetail.Session_HTML]);

  const sortedPresentations =
    sessionDetail.Presentations?.slice().sort(
      (a, b) =>
        a.Start_Time.localeCompare(b.Start_Time) ||
        a.Sequence_Number.localeCompare(b.Sequence_Number),
    ) ?? [];


  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .sheet-slide-up {
          animation: slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        .backdrop-fade {
          animation: fadeIn 0.2s ease both;
        }
      `}</style>

      {/* Backdrop */}
      <div className="backdrop-fade fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="sheet-slide-up fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col md:inset-0 md:m-auto md:h-fit md:w-fit md:rounded-2xl md:max-w-2xl md:max-h-[90vh]">
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Time + Location */}
              <div
                className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium ${theme.primaryText} mb-1.5`}>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {session.Session_Start_Time} – {session.Session_End_Time}
                </span>
                {session.Session_Location && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {session.Session_Location}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2
                className={`text-base font-bold ${theme.titleText} leading-none`}>
                {sessionDetail.Session_Title}
              </h2>

              {/* Session Description / Summary */}
              {loadingDetail && !sessionDetail.Session_HTML && (
                <div className="mt-2 text-sm text-gray-400 italic">
                  Cargando resumen...
                </div>
              )}
              {(sessionDetail.Session_HTML || sessionDetail.Session_Notes) && (
                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Resumen
                  </span>
                  <div className="text-[11px] text-gray-500 leading-none">
                    {sessionDetail.Session_HTML ? (
                      <div
                        className="max-w-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: sessionDetail.Session_HTML }}
                      />
                    ) : (
                      <p>{sessionDetail.Session_Notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Chair */}
              {splitChairRoles ? (
                (() => {
                  const president = formatNameString(sessionDetail.Session_Chair, { sort: false });
                  const secretary = formatNameString(sessionDetail.Session_CoChair, { sort: false });
                  if (!president && !secretary) return null;
                  return (
                    <div className="mt-2 flex flex-col gap-1 items-start">
                      {president && (
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs ${theme.lightBg} border ${theme.lightBorder} rounded-full px-3 py-1`}>
                          <UserRound
                            className={`w-3 h-3 ${theme.chairIconColor} flex-shrink-0`}
                          />
                          <span className="text-gray-500 leading-none">
                            Presidente - Moderador/a:
                          </span>
                          <span className={`${NAME_COLOR} font-semibold leading-none`}>
                            {president}
                          </span>
                        </div>
                      )}
                      {secretary && (
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs ${theme.lightBg} border ${theme.lightBorder} rounded-full px-3 py-1`}>
                          <UserRound
                            className={`w-3 h-3 ${theme.chairIconColor} flex-shrink-0`}
                          />
                          <span className="text-gray-500 leading-none">Secretario/a:</span>
                          <span className={`${NAME_COLOR} font-semibold leading-none`}>
                            {secretary}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const chairs = formatChairs(sessionDetail.Session_Faculty ?? [], sessionDetail.Session_Chair, titlesMap);
                  if (!chairs) return null;
                  return (
                    <div
                      className={`mt-2 inline-flex items-center gap-1.5 text-xs ${theme.lightBg} border ${theme.lightBorder} rounded-full px-3 py-1`}>
                      <UserRound
                        className={`w-3 h-3 ${theme.chairIconColor} flex-shrink-0`}
                      />
                      <span className="text-gray-500 leading-none">Modera:</span>
                      <span className={`${NAME_COLOR} font-semibold leading-none`}>
                        {chairs}
                      </span>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presentations list */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {sortedPresentations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8"></p>
          ) : (
            <div className="space-y-5">
              {sortedPresentations.map((presentation, idx) => (
                <div
                  key={idx}
                  className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  {/* Presentation time */}
                  {presentation.Start_Time &&
                    presentation.Start_Time !== "00:00" && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${theme.primaryText} mb-1.5`}>
                        <Clock className="w-3 h-3" />
                        {presentation.Start_Time}
                      </span>
                    )}

                  {/* Presentation title */}
                  <div className="flex items-start gap-2">
                    <ArrowRight
                      className={`w-4 h-4 ${theme.iconColor} mt-0.5 flex-shrink-0`}
                    />
                    <p className="text-sm text-gray-800 font-medium leading-none">
                      {presentation.Presentation_Title || (
                        <span className="text-gray-400 italic">Sin título</span>
                      )}
                    </p>
                  </div>

                  {/* Speakers */}
                  {presentation.AllSpeakers?.length > 0 && (
                    <div className="mt-2.5 pl-6 space-y-2">
                      {presentation.AllSpeakers.slice()
                        .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
                        .map(
                        (spk: Speaker, i: number) => (
                          <button
                            key={i}
                            onClick={() => setSelectedFacultyId(spk.Faculty_Id)}
                            className="flex items-center gap-2.5 w-full text-left group">
                            <img
                              src={spk.Image01 || "/user-avatar.png"}
                              alt={spk.Full_Name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0"
                            />
                            <div>
                              <p
                                className={`text-sm font-semibold leading-none ${NAME_COLOR} group-hover:underline`}>
                                {(() => {
                                  const name = getSpeakerName(spk, titlesMap);
                                  const country = getCountryLabel(spk.Country_Name);
                                  return country ? `${name} (${country})` : name;
                                })()}
                              </p>
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Speaker faculty modal */}
      {selectedFacultyId && facultyEndpoint && (
        <FacultyModal
          facultyId={selectedFacultyId}
          endpointUrl={facultyEndpoint}
          onClose={() => setSelectedFacultyId(null)}
        />
      )}
    </>
  );
};

export default SessionDetailModal;
