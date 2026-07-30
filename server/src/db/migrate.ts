import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

async function main() {
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  console.log("Migrations appliquées");
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Échec des migrations", error);
    process.exit(1);
  });
