/* Custom cursor, mouse only: a small lime dot that follows the pointer exactly and a thin ring that
   eases after it. Over links and buttons the ring grows and the dot hides; over text fields the
   native text cursor comes back. Touch screens keep their default behaviour. */
(function(){
  if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cur-dot'; ring.className = 'cur-ring';
  dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  document.documentElement.classList.add('has-cursor');

  var x = -100, y = -100, rx = -100, ry = -100, raf = 0;
  var EASE = reduce ? 1 : 0.2; // share of the remaining distance the ring covers each frame

  function frame(){
    rx += (x - rx) * EASE; ry += (y - ry) * EASE;
    // The `translate` property (not `transform`) is applied after `scale`, so the hover growth
    // scales the ring around its centre instead of scaling its distance from the corner too.
    dot.style.translate = x + 'px ' + y + 'px';
    ring.style.translate = rx + 'px ' + ry + 'px';
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(frame) : 0;
  }

  window.addEventListener('pointermove', function(ev){
    if(ev.pointerType !== 'mouse') return;
    x = ev.clientX; y = ev.clientY;
    document.documentElement.classList.remove('cur-out');
    var t = ev.target.closest ? ev.target : null;
    document.documentElement.classList.toggle('cur-link', !!(t && t.closest('a,button,[role="button"],summary,label,.reel-video')));
    document.documentElement.classList.toggle('cur-text', !!(t && t.closest('input,textarea,select,[contenteditable="true"]')));
    if(!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  window.addEventListener('pointerdown', function(){ document.documentElement.classList.add('cur-down'); });
  window.addEventListener('pointerup', function(){ document.documentElement.classList.remove('cur-down'); });
  document.documentElement.addEventListener('mouseleave', function(){ document.documentElement.classList.add('cur-out'); });
})();
