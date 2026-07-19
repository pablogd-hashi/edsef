import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@memoria.app" },
    update: {},
    create: {
      name: "Padre Demo",
      email: "demo@memoria.app",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const family = await prisma.family.upsert({
    where: { id: "seed-family-bianca" },
    update: {},
    create: {
      id: "seed-family-bianca",
      name: "Familia Demo",
    },
  });

  const existingMember = await prisma.familyMember.findFirst({
    where: { familyId: family.id, userId: user.id, childId: null },
  });
  if (!existingMember) {
    await prisma.familyMember.create({
      data: { familyId: family.id, userId: user.id, role: "OWNER" },
    });
  }

  const amsterdam = await prisma.location.upsert({
    where: { id: "seed-loc-amsterdam" },
    update: {},
    create: {
      id: "seed-loc-amsterdam",
      familyId: family.id,
      name: "Ámsterdam",
      city: "Ámsterdam",
      country: "Países Bajos",
    },
  });

  const diemen = await prisma.location.upsert({
    where: { id: "seed-loc-diemen" },
    update: {},
    create: {
      id: "seed-loc-diemen",
      familyId: family.id,
      name: "Diemen",
      city: "Diemen",
      country: "Países Bajos",
    },
  });

  const valencia = await prisma.location.upsert({
    where: { id: "seed-loc-valencia" },
    update: {},
    create: {
      id: "seed-loc-valencia",
      familyId: family.id,
      name: "Valencia",
      city: "Valencia",
      country: "España",
    },
  });

  const child = await prisma.child.upsert({
    where: { id: "seed-child-bianca" },
    update: {},
    create: {
      id: "seed-child-bianca",
      familyId: family.id,
      fullName: "Bianca",
      nickname: "Bi",
      birthDate: new Date("2024-03-15"),
      themeColor: "#C4A77D",
      titleFont: "serif",
      description:
        "Nacida en Ámsterdam. Su primer año estuvo lleno de descubrimientos, viajes y primeras veces.",
      createdById: user.id,
      updatedById: user.id,
    },
  });

  const yearbook = await prisma.yearbook.upsert({
    where: { id: "seed-yearbook-bianca-y1" },
    update: {},
    create: {
      id: "seed-yearbook-bianca-y1",
      childId: child.id,
      title: "Año 1",
      yearNumber: 1,
      periodStart: new Date("2024-03-15"),
      periodEnd: new Date("2025-03-14"),
      ageLabel: "0-12 meses",
      template: "EDITORIAL",
      status: "DRAFT",
      customCoverTitle: "El primer año de Bianca",
      summaryContent: {
        location: "Diemen, Países Bajos",
        context: "Primer año en familia, entre Ámsterdam y viajes a España",
        trips: ["Valencia", "Primera playa"],
        favoriteMusic: "Canciones de cuna y melodías suaves",
        likes: "Agua, música, mirar luces",
        fears: "Ruidos fuertes repentinos",
        quotes: ["¡Agua!", "Mamá"],
        importantPeople: ["Mamá", "Papá", "Abuelos"],
      },
      createdById: user.id,
      updatedById: user.id,
    },
  });

  const sectionTypes = [
    { type: "COVER" as const, title: "Portada", order: 0 },
    { type: "SUMMARY" as const, title: "Resumen del año", order: 1 },
    { type: "MILESTONES" as const, title: "Hitos", order: 2 },
    { type: "STORIES" as const, title: "Historias", order: 3 },
    { type: "VIDEOS" as const, title: "Videos", order: 4 },
    { type: "MUSIC" as const, title: "Música", order: 5 },
    { type: "PARENT_NOTES" as const, title: "Notas de mamá y papá", order: 6 },
    { type: "TIMELINE" as const, title: "Línea temporal", order: 7 },
    { type: "FUTURE_LETTER" as const, title: "Carta al futuro", order: 8 },
    { type: "ATTACHMENTS" as const, title: "Archivos importantes", order: 9 },
  ];

  for (const s of sectionTypes) {
    await prisma.section.upsert({
      where: { id: `seed-section-${s.type.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-section-${s.type.toLowerCase()}`,
        yearbookId: yearbook.id,
        type: s.type,
        title: s.title,
        order: s.order,
        visible: true,
      },
    });
  }

  const milestones = [
    {
      id: "seed-milestone-birth",
      title: "Nacimiento",
      description: "Llegó al mundo en un hospital de Ámsterdam en una mañana de marzo.",
      eventDate: new Date("2024-03-15"),
      ageLabel: "0 días",
      order: 0,
      locationId: amsterdam.id,
    },
    {
      id: "seed-milestone-first-food",
      title: "Primera comida: banana y palta",
      description: "Sus primeros sabores fueron banana y palta. Las caras que puso fueron irresistibles.",
      eventDate: new Date("2024-09-10"),
      ageLabel: "6 meses",
      order: 1,
    },
    {
      id: "seed-milestone-first-flight",
      title: "Primer vuelo a Valencia",
      description: "Su primer viaje en avión hacia el sol de Valencia.",
      eventDate: new Date("2024-10-20"),
      ageLabel: "7 meses",
      order: 2,
      locationId: valencia.id,
    },
    {
      id: "seed-milestone-first-beach",
      title: "Primera vez en la playa",
      description: "Arena, olas y mucha curiosidad. No le gustó demasiado el agua fría al principio.",
      eventDate: new Date("2024-10-22"),
      ageLabel: "7 meses",
      order: 3,
      locationId: valencia.id,
    },
  ];

  for (const m of milestones) {
    await prisma.milestone.upsert({
      where: { id: m.id },
      update: {},
      create: { yearbookId: yearbook.id, ...m },
    });
  }

  await prisma.story.upsert({
    where: { id: "seed-story-birth" },
    update: {},
    create: {
      id: "seed-story-birth",
      yearbookId: yearbook.id,
      title: "El día que naciste",
      isFeatured: true,
      order: 0,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "El día que naciste" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Era una mañana de marzo en Ámsterdam. El cielo estaba gris pero dentro del hospital todo brillaba. Después de horas de espera y emoción, finalmente te vimos por primera vez.",
              },
            ],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "text",
                text: "Bienvenida al mundo, pequeña Bianca.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Ese día supimos que nuestra vida había cambiado para siempre. Volvimos a casa en Diemen, donde empezarías a descubrir el mundo.",
              },
            ],
          },
        ],
      },
    },
  });

  const timelineEntries = [
    {
      id: "seed-timeline-mar",
      title: "Nacimiento en Ámsterdam",
      description: "Bienvenida al mundo en una mañana de marzo.",
      eventDate: new Date("2024-03-15"),
      month: 3,
      ageLabel: "0 días",
      locationId: amsterdam.id,
    },
    {
      id: "seed-timeline-apr",
      title: "Primer mes en casa",
      description: "Adaptándose a la vida en Diemen.",
      eventDate: new Date("2024-04-15"),
      month: 4,
      ageLabel: "1 mes",
      locationId: diemen.id,
    },
    {
      id: "seed-timeline-jun",
      title: "Primeras sonrisas sociales",
      description: "Empezó a responder con sonrisas a voces conocidas.",
      eventDate: new Date("2024-06-15"),
      month: 6,
      ageLabel: "3 meses",
    },
    {
      id: "seed-timeline-sep",
      title: "Primeros sabores",
      description: "Banana y palta — las primeras comidas.",
      eventDate: new Date("2024-09-10"),
      month: 9,
      ageLabel: "6 meses",
    },
    {
      id: "seed-timeline-oct",
      title: "Viaje a Valencia",
      description: "Primer vuelo y primera playa.",
      eventDate: new Date("2024-10-20"),
      month: 10,
      ageLabel: "7 meses",
      locationId: valencia.id,
    },
    {
      id: "seed-timeline-dec",
      title: "Fin del primer año",
      description: "Celebrando 9 meses de aventuras.",
      eventDate: new Date("2024-12-15"),
      month: 12,
      ageLabel: "9 meses",
    },
  ];

  for (const t of timelineEntries) {
    await prisma.timelineEntry.upsert({
      where: { id: t.id },
      update: {},
      create: { yearbookId: yearbook.id, ...t },
    });
  }

  await prisma.musicEntry.upsert({
    where: { id: "seed-music-1" },
    update: {},
    create: {
      id: "seed-music-1",
      yearbookId: yearbook.id,
      title: "Twinkle Twinkle Little Star",
      artist: "Canciones de cuna",
      order: 0,
    },
  });

  await prisma.parentNote.upsert({
    where: { id: "seed-note-1" },
    update: {},
    create: {
      id: "seed-note-1",
      yearbookId: yearbook.id,
      author: "Papá",
      content:
        "Este primer año ha sido el más intenso y hermoso de nuestras vidas. Cada día aprendemos algo nuevo contigo.",
      noteDate: new Date("2025-03-14"),
      order: 0,
    },
  });

  await prisma.futureLetter.upsert({
    where: { yearbookId: yearbook.id },
    update: {},
    create: {
      yearbookId: yearbook.id,
      content:
        "Querida Bianca, cuando leas esto quizás tengas 18 años o más. Queremos que sepas que desde el primer día fuiste amada profundamente. Este año estuvo lleno de primeras veces: tu nacimiento en Ámsterdam, tu casa en Diemen, tu primer vuelo, tu primera playa en Valencia. Guardamos cada momento para ti.",
      signature: "Mamá y Papá",
      letterDate: new Date("2025-03-14"),
      hiddenUntilAge: 18,
    },
  });

  const tags = ["viaje", "alimentación", "familia", "playa"];
  for (const name of tags) {
    await prisma.tag.upsert({
      where: { familyId_name: { familyId: family.id, name } },
      update: {},
      create: { familyId: family.id, name },
    });
  }

  console.log("✅ Seed completed!");
  console.log("");
  console.log("Demo credentials:");
  console.log("  Email:    demo@memoria.app");
  console.log("  Password: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
