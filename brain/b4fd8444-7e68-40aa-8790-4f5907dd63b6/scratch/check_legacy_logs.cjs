const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://lxlclnlhqodykjpeyjpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bGNsbmxocW9keWtqcGV5anB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEzOTcsImV4cCI6MjA5MjUxNzM5N30.EgBwcCsEnaOdK_L1N6cA1_DwhFjFcZLAkozn4RKgbbY"
);

async function checkLogs() {
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkLogs();
