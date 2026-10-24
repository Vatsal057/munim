import { seedAllPersonas } from "./runSeed.ts";
import { applySchemaFile } from "../db";

applySchemaFile()
  .then(() => seedAllPersonas())
  .then((results) => {
    for (const r of results) console.log(`Seeded ${r.slug} — merchant id ${r.merchantId}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
