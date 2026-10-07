PRAGMA foreign_keys = ON;

CREATE TABLE regions (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL
);

CREATE TABLE diseases (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  cause_en TEXT,
  cause_fr TEXT,
  prevention_en TEXT,
  prevention_fr TEXT,
  urgency TEXT NOT NULL CHECK (urgency IN ('emergency','urgent','routine','self_care')),
  icd11_code TEXT,
  source_url TEXT NOT NULL
);

CREATE TABLE disease_regions (
  disease_id INTEGER NOT NULL REFERENCES diseases(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  prevalence INTEGER NOT NULL CHECK (prevalence BETWEEN 1 AND 3),
  PRIMARY KEY (disease_id, region_id)
);

CREATE TABLE symptoms (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor','severe','red_flag'))
);

CREATE TABLE disease_symptoms (
  disease_id INTEGER NOT NULL REFERENCES diseases(id),
  symptom_id INTEGER NOT NULL REFERENCES symptoms(id),
  weight REAL NOT NULL CHECK (weight BETWEEN 0 AND 1),
  PRIMARY KEY (disease_id, symptom_id)
);