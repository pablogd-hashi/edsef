import { describe, expect, it } from "vitest";
import { parseNotesDocument } from "@/lib/import/notes-parser";

const SAMPLE = `
Emma 2021-2022
First year together

- Born in spring during lockdown
- We lived downtown in a small apartment

What you achieved this year (see below)
1. 6 months: first solid foods — banana and avocado
2. 10 months: first flight to visit grandparents
3. 10 months: first time at the beach

Music you liked
- Song One: Artist A
- Song Two: Artist B

The day you were born
The day before, we went out for dinner. The next morning labor started around 11am.
We spent hours breathing through contractions, called the midwife, and by evening
you arrived. It was quiet, warm, and full of music we had chosen together.

2021 - Parent notes
January
- Sleeping longer stretches at night
- Waking around 7am every day

2021 - Things that happened before you were born
January
- New Year's trip
February
- Big snowstorm
March
- We moved apartments
November
- You arrived!

2022 - Things that happened this year
May
- First family trip
- Six months old!
June
- First Father's Day
September
- First time visiting the coast
`;

describe("parseNotesDocument", () => {
  it("detects title, milestones, music, story, and monthly timeline", () => {
    const result = parseNotesDocument(SAMPLE);

    expect(result.detectedTitle).toBe("Emma 2021-2022");
    expect(result.yearRange).toEqual({ start: 2021, end: 2022 });
    expect(result.milestones).toHaveLength(3);
    expect(result.milestones[0].title).toContain("6 months");
    expect(result.music).toHaveLength(2);
    expect(result.stories.length).toBeGreaterThanOrEqual(1);
    expect(result.stories[0].title).toMatch(/day you were born/i);
    expect(result.parentNotes.length).toBeGreaterThanOrEqual(2);
    expect(result.timeline.some((t) => t.title.includes("snowstorm"))).toBe(true);
    expect(result.timeline.some((t) => t.month === 5 && t.year === 2022)).toBe(true);
  });

  it("handles Spanish month names", () => {
    const result = parseNotesDocument(`
2022 - Cosas que pasaron
Enero
- Primer viaje
Febrero
- Primera nieve
    `);

    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0].month).toBe(1);
    expect(result.timeline[1].month).toBe(2);
  });
});
