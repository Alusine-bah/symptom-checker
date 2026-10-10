// Free "describe your symptom" search. No AI and no server: it matches what the
// person types (English or French, everyday words included) to the checklist.

import type { Knowledge, Lang, Severity } from "./engine";

export type SymptomHit = { slug: string; name: string; severity: Severity };
export type SearchNote = { tone: "urgent" | "caution"; text: string };
export type SearchResult = { hits: SymptomHit[]; notes: SearchNote[] };

// Everyday ways people describe each symptom (English and French together).
const SYNONYMS: Record<string, string> = {
  fever: "fever, temperature, hot body, body is hot, feverish, burning up, fievre, temperature, corps chaud, brulant, febrile",
  high_fever: "very high fever, high temperature, very hot, burning hot, 39, 40, forte fievre, fievre elevee, tres chaud",
  chills: "chills, shivering, shaking, cold shivers, rigors, feeling cold, frissons, grelotte, tremblements, froid",
  fatigue: "tired, tiredness, fatigue, exhausted, no energy, lethargy, sleepy, fatigue, epuise, sans energie, somnolent",
  night_sweats: "night sweats, sweating at night, sweat at night, drenching sweats, soaked sheets, sueurs nocturnes, transpiration nuit, transpire la nuit",
  weight_loss: "weight loss, losing weight, getting thin, thinner, wasting, lost weight, skinny, perte de poids, maigrir, amaigrissement, maigre, perdu du poids",
  loss_of_appetite: "no appetite, not eating, loss of appetite, do not want to eat, poor appetite, refusing food, perte d appetit, pas d appetit, ne mange pas, refuse de manger, inappetence",
  swollen_glands: "swollen glands, swollen lymph nodes, lump in neck, lumps in neck, neck swelling, swollen neck, lump armpit, ganglions, glandes enflees, boule dans le cou, gonflement du cou",
  severe_weakness: "very weak, severe weakness, cannot stand, too weak, collapse, no strength, tres faible, faiblesse, ne peut pas se lever, plus de force, prostre",
  pale_skin: "pale, pale skin, pale eyelids, pale lips, anaemia, anemia, white eyes, looks pale, pale, paleur, anemie, paupieres pales, levres pales",
  excessive_thirst: "very thirsty, thirst, thirsty all the time, dry mouth, drinking a lot of water, soif, tres soif, bouche seche, boit beaucoup",
  cough: "cough, coughing, dry cough, wet cough, phlegm, sputum, mucus, toux, tousse, toux seche, crachats, glaires",
  persistent_cough: "cough for weeks, long cough, cough three weeks, chronic cough, cough that will not go, cough more than 3 weeks, toux depuis des semaines, toux chronique, toux persistante, toux qui dure",
  cough_blood: "cough blood, coughing blood, blood in sputum, blood when coughing, spitting blood, bloody cough, crache du sang, crachats de sang, sang en toussant, toux sanglante",
  shortness_of_breath: "cannot breathe, hard to breathe, difficulty breathing, short of breath, breathless, breathlessness, struggling to breathe, gasping, suffocating, difficulte a respirer, essoufflement, essouffle, souffle court, ne peut pas respirer, suffoque, manque d air",
  fast_breathing: "fast breathing, breathing fast, rapid breathing, quick breathing, panting, respiration rapide, respire vite, halete",
  wheezing: "wheeze, wheezing, whistling chest, chest whistling, noisy breathing, sifflement, respiration sifflante, siffle",
  nausea: "nausea, feel sick, feeling sick, nauseous, want to vomit, queasy, sick stomach, nausee, nausees, envie de vomir, mal au coeur",
  vomiting: "vomit, vomiting, throwing up, throw up, puking, threw up, vomissement, vomissements, vomir, vomis, rend",
  persistent_vomiting: "vomiting all day, cannot keep food down, keeps vomiting, repeated vomiting, vomiting many times, vomit tout le temps, vomissements repetes, ne garde rien, vomissements persistants",
  diarrhea: "diarrhea, diarrhoea, loose stool, loose stools, running stomach, runny stool, watery stool, frequent stool, purging, diarrhee, selles molles, selles liquides, ventre qui coule, va souvent a la selle",
  watery_diarrhea: "watery diarrhea, rice water stool, rice water, severe diarrhea, profuse diarrhea, diarrhee aqueuse, eau de riz, diarrhee abondante, selles aqueuses",
  bloody_stool: "blood in stool, bloody stool, bloody diarrhea, blood in faeces, black stool, red stool, dysentery, sang dans les selles, selles sanglantes, selles noires, dysenterie",
  abdominal_pain: "stomach pain, belly pain, tummy pain, stomach ache, stomachache, belly ache, abdominal pain, cramps, stomach cramps, tummy ache, mal au ventre, douleur au ventre, douleur abdominale, mal d estomac, crampes, maux de ventre",
  severe_abdominal_pain: "severe stomach pain, severe belly pain, unbearable stomach pain, strong stomach pain, sharp abdominal pain, severe abdominal pain, forte douleur au ventre, douleur abdominale intense, mal au ventre insupportable, douleur vive au ventre",
  constipation: "constipation, constipated, cannot pass stool, hard stool, not passing stool, constipe, ne va pas a la selle, selles dures",
  jaundice: "jaundice, yellow eyes, yellow skin, yellowish eyes, eyes turned yellow, jaunisse, yeux jaunes, peau jaune, yeux qui jaunissent",
  vomiting_blood: "vomiting blood, vomit blood, blood in vomit, bloody vomit, coffee ground vomit, throwing up blood, vomit du sang, vomissements de sang, sang dans les vomissements",
  headache: "headache, head pain, head ache, head hurts, pain in head, my head is aching, mal de tete, maux de tete, cephalee, tete qui fait mal, migraine",
  severe_headache: "severe headache, terrible headache, worst headache, strong headache, splitting headache, pounding head, mal de tete intense, forte migraine, violent mal de tete, mal de tete terrible",
  dizziness: "dizzy, dizziness, giddy, light headed, lightheaded, room spinning, vertigo, spinning, vertige, vertiges, etourdissement, tete qui tourne, etourdi",
  confusion: "confused, confusion, not making sense, disoriented, talking nonsense, delirious, delirium, hallucinating, confus, desoriente, delire, dit n importe quoi",
  seizures: "seizure, seizures, convulsion, convulsions, fits, fitting, epileptic fit, jerking, crise, crise d epilepsie, tremble, spasmes",
  stiff_neck: "stiff neck, neck stiffness, cannot bend neck, neck pain, neck hurts, neck rigid, nuque raide, raideur de la nuque, douleur au cou",
  light_sensitivity: "light hurts, sensitive to light, photophobia, bright light hurts eyes, cannot look at light, lumiere gene, sensible a la lumiere, photophobie, lumiere fait mal",
  unconsciousness: "fainted, fainting, passed out, collapsed, unconscious, blackout, black out, loss of consciousness, unresponsive, evanoui, evanouissement, perte de connaissance, inconscient, malaise, s est effondre",
  one_sided_weakness: "weak one side, one side of body weak, numb one side, face drooping, droop face, stroke, slurred speech, cannot move one side, faiblesse d un cote, moitie du corps, engourdissement d un cote, visage qui tombe, paralysie, avc, parole difficile",
  rash: "rash, skin rash, spots, red spots, bumps, skin eruptions, red patches, eruption, eruption cutanee, boutons, taches rouges, plaques rouges, rougeurs",
  itching: "itch, itching, itchy, scratching, itchy skin, demangeaison, demangeaisons, gratte, ca gratte, prurit",
  skin_sores: "sores, blisters, ulcer, open sore, wound that will not heal, pus, boils, abscess, pustules, plaie, plaies, cloques, ulcere, abces, furoncle, bouton purulent",
  unexplained_bleeding: "bleeding, bleeding gums, nosebleed, nose bleed, easy bruising, bruises, blood from nose, bleeding for no reason, saignement, saigne, saignement de nez, gencives qui saignent, bleus, ecchymoses, hemorragie",
  chest_pain: "chest pain, pain in chest, chest tightness, chest pressure, heart pain, tight chest, crushing chest, douleur poitrine, douleur dans la poitrine, oppression, serrement, douleur au coeur, poitrine serree",
  palpitations: "palpitations, heart racing, racing heart, heart pounding, fast heartbeat, heart beating fast, irregular heartbeat, heart jumping, coeur qui bat vite, coeur qui s emballe, battements rapides, tachycardie",
  swollen_legs: "swollen legs, swollen feet, swollen ankles, leg swelling, feet swelling, puffy legs, puffy feet, jambes enflees, pieds enfles, chevilles enflees, gonflement des jambes, oedeme",
  sore_throat: "sore throat, throat pain, painful throat, throat hurts, scratchy throat, tonsils, mal de gorge, gorge douloureuse, gorge qui fait mal, angine, amygdales",
  runny_nose: "runny nose, blocked nose, stuffy nose, nose running, catarrh, congestion, nasal congestion, snot, nez qui coule, nez bouche, rhume, ecoulement nasal, morve",
  ear_pain: "ear pain, earache, ear ache, ear hurts, pain in ear, discharge from ear, ear infection, mal a l oreille, douleur a l oreille, otite, oreille qui coule",
  red_eyes: "red eyes, red eye, painful eyes, eye pain, sore eyes, eyes watering, eye discharge, pink eye, itchy eyes, yeux rouges, oeil rouge, yeux douloureux, douleur a l oeil, larmoiement, conjonctivite",
  blurred_vision: "blurred vision, blurry vision, cannot see clearly, vision problems, poor eyesight, dim vision, double vision, seeing double, losing sight, vision floue, vue trouble, ne voit pas bien, probleme de vue, vision double, baisse de la vue",
  muscle_aches: "muscle pain, muscle aches, body aches, body pain, body ache, body pains, muscles hurt, myalgia, sore muscles, douleurs musculaires, courbatures, mal partout, douleurs du corps, mal au corps",
  joint_pain: "joint pain, joints hurt, painful joints, arthritis, knee pain, elbow pain, wrist pain, ankle pain, aching joints, douleurs articulaires, articulations douloureuses, mal aux articulations, mal aux genoux, arthrite",
  severe_joint_pain: "severe joint pain, unbearable joint pain, very painful joints, bone pain, douleurs articulaires intenses, articulations tres douloureuses, douleurs des os, douleur osseuse",
  painful_urination: "burning urine, burning when urinating, burning when i pee, pain when peeing, pain urinating, painful urination, burning urination, hurts to pee, stinging urine, pain passing urine, brulure en urinant, brulures urinaires, douleur en urinant, ca brule quand j urine, douleur a la miction",
  frequent_urination: "frequent urination, urinating often, peeing a lot, passing urine often, urinating a lot, going to toilet a lot, need to pee often, besoin frequent d uriner, urine souvent, urines frequentes, va souvent aux toilettes, envies frequentes d uriner",
  blood_in_urine: "blood in urine, red urine, bloody urine, urine has blood, brown urine, dark urine, cola colored urine, pink urine, sang dans les urines, urines rouges, urines sanglantes, urines foncees, urine marron",
  numb_skin_patch: "numb skin, numb patch, patch no feeling, skin patch loss of feeling, white patch numb, loss of sensation skin, plaque insensible, peau engourdie, tache sans sensibilite, plaque sans sensation, perte de sensation",
  loss_of_smell_taste: "lost my sense of smell, lost my sense of taste, sense of smell, sense of taste, cannot smell anything, lost smell, lost taste, cannot smell, cannot taste, no smell, no taste, loss of smell, loss of taste, food has no taste, perte de l odorat, perte du gout, ne sent plus, plus de gout, anosmie",
  sneezing: "sneezing, sneeze, sneezes, achoo, sneezing a lot, eternuements, eternue, eternuer, atchoum",
  difficulty_swallowing: "difficulty swallowing, painful swallowing, cannot swallow, hard to swallow, pain when swallowing, food stuck in throat, trouble swallowing, difficulte a avaler, avaler fait mal, ne peut pas avaler, douleur a la deglutition, aliment coince",
  jaw_stiffness: "stiff jaw, lockjaw, locked jaw, cannot open mouth, cannot open jaw, muscle spasms, muscle spasm, jaw locked, machoire raide, trismus, machoire bloquee, ne peut pas ouvrir la bouche, spasmes musculaires, contractures",
  animal_bite: "dog bite, bitten by dog, bat bite, monkey bite, animal bite, scratched by animal, cat scratch, animal scratch, morsure de chien, mordu par un chien, morsure, griffure, griffe par un animal",
  limb_paralysis: "cannot move arm, cannot move leg, floppy leg, floppy arm, weak leg child, paralysed, paralyzed, paralysis, limp leg, jambe molle, bras mou, paralysie, ne bouge plus la jambe, jambe flasque",
  flank_pain: "flank pain, side pain, pain in the side, back pain, pain in lower back, kidney pain, loin pain, pain under ribs, douleur au flanc, douleur sur le cote, mal au dos, douleur lombaire, douleur au rein, colique nephretique",
  vaginal_discharge: "vaginal discharge, discharge from vagina, smelly discharge, white discharge, fishy smell, foul smell down there, pertes vaginales, pertes blanches, pertes malodorantes, ecoulement vaginal, mauvaise odeur intime",
  vaginal_itching: "vaginal itching, itching down there, vagina itching, vaginal soreness, itchy private parts, demangeaisons vaginales, irritation vaginale, ca gratte en bas, vulve qui gratte",
  genital_sores: "genital sores, sore on private part, ulcer on genitals, sore on penis, sore on vagina, genital ulcer, wound on private parts, plaie sur le sexe, ulcere genital, bouton sur le sexe, plaie genitale",
  penile_discharge: "discharge from penis, penis discharge, pus from penis, urethral discharge, dripping from penis, ecoulement du penis, pus du sexe, ecoulement uretral, goutte",
  lower_abdominal_pain_women: "lower belly pain, pain in lower abdomen, pelvic pain, pain below the navel, pain in the lower stomach, douleur bas ventre, douleur pelvienne, mal au bas du ventre",
  pain_during_sex: "pain during sex, pain when having sex, painful sex, hurts during intercourse, pain during intercourse, douleur pendant les rapports, douleur lors des rapports, rapports douloureux",
  painful_buboes: "painful lump in groin, swollen painful gland, bubo, buboes, painful swelling in armpit, painful lump in neck, tender swollen glands, boule douloureuse a l aine, bubon, ganglion douloureux, gros ganglion douloureux",
  skin_red_hot_swollen: "red hot swollen skin, hot swollen leg, red swollen painful skin, spreading redness, skin infection, red patch spreading, warm red skin, peau rouge et chaude, jambe rouge et gonflee, rougeur qui s etend, infection de la peau",
  scalp_itch_lice: "head lice, lice, nits, itchy scalp, itchy head, scratching head, lice in hair, poux, lentes, cuir chevelu qui gratte, tete qui gratte",
  blistering_rash_one_side: "shingles, painful blisters one side, blisters on one side, band of blisters, burning rash one side, rash on one side of body, zona, cloques d un seul cote, eruption d un cote, bande de cloques",
  dark_urine: "dark urine, tea colored urine, brown urine, urine is dark, dark yellow urine, orange urine, urines foncees, urine couleur the, urine marron, urine sombre",
};

