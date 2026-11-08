/* Page background, drawn on a fixed canvas.
   Desktop: a dot grid where each dot holds an energy value. The cursor charges the dots it passes and
   pushes them aside, then they fade and settle back, leaving a green trail; a slow diagonal wave keeps
   it alive without a cursor.
   Phones: a starlight sky. Irregular stars drift slowly upwards, each twinkling between white and brand
   green at its own pace. The finger lights up the stars around it and a tap sends out a ripple. */
(function(){
  var canvas = document.getElementById('dotField');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stars = window.matchMedia('(pointer: coarse)').matches;

  var SPACING = 34, RADIUS = 120, PUSH = 7, DECAY = 0.975, SETTLE = 0.9;
  var WAVE_PERIOD = 9000, WAVE_BAND = 220, WAVE_POWER = 0.32;
  var DRIFT = 0.008; // stars rise 8px per second
  var RIPPLE_SPEED = 0.55, RIPPLE_LIFE = 1000, RIPPLE_BAND = 46, RIPPLE_POWER = 0.9;

  var w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
  var base = document.createElement('canvas');
  var energy, offX, offY;
  var cursor = null, last = null, raf = 0;
  var ripples = [], lastStarFrame = 0;

  // Stable pseudo-random per grid cell, so a star keeps its place, size and rhythm across resizes.
  function rand(c, r, k){
    var v = Math.sin(c * 12.9898 + r * 78.233 + k * 37.719) * 43758.5453;
    return v - Math.floor(v);
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / SPACING) + 1;
    // iOS changes the height when its address bar collapses. Sizing the sky from the screen keeps its
    // wrap-around constant, so the stars don't jump mid-scroll.
    rows = stars ? Math.ceil(Math.max(h, window.screen.height) / SPACING) + 2 : Math.ceil(h / SPACING) + 1;
    energy = new Float32Array(cols * rows);
    offX = new Float32Array(cols * rows);
    offY = new Float32Array(cols * rows);
    if(stars){ paintStars(performance.now()); return; }

    // The resting dots never change, so they are painted once and copied every frame.
    base.width = canvas.width; base.height = canvas.height;
    var b = base.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.fillStyle = 'rgba(250,250,250,.11)';
    for(var r = 0; r < rows; r++){
      for(var c = 0; c < cols; c++){
        b.beginPath(); b.arc(c * SPACING + SPACING / 2, r * SPACING + SPACING / 2, 1, 0, 6.2832); b.fill();
      }
    }
    ctx.drawImage(base, 0, 0);
  }

  // Charges the dots around the path travelled since the last frame, so fast moves leave no gaps.
  function charge(ax, ay, bx, by){
    var minC = Math.max(0, Math.floor((Math.min(ax, bx) - RADIUS) / SPACING));
    var maxC = Math.min(cols - 1, Math.ceil((Math.max(ax, bx) + RADIUS) / SPACING));
    var minR = Math.max(0, Math.floor((Math.min(ay, by) - RADIUS) / SPACING));
    var maxR = Math.min(rows - 1, Math.ceil((Math.max(ay, by) + RADIUS) / SPACING));
    var sx = bx - ax, sy = by - ay, len = sx * sx + sy * sy;
    for(var r = minR; r <= maxR; r++){
      for(var c = minC; c <= maxC; c++){
        var x = c * SPACING + SPACING / 2, y = r * SPACING + SPACING / 2;
        var t = len ? Math.max(0, Math.min(1, ((x - ax) * sx + (y - ay) * sy) / len)) : 0;
        var dx = x - (ax + sx * t), dy = y - (ay + sy * t);
        var d = Math.sqrt(dx * dx + dy * dy);
        if(d >= RADIUS) continue;
        var i = r * cols + c, power = 1 - d / RADIUS;
        if(power > energy[i]) energy[i] = power;
        if(d > 0.01){ offX[i] += dx / d * power * PUSH * 0.25; offY[i] += dy / d * power * PUSH * 0.25; }
      }
    }
  }

  function paintStars(now){
    var sky = rows * SPACING;
    var lift = now * DRIFT;
    ripples = ripples.filter(function(rp){ return now - rp.start < RIPPLE_LIFE; });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for(var r = 0; r < rows; r++){
      for(var c = 0; c < cols; c++){
        var i = r * cols + c;
        var homeY = r * SPACING + (rand(c, r, 2) - 0.5) * SPACING * 0.85 - lift;
        var y = ((homeY % sky) + sky) % sky - SPACING;
        var x = c * SPACING + SPACING / 2 + (rand(c, r, 1) - 0.5) * SPACING * 0.85;
        energy[i] *= DECAY; offX[i] *= SETTLE; offY[i] *= SETTLE;
        if(y < -SPACING || y > h + SPACING) continue;

        if(cursor){
          var cx = x - cursor.x, cy = y - cursor.y, cd = Math.sqrt(cx * cx + cy * cy);
          if(cd < RADIUS){
            var near = 1 - cd / RADIUS;
            if(near > energy[i]) energy[i] = near;
            if(cd > 0.01){ offX[i] += cx / cd * near * PUSH * 0.25; offY[i] += cy / cd * near * PUSH * 0.25; }
          }
        }
        for(var k = 0; k < ripples.length; k++){
          var age = now - ripples[k].start;
          var dx = x - ripples[k].x, dy = y - ripples[k].y;
          var ring = Math.abs(Math.sqrt(dx * dx + dy * dy) - age * RIPPLE_SPEED);
          if(ring < RIPPLE_BAND){
            var hit = RIPPLE_POWER * (1 - age / RIPPLE_LIFE) * (1 - ring / RIPPLE_BAND);
            if(hit > energy[i]) energy[i] = hit;
          }
        }

        var size = rand(c, r, 3), bright = size > 0.88; // a few larger stars, as in a real sky
        var twinkle = 0.55 + 0.45 * Math.sin(now * (0.0006 + rand(c, r, 4) * 0.0022) + rand(c, r, 5) * 6.2832);
        var alpha = (bright ? 0.8 : 0.16 + size * 0.36) * twinkle;
        // Each star fades between soft white and brand green on its own slower cycle.
        var mix = 0.5 + 0.5 * Math.sin(now * (0.0004 + rand(c, r, 6) * 0.0012) + rand(c, r, 7) * 6.2832);
        var e = energy[i];
        if(e > mix) mix = e;
        var red = Math.round(244 - 69 * mix), grn = Math.round(247 + 5 * mix), blu = Math.round(232 - 184 * mix);
        ctx.fillStyle = 'rgba(' + red + ',' + grn + ',' + blu + ',' + Math.min(1, alpha + e).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x + offX[i], y + offY[i], (bright ? 1.25 : 0.5 + size * 0.55) + e * 1.5, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  function draw(now){
    raf = requestAnimationFrame(draw);

    if(stars){
      if(now - lastStarFrame < 30) return; // 30fps is plenty for a slow sky and saves battery
      lastStarFrame = now;
      paintStars(now);
      return;
    }

    if(cursor){
      if(last && (last.x !== cursor.x || last.y !== cursor.y)) charge(last.x, last.y, cursor.x, cursor.y);
      last = { x: cursor.x, y: cursor.y };
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var waveAt = (now % WAVE_PERIOD) / WAVE_PERIOD * (w + h + WAVE_BAND * 2) - WAVE_BAND;
    for(var r = 0; r < rows; r++){
      for(var c = 0; c < cols; c++){
        var i = r * cols + c;
        var x = c * SPACING + SPACING / 2, y = r * SPACING + SPACING / 2;
        energy[i] *= DECAY; offX[i] *= SETTLE; offY[i] *= SETTLE;
        var gap = Math.abs(x + y - waveAt);
        var wave = gap < WAVE_BAND ? WAVE_POWER * (1 - gap / WAVE_BAND) : 0;
        var e = Math.max(energy[i], wave);
        if(e < 0.02) continue;
        var px = x + offX[i], py = y + offY[i];
        if(e > 0.45){ // soft halo, only near the cursor so the wave never clutters text
          ctx.fillStyle = 'rgba(175,252,48,' + (e * 0.16).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(px, py, 2 + e * 5, 0, 6.2832); ctx.fill();
        }
        ctx.fillStyle = 'rgba(175,252,48,' + Math.min(1, e * 1.1).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px, py, 1 + e * 1.3, 0, 6.2832); ctx.fill();
      }
    }
  }

  resize();
  window.addEventListener('resize', resize);
  if(reduce) return; // a still sky or grid, with no motion

  if(stars){
    var touchFrom = null;
    window.addEventListener('touchstart', function(ev){
      var t = ev.touches[0];
      cursor = { x: t.clientX, y: t.clientY };
      touchFrom = { x: t.clientX, y: t.clientY, at: ev.timeStamp };
    }, { passive: true });
    window.addEventListener('touchmove', function(ev){
      var t = ev.touches[0];
      cursor = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    var endTouch = function(ev){
      // A quick touch that barely moved, outside links and controls, counts as a tap on the background.
      if(ev.type === 'touchend' && touchFrom && cursor && ev.timeStamp - touchFrom.at < 300 &&
         Math.abs(cursor.x - touchFrom.x) < 10 && Math.abs(cursor.y - touchFrom.y) < 10 &&
         !(ev.target.closest && ev.target.closest('a,button,input,textarea,select,video,.autoscroll'))){
        ripples.push({ x: cursor.x, y: cursor.y, start: performance.now() });
        if(ripples.length > 4) ripples.shift();
      }
      cursor = null; touchFrom = null;
    };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });
  } else {
    window.addEventListener('pointermove', function(ev){
      if(ev.pointerType === 'mouse') cursor = { x: ev.clientX, y: ev.clientY };
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function(){ cursor = null; last = null; });
  }
  document.addEventListener('visibilitychange', function(){
    cancelAnimationFrame(raf); raf = 0;
    if(!document.hidden) raf = requestAnimationFrame(draw);
  });
  raf = requestAnimationFrame(draw);
})();
