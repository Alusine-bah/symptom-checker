import type { Lang, Urgency } from "./api";

const en = {
  title: "Disease encyclopedia",
  intro: "Browse diseases from A to Z. Choose a region to see what is common where you live.",
  search: "Search diseases…",
  regionFilter: "Region",
  allRegions: "All regions",
  diseasesCount: "diseases",
  noResults: "No diseases match your search.",
  loading: "Loading…",
  apiError: "Cannot reach the server. Make sure the backend is running.",
  prevVery: "Very common here",
  prevCommon: "Common here",
  prevRare: "Rare here",
  uEmergency: "Emergency",
  uUrgent: "Urgent",
  uRoutine: "Routine",
  uSelfCare: "Self-care",
  back: "← All diseases",
  urgencyLabel: "Urgency",
  causeTitle: "Cause",
  preventionTitle: "Prevention",
  regionsTitle: "Where it occurs",
  signsTitle: "Typical signs",
  signVery: "Very typical",
  signCommon: "Common",
  signSometimes: "Sometimes seen",
  signsNote:
    "Not everyone has every sign, and many illnesses look alike. Only a health worker can diagnose.",
  sourceLabel: "Source",
  checkCta: "Check my symptoms",
  notFound: "Disease not found.",
};

export type EncStrings = typeof en;

const fr: EncStrings = {
  title: "Encyclopédie des maladies",
  intro:
    "Parcourez les maladies de A à Z. Choisissez une région pour voir ce qui est courant près de chez vous.",
  search: "Rechercher une maladie…",
  regionFilter: "Région",
  allRegions: "Toutes les régions",
  diseasesCount: "maladies",
  noResults: "Aucune maladie ne correspond à votre recherche.",
  loading: "Chargement…",
  apiError: "Impossible de joindre le serveur. Vérifiez que le serveur est lancé.",
  prevVery: "Très fréquente ici",
  prevCommon: "Fréquente ici",
  prevRare: "Rare ici",
  uEmergency: "Urgence",
  uUrgent: "Urgent",
  uRoutine: "Consultation",
  uSelfCare: "Soins à domicile",
  back: "← Toutes les maladies",
  urgencyLabel: "Urgence",
  causeTitle: "Cause",
  preventionTitle: "Prévention",
  regionsTitle: "Où elle existe",
  signsTitle: "Signes typiques",
  signVery: "Très typiques",
  signCommon: "Fréquents",
  signSometimes: "Parfois présents",
  signsNote:
    "Tout le monde n'a pas tous les signes, et beaucoup de maladies se ressemblent. Seul un professionnel de santé peut poser un diagnostic.",
  sourceLabel: "Source",
  checkCta: "Vérifier mes symptômes",
  notFound: "Maladie introuvable.",
};

export const ENC: Record<Lang, EncStrings> = { en, fr };

export const URGENCY_BADGE: Record<Urgency, string> = {
  emergency: "bg-red-100 text-red-800",
  urgent: "bg-orange-100 text-orange-800",
  routine: "bg-yellow-100 text-yellow-800",
  self_care: "bg-emerald-100 text-emerald-800",
};

export const URGENCY_KEY: Record<Urgency, keyof EncStrings> = {
  emergency: "uEmergency",
  urgent: "uUrgent",
  routine: "uRoutine",
  self_care: "uSelfCare",
};

export const PREV_KEY: Record<number, keyof EncStrings> = {
  3: "prevVery",
  2: "prevCommon",
  1: "prevRare",
};

export const PREV_BADGE: Record<number, string> = {
  3: "bg-emerald-100 text-emerald-800",
  2: "bg-sky-100 text-sky-800",
  1: "bg-slate-100 text-slate-600",
};

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const firstLetter = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase();