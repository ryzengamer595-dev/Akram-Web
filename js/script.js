const DISCORD_ID = "1504461725888675970";
const API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const SOCKET = "wss://api.lanyard.rest/socket";

const $ = id => document.getElementById(id);
const colors = {online:"#38e58a", idle:"#ffbf4d", dnd:"#ff5964", offline:"#747f8d"};

function statusName(s){
  return ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"})[s] || "Offline";
}
function setStatus(status){
  const c = colors[status] || colors.offline;
  const dot = $("profileStatus"), mini = $("statusMini");
  if(dot){dot.style.background=c;dot.style.boxShadow=`0 0 16px ${c}`;}
  if(mini){mini.style.background=c;mini.style.boxShadow=`0 0 9px ${c}`;}
  if($("statusText")) $("statusText").textContent=statusName(status);
  if($("presenceState")) $("presenceState").textContent=status==="offline"?"Not currently connected to Discord":"Discord presence is being shared";
}
function elapsed(start){
  if(!start) return "";
  const sec=Math.max(0,Math.floor((Date.now()-start)/1000));
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${h}h ${m}m`:m?`${m}m ${s}s`:`${s}s`;
}
function activityImage(a){
  const img=a?.assets?.large_image;
  if(!img) return "";
  if(img.startsWith("spotify:")) return `https://i.scdn.co/image/${img.slice(8)}`;
  if(img.startsWith("mp:external/")) return "https://media.discordapp.net/"+img.replace("mp:external/","");
  if(a.application_id) return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
  return "";
}
function render(data){
  if(!data) return;
  const status=data.discord_status||"offline";
  setStatus(status);
  if(data.discord_user){
    const u=data.discord_user;
    $("discordName").textContent=u.global_name||u.username||"AKRAM";
    if(u.avatar) $("discordPfp").src=`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
  }

  if(data.listening_to_spotify && data.spotify){
    $("activityCard").style.display="flex";
    $("noActivity").style.display="none";
    $("activityType").textContent="LISTENING TO SPOTIFY";
    $("activityName").textContent=data.spotify.song||"Spotify";
    $("activityDetail").textContent=data.spotify.artist||"Spotify";
    if(data.spotify.album_art_url){
      $("activityImg").src=data.spotify.album_art_url;
      $("activityImg").style.display="block";
    }
    return;
  }

  const acts=Array.isArray(data.activities)?data.activities:[];
  const a=acts.find(x=>[0,1,2,3,5].includes(x.type));
  if(a){
    $("activityCard").style.display="flex";
    $("noActivity").style.display="none";
    $("activityType").textContent=a.type===0?"PLAYING":a.type===1?"STREAMING":a.type===2?"LISTENING TO":a.type===3?"WATCHING":"COMPETING IN";
    $("activityName").textContent=a.name||"Discord Activity";
    const details=[];
    if(a.details) details.push(a.details);
    if(a.state) details.push(a.state);
    if(a.timestamps?.start) details.push(elapsed(a.timestamps.start));
    $("activityDetail").textContent=details.join(" • ")||"Active on Discord";
    const img=activityImage(a);
    if(img){$("activityImg").src=img;$("activityImg").style.display="block";}
    else $("activityImg").style.display="none";
  }else{
    $("activityCard").style.display="none";
    $("noActivity").style.display="block";
    $("noActivity").textContent=status==="offline"?"Discord is currently offline.":"Online, but no activity is being shared.";
  }
}
async function loadPresence(){
  try{
    const r=await fetch(API,{cache:"no-store"});
    const j=await r.json();
    if(j.success&&j.data) render(j.data);
  }catch(e){console.log("Lanyard REST:",e)}
}
function connect(){
  const ws=new WebSocket(SOCKET); let heartbeat;
  ws.onmessage=e=>{
    try{
      const p=JSON.parse(e.data);
      if(p.op===1){
        ws.send(JSON.stringify({op:2,d:{subscribe_to_id:DISCORD_ID}}));
        clearInterval(heartbeat);
        heartbeat=setInterval(()=>{if(ws.readyState===1)ws.send(JSON.stringify({op:3}))},p.d.heartbeat_interval);
      }
      if(p.op===0&&(p.t==="INIT_STATE"||p.t==="PRESENCE_UPDATE")) render(p.d);
    }catch(err){console.log("Lanyard socket:",err)}
  };
  ws.onclose=()=>{clearInterval(heartbeat);setTimeout(connect,5000)};
  ws.onerror=()=>ws.close();
}

const menuBtn=$("menuBtn"), mobileNav=$("mobileNav");
menuBtn?.addEventListener("click",()=>{
  const open=mobileNav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded",String(open));
});
mobileNav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  mobileNav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false");
}));

const navLinks=[...document.querySelectorAll(".nav-link")];
const sections=[...document.querySelectorAll("main section[id]")];
function updateNav(){
  const y=scrollY+130;
  let current="about";
  sections.forEach(s=>{if(y>=s.offsetTop&&y<s.offsetTop+s.offsetHeight) current=s.id});
  navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===`#${current}`));
  $("backTop")?.classList.toggle("show",scrollY>500);
}
addEventListener("scroll",updateNav,{passive:true}); updateNav();
$("backTop")?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

const particles=$("particles");
for(let i=0;i<65;i++){
  const p=document.createElement("span");
  p.className="particle";
  const size=Math.random()*5+2;
  p.style.width=`${size}px`;p.style.height=`${size}px`;
  p.style.left=`${Math.random()*100}%`;
  p.style.top=`${Math.random()*100}%`;
  p.style.opacity=(Math.random()*.7+.2).toFixed(2);
  p.style.animationDuration=`${Math.random()*12+10}s`;
  p.style.animationDelay=`-${Math.random()*20}s`;
  p.style.setProperty("--drift",`${(Math.random()-.5)*180}px`);
  particles.appendChild(p);
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.animate(
    [{opacity:0,transform:"translateY(24px)"},{opacity:1,transform:"translateY(0)"}],
    {duration:700,easing:"cubic-bezier(.2,.7,.2,1)",fill:"forwards"}
  );observer.unobserve(e.target)}})
},{threshold:.12});
document.querySelectorAll(".info-card,.skill,.project-card,.tool-card,.presence-card").forEach(x=>observer.observe(x));

loadPresence(); connect(); setInterval(loadPresence,30000);
