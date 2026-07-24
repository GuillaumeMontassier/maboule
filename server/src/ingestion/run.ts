import { db, pool } from "../db/client";
import { upsertBoulodromes } from "../db/boulodromesRepository";
import { fetchParisBoulodromes } from "./dataEs";

async function main() {
  const boulodromes = await fetchParisBoulodromes();
  console.log(`${boulodromes.length} boulodromes récupérés depuis Data ES`);

  await upsertBoulodromes(db, boulodromes);
  console.log("Import terminé");

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
