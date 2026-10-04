'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const years = $('years'), speed = $('speed');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const number = (value, digits = 2) => value.toLocaleString('en-US', {
    maximumFractionDigits: digits, minimumFractionDigits: 0,
    ...(value > 0 && value < 0.01 ? { maximumSignificantDigits: 3 } : {})
  });
  let mission = null, flightStart = null, flightFrame = null;
  function current() { return Relativity.calculate(years.valueAsNumber, speed.valueAsNumber / 10000); }
  function update() {
    const percent = speed.valueAsNumber / 100;
    $('speed-value').textContent = number(percent);
    speed.setAttribute('aria-valuetext', `${number(percent)} percent of the speed of light`);
    document.querySelectorAll('[data-speed]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.speed === speed.value));
    });
    $('velocity').textContent = `${number(speed.valueAsNumber / 10000 * Relativity.C_KM_S)} km/s`;
    if (!years.validity.valid) {
      $('preview-years').textContent = '—';
      $('preview-copy').textContent = 'Enter an Earth duration within the supported range.';
      return;
    }
    const result = current();
    document.querySelector('.preview-main > span').textContent = `While Earth experiences ${number(result.earthYears)} years, you experience`;
    $('preview-years').textContent = number(result.travellerYears);
    $('preview-copy').textContent = 'Same journey. A very different amount of time.';
    $('gamma').textContent = `${number(result.gamma, 3)}×`;
    $('saved').textContent = `${number((1 - result.ratio) * 100)}%`;
  }
  years.addEventListener('input', update);
  speed.addEventListener('input', update);
  document.querySelectorAll('[data-speed]').forEach((button) => button.addEventListener('click', () => {
    speed.value = button.dataset.speed; update();
  }));
  function finish() {
    if (flightFrame !== null) cancelAnimationFrame(flightFrame);
    flightFrame = null; flightStart = null;
    $('earth-result').textContent = number(mission.earthYears);
    $('ship-result').textContent = number(mission.travellerYears);
    $('difference-result').textContent = number(mission.difference);
    $('ship-bar').style.width = `${mission.ratio * 100}%`;
    $('result-summary').textContent = `At ${number(mission.beta * 100)}% of light speed, your Lorentz factor is ${number(mission.gamma, 3)}.`;
    $('flight').hidden = true; $('results').hidden = false;
    $('result-title').focus({ preventScroll: true });
  }
  function tick(now) {
    if (flightStart === null) flightStart = now;
    const progress = Math.min((now - flightStart) / 4500, 1);
    $('earth-tick').textContent = number(mission.earthYears * progress);
    $('ship-tick').textContent = number(mission.travellerYears * progress);
    $('flight-progress').value = progress;
    if (progress < 1) flightFrame = requestAnimationFrame(tick); else finish();
  }
  $('flight-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!years.reportValidity()) return;
    mission = current(); $('configure').hidden = true; $('results').hidden = true;
    $('flight').hidden = false; $('earth-tick').textContent = '0'; $('ship-tick').textContent = '0';
    $('flight-progress').value = 0;
    $('journey').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
    if (reduced.matches) finish(); else {
      $('flight').querySelector('h3').focus({ preventScroll: true });
      flightStart = null; flightFrame = requestAnimationFrame(tick);
    }
  });
  $('skip-flight').addEventListener('click', finish);
  $('again').addEventListener('click', () => {
    $('results').hidden = true; $('configure').hidden = false;
    years.focus({ preventScroll: true });
    $('journey').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches && !$('flight').hidden) finish();
    draw();
  });
  update();

  // Decorative starfield: no network requests, images, or stored visitor data.
  const canvas = $('stars'), ctx = canvas.getContext('2d');
  let width = 0, height = 0, stars = [], animation = null, last = 0;
  function resize() {
    width = innerWidth; height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * scale; canvas.height = height * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    stars = Array.from({ length: Math.min(180, Math.floor(width / 7)) }, () => ({
      x: Math.random() * width, y: Math.random() * height, size: Math.random() * 1.1 + 0.2,
      alpha: Math.random() * 0.5 + 0.15
    }));
    draw();
  }
  function draw(now = 0) {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    if (!ctx || document.hidden) return;
    const delta = Math.min((now - last) / 16.67 || 1, 3); last = now;
    ctx.clearRect(0, 0, width, height);
    const flying = !$('flight').hidden && !reduced.matches;
    for (const star of stars) {
      ctx.fillStyle = `rgba(216,226,239,${star.alpha})`;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
      if (!reduced.matches) {
        if (flying) {
          const dx = (star.x - width / 2) * 0.022 * delta;
          const dy = (star.y - height / 2) * 0.022 * delta;
          ctx.strokeStyle = `rgba(239,183,127,${star.alpha})`;
          ctx.beginPath();ctx.moveTo(star.x,star.y);ctx.lineTo(star.x+dx*4,star.y+dy*4);ctx.stroke();
          star.x += dx; star.y += dy;
          if (star.x < 0 || star.x > width || star.y < 0 || star.y > height) {
            star.x = Math.random() * width; star.y = Math.random() * height;
          }
        } else { star.y = (star.y + 0.055 * delta) % height; }
      }
    }
    if (!reduced.matches) animation = requestAnimationFrame(draw);
  }
  if (ctx) {
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => draw());
    resize();
  }
})();
