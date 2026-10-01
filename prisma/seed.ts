import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STANDARDS } from "./dfe-catalogue";

const prisma = new PrismaClient();


/**
 * The Filtering & Monitoring visit checklist — the same 7 checks a
 * technician runs against every device/user/location tested during a
 * visit (staff laptop, student login, guest network, BYOD, etc.).
 */
const FILTERING_CHECK_ITEMS = [
  {
    code: "categories-blocked",
    title: "Are expected categories blocked?",
    guidance:
      "Try an obviously inappropriate but harmless site like guinness.com to show filtering is active (if the alcohol category is blocked).",
  },
  {
    code: "block-page-policy",
    title: "Block page shows the correct policy",
    guidance:
      "While on the block page, click to see more information and double check you are on the correct policy, e.g. student policy for a student login (if your provider does not have this on the block page, ask how you can test this).",
  },
  {
    code: "illegal-content-blocked",
    title: "Illegal content is blocked",
    guidance:
      "Check illegal sites are blocked using the Safer Internet Centre's testfiltering.com (select the green school, then the blue \"run filtering test\" button).",
  },
  {
    code: "youtube-restricted-mode",
    title: "YouTube restricted mode",
    guidance: "Check YouTube is on one of the two restricted modes via youtubemode.lgfl.net (find out more at youtube.lgfl.net).",
  },
  {
    code: "safe-search-enforced",
    title: "Safe Search is enforced",
    guidance: "Check Safe Search is on and enforced for all search engines you use, and check it can't be turned off.",
  },
  {
    code: "recent-access-issues",
    title: "Recent access issues followed up",
    guidance:
      "Ask if the school has recently not been able to access educational sites, or stumbled across inappropriate sites (and get them un/blocked). Remind them to report promptly in future.",
  },
  {
    code: "bypass-concerns",
    title: "Concerns about bypassing blocks?",
    guidance: "Ask if there are any concerns about students bypassing filtering (e.g. VPNs, proxy sites).",
  },
];

async function seedFilteringCheckCatalogue() {
  for (const [order, item] of FILTERING_CHECK_ITEMS.entries()) {
    await prisma.filteringCheckItem.upsert({
      where: { code: item.code },
      create: { ...item, order },
      update: { ...item, order },
    });
  }
  console.log(`Seeded ${FILTERING_CHECK_ITEMS.length} Filtering & Monitoring check items.`);
}

async function seedComplianceCatalogue() {
  const keptStandardCodes = new Set(STANDARDS.map((s) => s.code));
  const staleStandards = await prisma.complianceStandard.findMany({
    where: { code: { notIn: [...keptStandardCodes] } },
  });
  for (const stale of staleStandards) {
    await prisma.complianceStandard.delete({ where: { id: stale.id } });
    console.log(`Removed stale standard "${stale.title}" (${stale.code}) — not part of the real DfE catalogue.`);
  }

  for (const [standardOrder, standard] of STANDARDS.entries()) {
    const created = await prisma.complianceStandard.upsert({
      where: { code: standard.code },
      create: {
        code: standard.code,
        title: standard.title,
        description: standard.description,
        officialUrl: standard.officialUrl,
        order: standardOrder,
      },
      update: {
        title: standard.title,
        description: standard.description,
        officialUrl: standard.officialUrl,
        order: standardOrder,
      },
    });

    const keptItemCodes = new Set(standard.items.map((i) => i.code));
    await prisma.complianceItem.deleteMany({
      where: { standardId: created.id, code: { notIn: [...keptItemCodes] } },
    });

    for (const [itemOrder, item] of standard.items.entries()) {
      await prisma.complianceItem.upsert({
        where: { standardId_code: { standardId: created.id, code: item.code } },
        create: { ...item, standardId: created.id, order: itemOrder },
        update: { ...item, order: itemOrder },
      });
    }
  }
  console.log(`Seeded ${STANDARDS.length} DfE compliance standards.`);
}

async function seedDemoTenant() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-school" },
    create: { name: "Demo School", slug: "demo-school" },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: "admin@demo-school.example" },
    create: {
      tenantId: tenant.id,
      email: "admin@demo-school.example",
      name: "Demo Admin",
      passwordHash,
      role: "ADMIN",
    },
    update: {},
  });
  console.log("Seeded demo tenant (admin@demo-school.example / password123).");
}

/** Creates (or updates the password of) a platform SUPER_ADMIN — belongs to no tenant, can see every school. Only runs when both env vars are set, so it's safe to leave in production seeding. */
async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "Super Admin", passwordHash, role: "SUPER_ADMIN", tenantId: null },
    update: { passwordHash, role: "SUPER_ADMIN", tenantId: null },
  });
  console.log(`Seeded super admin (${email}).`);
}

async function main() {
  await seedComplianceCatalogue();
  await seedFilteringCheckCatalogue();
  if (process.env.SEED_DEMO_TENANT === "true") {
    await seedDemoTenant();
  }
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
