import { jsPDF } from "jspdf";
import { ProgrammeData, Session } from "@/type/type";

export function isBreak(title: string): boolean {
  const l = title.toLowerCase();
  return (
    l.includes("coffee") ||
    l.includes("café") ||
    l.includes("almuerzo") ||
    l.includes("lunch") ||
    l.includes("cena") ||
    l.includes("dinner") ||
    l.includes("cocktail") ||
    l.includes("receso") ||
    l.includes("registration") ||
    l.includes("registro")
  );
}

export function parseDate(dateStr: string): Date {
  const isoMatch = dateStr?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmyMatch = dateStr?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (isoMatch)
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  if (dmyMatch)
    return new Date(
      Number(dmyMatch[3]),
      Number(dmyMatch[2]) - 1,
      Number(dmyMatch[1]),
    );
  return new Date(dateStr);
}

export interface GeneratePDFOptions {
  coverImagePath?: string;  // e.g. "/portadas/portada-cc.jpg"
  title?: string;           // e.g. "AGENDA"
  subtitle?: string;        // e.g. "42° Congreso Uruguayo de Cardiología • CardioSUC 2026"
  filename?: string;        // e.g. "agenda-cardiosuc2026.pdf"
  footerText?: string;      // e.g. "CARDIOSUC 2026  •  AGENDA OFICIAL"
}

export async function generateAgendaPDF(
  data: ProgrammeData,
  options: GeneratePDFOptions = {},
) {
  const {
    coverImagePath,
    title = "AGENDA",
    subtitle = "",
    filename = "agenda.pdf",
    footerText = "AGENDA OFICIAL",
  } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Cover page ──────────────────────────────────────────────────
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
    } catch (_) {
      // cover image failed — leave blank page
    }
    doc.addPage();
  }

  // ── Layout constants ─────────────────────────────────────────────
  const ML = 15, MR = 15, MT = 15;
  const usableW = pageW - ML - MR;
  const TIME_W = 33;
  const ROOM_W = 36;
  const TITLE_W = usableW - TIME_W - ROOM_W;
  let y = MT;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 12) {
      doc.addPage();
      y = MT;
    }
  };

  const splitWrite = (
    text: string,
    x: number,
    maxW: number,
    size: number,
    font: "normal" | "bold" | "italic",
    r: number, g: number, b: number,
    lineH: number,
  ) => {
    doc.setFontSize(size).setFont("helvetica", font).setTextColor(r, g, b);
    const lines: string[] = doc.splitTextToSize(text, maxW);
    checkPage(lines.length * lineH + 1);
    doc.text(lines, x, y);
    y += lines.length * lineH;
  };

  // ── Main title ───────────────────────────────────────────────────
  doc.setFontSize(26).setFont("helvetica", "bold").setTextColor(20, 20, 20);
  doc.text(title, ML, y);
  y += 5;
  if (subtitle) {
    doc.setFontSize(11).setFont("helvetica", "normal").setTextColor(100, 100, 100);
    doc.text(subtitle, ML, y);
    y += 4;
  }
  doc.setDrawColor(210, 210, 210).setLineWidth(0.3);
  doc.line(ML, y, pageW - MR, y);
  y += 8;

  // ── Build days ───────────────────────────────────────────────────
  const days = Object.keys(data.Programme.Days);
  const allDaysSessions = days.map((day) => {
    const dateStr = data.Programme.Days[day].Date_String;
    const date = parseDate(dateStr);
    const sessions: Session[] = Object.values(
      data.Programme.Days[day].Session_Groups,
    )
      .flatMap((g) => g.Sessions)
      .sort((a, b) => a.Session_Start_Time.localeCompare(b.Session_Start_Time));
    return { day, date, sessions };
  });

  // ── Days ─────────────────────────────────────────────────────────
  allDaysSessions.forEach(({ date, sessions }, idx) => {
    checkPage(18);

    const weekday = date
      .toLocaleDateString("es-ES", { weekday: "long" })
      .toUpperCase();
    const dayDate = date
      .toLocaleDateString("es-ES", { day: "numeric", month: "long" })
      .toUpperCase();
    const dayLabel = `DÍA ${idx + 1}  •  ${weekday}, ${dayDate}`;
    doc.setFillColor(26, 32, 44);
    doc.rect(ML, y - 4.5, usableW, 9, "F");
    doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(255, 255, 255);
    doc.text(dayLabel, ML + 3, y + 1);
    y += 11;

    sessions.forEach((s) => {
      const breakSess = isBreak(s.Session_Title);
      const titleLines: string[] = doc.splitTextToSize(s.Session_Title, TITLE_W);
      const rowH = Math.max(titleLines.length * 5, 7);
      checkPage(rowH + 8);

      // Time
      doc.setFontSize(8.5).setFont("helvetica", "bold").setTextColor(40, 40, 40);
      doc.text(`${s.Session_Start_Time} - ${s.Session_End_Time}`, ML, y);

      // Title
      doc
        .setFontSize(9)
        .setFont("helvetica", breakSess ? "normal" : "bold")
        .setTextColor(breakSess ? 100 : 20, breakSess ? 100 : 20, breakSess ? 100 : 20);
      doc.text(titleLines, ML + TIME_W, y);

      // Room
      if (s.Session_Location) {
        doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(160, 160, 160);
        doc.text(s.Session_Location, pageW - MR, y, { align: "right" });
      }
      y += rowH;

      // Chair
      if (s.Session_Chair) {
        splitWrite(`Modera: ${s.Session_Chair}`, ML + TIME_W, TITLE_W, 7.5, "italic", 123, 21, 53, 4.5);
        y += 1;
      }

      // Presentations
      if (s.Presentations?.length) {
        s.Presentations.forEach((p) => {
          checkPage(6);
          const t = p.Start_Time && p.Start_Time !== "00:00" ? `${p.Start_Time}  ` : "";
          const spk = p.AllSpeakers?.length
            ? `  —  ${p.AllSpeakers.map((sp) => sp.Full_Name).join(", ")}`
            : "";
          splitWrite(`• ${t}${p.Presentation_Title}${spk}`, ML + TIME_W + 2, TITLE_W - 2, 7.5, "normal", 70, 70, 70, 4.2);
        });
        y += 1;
      }

      // Separator
      doc.setDrawColor(235, 235, 235).setLineWidth(0.2);
      doc.line(ML, y + 1.5, pageW - MR, y + 1.5);
      y += 5;
    });

    y += 5;
  });

  // ── Footer on every page ─────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(180, 180, 180);
    doc.text(footerText, pageW / 2, pageH - 8, { align: "center" });
    doc.text(`${p} / ${totalPages}`, pageW - MR, pageH - 8, { align: "right" });
  }

  doc.save(filename);
}
