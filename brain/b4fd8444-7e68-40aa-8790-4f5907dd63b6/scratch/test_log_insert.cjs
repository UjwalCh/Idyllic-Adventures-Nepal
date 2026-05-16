const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://lxlclnlhqodykjpeyjpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bGNsbmxocW9keWtqcGV5anB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEzOTcsImV4cCI6MjA5MjUxNzM5N30.EgBwcCsEnaOdK_L1N6cA1_DwhFjFcZLAkozn4RKgbbY"
);

async function testInsert() {
  const { error } = await supabase.from("admin_activity_logs").insert({
    user_id: null,
    action_type: "update",
    entity_type: "test",
    entity_id: "test",
    details: "test insert"
  });
  
  if (error) console.log("Insert failed:", error.message);
  else console.log("Insert success!");
}

testInsert();
