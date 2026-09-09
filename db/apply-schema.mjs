// Applies db/schema.sql to the database in DATABASE_URL.
//
//   node db/apply-schema.mjs          # or: npm run db:schema
//
// Exists because this repo has no migration tool and psql is not a
// prerequisite — @neondatabase/serverless is already a dependency, so the
// schema can be applied with what is in node_modules. schema.sql is
// idempotent, so re-running this is the update path.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));

/** Next loads .env by itself; a bare node script has to do it. */
function loadEnvFile() {
  if (process.env.DATABASE_URL) return;
  let text;
  try {
    text = readFileSync(join(here, "..", ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

/**
 * Split on semicolons that actually terminate a statement. Neon's HTTP
 * endpoint takes one statement per query, so the file has to be broken up —
 * and a naive split on ";" would break the moment someone puts one inside a
 * string literal or a function body.
 */
function splitStatements(sqlText) {
  const statements = [];
  let current = "";
  let i = 0;

  while (i < sqlText.length) {
    const rest = sqlText.slice(i);

    if (rest.startsWith("--")) {
      const end = sqlText.indexOf("\n", i);
      i = end === -1 ? sqlText.length : end;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = sqlText.indexOf("*/", i + 2);
      i = end === -1 ? sqlText.length : end + 2;
      continue;
    }
    const dollarTag = /^\$[A-Za-z_]*\$/.exec(rest);
    if (dollarTag) {
      const tag = dollarTag[0];
      const end = sqlText.indexOf(tag, i + tag.length);
      const stop = end === -1 ? sqlText.length : end + tag.length;
      current += sqlText.slice(i, stop);
      i = stop;
      continue;
    }
    const quote = sqlText[i];
    if (quote === "'" || quote === '"') {
      let j = i + 1;
      while (j < sqlText.length) {
        if (sqlText[j] === quote) {
          if (sqlText[j + 1] === quote) j += 2; // '' is an escaped quote
          else { j += 1; break; }
        } else j += 1;
      }
      current += sqlText.slice(i, j);
      i = j;
      continue;
    }
    if (quote === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      i += 1;
      continue;
    }
    current += quote;
    i += 1;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

loadEnvFile();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Put your Neon pooled connection string in .env (see .env.example),\n" +
      "or pass it inline:  DATABASE_URL='postgresql://…' node db/apply-schema.mjs"
  );
  process.exit(1);
}

const schemaPath = join(here, "schema.sql");
const statements = splitStatements(readFileSync(schemaPath, "utf8"));

if (statements.length === 0) {
  console.error(`No statements found in ${schemaPath}`);
  process.exit(1);
}

const host = (() => {
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
})();

console.log(`Applying ${statements.length} statements to ${host}`);

const sql = neon(url);

try {
  // One transaction, so a half-applied schema is not a possible outcome.
  await sql.transaction(statements.map((statement) => sql.query(statement)));
  for (const statement of statements) {
    console.log(`  ✓ ${statement.split("\n")[0].slice(0, 68)}…`);
  }
  console.log("Schema applied.");
} catch (error) {
  console.error("\nFailed to apply schema:");
  console.error(`  ${error.message}`);
  if (!host.includes("-pooler")) {
    console.error(
      "\nNote: this host is not the pooled endpoint. Use the connection string\n" +
        'with "Connection pooling" enabled in the Neon console.'
    );
  }
  process.exit(1);
}
