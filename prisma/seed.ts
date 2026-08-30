import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@amislab.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Lab Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@amislab.local" },
    update: {},
    create: {
      name: "Abdulaziz Asiri",
      email: "member@amislab.local",
      passwordHash: await bcrypt.hash("Member123!", 10),
      role: "MEMBER",
      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: { email: "pending@amislab.local" },
    update: {},
    create: {
      name: "New Applicant",
      email: "pending@amislab.local",
      passwordHash: await bcrypt.hash("Pending123!", 10),
      role: "MEMBER",
      status: "PENDING",
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "1" },
    update: {},
    create: {
      id: "1",
      homeIntroTitle: "AMIS Lab",
      homeIntroBody:
        "AMIS Lab (Advanced Materials, Innovation & Sustainability) develops next-generation materials spanning optics, protective shielding, and biomedical glass — bridging fundamental research with real-world commercialization through our Optic Glasses, Shielding Glasses, and Bioglasses product lines.",
      directorName: "Prof. Dr. El Sayed Yousef",
      directorMessage:
        "Welcome to AMIS Lab. Our mission is to push the boundaries of materials science while translating discoveries into technologies that serve industry and society. Explore our research, meet the team, and get in touch if you'd like to collaborate.",
      directorMessageAr:
        "مرحبًا بكم في مختبر AMIS. تتمثل مهمتنا في دفع حدود علوم المواد مع ترجمة الاكتشافات إلى تقنيات تخدم الصناعة والمجتمع. تعرّفوا على أبحاثنا، وتعرّفوا على فريقنا، وتواصلوا معنا إذا كنتم ترغبون في التعاون.",
      contactAddress: "Department of Materials Engineering, University Campus",
      contactEmail: "contact@amislab.local",
      contactPhone: "+1 555-0100",
    },
  });

  const socialLinks = [
    { platform: "LinkedIn", url: "https://linkedin.com/company/amislab", icon: "linkedin", sortOrder: 0 },
    { platform: "X", url: "https://x.com/amislab", icon: "x", sortOrder: 1 },
    { platform: "YouTube", url: "https://youtube.com/@amislab", icon: "youtube", sortOrder: 2 },
    { platform: "ResearchGate", url: "https://researchgate.net/lab/AMIS-Lab", icon: "researchgate", sortOrder: 3 },
  ];
  for (const link of socialLinks) {
    const existing = await prisma.socialLink.findFirst({ where: { platform: link.platform } });
    if (!existing) await prisma.socialLink.create({ data: link });
  }

  const homeMediaCount = await prisma.homeMedia.count();
  if (homeMediaCount === 0) {
    await prisma.homeMedia.createMany({
      data: [
        { type: "VIDEO_EMBED", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", caption: "AMIS Lab overview", sortOrder: 0 },
      ],
    });
  }

  const people = [
    {
      fullName: "Prof. Dr. El Sayed Yousef",
      titleOrRole: "Professor of Physics, King Khalid University",
      category: "DIRECTOR" as const,
      bio: "Director of AMIS Lab and Professor of Physics at King Khalid University. Research focuses on the characterization and development of glass and glass ceramics for optical, photonic, sensing, and biomedical applications.",
      links: [
        { label: "ResearchGate", url: "https://www.researchgate.net/profile/El-Yousef" },
        { label: "Scopus", url: "https://www.scopus.com/authid/detail.uri?authorId=6602856303" },
      ],
    },
    {
      fullName: "Prof. Dr. Alaa Dahshan",
      titleOrRole: "Professor of Physics, King Khalid University",
      category: "FACULTY" as const,
      bio: "Research focuses on amorphous semiconductors, chalcogenide glasses, and thin films, including their optical, electronic, photoelectrical, and thermal characterization.",
      links: [
        { label: "ResearchGate", url: "https://www.researchgate.net/profile/A_Dahshan/publications" },
        { label: "Scopus", url: "https://www.scopus.com/authid/detail.uri?authorId=6602133954" },
      ],
    },
    {
      fullName: "Prof. Dr. Hany S. Hussein",
      titleOrRole: "Professor, King Khalid University and Aswan University",
      category: "FACULTY" as const,
      bio: "Research spans wireless communication, digital signal processing, image processing, multi-view video coding, and visible light communications, with widely cited work on deep learning applications in medical imaging and signal classification.",
      links: [
        { label: "Google Scholar", url: "https://scholar.google.com.eg/citations?user=M4k_z48AAAAJ&hl=en" },
        { label: "ResearchGate", url: "https://www.researchgate.net/profile/Hany-Hussein" },
      ],
    },
    {
      fullName: "Dr. Khalid Ibrahim Hussein Ibrahim",
      titleOrRole: "Associate Professor, Department of Radiological Sciences, King Khalid University",
      category: "FACULTY" as const,
      bio: "Research spans medical physics, radiation protection, radiotherapy, and nuclear medicine, alongside materials-science work on radiation-shielding glasses and functional oxide materials.",
      links: [
        { label: "Google Scholar", url: "https://scholar.google.com/citations?user=0uf5gugAAAAJ&hl=en" },
        { label: "Faculty Profile", url: "https://cams.kku.edu.sa/en/node/512" },
      ],
    },
    {
      fullName: "Abdulaziz Ahmed Hadi Asiri",
      titleOrRole: "PhD Student",
      category: "STUDENT" as const,
      bio: "PhD student working on scientific instrumentation, optical systems, and terahertz spectroscopy, including a photoconductive-antenna-based terahertz time-domain spectrometer for materials characterization.",
      links: [{ label: "Published Paper (DOI)", url: "https://doi.org/10.69626/sag.2025.0207" }],
    },
  ];

  for (let i = 0; i < people.length; i++) {
    const { links, ...p } = people[i] as (typeof people)[number] & { links?: { label: string; url: string }[] };
    const existing = await prisma.person.findFirst({ where: { fullName: p.fullName } });
    if (existing) continue;
    const created = await prisma.person.create({
      data: {
        ...p,
        sortOrder: i,
        state: "PUBLISHED",
        submittedById: admin.id,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        ...(p.fullName === "Abdulaziz Ahmed Hadi Asiri" ? { userId: member.id } : {}),
      },
    });
    const profileLinks = links ?? [
      { label: "LinkedIn", url: "https://linkedin.com/in/example" },
      { label: "Google Scholar", url: "https://scholar.google.com/" },
    ];
    await prisma.profileLink.createMany({
      data: profileLinks.map((link, idx) => ({ personId: created.id, label: link.label, url: link.url, sortOrder: idx })),
    });
  }

  const projectsCount = await prisma.project.count();
  if (projectsCount === 0) {
    await prisma.project.createMany({
      data: [
        {
          title: "High-Durability Optic Glasses",
          slug: "high-durability-optic-glasses",
          summary: "Next-generation optical glass with enhanced scratch and UV resistance.",
          description:
            "This project develops a new class of optical glass formulations that combine high refractive index with superior scratch resistance and long-term UV stability, targeting eyewear and precision optics markets.",
          phase: "ONGOING",
          tags: ["optic-glasses", "materials-science"],
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Nanocomposite Shielding Glass",
          slug: "nanocomposite-shielding-glass",
          summary: "Lightweight radiation and impact shielding glass using nanocomposite reinforcement.",
          description:
            "A protective glass composite combining traditional shielding materials with nanoscale reinforcement to reduce weight while maintaining protective performance, aimed at industrial and defense applications.",
          phase: "ONGOING",
          tags: ["shielding-glasses", "nanocomposites"],
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Bioactive Glass Scaffolds",
          slug: "bioactive-glass-scaffolds",
          summary: "Bioglass scaffolds designed to promote bone tissue regeneration.",
          description:
            "This project investigates bioactive glass compositions and 3D scaffold architectures that support osteogenesis, with the long-term goal of clinical translation for bone repair applications.",
          phase: "COMPLETED",
          tags: ["bioglasses", "tissue-engineering"],
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Smart Coating for Optic Glasses",
          slug: "smart-coating-for-optic-glasses",
          summary: "A self-cleaning, anti-glare coating for optical lenses.",
          description:
            "Early-stage research into a smart coating that combines anti-glare and self-cleaning (hydrophobic) properties for the Optic Glasses product line.",
          phase: "PLANNED",
          tags: ["optic-glasses"],
          state: "PENDING",
          submittedById: member.id,
        },
      ],
    });
  }

  const publicationsCount = await prisma.publication.count();
  if (publicationsCount === 0) {
    await prisma.publication.createMany({
      data: [
        {
          title: "Enhanced UV Stability in Optical Glass via Rare-Earth Doping",
          authors: ["A. Rahman", "S. Tariq"],
          venue: "Journal of Materials Science",
          year: 2025,
          type: "JOURNAL",
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Nanocomposite Reinforcement Strategies for Lightweight Shielding Glass",
          authors: ["F. Khan", "H. Siddiqui"],
          venue: "International Conference on Advanced Materials",
          year: 2024,
          type: "CONFERENCE",
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Bioactive Glass Composition for Enhanced Osteogenesis",
          authors: ["A. Rahman", "B. Ahmed"],
          venue: "Biomaterials Research",
          year: 2023,
          type: "JOURNAL",
          state: "PUBLISHED",
          submittedById: admin.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        {
          title: "Method for Producing Anti-Glare Optical Coatings",
          authors: ["A. Rahman"],
          venue: "US Patent Office",
          year: 2025,
          type: "PATENT",
          state: "PENDING",
          submittedById: member.id,
        },
      ],
    });
  }

  const toolsCount = await prisma.digitalTool.count();
  if (toolsCount === 0) {
    await prisma.digitalTool.createMany({
      data: [
        { title: "Glass Composition Simulator", description: "A web tool for simulating optical properties of glass compositions before synthesis.", state: "PUBLISHED" },
        { title: "Shielding Performance Calculator", description: "Estimates shielding effectiveness for composite thicknesses and materials.", state: "PUBLISHED" },
      ],
    });
  }

  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: [
        { title: "Materials Characterization", description: "Optical, mechanical, and thermal characterization services for industry partners.", ctaLabel: "Request a quote", ctaEmail: "contact@amislab.local", state: "PUBLISHED" },
        { title: "Custom Glass Formulation", description: "Bespoke glass composition development for specialized optical, protective, or biomedical applications.", ctaLabel: "Get in touch", ctaEmail: "contact@amislab.local", state: "PUBLISHED" },
      ],
    });
  }

  const equipmentCount = await prisma.equipment.count();
  if (equipmentCount === 0) {
    await prisma.equipment.createMany({
      data: [
        { slug: "uv-vis-spectrophotometer-demo", name: "UV-Vis Spectrophotometer", description: "Measures optical transmission and absorption spectra of glass samples.", location: "Room 204", state: "PUBLISHED" },
        { slug: "melt-furnace-demo", name: "Melt Furnace", description: "High-temperature furnace for glass melting and formulation trials.", location: "Room 101", state: "PUBLISHED" },
        { slug: "scanning-electron-microscope-demo", name: "Scanning Electron Microscope", description: "Used for microstructural analysis of composite and bioglass samples.", location: "Core Facility", state: "PUBLISHED" },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
