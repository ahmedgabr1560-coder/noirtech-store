// loaded after script.js
(function(){
  window.goHome = function(){
    try{
      document.getElementById('authOverlay')?.classList.remove('open');
      document.getElementById('authModal')?.classList.remove('open');
      document.getElementById('profileOverlay')?.classList.remove('open');
      document.getElementById('profileModal')?.classList.remove('open');
      document.getElementById('cartOverlay')?.classList.remove('open');
      document.getElementById('cartSidebar')?.classList.remove('open');
      document.getElementById('aiOverlay')?.classList.remove('open');
      document.getElementById('aiPanel')?.classList.remove('open');
    }catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
    document.getElementById('home')?.scrollIntoView({behavior:'smooth'});
  };
  // Hook forms after DOM ready
  function wrap(){
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('registerForm');
    const prof = document.getElementById('profileForm');
    const logout = document.getElementById('logoutBtn');
    const checkout = document.getElementById('checkoutBtn');
    if(login && !login._gh){ login._gh=true; login.addEventListener('submit',()=>setTimeout(()=>{ if(!window._pendingCheckout) window.goHome(); },400)); }
    if(reg && !reg._gh){ reg._gh=true; reg.addEventListener('submit',()=>setTimeout(()=>{ if(!window._pendingCheckout) window.goHome(); },400)); }
    if(prof && !prof._gh){ prof._gh=true; prof.addEventListener('submit',()=>setTimeout(()=>window.goHome(),400)); }
    if(logout && !logout._gh){ logout._gh=true; logout.addEventListener('click',()=>setTimeout(()=>window.goHome(),300)); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wrap); else wrap();
  setTimeout(wrap,500);
})();
