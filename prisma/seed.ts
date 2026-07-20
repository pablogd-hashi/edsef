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
    update: {
      birthDate: new Date("2021-11-07"),
      description:
        "Nacida en Ámsterdam, cerca de las 22hs. Vivíamos en Diemen. Su primer año estuvo lleno de descubrimientos, viajes y primeras veces — todo en medio de una pandemia.",
    },
    create: {
      id: "seed-child-bianca",
      familyId: family.id,
      fullName: "Bianca",
      nickname: "Bianqui",
      birthDate: new Date("2021-11-07"),
      themeColor: "#EC4899",
      titleFont: "serif",
      description:
        "Nacida en Ámsterdam, cerca de las 22hs. Vivíamos en Diemen. Su primer año estuvo lleno de descubrimientos, viajes y primeras veces — todo en medio de una pandemia.",
      createdById: user.id,
      updatedById: user.id,
    },
  });

  const yearbook = await prisma.yearbook.upsert({
    where: { id: "seed-yearbook-bianca-y1" },
    update: {
      title: "Año 1",
      periodStart: new Date("2021-11-07"),
      periodEnd: new Date("2022-11-06"),
      customCoverTitle: "Primer año juntos",
      summaryContent: {
        location: "Diemen, Países Bajos — Theo van Doesburghof 78",
        context: "Primer año en familia, en plena pandemia de COVID. Nacida en el Hospital BovenIJ de Ámsterdam.",
        trips: ["Valencia (primer vuelo)", "Primera playa"],
        favoriteMusic: "As It Was — Harry Styles, Don't Start Now — Dua Lipa",
        likes: "Agua, música, mirar luces",
        fears: "Ruidos fuertes repentinos",
        quotes: ["¡Agua!", "Mamá"],
        importantPeople: ["Mamá (Caro)", "Papá", "Alejandra (Doula)", "La partera"],
      },
    },
    create: {
      id: "seed-yearbook-bianca-y1",
      childId: child.id,
      title: "Año 1",
      yearNumber: 1,
      periodStart: new Date("2021-11-07"),
      periodEnd: new Date("2022-11-06"),
      ageLabel: "0-12 meses",
      template: "EDITORIAL",
      status: "DRAFT",
      customCoverTitle: "Primer año juntos",
      summaryContent: {
        location: "Diemen, Países Bajos — Theo van Doesburghof 78",
        context: "Primer año en familia, en plena pandemia de COVID. Nacida en el Hospital BovenIJ de Ámsterdam.",
        trips: ["Valencia (primer vuelo)", "Primera playa"],
        favoriteMusic: "As It Was — Harry Styles, Don't Start Now — Dua Lipa",
        likes: "Agua, música, mirar luces",
        fears: "Ruidos fuertes repentinos",
        quotes: ["¡Agua!", "Mamá"],
        importantPeople: ["Mamá (Caro)", "Papá", "Alejandra (Doula)", "La partera"],
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
      title: "Nacimiento en Ámsterdam",
      description:
        "Llegó al mundo cerca de las 22hs en el Hospital BovenIJ. Luz tenue, música de fondo, 45 minutos de piel con piel sin interrupciones. No lloró ni una sola vez.",
      eventDate: new Date("2021-11-07"),
      ageLabel: "0 días",
      order: 0,
      locationId: amsterdam.id,
    },
    {
      id: "seed-milestone-first-food",
      title: "Primera comida: banana y palta",
      description: "A los 6 meses probó sus primeros alimentos sólidos. Banana y palta — las caras fueron irresistibles.",
      eventDate: new Date("2022-05-07"),
      ageLabel: "6 meses",
      order: 1,
    },
    {
      id: "seed-milestone-first-flight",
      title: "Primer vuelo a Valencia",
      description:
        "A los 10 meses, su primer viaje en avión. Destino Valencia — que después sería nuestra casa sin saberlo.",
      eventDate: new Date("2022-09-07"),
      ageLabel: "10 meses",
      order: 2,
      locationId: valencia.id,
    },
    {
      id: "seed-milestone-first-beach",
      title: "Primera vez en la playa",
      description: "Arena, olas y mucha curiosidad en Valencia. Un momento que nunca olvidaremos.",
      eventDate: new Date("2022-09-10"),
      ageLabel: "10 meses",
      order: 3,
      locationId: valencia.id,
    },
  ];

  for (const m of milestones) {
    await prisma.milestone.upsert({
      where: { id: m.id },
      update: m,
      create: { yearbookId: yearbook.id, ...m },
    });
  }

  await prisma.story.upsert({
    where: { id: "seed-story-birth" },
    update: {
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
                text: "El día anterior, 6 de noviembre, fuimos a una casa de comida italiana a buscar panettones. Hasta el día de hoy creo que sentiste el aroma y decidiste que querías salir pronto, porque mamá Caro empezó con algunas molestias apenas volvimos a casa…",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Arrancamos el 7 de noviembre con total normalidad. Desayuno, mates y charla casual hasta aproximadamente las 11 de la mañana cuando mamá empieza a sentir dolores similares a los menstruales. En el lapso de no más de una hora, su cara ya era otra y empezamos juntos a transitar la fase activa, con masajes, pelota de yoga, pero sobre todo con la respiración.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Nos fuimos a las 19:50 al hospital, todos con barbijo y derecho a la bañera. Dos horas muy intensas hasta que a las 22 decidiste venir a conocernos, Bianqui.",
              },
            ],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "text",
                text: "En la habitación estábamos solo nosotros, la Doula, la partera y una enfermera. La música que queríamos escuchar de fondo, luz tenue. Te pusieron sobre el pecho de mamá y estuvimos casi 45 minutos sin que nadie nos interrumpa.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "No lloraste ni una sola vez… después pasaste al pecho de papá y estuvimos abrazados un tiempo largo. Bienvenida al mundo, pequeña.",
              },
            ],
          },
        ],
      },
    },
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
      id: "seed-timeline-nov",
      title: "Bianca llega a nuestras vidas",
      description: "Nacimiento en el Hospital BovenIJ de Ámsterdam, cerca de las 22hs.",
      eventDate: new Date("2021-11-07"),
      month: 11,
      ageLabel: "0 días",
      locationId: amsterdam.id,
    },
    {
      id: "seed-timeline-dec",
      title: "Primera Navidad juntos",
      description: "Celebrando las fiestas en Diemen, en plena pandemia.",
      eventDate: new Date("2021-12-25"),
      month: 12,
      ageLabel: "1 mes",
      locationId: diemen.id,
    },
    {
      id: "seed-timeline-mar",
      title: "Armando el cochecito",
      description: "Preparativos para salir a explorar el mundo.",
      eventDate: new Date("2022-03-15"),
      month: 3,
      ageLabel: "4 meses",
      locationId: diemen.id,
    },
    {
      id: "seed-timeline-may",
      title: "Primeros alimentos sólidos",
      description: "Banana y palta — las primeras comidas.",
      eventDate: new Date("2022-05-07"),
      month: 5,
      ageLabel: "6 meses",
    },
    {
      id: "seed-timeline-sep",
      title: "Primer vuelo a Valencia",
      description: "Su primer viaje en avión y primera vez en la playa.",
      eventDate: new Date("2022-09-07"),
      month: 9,
      ageLabel: "10 meses",
      locationId: valencia.id,
    },
    {
      id: "seed-timeline-oct",
      title: "Primera vez en el metro",
      description: "Explorando la ciudad en transporte público.",
      eventDate: new Date("2022-10-15"),
      month: 10,
      ageLabel: "11 meses",
    },
  ];

  for (const t of timelineEntries) {
    await prisma.timelineEntry.upsert({
      where: { id: t.id },
      update: t,
      create: { yearbookId: yearbook.id, ...t },
    });
  }

  const musicTracks = [
    {
      id: "seed-music-1",
      title: "As It Was",
      artist: "Harry Styles",
      youtubeUrl: "https://music.youtube.com/search?q=Harry+Styles+As+It+Was",
      order: 0,
    },
    {
      id: "seed-music-2",
      title: "Don't Start Now",
      artist: "Dua Lipa",
      youtubeUrl: "https://music.youtube.com/search?q=Dua+Lipa+Don%27t+Start+Now",
      order: 1,
    },
    {
      id: "seed-music-3",
      title: "Chuchuwua",
      artist: "Piñon Fijo",
      youtubeUrl: "https://music.youtube.com/search?q=Pi%C3%B1on+Fijo+Chuchuwua",
      order: 2,
    },
  ];

  for (const track of musicTracks) {
    await prisma.musicEntry.upsert({
      where: { id: track.id },
      update: track,
      create: { yearbookId: yearbook.id, ...track },
    });
  }

  await prisma.parentNote.upsert({
    where: { id: "seed-note-1" },
    update: {
      author: "Mamá",
      content:
        "A veces toma leche para irse a dormir en la noche y cada vez menos leche durante la madrugada (¡1 solo despertar!). Madrugamos 6:50am aprox todos los días.",
      noteDate: new Date("2022-06-01"),
    },
    create: {
      id: "seed-note-1",
      yearbookId: yearbook.id,
      author: "Mamá",
      content:
        "A veces toma leche para irse a dormir en la noche y cada vez menos leche durante la madrugada (¡1 solo despertar!). Madrugamos 6:50am aprox todos los días.",
      noteDate: new Date("2022-06-01"),
      order: 0,
    },
  });

  await prisma.parentNote.upsert({
    where: { id: "seed-note-2" },
    update: {},
    create: {
      id: "seed-note-2",
      yearbookId: yearbook.id,
      author: "Papá",
      content:
        "Este primer año ha sido el más intenso y hermoso de nuestras vidas. Desde el día de los panettones hasta tu primer vuelo a Valencia, cada momento contigo es un regalo.",
      noteDate: new Date("2022-11-06"),
      order: 1,
    },
  });

  await prisma.futureLetter.upsert({
    where: { yearbookId: yearbook.id },
    update: {
      content:
        "Querida Bianqui, cuando leas esto quizás tengas 18 años o más. Queremos que sepas que desde el primer día fuiste amada profundamente. Naciste en Ámsterdam, creciste en Diemen, y tu primer gran viaje fue a Valencia — una ciudad que después se convertiría en tu hogar. Guardamos cada momento de este primer año para ti, para que nunca olvides de dónde vienes y cuánto te queremos.",
    },
    create: {
      yearbookId: yearbook.id,
      content:
        "Querida Bianqui, cuando leas esto quizás tengas 18 años o más. Queremos que sepas que desde el primer día fuiste amada profundamente. Naciste en Ámsterdam, creciste en Diemen, y tu primer gran viaje fue a Valencia — una ciudad que después se convertiría en tu hogar. Guardamos cada momento de este primer año para ti, para que nunca olvides de dónde vienes y cuánto te queremos.",
      signature: "Mamá y Papá",
      letterDate: new Date("2022-11-06"),
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
