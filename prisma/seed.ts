import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (order matters for FK constraints)
  await prisma.assignmentAgreement.deleteMany();
  await prisma.note.deleteMany();
  await prisma.ipAsset.deleteMany();
  await prisma.person.deleteMany();

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      hashedPassword: hashSync("password123", 10),
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create sample notes
  const notes = [
    { title: "Patent Filing Checklist", body: "1. Prior art search\n2. Draft claims\n3. File provisional\n4. Review and revise\n5. File non-provisional" },
    { title: "Trademark Review Q3", body: "Review all active trademarks for renewal deadlines in Q3. Check jurisdictions: US, EU, JP." },
    { title: "Contractor IP Agreement Template", body: "Need to update the standard contractor IP assignment template to include new clauses for AI-generated works." },
    { title: "Meeting Notes - IP Strategy", body: "Discussed filing strategy for new product line. Priority markets: US, EU, CN. Budget approved for 3 new patent applications." },
    { title: "Deadline: US Patent Maintenance Fee", body: "Maintenance fee due for US Patent #10,XXX,XXX. Window opens Jan 2027. Set reminder for Nov 2026." },
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: { ...note, userId: user.id },
    });
  }
  console.log(`Created ${notes.length} sample notes`);

  // --- Stage 2: IP Assets ---
  const ipAssets = await Promise.all([
    prisma.ipAsset.create({
      data: {
        type: "PATENT",
        title: "Automated IP Risk Assessment System",
        jurisdiction: "US",
        filingDate: new Date("2025-07-15"),
        status: "FILED",
        description: "Method and system for automatically identifying intellectual property ownership gaps and deadline risks using structured data analysis.",
      },
    }),
    prisma.ipAsset.create({
      data: {
        type: "PATENT",
        title: "Blockchain-Based IP Provenance Tracker",
        jurisdiction: "US",
        filingDate: new Date("2025-03-01"),
        status: "PUBLISHED",
        description: "A distributed ledger system for tracking chain of ownership and assignment history for intellectual property assets.",
      },
    }),
    prisma.ipAsset.create({
      data: {
        type: "PATENT",
        title: "AI-Powered Prior Art Search Engine",
        jurisdiction: "EU",
        status: "DRAFT",
        description: "Machine learning model trained on patent databases to surface relevant prior art during the patent drafting process.",
      },
    }),
    prisma.ipAsset.create({
      data: {
        type: "TRADEMARK",
        title: "ContingencyIP",
        jurisdiction: "US",
        filingDate: new Date("2024-11-20"),
        status: "REGISTERED",
        registrationNumber: "TM-2024-88123",
        description: "Word mark for IP management software and related services.",
      },
    }),
    prisma.ipAsset.create({
      data: {
        type: "TRADEMARK",
        title: "ShieldMark Logo",
        jurisdiction: "EU",
        filingDate: new Date("2025-01-10"),
        status: "FILED",
        description: "Figurative mark — shield icon with interlocking IP letters. Used on product packaging and marketing materials.",
      },
    }),
    prisma.ipAsset.create({
      data: {
        type: "TRADEMARK",
        title: "IPGuard",
        jurisdiction: "JP",
        filingDate: new Date("2026-02-28"),
        status: "FILED",
        description: "Word mark for IP monitoring and alerting service targeting the Japanese market.",
      },
    }),
  ]);
  console.log(`Created ${ipAssets.length} IP assets`);

  // --- Stage 2: People ---
  const people = await Promise.all([
    prisma.person.create({
      data: {
        name: "Priya Sharma",
        email: "priya@example.com",
        role: "FOUNDER",
        startDate: new Date("2023-01-15"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Alex Chen",
        email: "alex.chen@example.com",
        role: "FOUNDER",
        startDate: new Date("2023-01-15"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Jordan Williams",
        email: "jordan.w@example.com",
        role: "EMPLOYEE",
        startDate: new Date("2023-06-01"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Sam Rivera",
        email: "sam.r@example.com",
        role: "EMPLOYEE",
        startDate: new Date("2024-02-15"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Dr. Emily Tanaka",
        email: "emily.t@example.com",
        role: "CONTRACTOR",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-08-31"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Michael O'Brien",
        email: "mobrien@lawfirm.com",
        role: "ADVISOR",
        startDate: new Date("2023-03-01"),
      },
    }),
    prisma.person.create({
      data: {
        name: "Lisa Park",
        role: "CONTRACTOR",
        startDate: new Date("2025-11-01"),
        endDate: new Date("2026-04-30"),
      },
    }),
  ]);
  console.log(`Created ${people.length} people`);

  // --- Stage 3: Assignment Agreements ---
  // Mix of statuses to show gaps on the dashboard
  const assignments = [
    {
      personId: people[0].id, // Priya - founder, signed company-wide
      scope: "COMPANY_WIDE" as const,
      status: "SIGNED" as const,
      signedDate: new Date("2023-01-20"),
      fileReference: "/docs/assignments/priya-company-wide.pdf",
      notes: "Original founder IP assignment agreement.",
    },
    {
      personId: people[1].id, // Alex - founder, signed company-wide
      scope: "COMPANY_WIDE" as const,
      status: "SIGNED" as const,
      signedDate: new Date("2023-01-20"),
      fileReference: "/docs/assignments/alex-company-wide.pdf",
      notes: "Original founder IP assignment agreement.",
    },
    {
      personId: people[2].id, // Jordan - employee, pending
      scope: "COMPANY_WIDE" as const,
      status: "PENDING" as const,
      notes: "Sent agreement for review on 2026-05-15. Awaiting signature.",
    },
    {
      personId: people[4].id, // Dr. Emily - contractor, signed for specific asset
      ipAssetId: ipAssets[1].id, // Blockchain patent
      scope: "ASSET_SPECIFIC" as const,
      status: "SIGNED" as const,
      signedDate: new Date("2024-10-01"),
      fileReference: "/docs/assignments/emily-blockchain-patent.pdf",
      notes: "Contractor assignment for blockchain IP work.",
    },
    {
      personId: people[5].id, // Michael - advisor, missing
      scope: "COMPANY_WIDE" as const,
      status: "MISSING" as const,
      notes: "Need to prepare advisor IP agreement. Low priority as advisory role is non-technical.",
    },
  ];
  // Sam Rivera (people[3]) and Lisa Park (people[6]) have NO assignments at all — they should show as gaps

  for (const assignment of assignments) {
    await prisma.assignmentAgreement.create({ data: assignment });
  }
  console.log(`Created ${assignments.length} assignment agreements`);
  console.log(`\nGap summary:`);
  console.log(`  - Sam Rivera: NO assignment (current employee — HIGH priority gap)`);
  console.log(`  - Lisa Park: NO assignment (current contractor — HIGH priority gap)`);
  console.log(`  - Jordan Williams: PENDING agreement`);
  console.log(`  - Michael O'Brien: MISSING agreement`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
