import countries from "@/country-flags/countries_with_flags.json";

type CountryEntry = { code: string; name_en: string; name_es: string };

const nameToEntry = new Map<string, CountryEntry>(
  (countries as CountryEntry[]).flatMap((c) => [
    [c.name_es.toLowerCase(), c],
    [c.name_en.toLowerCase(), c],
  ])
);

/**
 * Returns the full country name in Spanish, or "" if:
 *  - countryName is empty / null
 *  - countryName is Uruguay
 */
export function getCountryLabel(countryName?: string | null): string {
  if (!countryName?.trim()) return "";
  const lower = countryName.trim().toLowerCase();
  if (lower === "uruguay") return "";
  const entry = nameToEntry.get(lower);
  return entry ? entry.name_es : countryName.trim();
}
