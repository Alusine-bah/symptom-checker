"use client";

import { useApp } from "@/components/AppProvider";
import { ABOUT } from "@/lib/aboutStrings";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 text-slate-700">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  const { lang } = useApp();
  const a = ABOUT[lang];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{a.title}</h1>
      <p className="mt-3 text-slate-600">{a.intro}</p>

      <Section title={a.s1Title}>
        <List items={a.s1Items} />
      </Section>
      <Section title={a.s2Title}>
        <p className="mb-2">{a.s2Text}</p>
        <List items={a.s2Items} />
      </Section>
      <Section title={a.s3Title}>
        <List items={a.s3Items} />
      </Section>
      <Section title={a.s4Title}>
        <List items={a.s4Items} />
      </Section>
      <Section title={a.s5Title}>
        <p className="mb-2">{a.s5Text}</p>
        <ul className="list-disc space-y-2 pl-5">
          {a.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        {a.emergency}
      </p>
    </div>
  );
}
