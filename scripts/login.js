// ==================== TOAST CSS ====================
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  background: #4caf50;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.4s ease;
  z-index: 9999;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.toast.error {
  background: #f44336;
}
.toast.success {
  background: #4caf50;
}
.password-strength {
  font-size: 12px;
  margin-top: 4px;
}
.password-strength.weak { color: #f44336; }
.password-strength.medium { color: #ff9800; }
.password-strength.strong { color: #4caf50; }
`;
document.head.appendChild(toastStyle);

// ==================== TOAST HELPER ====================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ==================== FORM ANIMATION ====================
function formEffects() {
  const loginBox = document.querySelector(".login");
  const signupBox = document.querySelector(".signup");
  const loginLink = document.querySelector(".old_user a");
  const signLink = document.querySelector(".new_user a");
  
  signLink.addEventListener("click", () => {
    loginBox.classList.add("login_deactivate");
    signupBox.style.display = "flex";
    setTimeout(() => {
      loginBox.style.display = "none";
      signupBox.classList.add("signup_activated");
    }, 2000);
  });
  
  loginLink.addEventListener("click", () => {
    signupBox.classList.remove("signup_activated");
    setTimeout(() => {
      loginBox.classList.remove("login_deactivate");
      signupBox.style.display = "none";
      loginBox.style.display = "flex";
    }, 2000);
  });
}
formEffects();

// ==================== PASSWORD STRENGTH CHECK ====================
function getPasswordStrength(password) {
  if (!password) return { strength: "weak", score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[\W_]/.test(password)) score++; // special char
  if (score <= 1) return { strength: "weak", score };
  if (score === 2 || score === 3) return { strength: "medium", score };
  return { strength: "strong", score };
}

const passwordInput = document.querySelector(".signup input[name='password']");
const strengthLabel = document.createElement("div");
strengthLabel.className = "password-strength";
passwordInput.parentNode.appendChild(strengthLabel);

passwordInput.addEventListener("input", () => {
  const { strength } = getPasswordStrength(passwordInput.value);
  strengthLabel.innerText = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
  strengthLabel.className = `password-strength ${strength}`;
});

// ==================== SIGNUP LOGIC WITH VALIDATION ====================
const signupForm = document.querySelector(".signup form");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const formData = new FormData(signupForm);
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();
  const firstName = formData.get("first_name").trim();
  const secondName = formData.get("second_name").trim();
  const username = formData.get("username").trim();
  
  // Validate required fields
  if (!email || !password || !firstName || !secondName || !username) {
    showToast("Please fill all fields!", "error");
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Invalid email format!", "error");
    return;
  }
  
  // Validate password strength
  const { strength } = getPasswordStrength(password);
  if (strength === "weak") {
    showToast("Password too weak! Use 8+ chars, numbers, uppercase, symbols.", "error");
    return;
  }
  
  try {
    // Check username availability
    const { data: existingUsername } = await _supabase
      .from("user_data")
      .select("id")
      .eq("username", username)
      .single();
    
    if (existingUsername) {
      showToast("Username already taken. Choose another.", "error");
      return;
    }
    
    // Check email availability in user_data table
    const { data: existingEmail } = await _supabase
      .from("user_data")
      .select("id")
      .eq("email", email)
      .single();
    
    if (existingEmail) {
      showToast("Email already registered. Use a different one.", "error");
      return;
    }
    
    // Create Auth account
    const { data: authData, error: authError } = await _supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      showToast("Auth Error: " + authError.message, "error");
      return;
    }
    
    if (!authData.user) {
      showToast("Signup failed. Try again.", "error");
      return;
    }
    
    // Save extra user info
    const { error: dbError } = await _supabase
      .from("user_data")
      .insert([{
        id: authData.user.id,
        first_name: firstName,
        second_name: secondName,
        username: username,
        email: email
      }]);
    
    if (dbError) {
      showToast("Database Error: " + dbError.message, "error");
      return;
    }
    
    showToast("Account created! Check your email for confirmation.", "success");
    setTimeout(() => window.open("/index.html"), 1500);
    
  } catch (err) {
    showToast("Unexpected Error: " + err.message, "error");
  }
});

// ==================== LOGIN LOGIC ====================
const loginForm = document.querySelector(".login form");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const formData = new FormData(loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();
  
  if (!email || !password) {
    showToast("Please enter email and password!", "error");
    return;
  }
  
  const { data, error } = await _supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    showToast("Login Error: " + error.message, "error");
  } else {
    showToast("Welcome back!", "success");
    setTimeout(() => window.location.href = "index.html", 1200);
  }
});
