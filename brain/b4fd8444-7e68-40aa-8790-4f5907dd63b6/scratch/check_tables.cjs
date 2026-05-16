const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://lxlclnlhqodykjpeyjpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bGNsbmxocW9keWtqcGV5anB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEzOTcsImV4cCI6MjA5MjUxNzM5N30.EgBwcCsEnaOdK_L1N6cA1_DwhFjFcZLAkozn4RKgbbY"
);

async function checkTables() {
  const { data, error } = await supabase
    .from("admin_activity_logs")
    .select("id")
    .limit(1);
  
  if (error) {
    console.log("admin_activity_logs Table missing or error:", error.message);
  } else {
    console.log("admin_activity_logs Table exists");
  }

  const { data: data2, error: error2 } = await supabase
    .from("admin_logs")
    .select("id")
    .limit(1);
  
  if (error2) {
    console.log("admin_logs Table missing or error:", error2.message);
  } else {
    console.log("admin_logs Table exists");
  }
}

checkTables();
