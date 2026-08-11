import { jsPDF } from "jspdf";
import { ProgrammeData, Session, Speaker } from "@/type/type";
import { getCountryLabel } from "@/utils/countryLabel";

export function isBreak(title: string): boolean {
  const l = title.toLowerCase();
  return /\b(coffee|café|almuerzo|lunch|cena|dinner|cocktail|receso|registration|registro)\b/.test(l);
}

export function parseDate(dateStr: string): Date {
  const isoMatch = dateStr?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmyMatch = dateStr?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (isoMatch)
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  if (dmyMatch)
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  return new Date(dateStr);
}

const titlePattern = /^(Dr|Dra|Prof|Lic|Mg|PhD)[\.\s]/i;

function getPDFSpeakerName(spk: Speaker, titlesMap?: Map<string, string>): string {
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
}

function getPDFSpeakerLabel(spk: Speaker, titlesMap?: Map<string, string>): string {
  const name = getPDFSpeakerName(spk, titlesMap);
  const country = getCountryLabel(spk.Country_Name);
  return country ? `${name} (${country})` : name;
}

export interface GeneratePDFOptions {
  coverImagePath?: string;
  title?: string;
  subtitle?: string;
  filename?: string;
  footerText?: string;
  /** If provided, PDF is structured Room → Sessions instead of flat by time */
  roomOrder?: string[];
  /** Faculty endpoint to enrich speaker titles when Programme data lacks Prefix_Title */
  facultyEndpoint?: string;
  /** Color de acento (RGB) del congreso: encabezado de sala, coordinan, horarios de charlas. Default: bordó. */
  accentColor?: [number, number, number];
  /** Días a excluir del PDF (match exacto contra `Date_String`, ej: "Tue 20 Oct 2026"). El día sigue visible en la agenda en pantalla. */
  excludeDayDates?: string[];
}

