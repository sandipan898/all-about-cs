"use client";

import { useEffect, useRef, useCallback } from "react";

const VERT = `
attribute vec2 a_position;
attribute float a_size;
attribute float a_alpha;
uniform vec2 u_resolution;
varying float v_alpha;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_size;
  v_alpha = a_alpha;
}
`;

const FRAG = `
precision mediump float;
uniform vec3 u_color;
uniform float u_coreBoost;
varying float v_alpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  // Bright neon core with a soft luminous halo
  float core = smoothstep(0.35, 0.0, d);
  float halo = smoothstep(1.0, 0.0, d);
  float intensity = halo * 0.55 + core;
  vec3 col = u_color + core * u_coreBoost; // brighten center (additive/dark only)
  gl_FragColor = vec4(col * intensity, intensity * v_alpha);
}
`;

const COUNT = 100;
const MOUSE_RADIUS = 140;
const REPEL_STRENGTH = 0.06;
const RETURN_SPEED = 0.015;
const BASE_SIZE = 12.0;
const DRIFT_SPEED = 0.38; // px/frame, slow ambient float

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  dx: number; // origin drift velocity
  dy: number;
  size: number;
  alpha: number;
}

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouseRef.current.x = t.clientX - rect.left;
    mouseRef.current.y = t.clientY - rect.top;
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement!;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    // Build program
    const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, "a_position");
    const aSize = gl.getAttribLocation(prog, "a_size");
    const aAlpha = gl.getAttribLocation(prog, "a_alpha");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uCoreBoost = gl.getUniformLocation(prog, "u_coreBoost");

    // Buffers
    const posBuf = gl.createBuffer()!;
    const sizeBuf = gl.createBuffer()!;
    const alphaBuf = gl.createBuffer()!;
    const posData = new Float32Array(COUNT * 2);
    const sizeData = new Float32Array(COUNT);
    const alphaData = new Float32Array(COUNT);

    // Init particles
    let prevW = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      // Mobile browsers fire resize when the address bar hides/shows during
      // scroll (height changes, width stays). Ignore these so particles don't
      // reset/glitch. Only react when the width meaningfully changes.
      const widthChanged = Math.abs(w - prevW) > 1;
      const firstRun = prevW === 0;
      if (!firstRun && !widthChanged) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, w, h);

      prevW = w;

      // Respawn particles to fill viewport
      const particles: Particle[] = [];
      for (let i = 0; i < COUNT; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 0.6) * DRIFT_SPEED;
        particles.push({
          x, y, ox: x, oy: y,
          vx: 0, vy: 0,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: BASE_SIZE + Math.random() * 6,
          alpha: 0.5 + Math.random() * 0.5,
        });
      }
      particlesRef.current = particles;
    }

    resize();

    // Resolve any CSS color string to normalized RGB [0..1]
    function resolveColor(input: string, fallback: [number, number, number]) {
      if (!input) return fallback;
      const temp = document.createElement("div");
      temp.style.color = input;
      document.body.appendChild(temp);
      const computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      const m = computed.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        return [
          parseFloat(m[0]) / 255,
          parseFloat(m[1]) / 255,
          parseFloat(m[2]) / 255,
        ] as [number, number, number];
      }
      return fallback;
    }

    // Pick a vivid neon color based on the active theme
    function applyThemeColor() {
      const isDark = document.documentElement.classList.contains("dark");
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--color-primary").trim();
      // Neon cyan for dark, deep saturated violet for light
      const fallback: [number, number, number] = isDark
        ? [0.25, 0.9, 1.0]
        : [0.42, 0.13, 0.85];
      const [r, g, b] = isDark
        ? resolveColor(primary, fallback)
        : fallback;
      gl!.useProgram(prog);
      gl!.uniform3f(uColor, r, g, b);
      // Brighten core toward white only in dark/additive mode
      gl!.uniform1f(uCoreBoost, isDark ? 0.6 : 0.0);

      // Additive glow looks great on dark, but washes out on light.
      // Use normal alpha blending in light mode so dark particles stay visible.
      gl!.enable(gl!.BLEND);
      if (isDark) {
        gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE);
      } else {
        gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      }
    }

    applyThemeColor();

    // React to theme (class) changes on <html>
    const themeObserver = new MutationObserver(applyThemeColor);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listen on parent so cursor detection covers the hero section
    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);
    parent.addEventListener("touchstart", handleTouchMove, { passive: true });
    parent.addEventListener("touchmove", handleTouchMove, { passive: true });
    parent.addEventListener("touchend", handleTouchEnd);
    parent.addEventListener("touchcancel", handleTouchEnd);
    window.addEventListener("resize", resize);

    function frame() {
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];

        // Slow ambient drift of the origin (wraps around edges)
        p.ox += p.dx;
        p.oy += p.dy;
        if (p.ox < -20) { p.ox += w + 40; p.x += w + 40; }
        else if (p.ox > w + 20) { p.ox -= w + 40; p.x -= w + 40; }
        if (p.oy < -20) { p.oy += h + 40; p.y += h + 40; }
        else if (p.oy > h + 20) { p.oy -= h + 40; p.y -= h + 40; }

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force * MOUSE_RADIUS;
          p.vy += (dy / dist) * force * MOUSE_RADIUS;
        }

        // Return to (the moving) origin
        p.vx += (p.ox - p.x) * RETURN_SPEED;
        p.vy += (p.oy - p.y) * RETURN_SPEED;

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;

        p.x += p.vx;
        p.y += p.vy;

        posData[i * 2] = p.x;
        posData[i * 2 + 1] = p.y;
        sizeData[i] = p.size * (Math.min(window.devicePixelRatio || 1, 2));
        alphaData[i] = p.alpha;
      }

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, posData, gl!.DYNAMIC_DRAW);
      gl!.enableVertexAttribArray(aPos);
      gl!.vertexAttribPointer(aPos, 2, gl!.FLOAT, false, 0, 0);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, sizeBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, sizeData, gl!.DYNAMIC_DRAW);
      gl!.enableVertexAttribArray(aSize);
      gl!.vertexAttribPointer(aSize, 1, gl!.FLOAT, false, 0, 0);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, alphaBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, alphaData, gl!.DYNAMIC_DRAW);
      gl!.enableVertexAttribArray(aAlpha);
      gl!.vertexAttribPointer(aAlpha, 1, gl!.FLOAT, false, 0, 0);

      gl!.drawArrays(gl!.POINTS, 0, COUNT);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      themeObserver.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      parent.removeEventListener("touchstart", handleTouchMove);
      parent.removeEventListener("touchmove", handleTouchMove);
      parent.removeEventListener("touchend", handleTouchEnd);
      parent.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(sizeBuf);
      gl.deleteBuffer(alphaBuf);
    };
  }, [handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-5"
      aria-hidden="true"
    />
  );
}
