/**
 * Interactive p5.js particle field background.
 * Monochrome palette synced with site light/dark theme.
 */
(function initP5Background() {
  const mount = document.getElementById('p5-background');
  if (!mount || typeof window.p5 !== 'function') return;

  const TARGET_COLS = 63;
  const DISPLACEMENT = 9;
  const NOISE_SCALE = 99;

  function isDarkTheme() {
    const scheme = document.documentElement.getAttribute('data-color-scheme');
    if (scheme === 'dark') return true;
    if (scheme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  new window.p5((sk) => {
    let t = 0;
    let darkTheme = isDarkTheme();
    const grid = {
      cols: 0,
      rows: 0,
      stepX: 1,
      stepY: 1,
    };
    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };

    const setPointer = (clientX, clientY) => {
      pointer.x = clientX;
      pointer.y = clientY;
      pointer.active = true;
    };

    const updateGrid = () => {
      grid.cols = TARGET_COLS;
      grid.rows = Math.max(1, Math.round((sk.height / sk.width) * TARGET_COLS));
      grid.stepX = sk.width / grid.cols;
      grid.stepY = sk.height / grid.rows;
    };

    pointer.x = window.innerWidth / 2;
    pointer.y = window.innerHeight / 3;

    window.addEventListener('mousemove', (event) => {
      setPointer(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
      if (event.touches && event.touches[0]) {
        setPointer(event.touches[0].clientX, event.touches[0].clientY);
      }
    }, { passive: true });

    const themeObserver = new MutationObserver(() => {
      darkTheme = isDarkTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme'],
    });

    sk.setup = () => {
      const canvas = sk.createCanvas(sk.windowWidth, sk.windowHeight);
      canvas.parent(mount);
      canvas.elt.setAttribute('aria-hidden', 'true');
      canvas.elt.style.display = 'block';
      canvas.elt.style.width = '100%';
      canvas.elt.style.height = '100%';
      sk.strokeWeight(2);
      sk.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      updateGrid();
    };

    sk.windowResized = () => {
      sk.resizeCanvas(sk.windowWidth, sk.windowHeight);
      updateGrid();
    };

    sk.draw = () => {
      sk.background(darkTheme ? 0 : 255);

      const baseAlpha = pointer.active ? 1 : 0.55;
      const X = pointer.active ? pointer.x : sk.width * sk.noise((t += 0.01));
      const Y = pointer.active ? pointer.y : sk.height * sk.noise(9, t);

      for (let row = 0; row <= grid.rows; row++) {
        for (let col = 0; col <= grid.cols; col++) {
          let x = col * grid.stepX;
          let y = row * grid.stepY;
          const n = 9 * sk.noise(x / NOISE_SCALE, y / NOISE_SCALE, t);
          x += DISPLACEMENT * Math.cos(n);
          y += DISPLACEMENT * Math.sin(n);

          const k = 0.98 ** sk.dist(x, y, X, Y);
          const strength = (255 * k + 90) * baseAlpha;

          if (darkTheme) {
            sk.stroke(strength, strength, strength, strength);
          } else {
            const ink = 255 - strength;
            sk.stroke(ink, ink, ink, strength);
          }

          sk.point(sk.lerp(x, X, k), sk.lerp(y, Y, k));
        }
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) sk.noLoop();
      else sk.loop();
    });
  });
})();
