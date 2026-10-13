import type { Lang } from "./engine";

const en = {
  label: "Are you pregnant?",
  no: "No",
  yes: "Yes",
  hint: "Choosing “Yes” adds pregnancy warning signs to the checklist and adjusts the advice.",
};

export type PregnancyStrings = typeof en;

const fr: PregnancyStrings = {
  label: "Êtes-vous enceinte ?",
  no: "Non",
  yes: "Oui",
  hint: "Choisir « Oui » ajoute les signes d'alerte de la grossesse à la liste et adapte les conseils.",
};

export const PREG: Record<Lang, PregnancyStrings> = { en, fr };
