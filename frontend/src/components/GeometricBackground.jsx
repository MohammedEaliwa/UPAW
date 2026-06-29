import { useEffect, useRef } from 'react';

/**
 * GeometricBackground
 * Renders an animated hexagonal dot-grid on a <canvas> fixed behind all content.
 * Features:
 *  - Hexagonal lattice of dots connected by thin lines
 *  - 8% of nodes rendered as rotating diamonds (accent nodes)
 *  - Subtle pulse animation on every dot
 *  - Mouse-repulsion parallax: dots gently push away from the cursor
 *  - Fully responsive (redraws on resize)
 *  - Dark-mode aware (reads data-bs-theme attribute)
 *  - Respects prefers-reduced-motion
 */
const GeometricBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── State ──────────────────────────────────────────────────────────────
    let dots = [];
    let connections = [];
    let frameId = null;
    let t = 0;
    let mouse = { x: -9999, y: -9999 };

    const SPACING_X = 72;
    const SPACING_Y = 62;
    const MAX_DIST = SPACING_X * 1.65; // connection threshold
    const REPEL_RADIUS = 180;
    const REPEL_STRENGTH = 22;

    const isDark = () =>
      document.documentElement.getAttribute('data-bs-theme') === 'dark';

    const prefersReducedMotion = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Build grid ─────────────────────────────────────────────────────────
    const build = () => {
      const W = canvas.width;
      const H = canvas.height;
      const COLS = Math.ceil(W / SPACING_X) + 3;
      const ROWS = Math.ceil(H / SPACING_Y) + 3;

      dots = [];
      for (let row = -1; row <= ROWS; row++) {
        for (let col = -1; col <= COLS; col++) {
          const hexOffset = row % 2 === 0 ? 0 : SPACING_X / 2;
          dots.push({
            bx: col * SPACING_X + hexOffset,       // base X
            by: row * SPACING_Y,                   // base Y
            x: 0, y: 0,                            // current (after parallax)
            r: Math.random() * 1.4 + 0.9,          // radius
            phase: Math.random() * Math.PI * 2,    // pulse phase
            speed: Math.random() * 0.01 + 0.005,   // pulse speed
            isAccent: Math.random() < 0.07,        // diamond node
            rot: Math.random() * Math.PI,          // diamond initial rotation
            rotSpeed: (Math.random() - 0.5) * 0.002,
          });
        }
      }

      // Pre-compute neighbour connections once
      connections = [];
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].bx - dots[j].bx;
          const dy = dots[i].by - dots[j].by;
          if (Math.abs(dx) > MAX_DIST || Math.abs(dy) > MAX_DIST) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            connections.push({ i, j, t: dist / MAX_DIST });
          }
        }
      }
    };

    // ── Draw one frame ─────────────────────────────────────────────────────
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const reduce = prefersReducedMotion();

      if (!reduce) t += 1;
      ctx.clearRect(0, 0, W, H);

      const dark = isDark();
      // Brand colours: light mode = navy, dark mode = sky-blue
      const [cr, cg, cb] = dark ? [77, 142, 240] : [0, 48, 135];
      const [ar, ag, ab] = dark ? [56, 194, 255] : [0, 102, 204]; // accent

      // ── Update dot positions with mouse repulsion ──────────────────────
      dots.forEach(d => {
        const dx = d.bx - mouse.x;
        const dy = d.by - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!reduce && dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          d.x = d.bx + (dx / dist) * force;
          d.y = d.by + (dy / dist) * force;
        } else {
          // Gentle return to base
          d.x += (d.bx - d.x) * 0.12;
          d.y += (d.by - d.y) * 0.12;
        }

        if (d.isAccent && !reduce) d.rot += d.rotSpeed;
      });

      // ── Draw connections ───────────────────────────────────────────────
      connections.forEach(({ i, j, t: normDist }) => {
        const a = dots[i], b = dots[j];
        const baseAlpha = dark ? 0.13 : 0.1;
        const alpha = baseAlpha * (1 - normDist * 0.6);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // ── Draw dots ─────────────────────────────────────────────────────
      dots.forEach(d => {
        const pulse = Math.sin(t * d.speed + d.phase);
        const alpha = (dark ? 0.22 : 0.18) + pulse * 0.07;
        const dotR = d.r + pulse * 0.6;

        if (d.isAccent) {
          // Outer rotating diamond
          const size = 7 + pulse * 1.5;
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot + Math.PI / 4);
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha * 0.75})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.rect(-size / 2, -size / 2, size, size);
          ctx.stroke();

          // Inner smaller square
          const inner = size * 0.45;
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.rect(-inner / 2, -inner / 2, inner, inner);
          ctx.stroke();
          ctx.restore();

          // Centre dot
          ctx.beginPath();
          ctx.arc(d.x, d.y, dotR * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`;
          ctx.fill();
        } else {
          // Regular dot with optional glow ring
          ctx.beginPath();
          ctx.arc(d.x, d.y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();

          // Very subtle outer ring on larger dots
          if (d.r > 1.8) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, dotR * 2.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      frameId = requestAnimationFrame(draw);
    };

    // ── Resize ─────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      build();
    };

    // ── Events ─────────────────────────────────────────────────────────────
    const onMove = e => { mouse = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouse = { x: -9999, y: -9999 }; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default GeometricBackground;
