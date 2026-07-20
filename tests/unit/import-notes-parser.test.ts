import { describe, expect, it } from "vitest";
import { parseNotesDocument } from "@/lib/import/notes-parser";

const SAMPLE = `
Emma 2021-2022
First year together

Un resumen
- Born in spring during lockdown
- We lived downtown

Lo que lograste este año
1. 6 months: first solid foods
2. 10 months: first flight
3. 10 months: first beach day

Musica que te gustaba
- Song One: Artist A
- Song Two: Artist B

The day you were born
The day before, we went out for dinner. The next morning labor started around 11am.
We spent hours breathing through contractions, called the midwife, and by evening
you arrived. It was quiet, warm, and full of music we had chosen together.

1 second of each day
https://drive.google.com/file/d/example/view

2021 - First year with Emma (mom notes)
January
- Sleeping longer stretches at night
- Waking around 7am

2021 - Things that happened before you were born
January
- New Year's trip
February
- Big snowstorm
November
- You arrived!

2022 - Things that happened this year
May
- First family trip
June
- First Father's Day
`;

describe("parseNotesDocument", () => {
  it("maps PDF-style sections correctly", () => {
    const result = parseNotesDocument(SAMPLE);

    expect(result.detectedTitle).toBe("Emma 2021-2022");
    expect(result.summary.subtitle).toBe("First year together");
    expect(result.summary.highlights?.length).toBeGreaterThanOrEqual(2);
    expect(result.milestones).toHaveLength(3);
    expect(result.music).toHaveLength(2);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].title).toMatch(/day you were born/i);
    expect(result.videos).toHaveLength(1);
    expect(result.parentNotes.length).toBeGreaterThanOrEqual(2);
    expect(result.parentsBeforeBirth.some((t) => t.title.includes("snowstorm"))).toBe(
      true
    );
    expect(result.parentsDuringYear.some((t) => t.month === 5)).toBe(true);
  });

  it("handles Spanish month names", () => {
    const result = parseNotesDocument(`
2022 - Cosas que pasaron en este año
Enero
- Primer viaje
Febrero
- Primera nieve
    `);

    expect(result.parentsDuringYear).toHaveLength(2);
    expect(result.parentsDuringYear[0].month).toBe(1);
    expect(result.parentsDuringYear[0].category).toBe("PARENTS_DURING_YEAR");
  });
});
