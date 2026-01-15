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

// ==================== IMAGE PREVIEW ====================
let input = document.querySelector("input[type='file']");
let label = document.querySelector("[for='image']");

input.addEventListener("change", (e) => {
 let img = e.target.files[0];
 if (!img) return;
 let url = URL.createObjectURL(img);
 label.innerHTML = "";
 label.style.backgroundImage = `url(${url})`;
 label.style.backgroundSize = "cover";
 label.style.backgroundPosition = "center";
});

// ==================== UPLOAD FORM ====================
const uploadForm = document.querySelector(".upload");

uploadForm.addEventListener("submit", async (e) => {
 e.preventDefault();
 
 const { data: { user } } = await _supabase.auth.getUser();
 if (!user) {
  showToast("You must be logged in to upload memes!", "error");
  return;
 }
 
 const fileInput = document.querySelector("#image");
 const file = fileInput.files[0];
 const description = document.querySelector("#desc").value;
 
 if (!file) {
  showToast("Please select an image first!", "error");
  return;
 }
 
 const fileExt = file.name.split('.').pop();
 const fileName = `${Math.random()}.${fileExt}`;
 const filePath = `${user.id}/${fileName}`;
 
 const { data: uploadData, error: uploadError } = await _supabase.storage
  .from('memes')
  .upload(filePath, file);
 
 if (uploadError) {
  showToast("Upload Error: " + uploadError.message, "error");
  return;
 }
 
 const { data: urlData } = _supabase.storage
  .from('memes')
  .getPublicUrl(filePath);
 
 const publicUrl = urlData.publicUrl;
 
 const { error: dbError } = await _supabase
  .from('memes')
  .insert([{
   image_url: publicUrl,
   description: description,
   user_id: user.id,
   likes_count: 0,
   flags_count: 0,
   downloads_count: 0
  }]);
 
 if (dbError) {
  showToast("Data Saving Error: " + dbError.message, "error");
 } else {
  showToast("Meme Uploaded Successfully!", "success");
  setTimeout(() => window.location.href = "user_profile.html", 1200);
 }
});

document.querySelector(".cancel").addEventListener("click", () => {
 let confirms = confirm("You meme won't be uploaded");
 if(confirms) {
  window.open("/user_profile.html")
 }
 else {
  return
 }
 
})