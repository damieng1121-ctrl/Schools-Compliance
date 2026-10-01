/**
 * Emits the SQL needed to apply prisma/dfe-catalogue.ts to a live database,
 * as a JSON array of statements (writes prisma/catalogue-sql.json).
 *
 * This exists because this sandbox has no network path to Neon at all (not
 * even HTTPS) — `prisma migrate`/`db push`/the seed script can't connect.
 * The only way to apply the catalogue is via the Neon MCP server's
 * run_sql_transaction tool, which needs a plain SQL statement array rather
 * than a live Prisma client. Run with: npx tsx scripts/generate-catalogue-sql.ts
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { STANDARDS } from "../prisma/dfe-catalogue";

function esc(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function escNullable(value: string | null | undefined): string {
  return value == null ? "NULL" : esc(value);
}

const statements: string[] = [];

const keptStandardCodes = STANDARDS.map((s) => s.code);
statements.push(
  `DELETE FROM "ComplianceStandard" WHERE code NOT IN (${keptStandardCodes.map(esc).join(", ")})`,
);

STANDARDS.forEach((standard, standardOrder) => {
  const id = randomUUID();
  statements.push(
    `INSERT INTO "ComplianceStandard" (id, code, title, description, "officialUrl", "order") ` +
      `VALUES (${esc(id)}, ${esc(standard.code)}, ${esc(standard.title)}, ${esc(standard.description)}, ${escNullable(standard.officialUrl)}, ${standardOrder}) ` +
      `ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "officialUrl" = EXCLUDED."officialUrl", "order" = EXCLUDED."order"`,
  );

  const keptItemCodes = standard.items.map((i) => i.code);
  statements.push(
    `DELETE FROM "ComplianceItem" WHERE "standardId" = (SELECT id FROM "ComplianceStandard" WHERE code = ${esc(standard.code)}) ` +
      `AND code NOT IN (${keptItemCodes.map(esc).join(", ")})`,
  );

  standard.items.forEach((item, itemOrder) => {
    const itemId = randomUUID();
    statements.push(
      `INSERT INTO "ComplianceItem" (id, "standardId", code, title, description, "sourceText", guidance, "order", priority, "govLink") ` +
        `VALUES (${esc(itemId)}, (SELECT id FROM "ComplianceStandard" WHERE code = ${esc(standard.code)}), ${esc(item.code)}, ${esc(item.title)}, ${esc(item.description)}, ${escNullable(item.sourceText)}, ${escNullable(item.guidance)}, ${itemOrder}, ${esc(item.priority)}, ${escNullable(item.govLink)}) ` +
        `ON CONFLICT ("standardId", code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "sourceText" = EXCLUDED."sourceText", guidance = EXCLUDED.guidance, "order" = EXCLUDED."order", priority = EXCLUDED.priority, "govLink" = EXCLUDED."govLink"`,
    );
  });
});

writeFileSync("prisma/catalogue-sql.json", JSON.stringify(statements));
console.log(`Wrote ${statements.length} SQL statements to prisma/catalogue-sql.json`);
console.log(`(${STANDARDS.length} standards, ${STANDARDS.reduce((n, s) => n + s.items.length, 0)} items)`);