const STOP = new Set(
  ("i me my a an the of or and in on at to is am are have has had with when from for it its feel feeling feels got get very some bit " +
    "j ai a de du des la le les un une et ou en au aux mon ma mes avec dans sur je me suis tres trop beaucoup il elle ca ").split(" "),
);

function normalize(s: string): string {
  return s
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s")) return w.slice(0, -1);
  return w;
}

function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

type Entry = { slug: string; phrases: string[]; words: string[]; bag: string[] };

let cache: { kb: Knowledge; entries: Entry[]; freq: Map<string, number> } | null = null;

function build(kb: Knowledge) {
  if (cache && cache.kb === kb) return cache;
  const entries: Entry[] = kb.symptoms.map((s) => {
    const terms = [
      ...(SYNONYMS[s.slug] ?? "").split(",").map((t) => normalize(t)),
      normalize(s.en.replace(/\(.*?\)/g, " ")),
      normalize(s.fr.replace(/\(.*?\)/g, " ")),
    ].filter(Boolean);
    const phrases = terms.filter((t) => t.includes(" "));
    const words = terms.filter((t) => !t.includes(" "));
    const bag = Array.from(
      new Set(
        terms
          .flatMap((t) => t.split(" "))
          .filter((w) => w.length > 1 && !STOP.has(w))
          .map(stem),
      ),
    );
    return { slug: s.slug, phrases, words, bag };
  });
  const freq = new Map<string, number>();
  for (const e of entries) for (const w of e.bag) freq.set(w, (freq.get(w) ?? 0) + 1);
  cache = { kb, entries, freq };
  return cache;
}

