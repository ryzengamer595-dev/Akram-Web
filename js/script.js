const DISCORD_ID = "1504461725888675970";
const API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const SOCKET = "wss://api.lanyard.rest/socket";

const $ = (id) => document.getElementById(id);
const profileStatus = $("profileStatus");
const statusMini = $("statusMini");
const statusText = $("statusText");
const presenceState = $("presenceState");
const discordName = $("discordName");
const discordPfp = $("discordPfp");
const activityCard = $("activityCard");
const activityImg = $("activityImg");
const activityType = $("activityType");
const activityName = $("activityName");
const activityDetail = $("activityDetail");
const noActivity = $("noActivity");

const colors = {
  online: "#38e58a",
  idle: "#ffbf4d",
  dnd: "#ff5964",
  offline: "#747f8d"
};

function statusLabel(status) {
  return ({online:"Online", idle:"Idle", dnd:"Do Not Disturb", offline:"Offline"})[status] || "Offline";
}

function setStatus(status) {
  const c = colors[status] || colors.offline;
  if (profileStatus) {
    profileStatus.style.background = c;
    profileStatus.style.boxShadow = `0 0 16px ${c}, 0 0 30px ${c}66`;
  }
  if (statusMini) {
    statusMini.style.background = c;
    statusMini.style.boxShadow = `0 0 9px ${c}`;
  }
  if (statusText) statusText.textContent = statusLabel(status);
  if (presenceState) {
    presenceState.textContent = status === "offline"
      ? "Not currently connected to Discord"
      : "Discord presence is being shared";
  }
}

function elapsed(start) {
  if (!start) return "";
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function activityImage(activity) {
  if (!activity) return "";
  const img = activity.assets?.large_image;
  if (!img) return "";
  if (img.startsWith("spotify:")) return `https://i.scdn.co/image/${img.slice(8)}`;
  if (img.startsWith("mp:external/")) return "https://media.discordapp.net/" + img.replace("mp:external/", "");
  if (activity.application_id) return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
  return "";
}

function render(data) {
  if (!data) return;
  const status = data.discord_status || "offline";
  setStatus(status);

  if (data.discord_user) {
    const user = data.discord_user;
    if (discordName) discordName.textContent = user.global_name || user.username || "AKRAM";
    if (discordPfp && user.avatar) {
      discordPfp.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    }
  }

  if (data.listening_to_spotify && data.spotify) {
    activityCard.style.display = "flex";
    noActivity.style.display = "none";
    activityType.textContent = "Listening to Spotify";
    activityName.textContent = data.spotify.song || "Spotify";
    activityDetail.textContent = data.spotify.artist
      ? `${data.spotify.artist}${data.spotify.album ? " • " + data.spotify.album : ""}`
      : "Spotify";
    if (data.spotify.album_art_url) {
      activityImg.src = data.spotify.album_art_url;
      activityImg.style.display = "block";
    }
    return;
  }

  const activities = Array.isArray(data.activities) ? data.activities : [];
  const act = activities.find(a => [0,1,2,3,5].includes(a.type));

  if (act) {
    activityCard.style.display = "flex";
    noActivity.style.display = "none";
    activityType.textContent =
      act.type === 0 ? "Playing" :
      act.type === 1 ? "Streaming" :
      act.type === 2 ? "Listening to" :
      act.type === 3 ? "Watching" :
      act.type === 5 ? "Competing in" : "Active";
    activityName.textContent = act.name || "Discord Activity";
    const details = [];
    if (act.details) details.push(act.details);
    if (act.state) details.push(act.state);
    if (act.timestamps?.start) details.push(elapsed(act.timestamps.start));
    activityDetail.textContent = details.join(" • ") || "Active on Discord";
    const img = activityImage(act);
    if (img) {
      activityImg.src = img;
      activityImg.style.display = "block";
    } else {
      activityImg.style.display = "none";
    }
    return;
  }

  activityCard.style.display = "none";
  noActivity.style.display = "block";
  noActivity.textContent = status === "offline"
    ? "Discord is currently offline."
    : "Online, but no game/activity is being shared right now.";
}

async function loadPresence() {
  try {
    const res = await fetch(API, {cache:"no-store"});
    const json = await res.json();
    if (json.success && json.data) render(json.data);
  } catch (e) {
    console.log("Lanyard REST:", e);
  }
}

function connect() {
  const ws = new WebSocket(SOCKET);
  let heartbeat;

  ws.onmessage = event => {
    try {
      const packet = JSON.parse(event.data);
      if (packet.op === 1) {
        ws.send(JSON.stringify({op:2, d:{subscribe_to_id:DISCORD_ID}}));
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({op:3}));
        }, packet.d.heartbeat_interval);
      }
      if (packet.op === 0 && (packet.t === "INIT_STATE" || packet.t === "PRESENCE_UPDATE")) render(packet.d);
    } catch (e) {
      console.log("Lanyard socket:", e);
    }
  };

  ws.onclose = () => {
    clearInterval(heartbeat);
    setTimeout(connect, 5000);
  };
  ws.onerror = () => ws.close();
}

// Theme
const themeToggle = $("themeToggle");
if (localStorage.getItem("akram-theme") === "light") document.body.classList.add("light");
function updateThemeIcon() {
  if (themeToggle) themeToggle.textContent = document.body.classList.contains("light") ? "☾" : "☼";
}
updateThemeIcon();
themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("akram-theme", document.body.classList.contains("light") ? "light" : "dark");
  updateThemeIcon();
});

// Mobile navigation
const menuToggle = $("menuToggle");
const mobileMenu = $("mobileMenu");
menuToggle?.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
mobileMenu?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, {threshold:.12});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// Active navigation + scroll-to-top
const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll("main section[id]")];
const scrollTop = $("scrollTop");

window.addEventListener("scroll", () => {
  const y = window.scrollY + 140;
  let active = "home";
  sections.forEach(section => {
    if (y >= section.offsetTop && y < section.offsetTop + section.offsetHeight) active = section.id;
  });
  navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${active}`));
  scrollTop?.classList.toggle("show", window.scrollY > 500);
}, {passive:true});

scrollTop?.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

// Presence
loadPresence();
connect();
setInterval(loadPresence, 30000);
