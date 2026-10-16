import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const client = createClient(url, key);

async function test() {
  console.log("Testing auth.admin.createUser...");
  const res = await client.auth.admin.createUser({
    email: "test.teacher.1@madrasah.id",
    password: "Password123!",
    email_confirm: true,
  });
  console.log("Result:", JSON.stringify(res, null, 2));
}

test();