// Things this checker cannot assess. Show a safety message instead of guessing.
const NOTES: { terms: string[]; tone: SearchNote["tone"]; suppressHits: boolean; en: string; fr: string }[] = [
  {
    terms: [
      "snake", "snakebite", "scorpion", "poison", "poisoned", "poisoning", "overdose", "accident", "fracture",
      "broken bone", "gunshot", "stabbed", "drowning", "electric shock", "electrocuted",
      "serpent", "empoisonne", "empoisonnement", "surdose", "os casse", "coup de feu", "poignarde", "noye", "electrocute",
    ],
    tone: "urgent",
    suppressHits: true,
    en: "This may be an emergency that this checker cannot assess. Go to the nearest health facility or hospital now.",
    fr: "Cela peut être une urgence que ce vérificateur ne peut pas évaluer. Rendez-vous immédiatement dans l'établissement de santé ou l'hôpital le plus proche.",
  },
  {
    terms: [
      "pregnant", "pregnancy", "miscarriage", "labour", "labor", "contractions",
      "enceinte", "grossesse", "fausse couche", "accouchement",
    ],
    tone: "urgent",
    suppressHits: false,
    en: "This checker does not cover pregnancy. If you are pregnant and have heavy bleeding, a severe headache, swelling of the face or hands, convulsions, severe belly pain, fever, or your baby is moving less, go to a health facility immediately.",
    fr: "Ce vérificateur ne couvre pas la grossesse. Si vous êtes enceinte et avez un saignement abondant, un violent mal de tête, un gonflement du visage ou des mains, des convulsions, de fortes douleurs au ventre, de la fièvre, ou si le bébé bouge moins, allez immédiatement dans un établissement de santé.",
  },
  {
    terms: [
      "suicide", "suicidal", "kill myself", "end my life", "harm myself", "hurt myself", "want to die",
      "me tuer", "mettre fin a mes jours", "me faire du mal", "envie de mourir", "suicider",
    ],
    tone: "caution",
    suppressHits: true,
    en: "I'm sorry you are going through this. You deserve support right now. Please tell someone you trust, or go to the nearest clinic or hospital and ask for help today.",
    fr: "Je suis désolé que vous traversiez cela. Vous méritez du soutien dès maintenant. Parlez-en à une personne de confiance, ou rendez-vous aujourd'hui dans la clinique ou l'hôpital le plus proche pour demander de l'aide.",
  },
];

