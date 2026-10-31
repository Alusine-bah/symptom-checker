// Visitors report mistakes through a Google Form. The first question ("Which page is this about?")
// is pre-filled with the page name and address, so every report arrives tagged with its page.
const FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSeeUtsD0ZqbZYQuiNs36oGqa_supNcD2k7hDsm2OmGZ82POdg/viewform";
const PAGE_FIELD = "entry.1725776358";

export function reportUrl(pageLabel: string, path: string): string {
  const value = `${pageLabel} (${path})`;
  return `${FORM}?usp=pp_url&${PAGE_FIELD}=${encodeURIComponent(value)}`;
}
