import React, { useState } from "react";
import { Session, Speaker, AgendaTheme } from "@/type/type";
import { X, Clock, UserRound, MapPin, ArrowRight } from "lucide-react";
import FacultyModal from "./FacultyModal";

type SessionDetailModalProps = {
  session: Session;
  theme: AgendaTheme;
  facultyEndpoint?: string;
  onClose: () => void;
};

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  theme,
  facultyEndpoint,
  onClose,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null,
  );

  const sortedPresentations =
    session.Presentations?.slice().sort(
      (a, b) =>
        a.Start_Time.localeCompare(b.Start_Time) ||
        a.Sequence_Number.localeCompare(b.Sequence_Number),
    ) ?? [];

  const cleanChairName = (chair: string) => {
    const parts = chair
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return [...new Set(parts)].join(", ");
  };

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
      <div className="sheet-slide-up fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col md:inset-0 md:m-auto md:rounded-2xl md:max-w-2xl md:max-h-[90vh]">
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
                className={`text-base font-bold ${theme.titleText} leading-snug`}>
                {session.Session_Title}
              </h2>

              {/* Chair */}
              {session.Session_Chair && (
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 text-xs ${theme.lightBg} border ${theme.lightBorder} rounded-full px-3 py-1`}>
                  <UserRound
                    className={`w-3 h-3 ${theme.chairIconColor} flex-shrink-0`}
                  />
                  <span className="text-gray-500">Modera:</span>
                  <span className={`${theme.primaryText} font-semibold`}>
                    {cleanChairName(session.Session_Chair)}
                  </span>
                </div>
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
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {presentation.Presentation_Title || (
                        <span className="text-gray-400 italic">Sin título</span>
                      )}
                    </p>
                  </div>

                  {/* Speakers */}
                  {presentation.AllSpeakers?.length > 0 && (
                    <div className="mt-2.5 pl-6 space-y-2">
                      {presentation.AllSpeakers.map(
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
                                className={`text-sm font-semibold ${theme.primaryText} group-hover:underline`}>
                                {spk.Full_Name}
                              </p>
                              {spk.Country_Name && (
                                <p className="text-xs text-gray-400">
                                  {spk.Country_Name}
                                </p>
                              )}
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
