import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const client = createClient(url, key);

async function check() {
  const { data, error } = await client.rpc("exec_sql", { sql: "SELECT 1" });
  console.log("RPC result:", { data, error });
}

check();
