(() => {
  "use strict";
  const API = (window.BETTERWRITE_CONFIG?.API_URL || "").replace(/\/$/, "");
  const $ = (s, root=document) => root.querySelector(s);
  const toast = (message) => { const el=$("#toast"); if(!el)return; el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2800); };
  const request = async (path, options={}) => {
    if(!API || API.includes("mon-backend.exemple.com")) throw new Error("Configure l'adresse du backend dans config.js.");
    const token=localStorage.getItem("bw_token");
    const headers={...(options.body && !(options.body instanceof FormData)?{"Content-Type":"application/json"}:{}),...(token?{Authorization:"Bearer "+token}:{}),...options.headers};
    const response=await fetch(API+path,{...options,headers});
    const data=await response.json().catch(()=>({error:"Réponse invalide du serveur"}));
    if(!response.ok) throw new Error(data.error||"Une erreur est survenue.");
    return data;
  };
  window.BetterWrite={API,request,toast};
  const palettes=[["#6953a8","#c1a7ef"],["#c07864","#eac8ad"],["#315d72","#a8d0d5"],["#8a5d72","#e3b4c4"],["#536d59","#b4c9a4"]];
  function cover(book,i){const c=palettes[i%palettes.length];return '<div class="cover" style="background:linear-gradient(145deg,'+c[0]+','+c[1]+')"><small>'+escapeHtml((book.genre||"ROMAN").toUpperCase())+'</small><strong>'+escapeHtml(book.title||"Sans titre")+'</strong><small>BETTERWRITE</small></div>';}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function card(book,i){return '<a class="book-card" href="book.html?id='+encodeURIComponent(book.id)+'">'+cover(book,i)+'<h3>'+escapeHtml(book.title)+'</h3><p>Par '+escapeHtml(book.author_name||"Auteur")+' · '+escapeHtml(book.genre||"Roman")+'</p></a>';}
  async function loadBooks(){
    const grid=$("#bookGrid"),weekly=$("#weeklyBooks"); if(!grid)return;
    try{
      const [recent,top]=await Promise.all([request("/api/books?limit=8"),request("/api/statistics/weekly")]);
      grid.innerHTML=recent.books?.length?recent.books.map(card).join(""):'<div class="empty-state">Aucun livre publié pour le moment. Soyez le premier à partager votre histoire !</div>';
      if(weekly) weekly.innerHTML=top.books?.length?top.books.slice(0,10).map((b,i)=>'<div class="weekly-item"><span class="weekly-rank">'+String(i+1).padStart(2,"0")+'</span><div><strong>'+escapeHtml(b.title)+'</strong><small>'+escapeHtml(b.author_name||"Auteur")+' · '+Number(b.weekly_reads||0)+' lectures</small></div></div>').join(""):'<p>Les premières histoires arrivent bientôt.</p>';
    }catch(e){grid.innerHTML='<div class="empty-state">'+escapeHtml(e.message)+'</div>';if(weekly)weekly.innerHTML='<p>Classement indisponible pour le moment.</p>';}
  }
  function modal(view){
    const root=$("#modalRoot");if(!root)return;
    const register=view==="register";
    root.innerHTML='<div class="modal" role="dialog" aria-modal="true"><button class="modal-close" aria-label="Fermer">×</button><h2>'+(register?"Rejoignez BetterWrite":"Ravi de vous revoir")+'</h2><p>'+(register?"Créez votre compte auteur gratuitement.":"Connectez-vous pour retrouver vos livres.")+'</p><form id="authForm">'+(register?'<div class="field"><label for="name">Nom d’auteur</label><input id="name" name="name" required maxlength="60" autocomplete="name"></div>':'')+'<div class="field"><label for="email">Adresse e-mail</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="password">Mot de passe</label><input id="password" name="password" type="password" required minlength="8" autocomplete="'+(register?"new-password":"current-password")+'"></div><button class="btn btn-primary" type="submit">'+(register?"Créer mon compte":"Se connecter")+' →</button></form><p style="text-align:center"> '+(register?'Déjà inscrit ? <a href="#login" data-view="login">Connexion</a>':'Pas encore de compte ? <a href="#register" data-view="register">Inscription</a>')+'</p></div>';
    root.querySelector(".modal-close").onclick=()=>root.innerHTML="";
    root.querySelector("#authForm").onsubmit=async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries());try{const data=await request("/api/auth/"+(register?"register":"login"),{method:"POST",body:JSON.stringify(payload)});localStorage.setItem("bw_token",data.token);localStorage.setItem("bw_user",JSON.stringify(data.user));location.href="dashboard.html";}catch(err){toast(err.message);}};
    root.querySelectorAll("[data-view]").forEach(a=>a.onclick=e=>{e.preventDefault();modal(a.dataset.view);});
  }
  document.addEventListener("click",e=>{const link=e.target.closest("[data-view]");if(link){e.preventDefault();modal(link.dataset.view);}});
  $("#themeToggle")?.addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("bw_theme",document.body.classList.contains("dark")?"dark":"light");});
  if(localStorage.getItem("bw_theme")==="dark")document.body.classList.add("dark");
  $("#refreshBooks")?.addEventListener("click",e=>{e.preventDefault();loadBooks();});
  $("#year").textContent=new Date().getFullYear();
  loadBooks();
  if(location.hash==="#login" || location.hash==="#register") modal(location.hash.slice(1));
})();