import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER ?? "postgres",
  host: process.env.PGHOST ?? "localhost",
  database: process.env.PGDATABASE ?? "dream_visualizer",
  password: process.env.PGPASSWORD ?? "Speed113",
  port: Number(process.env.PGPORT ?? 5432),
});

pool.on("error", (err: unknown) => {
  console.error("Unexpected PG pool error:", err);
});

export default pool;