export function searchSymptoms(kb: Knowledge, query: string, lang: Lang): SearchResult {
  const q = normalize(query);
  if (q.length < 2) return { hits: [], notes: [] };

  const { entries, freq } = build(kb);
  const padded = ` ${q} `;
  const qTokens = q.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  const qStems = qTokens.map(stem);

  const notes: SearchNote[] = [];
  let suppress = false;
  for (const n of NOTES) {
    const hit = n.terms.some((t) => (t.includes(" ") ? padded.includes(` ${t} `) : q.split(" ").includes(t)));
    if (hit) {
      notes.push({ tone: n.tone, text: n[lang] });
      if (n.suppressHits) suppress = true;
    }
  }
  if (suppress) return { hits: [], notes };

  const scored: { slug: string; score: number }[] = [];
  for (const e of entries) {
    let score = 0;
    for (const p of e.phrases) if (padded.includes(` ${p} `)) score += 4;
    for (const w of e.words) if (qTokens.includes(w)) score += 2;
    for (const qs of qStems) {
      let best = 0;
      for (const b of e.bag) {
        if (tokensMatch(qs, b)) best = Math.max(best, 2 / Math.sqrt(freq.get(b) ?? 1));
      }
      score += best;
    }
    if (score >= 0.5) scored.push({ slug: e.slug, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const cutoff = scored.length > 0 ? scored[0].score * 0.35 : 0;

  const bySlug = new Map(kb.symptoms.map((s) => [s.slug, s]));
  const hits = scored.filter((x) => x.score >= cutoff).slice(0, 6).map(({ slug }) => {
    const s = bySlug.get(slug)!;
    return { slug, name: s[lang], severity: s.severity };
  });
  return { hits, notes };
}
