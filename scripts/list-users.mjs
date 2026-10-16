import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const client = createClient(url, key);

async function list() {
  const { data, error } = await client.auth.admin.listUsers();
  if (error) {
    console.error("List users error:", error);
    return;
  }
  console.log("Users in Supabase:");
  for (const u of data.users) {
    console.log(`- ${u.email} (ID: ${u.id})`);
  }
}

list();
