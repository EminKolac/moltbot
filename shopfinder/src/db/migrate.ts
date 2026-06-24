import { getDb } from "./client";
import { countStores } from "./repo";

// Opening the DB ensures the schema (CREATE TABLE IF NOT EXISTS ...).
const db = getDb();
console.log(`[migrate] schema ready at ${process.env.DATABASE_PATH ?? "./data/shopfinder.db"} (${countStores(db)} stores)`);
