// scripts/supabase-config.js

const SUPABASE_URL = "https://fgnxjnfmejhsnugpobrz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7P05zadrAnqwLceiNw6ZQQ_XoXHrwYU";

// This initializes the connection
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// This function checks if someone is logged in
async function checkUserSession() {
  const { data: { session }, error } = await _supabase.auth.getSession();
  
  if (session) {
    // Access it from metadata if you saved it there during signup
  } else {
    // If no session exists and they aren't on the login page, kick them back to login
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
}

// Run the check when the page loads
checkUserSession();