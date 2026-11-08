/* Interface sounds, mouse only: a short, soft digital tick when a link or button is pressed, made with
   Web Audio (no sound files). On by default; the equaliser toggle in the header turns it off or on and
   each visitor's choice is remembered. Browsers only allow audio after a user gesture, so the audio
   context is created on the first press. */
(function(){
  var toggle = document.querySelector('[data-sound-toggle]');
  if(!toggle || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;

  var KEY = 'logyc-sound', ctx = null;
  var on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch(e){}

  function render(){
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    toggle.classList.toggle('is-on', on);
    toggle.setAttribute('aria-label', toggle.dataset[on ? 'labelOn' : 'labelOff']);
    toggle.title = toggle.getAttribute('aria-label');
  }

  function audio(){
    if(!ctx) ctx = new Ctx();
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One blip: a sine that glides from `from` to `to` Hz while fading out over `len` seconds.
  function blip(from, to, len, vol, delay){
    var a = audio(), t = a.currentTime + (delay || 0);
    var osc = a.createOscillator(), gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + len);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(a.destination);
    osc.start(t); osc.stop(t + len + 0.02);
  }

  function tick(){ blip(1900, 1100, 0.045, 0.05); }
  function powerUp(){ blip(700, 1100, 0.07, 0.05); blip(1100, 1800, 0.08, 0.05, 0.07); }
  function powerDown(){ blip(1400, 900, 0.07, 0.04); blip(900, 500, 0.09, 0.04, 0.07); }

  render();

  toggle.addEventListener('click', function(){
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch(e){}
    render();
    (on ? powerUp : powerDown)();
  });

  // pointerdown rather than click, so the tick still sounds when the link leaves the page.
  document.addEventListener('pointerdown', function(ev){
    if(!on || ev.pointerType !== 'mouse' || ev.button !== 0) return;
    var t = ev.target.closest && ev.target.closest('a,button,[role="button"],summary');
    if(!t || t.closest('[data-sound-toggle]')) return;
    tick();
  });
})();
