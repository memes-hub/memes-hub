// ===================== GLOBAL STATE =====================
let currentUser = null;
const memeState = new Map();
const lock = new Set();
let memesCache = [];

// ===================== TOAST =====================
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "rgba(0,0,0,0.85)";
  toast.style.color = "#fff";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.zIndex = "999999";
  toast.style.fontFamily = "sans-serif";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";
  toast.style.pointerEvents = "none";
  
  document.body.appendChild(toast);
  
  toast.offsetHeight;
  toast.style.opacity = "1";
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===================== USER INIT =====================
async function initUser() {
  const { data } = await _supabase.auth.getUser();
  currentUser = data?.user || null;
}

// ===================== LOAD HOME FEED =====================
async function loadHomeFeed(clear = true) {
  const main = document.querySelector("main");
  
  const { data: memes, error } = await _supabase
    .from("memes")
    .select("*, meme_likes(user_id)")
    .order("created_at", { ascending: false });
  
  if (error) return showToast("Failed to load feed");
  
  const { data: users } = await _supabase
    .from("user_data")
    .select("*");
  
  if (clear) {
    main.innerHTML = "";
    memesCache = [];
  }
  
  const fresh = memes.filter(m => !memesCache.includes(m.id));
  memesCache.push(...fresh.map(m => m.id));
  
  if (!fresh.length && memesCache.length) {
    const p = document.createElement("p");
    p.textContent = "You're all caught up!";
    p.style.textAlign = "center";
    p.style.padding = "20px";
    main.appendChild(p);
    return;
  }
  
  fresh.forEach(meme => {
    const owner = users?.find(u => u.id === meme.user_id);
    const liked = currentUser ?
      meme.meme_likes.some(l => l.user_id === currentUser.id) :
      false;
    
    memeState.set(meme.id, {
      likes: meme.likes_count,
      liked
    });
    
    main.insertAdjacentHTML("beforeend", `
      <div class="meme_card">
        <div class="owner">
          <img loading="lazy" src="${owner?.avatar_url || '/assets/images/01f4c8851b0b58aa937541b8827e5feb.jpg'}">
          <div class="owner_name">${owner?.username || "Anonymous"}</div>
        </div>

        <img loading="lazy" src="${meme.image_url}" class="meme_image">

        <div class="memes_assets">
          <button class="like_btn ${liked ? "liked" : ""}" data-id="${meme.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01z"/>
            </svg>
            <span class="count">${meme.likes_count}</span>
          </button>

          <button onclick="downloadMeme('${meme.image_url}', ${meme.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
            </svg>
            <span class="count">${meme.downloads_count}</span>
          </button>

          <button onclick="updateFlag(${meme.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464"/>
            </svg>
            <span class="count">${meme.flags_count}</span>
          </button>
        </div>
      </div>
    `);
  });
  
  document.querySelectorAll(".like_btn").forEach(btn => {
    btn.onclick = () => toggleLike(+btn.dataset.id);
  });
}

// ===================== LIKE =====================
async function toggleLike(memeId) {
  if (!currentUser) return showToast("Login required");
  if (lock.has(memeId)) return;
  
  const state = memeState.get(memeId);
  const btn = document.querySelector(`.like_btn[data-id="${memeId}"]`);
  if (!state || !btn) return;
  
  lock.add(memeId);
  
  state.liked = !state.liked;
  state.likes += state.liked ? 1 : -1;
  
  btn.classList.toggle("liked", state.liked);
  btn.querySelector(".count").textContent = state.likes;
  
  try {
    if (state.liked) {
      await _supabase.from("meme_likes").insert({ meme_id: memeId, user_id: currentUser.id });
      await _supabase.rpc("increment_like", { m_id: memeId });
    } else {
      await _supabase.from("meme_likes").delete().match({ meme_id: memeId, user_id: currentUser.id });
      await _supabase.rpc("decrement_like", { m_id: memeId });
    }
  } catch {
    showToast("Like failed");
  }
  
  setTimeout(() => lock.delete(memeId), 400);
}

// ===================== DOWNLOAD =====================
async function downloadMeme(url, memeId) {
  if (!currentUser) return showToast("Login required");
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
  
  await _supabase.rpc("increment_download", { m_id: memeId });
  showToast("Downloaded");
}

// ===================== FLAG =====================
async function updateFlag(memeId) {
  if (!currentUser) return showToast("Login required");
  
  const { data } = await _supabase
    .from("memes")
    .select("flags_count")
    .eq("id", memeId)
    .single();
  
  await _supabase
    .from("memes")
    .update({ flags_count: (data.flags_count || 0) + 1 })
    .eq("id", memeId);
  
  loadHomeFeed(false);
}

// ===================== REALTIME =====================
_supabase
  .channel("realtime-memes")
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "memes" }, payload => {
    const btn = document.querySelector(`.like_btn[data-id="${payload.new.id}"]`);
    if (btn) btn.querySelector(".count").textContent = payload.new.likes_count;
  })
  .subscribe();

// ===================== SIDEBAR =====================
const sidebar = document.querySelector(".sidebar");
const sidebarToggler = document.querySelector(".sidebar_toggler");
const closeSidebar = document.querySelector(".close_sidebar");

sidebarToggler?.addEventListener("click", () => {
  sidebar.classList.add("active");
  setTimeout(() => sidebar.style.width = "100%", 500);
});

closeSidebar?.addEventListener("click", () => {
  sidebar.classList.remove("active");
  setTimeout(() => sidebar.style.width = "0", 1000);
});

// ===================== BOOT =====================
(async function() {
  await initUser();
  await loadHomeFeed();
  const y = document.querySelector(".year");
  if (y) y.textContent = new Date().getFullYear();
})();
if("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripts/sw.js")
  .then(e => console.log("SW Registered"))
}