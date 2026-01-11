const listEl = document.getElementById("list");
const messageEl = document.getElementById("message");
const breadcrumbEl = document.getElementById("breadcrumb");
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalInfo = document.getElementById("modalInfo");
const closeModal = document.getElementById("closeModal");

let currentPath = "";

async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:res.statusText}));
    throw err;
  }
  return res.json();
}

function showMessage(text, timeout=3000) {
  messageEl.textContent = text;
  if (timeout) setTimeout(()=> messageEl.textContent = "", timeout);
}

function joinPath(base, name) {
  if (!base) return name;
  return `${base}/${name}`.replace(/\/+/g, "/");
}

async function load(path="") {
  try {
    const data = await api(`/api/list?path=${encodeURIComponent(path)}`);
    currentPath = data.current || "";
    breadcrumbEl.textContent = "/" + (currentPath || "");
    renderList(data.items);
  } catch (e) {
    showMessage(e.error || "Failed to load");
  }
}

function renderList(items) {
  listEl.innerHTML = "";
  // Parent link
  if (currentPath) {
    const parent = currentPath.split("/").slice(0,-1).join("/");
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `<div class="left"><span class="icon">⬆️</span><div><div class="name">..</div><div class="meta">Parent</div></div></div>
      <div class="actions"><button onclick="navigate('${parent}')">Open</button></div>`;
    listEl.appendChild(el);
  }

  items.forEach(it => {
    const el = document.createElement("div");
    el.className = "item";
    const left = document.createElement("div");
    left.className = "left";
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = it.is_dir ? "📁" : (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(it.name) ? "🖼️" : "📄");
    const info = document.createElement("div");
    info.innerHTML = `<div class="name">${it.name}</div><div class="meta">${it.size}${it.is_dir ? " • folder" : ""}</div>`;
    left.appendChild(icon);
    left.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "actions";

    if (it.is_dir) {
      const openBtn = document.createElement("button");
      openBtn.textContent = "Open";
      openBtn.onclick = ()=> navigate(it.path);
      actions.appendChild(openBtn);
    } else {
      const openLink = document.createElement("a");
      openLink.textContent = "Open";
      openLink.href = `/open/${encodeURIComponent(it.path)}`;
      openLink.target = "_blank";
      actions.appendChild(openLink);

      if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(it.name)) {
        const previewBtn = document.createElement("button");
        previewBtn.textContent = "Preview";
        previewBtn.onclick = ()=> previewImage(it.path, it.name);
        actions.appendChild(previewBtn);
      }
    }

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = ()=> deleteItem(it.path, it.is_dir);
    actions.appendChild(delBtn);

    el.appendChild(left);
    el.appendChild(actions);
    listEl.appendChild(el);
  });
}

function navigate(path) {
  load(path);
}

async function previewImage(path, name) {
  modalImage.src = `/open/${encodeURIComponent(path)}`;
  modalInfo.textContent = name + (currentPath ? ` • ${currentPath}` : "");
  modal.classList.remove("hidden");
}

closeModal.onclick = ()=> {
  modal.classList.add("hidden");
  modalImage.src = "";
};

window.onclick = (e)=> {
  if (e.target === modal) {
    modal.classList.add("hidden");
    modalImage.src = "";
  }
};

// Create folder
document.getElementById("createFolderForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  fd.append("path", currentPath);
  try {
    await fetch("/api/create-folder", {method:"POST", body:fd});
    showMessage("Folder created");
    load(currentPath);
    form.reset();
  } catch (err) {
    showMessage(err.error || "Create failed");
  }
});

// Upload
document.getElementById("uploadForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  fd.append("path", currentPath);
  try {
    await fetch("/api/upload", {method:"POST", body:fd});
    showMessage("Uploaded");
    load(currentPath);
    form.reset();
  } catch (err) {
    showMessage(err.error || "Upload failed");
  }
});

async function deleteItem(path, isDir) {
  if (!confirm(`Delete ${isDir ? "folder" : "file"}: ${path}?`)) return;
  const fd = new FormData();
  fd.append("path", path);
  try {
    await fetch("/api/delete", {method:"POST", body:fd});
    showMessage("Deleted");
    load(currentPath);
  } catch (err) {
    showMessage(err.error || "Delete failed");
  }
}

// initial load
load("");