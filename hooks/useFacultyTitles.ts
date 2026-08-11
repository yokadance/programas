import { useEffect, useState } from "react";

/**
 * Fetches the faculty endpoint and returns a Map<Faculty_Id, Prefix_Title>.
 * Used to enrich speaker data from Programme, which sometimes lacks Prefix_Title.
 */
export function useFacultyTitles(endpoint?: string): Map<string, string> {
  const [titlesMap, setTitlesMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!endpoint) return;
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        const list: { Faculty_Id: string; Prefix_Title?: string; Job_Title?: string }[] =
          Array.isArray(data) ? data : data.Faculty ?? [];
        const m = new Map<string, string>();
        list.forEach((f) => {
          const title = f.Prefix_Title || f.Job_Title || "";
          if (f.Faculty_Id && title) {
            m.set(f.Faculty_Id, title);
          }
        });
        setTitlesMap(m);
      })
      .catch(() => {});
  }, [endpoint]);

  return titlesMap;
}
