/* ============================================
   Artfolio — background.js v2
   Subtle drifting particles + warm glow
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var particles = [];
  var mouseX = -9999;
  var mouseY = -9999;
  var W, H;
  var rafId = null;
  var resizeTimer = null;

  // Warm tone variations for particles
  var warmTones = [
    { r: 244, g: 239, b: 230, a: 0.12 },   // candlelight
    { r: 201, g: 169, b: 110, a: 0.06 },   // gold dust
    { r: 220, g: 210, b: 190, a: 0.08 },   // warm paper
    { r: 240, g: 225, b: 210, a: 0.10 },   // soft cream
    { r: 180, g: 155, b: 120, a: 0.05 },   // muted bronze
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    var count = Math.min(Math.floor((W * H) / 14000), 70);
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.3,
        dx: (Math.random() - 0.5) * 0.18,
        dy: (Math.random() - 0.5) * 0.18,
        tone: warmTones[Math.floor(Math.random() * warmTones.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function update() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Very gentle mouse repulsion — only when close
      var dx = p.x - mouseX;
      var dy = p.y - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140 && dist > 0.01) {
        var force = (140 - dist) / 140 * 0.35;
        p.dx += (dx / dist) * force * 0.012;
        p.dy += (dy / dist) * force * 0.012;
      }

      // Damping + tiny noise for organic drift
      p.dx = p.dx * 0.992 + (Math.random() - 0.5) * 0.006;
      p.dy = p.dy * 0.992 + (Math.random() - 0.5) * 0.006;

      // Integrate
      p.x += p.dx;
      p.y += p.dy;

      // Wrap softly — when leaving on one side, appear on opposite with slight offset
      if (p.x < -20) { p.x = W + 20; p.y = Math.random() * H; }
      if (p.x > W + 20) { p.x = -20; p.y = Math.random() * H; }
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }

      // Slow radial breathing
      p.phase += 0.003;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Very subtle vignette — warm center
    var grad = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.65);
    grad.addColorStop(0, 'rgba(13, 11, 9, 0)');
    grad.addColorStop(0.7, 'rgba(13, 11, 9, 0.02)');
    grad.addColorStop(1, 'rgba(13, 11, 9, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw particles — soft glowing dots
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Size breathes slightly
      var breathe = Math.sin(p.phase) * 0.15 + 1;
      var r = p.r * breathe;

      // Glow
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
      glow.addColorStop(0, 'rgba(' + p.tone.r + ',' + p.tone.g + ',' + p.tone.b + ',' + (p.tone.a * 0.9) + ')');
      glow.addColorStop(0.4, 'rgba(' + p.tone.r + ',' + p.tone.g + ',' + p.tone.b + ',' + (p.tone.a * 0.3) + ')');
      glow.addColorStop(1, 'rgba(' + p.tone.r + ',' + p.tone.g + ',' + p.tone.b + ',0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(r, 0.4), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.tone.r + ',' + p.tone.g + ',' + p.tone.b + ',' + (p.tone.a * 1.3) + ')';
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // Mouse tracking for particle repulsion
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
  function onMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mouseleave', onMouseLeave, { passive: true });

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  }, { passive: true });

  resize();
  loop();

  // Pause when tab hidden (save resources)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      loop();
    }
  });

})();
