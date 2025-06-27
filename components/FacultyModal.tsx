// // components/FacultyModal.tsx
// import React, { useEffect, useState } from "react";

// import Image from "next/image";
// import { X } from "lucide-react";
// import { ABU_FACULTY } from "@/http/api";
// import { FacultyData } from "@/type/type";
// import parse from "html-react-parser";

// type FacultyModalProps = {
//   facultyId: string;
//   onClose: () => void;
// };

// const FacultyModal: React.FC<FacultyModalProps> = ({ facultyId, onClose }) => {
//   const [faculty, setFaculty] = useState<FacultyData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   useEffect(() => {
//     const fetchFaculty = async () => {
//       try {
//         const res = await fetch(`${ABU_FACULTY}/${facultyId}`);
//         const data = await res.json();
//         if (!res.ok || !data || !data.length) {
//           setNotFound(true);
//         } else {
//           setFaculty(data[0]);
//         }
//       } catch (error) {
//         setNotFound(true);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFaculty();
//   }, [facultyId]);

//   if (loading) {
//     return (
//       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//         <div className="bg-white p-6 rounded-xl shadow-xl">
//           <p className="text-center text-sm text-gray-700">Cargando datos...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//       <div className="relative bg-white max-w-2xl w-full rounded-xl shadow-xl overflow-auto max-h-[90vh] p-6">
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
//           <X className="w-5 h-5" />
//         </button>

//         {notFound || !faculty ? (
//           <div className="text-center space-y-4">
//             <Image
//               src="/not-available.png"
//               alt="No disponible"
//               width={200}
//               height={200}
//               className="mx-auto"
//             />
//             <p className="text-gray-500 text-sm">Información no disponible</p>
//           </div>
//         ) : (
//           <div>
//             <div className="flex gap-5 items-center">
//               <img
//                 src={faculty.Image01 || "/user-avatar.png"}
//                 alt={faculty.First_Name}
//                 className="w-24 h-24 object-cover rounded-full ring-2 ring-blue-300"
//               />
//               <div>
//                 <h2 className="text-xl font-bold text-gray-800">
//                   {faculty.Prefix_Title} {faculty.First_Name}{" "}
//                   {faculty.Family_Name} {faculty.Suffix_Title}
//                 </h2>
//                 <p className="text-sm text-gray-600">{faculty.Country_Name}</p>
//                 <p className="text-sm text-blue-600">{faculty.EMail}</p>
//               </div>
//             </div>

//             {/* Biografía */}
//             {faculty.Biography && (
//               <div
//                 className="mt-6 prose prose-sm prose-blue max-w-none text-gray-700"
//                 dangerouslySetInnerHTML={{ __html: faculty.Biography }}
//               />
//             )}

//             {/* Asignaciones */}
//             {faculty.Assignments.presentations.length > 0 && (
//               <div className="mt-6">
//                 <h3 className="font-semibold text-gray-800 mb-3">
//                   Presentaciones:
//                 </h3>
//                 <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
//                   {faculty.Assignments.presentations.map((p, i) => (
//                     <li key={i} className="border-b pb-2">
//                       <p className="font-medium text-blue-700">
//                         {p.Presentation_Title}
//                       </p>
//                       <p>
//                         {p.Session_Title} – {p.Session_Start_Time} -{" "}
//                         {p.Session_End_Time}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         Sala: {p.Room_Name}
//                       </p>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FacultyModal;
// components/FacultyModal.tsx
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { FacultyData } from "@/type/type";

type FacultyModalProps = {
  facultyId: string;
  endpointUrl: string; // 🔹 Nueva prop
  onClose: () => void;
};

const FacultyModal: React.FC<FacultyModalProps> = ({
  facultyId,
  endpointUrl,
  onClose,
}) => {
  const [faculty, setFaculty] = useState<FacultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch(`${endpointUrl}/${facultyId}`);
        const data = await res.json();
        if (!res.ok || !data || !data.length) {
          setNotFound(true);
        } else {
          setFaculty(data[0]);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [facultyId, endpointUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <p className="text-center text-sm text-gray-700">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white max-w-2xl w-full rounded-xl shadow-xl overflow-auto max-h-[90vh] p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        {notFound || !faculty ? (
          <div className="text-center space-y-4">
            <Image
              src="/not-available.png"
              alt="No disponible"
              width={200}
              height={200}
              className="mx-auto"
            />
            <p className="text-gray-500 text-sm">Información no disponible</p>
          </div>
        ) : (
          <div>
            <div className="flex gap-5 items-center">
              <img
                src={faculty.Image01 || "/user-avatar.png"}
                alt={faculty.First_Name}
                className="w-24 h-24 object-cover rounded-full ring-2 ring-blue-300"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {faculty.Prefix_Title} {faculty.First_Name}{" "}
                  {faculty.Family_Name} {faculty.Suffix_Title}
                </h2>
                <p className="text-sm text-gray-600">{faculty.Country_Name}</p>
                <p className="text-sm text-blue-600">{faculty.EMail}</p>
              </div>
            </div>

            {faculty.Biography && (
              <div
                className="mt-6 prose prose-sm prose-blue max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: faculty.Biography }}
              />
            )}

            {faculty.Assignments.presentations.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Presentaciones:
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                  {faculty.Assignments.presentations.map((p, i) => (
                    <li key={i} className="border-b pb-2">
                      <p className="font-medium text-blue-700">
                        {p.Presentation_Title}
                      </p>
                      <p>
                        {p.Session_Title} – {p.Session_Start_Time} -{" "}
                        {p.Session_End_Time}
                      </p>
                      <p className="text-xs text-gray-500">
                        Sala: {p.Room_Name}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyModal;
