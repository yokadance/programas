import React from "react";

// Tags de formato que ShockLogic puede traer dentro de un título (ej: nombres
// científicos en cursiva, fórmulas con subíndices). Cualquier otro tag se
// descarta conservando su texto: nunca se inyecta HTML crudo de la API.
const ALLOWED_TAGS: Record<string, keyof React.JSX.IntrinsicElements> = {
  i: "i",
  em: "em",
  b: "strong",
  strong: "strong",
  sub: "sub",
  sup: "sup",
  u: "u",
};

const TAG_RE = /<(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;

type Frame = { tag: keyof React.JSX.IntrinsicElements | null; children: React.ReactNode[] };

/** Quita todos los tags y deja el texto plano (para PDF, `alt`, títulos, etc.). */
export function stripTags(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(TAG_RE, "");
}

/**
 * Renderiza un texto que puede traer tags de formato simples respetándolos.
 * Devuelve el string tal cual si no hay nada que parsear.
 */
export function renderRichText(
  text: string | null | undefined,
): React.ReactNode {
  if (!text) return null;
  if (!text.includes("<")) return text;

  const stack: Frame[] = [{ tag: null, children: [] }];
  let lastIndex = 0;
  let key = 0;

  const pushText = (value: string) => {
    if (value) stack[stack.length - 1].children.push(value);
  };

  const closeFrame = () => {
    const frame = stack.pop()!;
    const parent = stack[stack.length - 1];
    const Tag = frame.tag!;
    parent.children.push(
      <Tag key={`rt-${key++}`}>{frame.children}</Tag>,
    );
  };

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(text)) !== null) {
    pushText(text.slice(lastIndex, match.index));
    lastIndex = TAG_RE.lastIndex;

    const isClosing = match[1] === "/";
    const tag = ALLOWED_TAGS[match[2].toLowerCase()];
    if (!tag) continue; // tag no permitido: se ignora y su contenido se conserva

    if (!isClosing) {
      stack.push({ tag, children: [] });
    } else if (stack.length > 1 && stack[stack.length - 1].tag === tag) {
      closeFrame();
    }
  }
  pushText(text.slice(lastIndex));

  // Tags sin cerrar: se cierran solos para no perder el texto.
  while (stack.length > 1) closeFrame();

  const { children } = stack[0];
  return children.length === 1 && typeof children[0] === "string"
    ? children[0]
    : children;
}