export async function generateAgendaPDF(
  data: ProgrammeData,
  options: GeneratePDFOptions = {},
) {
  const {
    coverImagePath,
    title = "AGENDA",
    subtitle = "",
    footerText = "AGENDA OFICIAL",
    roomOrder,
    facultyEndpoint,
    accentColor = [123, 21, 53],
    excludeDayDates = [],
  } = options;
  const [AR, AG, AB] = accentColor;

  // Build titles map from faculty endpoint if provided
  const titlesMap = new Map<string, string>();
  if (facultyEndpoint) {
    try {
      const fr = await fetch(facultyEndpoint);
      if (fr.ok) {
        const fd = await fr.json();
        const list: { Faculty_Id: string; Prefix_Title?: string; Job_Title?: string }[] =
          Array.isArray(fd) ? fd : fd.Faculty ?? [];
        list.forEach((f) => {
          const title = f.Prefix_Title || f.Job_Title || "";
          if (f.Faculty_Id && title) titlesMap.set(f.Faculty_Id, title);
        });
      }
    } catch (_) {}
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Cover page ─────────────────────────────────────────────────
  if (coverImagePath) {
    try {
      const resp = await fetch(coverImagePath);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "JPEG", 0, 0, pageW, pageH);
    } catch (_) {}
    doc.addPage();
  }

  // ── Layout constants ────────────────────────────────────────────
  const ML = 15, MR = 15, MT = 15;
  const usableW = pageW - ML - MR;
  const TIME_W = 33;
  // When grouped by room the room column is not needed
  const TITLE_W = usableW - TIME_W;
  let y = MT;

  // Track current day info for repeating headers on each page
  type DayInfo = { idx: number; weekday: string; dayDate: string };
  let currentDayInfo: DayInfo | null = null;

  const renderDayHeader = () => {
    if (!currentDayInfo) return;
    const dayLabel = `DÍA ${currentDayInfo.idx + 1}  •  ${currentDayInfo.weekday}, ${currentDayInfo.dayDate}`;
    doc.setFillColor(26, 32, 44);
    doc.rect(ML, y - 4.5, usableW, 9, "F");
    doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(255, 255, 255);
    doc.text(dayLabel, ML + 3, y + 1, { align: "left" });
    y += 11;
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 12) {
      doc.addPage();
      y = MT;
      renderDayHeader();
    }
  };

  const splitWrite = (
    text: string, x: number, maxW: number,
    size: number, font: "normal" | "bold" | "italic",
    r: number, g: number, b: number, lineH: number,
  ) => {
    doc.setFontSize(size).setFont("helvetica", font).setTextColor(r, g, b);
    const lines: string[] = doc.splitTextToSize(text, maxW);
    lines.forEach((line) => {
      checkPage(lineH + 1);
      doc.text(line, x, y, { align: "left" });
      y += lineH;
    });
  };

  const renderSession = (s: Session, showRoom: boolean) => {
    const breakSess = isBreak(s.Session_Title);
    const titleMaxW = showRoom ? TITLE_W - 36 : TITLE_W;
    // Set font BEFORE splitTextToSize so width measurement matches rendering
    doc.setFontSize(9).setFont("helvetica", "bold");
    const titleLines: string[] = doc.splitTextToSize(s.Session_Title, titleMaxW);
    const rowH = Math.max(titleLines.length * 5, 7);
    checkPage(rowH + 8);

    // Time
    doc.setFontSize(8.5).setFont("helvetica", "bold").setTextColor(40, 40, 40);
    doc.text(`${s.Session_Start_Time} - ${s.Session_End_Time}`, ML, y, { align: "left" });

    // Title — render each line individually with explicit y to avoid jsPDF auto-spacing
    const titleColor = breakSess ? 100 : 20;
    doc.setFontSize(9).setFont("helvetica", "bold")
      .setTextColor(titleColor, titleColor, titleColor);
    const startY = y;
    titleLines.forEach((line, i) => {
      doc.text(line, ML + TIME_W, startY + i * 5, { align: "left" });
    });

    // Room (only in flat mode) — aligned with first title line
    if (showRoom && s.Session_Location) {
      doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(160, 160, 160);
      doc.text(s.Session_Location, pageW - MR, startY, { align: "right" });
    }
    y += rowH;

    // Chair
    const chairStr = (() => {
      if (s.Session_Faculty?.length > 0) {
        return s.Session_Faculty
          .slice()
          .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
          .map((f) => {
            const alreadyHasTitle = titlePattern.test(f.First_Name?.trim() || "");
            const prefix = !alreadyHasTitle
              ? (f.Prefix_Title || (f.Faculty_Id ? titlesMap.get(f.Faculty_Id) : undefined) || "")
              : "";
            return `${prefix ? prefix + " " : ""}${f.First_Name} ${f.Family_Name}`.trim();
          })
          .join(", ");
      }
      return s.Session_Chair || null;
    })();
    if (chairStr) {
      splitWrite(`Coordinan: ${chairStr}`, ML + TIME_W, TITLE_W, 7.5, "italic", AR, AG, AB, 4.5);
      y += 1;
    }

    // Presentations
    if (s.Presentations?.length) {
      const sorted = [...s.Presentations].sort((a, b) =>
        (a.Start_Time || "").localeCompare(b.Start_Time || "")
      );
      sorted.forEach((p, pi) => {
        checkPage(10);
        const hasTime = p.Start_Time && p.Start_Time !== "00:00";
        const endTime = sorted[pi + 1]?.Start_Time || s.Session_End_Time;
        const titleX = ML + TIME_W;

        // Presentation time — at left column
        if (hasTime) {
          doc.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(AR, AG, AB);
          doc.text(`${p.Start_Time} - ${endTime}`, ML, y, { align: "left" });
        }

        // Presentation title — aligned to title column
        splitWrite(`• ${p.Presentation_Title}`, titleX, TITLE_W, 7.5, "bold", 70, 70, 70, 4);

        // Speakers — sorted by family name, with title and country
        if (p.AllSpeakers?.length) {
          const names = [...p.AllSpeakers]
            .sort((a, b) => a.Family_Name.localeCompare(b.Family_Name, "es", { sensitivity: "base" }))
            .map((spk) => getPDFSpeakerLabel(spk, titlesMap))
            .join(", ");
          splitWrite(names, titleX + 4, TITLE_W - 4, 7, "normal", 130, 130, 130, 4);
        }

        y += 3;
      });
      y += 1;
    }

    // Separator
    doc.setDrawColor(235, 235, 235).setLineWidth(0.2);
    doc.line(ML, y + 1.5, pageW - MR, y + 1.5);
    y += 6;
  };

  // ── Main title ─────────────────────────────────────────────────
  doc.setFontSize(26).setFont("helvetica", "bold").setTextColor(20, 20, 20);
  doc.text(title, ML, y, { align: "left" });
  y += 5;
  if (subtitle) {
    doc.setFontSize(11).setFont("helvetica", "normal").setTextColor(100, 100, 100);
    doc.text(subtitle, ML, y, { align: "left" });
    y += 4;
  }
  doc.setDrawColor(210, 210, 210).setLineWidth(0.3);
  doc.line(ML, y, pageW - MR, y);
  y += 8;

  // ── Build days ─────────────────────────────────────────────────
  const days = Object.keys(data.Programme.Days).filter(
    (day) => !excludeDayDates.includes(data.Programme.Days[day].Date_String),
  );
  const allDaysSessions = days.map((day) => {
    const dateStr = data.Programme.Days[day].Date_String;
    const date = parseDate(dateStr);
    const sessions: Session[] = Object.values(data.Programme.Days[day].Session_Groups)
      .flatMap((g) => g.Sessions)
      .filter((s) => (s.Session_Location?.trim() || "").toLowerCase() !== "foyer")
      .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));
    return { day, date, sessions };
  });

  // ── Days ───────────────────────────────────────────────────────
  allDaysSessions.forEach(({ date, sessions }, idx) => {
    // Set current day info for headers
    const weekday = date.toLocaleDateString("es-ES", { weekday: "long" }).toUpperCase();
    const dayDate = date.toLocaleDateString("es-ES", { day: "numeric", month: "long" }).toUpperCase();
    currentDayInfo = { idx, weekday, dayDate };

    // Each day starts on a new page (except the very first)
    if (idx > 0) { doc.addPage(); y = MT; }

    // Render day header
    renderDayHeader();

    if (roomOrder && roomOrder.length > 0) {
      // ── Grouped by room ───────────────────────────────────────
      const allRooms = [
        ...roomOrder.filter((r) => sessions.some((s) => (s.Session_Location?.trim() || "General") === r)),
        ...sessions
          .map((s) => s.Session_Location?.trim() || "General")
          .filter((r, i, arr) => !roomOrder.includes(r) && arr.indexOf(r) === i),
      ];

      allRooms.forEach((room, roomIdx) => {
        const roomSessions = sessions.filter(
          (s) => (s.Session_Location?.trim() || "General") === room
        );
        if (!roomSessions.length) return;

        // Each room starts on a new page (the day already handles the break for room 0)
        if (roomIdx > 0) {
          doc.addPage();
          y = MT;
          renderDayHeader();
        }

        // Room sub-header
        doc.setFillColor(AR, AG, AB);
        doc.rect(ML, y - 3.5, usableW, 7, "F");
        doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(255, 255, 255);
        doc.text(room.toUpperCase(), ML + 3, y + 0.5, { align: "left" });
        y += 10;

        roomSessions.forEach((s) => renderSession(s, false));
        y += 3;
      });
    } else {
      // ── Flat by time (default) ────────────────────────────────
      sessions.forEach((s) => renderSession(s, true));
    }

    y += 5;
  });

  // ── Footer on every page ───────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(180, 180, 180);
    doc.text(footerText, pageW / 2, pageH - 8, { align: "center" });
    doc.text(`${p} / ${totalPages}`, pageW - MR, pageH - 8, { align: "right" });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
