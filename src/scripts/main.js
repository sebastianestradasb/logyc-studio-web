(function(){
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // nav scrolled state
  var hdr = document.getElementById('hdr');
  function onScroll(){ hdr.classList.toggle('scrolled', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // mobile menu
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  burger.addEventListener('click', function(){ menu.classList.toggle('open'); });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.classList.remove('open'); }); });

  // copy-to-clipboard buttons (e.g. the email on the contact page)
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    var label = btn.textContent;
    btn.addEventListener('click', function(){
      if(!navigator.clipboard) return;
      navigator.clipboard.writeText(btn.dataset.copy).then(function(){
        btn.textContent = btn.dataset.copied || label;
        setTimeout(function(){ btn.textContent = label; }, 2000);
      });
    });
  });

  // scroll reveal
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.fx').forEach(function(el,i){
    var sibs = el.parentElement.querySelectorAll(':scope > .fx');
    obs.observe(el);
  });

  // stagger children reveals a touch
  document.querySelectorAll('.steps, .pkgs, .types, .timeline').forEach(function(group){
    var kids = group.querySelectorAll('.fx');
    kids.forEach(function(k,i){ k.style.transitionDelay = (i*0.07)+'s'; });
  });

  // hero cursor glow
  if(!reduce){
    var glow = document.getElementById('heroGlow');
    var hero = document.querySelector('.hero');
    var tx=0,ty=0,cx=0,cy=0,raf;
    hero.addEventListener('mousemove', function(ev){
      var r = hero.getBoundingClientRect();
      tx = ev.clientX - r.left; ty = ev.clientY - r.top;
      if(!raf) raf = requestAnimationFrame(loop);
    });
    function loop(){
      cx += (tx-cx)*0.08; cy += (ty-cy)*0.08;
      glow.style.transform = 'translate('+(cx-320)+'px,'+(cy-320)+'px)';
      if(Math.abs(tx-cx)>0.5||Math.abs(ty-cy)>0.5){ raf=requestAnimationFrame(loop); } else { raf=null; }
    }
  }

  // pixel orbit dots inside service visuals
  function buildOrbit(id, color){
    var host = document.getElementById(id);
    if(!host) return;
    var count = 5;
    for(var i=0;i<count;i++){
      var d = document.createElement('i');
      var ang = (i/count)*Math.PI*2;
      d.style.left = (50 + Math.cos(ang)*38) + '%';
      d.style.top  = (50 + Math.sin(ang)*38) + '%';
      d.style.opacity = (i===0? '1':'.5');
      if(i!==0){ d.style.background = 'rgba(115,115,115,.6)'; }
      host.appendChild(d);
    }
    if(!reduce){
      var t=0;
      setInterval(function(){
        t += 0.012;
        host.querySelectorAll('i').forEach(function(d,i){
          var ang = (i/count)*Math.PI*2 + t;
          d.style.left = (50 + Math.cos(ang)*38) + '%';
          d.style.top  = (50 + Math.sin(ang)*38) + '%';
        });
      }, 40);
    }
  }
  buildOrbit('orbit1'); buildOrbit('orbit2');

  // portfolio previews: scroll slowly on their own while visible; the visitor can take over anytime
  if(!reduce){
    document.querySelectorAll('.autoscroll').forEach(function(box){
      var speed = parseFloat(box.dataset.speed) || 50, pos = 0, last = 0, holdUntil = 0, visible = false, raf = null;
      function step(t){
        if(!visible){ raf = null; last = 0; return; }
        var dt = last ? Math.min((t - last) / 1000, .1) : 0; last = t;
        if(Date.now() < holdUntil){ pos = box.scrollTop; }
        else {
          var max = box.scrollHeight - box.clientHeight;
          if(pos >= max - 1){
            holdUntil = Date.now() + 2200;
            setTimeout(function(){ box.scrollTo({top: 0, behavior: 'smooth'}); pos = 0; }, 1400);
          } else { pos += speed * dt; box.scrollTop = pos; }
        }
        raf = requestAnimationFrame(step);
      }
      ['wheel','touchstart','pointerdown','keydown'].forEach(function(ev){
        box.addEventListener(ev, function(){ holdUntil = Date.now() + 4000; }, {passive:true});
      });
      new IntersectionObserver(function(entries){
        entries.forEach(function(e){ visible = e.isIntersecting; if(visible && !raf) raf = requestAnimationFrame(step); });
      }, {threshold:.25}).observe(box);
    });
  }

  // FAQ accordion
  document.querySelectorAll('.acc-item').forEach(function(item){
    var q = item.querySelector('.acc-q');
    var a = item.querySelector('.acc-a');
    q.addEventListener('click', function(){
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(function(o){
        o.classList.remove('open'); o.querySelector('.acc-a').style.maxHeight = null;
      });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
})();
