import * as fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];

async function run() {
  const res = await fetch(url + "/rest/v1/", {
    headers: { apikey: key, Authorization: "Bearer " + key },
  });
  const data = await res.json();
  console.log("REST tables:", Object.keys(data.definitions || {}));
}

run().catch(console.error);
