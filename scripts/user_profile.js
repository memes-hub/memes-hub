// ==================== EMBED TOAST CSS ====================
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
.toast { width:100%; position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); opacity: 0; transition: transform 0.4s ease, opacity 0.4s ease; z-index: 9999; display: flex; justify-content: center; align-items: center; }
.toast.show { opacity: 1; transform: translate(0, 60%); }
.toast.error { background: #f44336; }
.toast.success { background: #4caf50; }
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

// ==================== DOM READY ====================
document.addEventListener("DOMContentLoaded", () => {
  setupDropdown();
  initProfile();
  setupUpload();
  setupDeleteProfilePic();
  setupSaveDetails();
  loadMyUploads();
  setupDeactivation(); // Added Feature
});

// ==================== INIT PROFILE ====================
async function initProfile() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { window.location.href = "login.html"; return; }
  
  const { data: profile } = await _supabase.from("user_data").select("*").eq("id", user.id).single();
  if (!profile) return;
  
  // ADDED: Reactivation check
  if (profile.is_active === false) {
    const reactivate = confirm("Account is deactivated. Reactivate it?");
    if (reactivate) {
      await _supabase.from('user_data').update({ is_active: true }).eq('id', user.id);
      showToast("Reactivated!");
    } else {
      await _supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }
  }
  
  window.originalProfile = { ...profile };
  
  const profileImage = document.querySelector(".user_profile img");
  if (profile.avatar_url && profileImage) {
    profileImage.src = profile.avatar_url;
  }
  
  const headerName = document.querySelector(".user_name");
  if (headerName) headerName.innerText = `${profile.first_name} ${profile.second_name}`;
  
  const detailSpans = document.querySelectorAll(".user_details .name span:last-child");
  if (detailSpans.length >= 4) {
    detailSpans[0].innerText = profile.first_name;
    detailSpans[1].innerText = profile.second_name;
    detailSpans[2].innerText = user.email;
    detailSpans[3].innerText = profile.username;
    detailSpans[2].setAttribute("contenteditable", "false");
    detailSpans[2].style.opacity = "0.6";
  }
}

// ==================== DROPDOWN & LOGOUT ====================
function setupDropdown() {
  let dd = lite.pick(".dd");
  let dots = lite.pick(".settings_bar");
  if (dots && dd) {
    dots.on("click", () => {
      dd.switchClass("dd_active");
      dd.contains("dd_active") ? dd.unfold() : dd.fold();
    });
  }
  
  const logoutBtn = document.querySelector(".dd button:nth-child(2)");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await _supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
}

// ==================== DEACTIVATE ====================
function setupDeactivation() {
  const deactivateBtn = document.querySelector(".dd button:nth-child(3)");
  if (!deactivateBtn) return;
  deactivateBtn.addEventListener("click", async () => {
    if (!confirm("Deactivate your account? This will hide your memes.")) return;
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from('user_data').update({ is_active: false }).eq('id', user.id);
    await _supabase.auth.signOut();
    window.location.href = "login.html";
  });
}

// ==================== DP UPLOAD ====================
function setupUpload() {
  const fileInput = document.querySelector("#profile_picture");
  if (!fileInput) return;
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast("Uploading...", "success");
    const { data: { user } } = await _supabase.auth.getUser();
    const filePath = `avatars/${user.id}_${Date.now()}`;
    const { error: uploadError } = await _supabase.storage.from('memes').upload(filePath, file);
    if (uploadError) return showToast("Upload failed!", "error");
    const { data: urlData } = _supabase.storage.from('memes').getPublicUrl(filePath);
    await _supabase.from('user_data').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
    const profileImage = document.querySelector(".user_profile img");
    if (profileImage) profileImage.src = urlData.publicUrl;
    showToast("Profile picture updated!", "success");
  });
}

// ==================== DELETE DP ====================
function setupDeleteProfilePic() {
  const deleteBtn = document.querySelector(".profile_input button");
  if (!deleteBtn) return;
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Remove profile picture?")) return;
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from('user_data').update({ avatar_url: null }).eq('id', user.id);
    const profileImage = document.querySelector(".user_profile img");
    if (profileImage) profileImage.src = "/assets/Icons/person.svg";
    showToast("Picture removed.", "success");
  });
}

// ==================== SAVE DETAILS ====================
function setupSaveDetails() {
  const saveBtn = document.querySelector(".save_details");
  if (!saveBtn) return;
  saveBtn.addEventListener("click", async () => {
    const spans = document.querySelectorAll(".user_details .name span:last-child");
    const first_name = spans[0].innerText.trim();
    const second_name = spans[1].innerText.trim();
    const username = spans[3].innerText.trim();
    const { data: { user } } = await _supabase.auth.getUser();
    const { error } = await _supabase.from('user_data').update({ first_name, second_name, username }).eq('id', user.id);
    if (error) return showToast("Update failed.", "error");
    // document.querySelector(".user_name").innerText = `${first_name} ${second_name}`;
    showToast("Profile updated!", "success");
  });
}; 

// ==================== LOAD MEMES ====================
async function loadMyUploads() {
  const container = document.querySelector(".user_posted_contents");
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user || !container) return;
  const { data: myMemes } = await _supabase.from('memes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  container.innerHTML = "<h1>Your Uploads</h1>";
  if (!myMemes || myMemes.length === 0) {
    container.innerHTML += `<div class="no_posts">No uploads found.</div>`;
    return;
  }
  myMemes.forEach(meme => {
    container.innerHTML += `
      <div class="posted_meme_card">
        <img loading="lazy" src="${meme.image_url}">
        <div class="upload_details">
          <div class="likes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
            </svg>
            <div class="count">${meme.likes_count || 0}</div>
          </div>
          <button class="delete_post" onclick="deleteMeme(${meme.id})">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 109.484 122.88">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M2.347,9.633h38.297V3.76c0-2.068,1.689-3.76,3.76-3.76h21.144 c2.07,0,3.76,1.691,3.76,3.76v5.874h37.83c1.293,0,2.347,1.057, 2.347,2.349v11.514H0V11.982C0,10.69,1.055,9.633,2.347,9.633z M8.69,29.605h92.921c1.937,0,3.696,1.599,3.521,3.524l-7.864,86.229 c-0.174,1.926-1.812,3.521-3.751,3.521H15.968c-1.939,0-3.577-1.595-3.75-3.521l-7.865-86.229 C4.179,31.204,5.938,29.605,7.875,29.605z"/>
            </svg>
          </button>
        </div>
      </div>`;
  });
}

async function deleteMeme(memeId) {
  if (!confirm("Delete this meme?")) return;
  await _supabase.from('memes').delete().eq('id', memeId);
  loadMyUploads();
}