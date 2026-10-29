import type { Lang } from "./engine";

const REPO = "https://github.com/Alusine-bah/symptom-checker";

const en = {
  nav: "About and sources",
  title: "About this tool and its sources",
  intro:
    "This is an educational project. It does not diagnose and it is not medical advice. This page says plainly what is sourced, what is estimated and what is still unchecked.",
  s1Title: "Disease information",
  s1Items: [
    "Every disease links to a public-health page (WHO, CDC or MedlinePlus). Use that page to confirm what you read here.",
    "The text was checked against those pages. 17 diseases have been compared line by line, and any wording the page did not support was removed. The rest passed an automatic screen that looks for the key terms, which is a rough test and not proof.",
    "Where the cited page leaves out an important warning sign, the warning is kept for safety and labelled “General safety advice (not from the cited page)”.",
  ],
  s2Title: "Estimates, not published figures",
  s2Text:
    "These are design choices, not clinical measurements, so they cannot be called “medically proven”:",
  s2Items: [
    "how strongly each symptom points to each disease",
    "how common each disease is in each region",
    "the urgency level given to each disease",
    "small adjustments for age, sex and pregnancy",
    "the list of danger signs that trigger the emergency alert",
  ],
  s3Title: "Checks that were run",
  s3Items: [
    "All 100 source links were tested by a script on 30 October 2026: none are broken.",
    "5 CDC pages refuse scripts, so they were opened and checked by eye: all 5 show the right disease.",
    "118 automated tests, and 75 written test scenarios (the same author wrote the scenarios and the weights, so they show consistency, not real-world accuracy).",
  ],
  s4Title: "Still needed",
  s4Items: [
    "Review of the weights, urgency levels and danger signs by a doctor, nurse or other qualified clinician.",
    "Review of the French medical wording by a French-speaking health professional.",
    "A line-by-line comparison for the remaining diseases.",
  ],
  s5Title: "Full details",
  s5Text: "The method, the line-by-line log and the link report are public:",
  links: [
    { label: "How the data is sourced and verified", href: `${REPO}/blob/main/docs/DATA_SOURCES.md` },
    { label: "Line-by-line verification log", href: `${REPO}/blob/main/docs/VERIFICATION_LOG.md` },
    { label: "Link check report", href: `${REPO}/blob/main/docs/source-report.csv` },
  ],
  emergency:
    "If you or someone else feels very unwell, or has a danger sign, seek medical care immediately.",
};

export type AboutStrings = typeof en;

const fr: AboutStrings = {
  nav: "À propos et sources",
  title: "À propos de cet outil et de ses sources",
  intro:
    "Ceci est un projet éducatif. Il ne pose pas de diagnostic et ne remplace pas un avis médical. Cette page indique clairement ce qui est sourcé, ce qui est estimé et ce qui reste à vérifier.",
  s1Title: "Informations sur les maladies",
  s1Items: [
    "Chaque maladie renvoie vers une page de santé publique (OMS, CDC ou MedlinePlus). Utilisez cette page pour confirmer ce que vous lisez ici.",
    "Les textes ont été comparés à ces pages. 17 maladies ont été comparées ligne par ligne, et tout ce que la page ne confirmait pas a été retiré. Les autres ont passé un contrôle automatique qui recherche les termes clés, un test approximatif et non une preuve.",
    "Quand la page citée omet un signe d'alerte important, l'avertissement est conservé par sécurité et étiqueté « Conseil de sécurité général (ne provient pas de la page citée) ».",
  ],
  s2Title: "Estimations, pas des chiffres publiés",
  s2Text:
    "Ce sont des choix de conception et non des mesures cliniques ; on ne peut donc pas les dire « médicalement prouvés » :",
  s2Items: [
    "le poids de chaque symptôme pour chaque maladie",
    "la fréquence de chaque maladie dans chaque région",
    "le niveau d'urgence attribué à chaque maladie",
    "de petits ajustements selon l'âge, le sexe et la grossesse",
    "la liste des signes de danger qui déclenchent l'alerte d'urgence",
  ],
  s3Title: "Vérifications effectuées",
  s3Items: [
    "Les 100 liens de sources ont été testés par un script le 30 octobre 2026 : aucun n'est cassé.",
    "5 pages du CDC refusent les scripts ; elles ont été ouvertes et vérifiées à la main : les 5 montrent la bonne maladie.",
    "118 tests automatiques et 75 scénarios de test écrits (le même auteur a écrit les scénarios et les poids : ils montrent la cohérence, pas la précision en conditions réelles).",
  ],
  s4Title: "Reste à faire",
  s4Items: [
    "Relecture des poids, des niveaux d'urgence et des signes de danger par un médecin, un infirmier ou un autre clinicien qualifié.",
    "Relecture du vocabulaire médical français par un professionnel de santé francophone.",
    "Comparaison ligne par ligne pour les maladies restantes.",
  ],
  s5Title: "Détails complets",
  s5Text: "La méthode, le journal ligne par ligne et le rapport des liens sont publics :",
  links: en.links.map((l, i) => ({
    ...l,
    label: [
      "Comment les données sont sourcées et vérifiées",
      "Journal de vérification ligne par ligne",
      "Rapport de vérification des liens",
    ][i],
  })),
  emergency:
    "Si vous ou une autre personne vous sentez très mal, ou présentez un signe de danger, consultez immédiatement un professionnel de santé.",
};

export const ABOUT: Record<Lang, AboutStrings> = { en, fr };
