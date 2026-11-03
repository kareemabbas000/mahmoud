"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * Real-time WebGL hero: working papers on a ledger floor, a 3D audit tick that draws itself,
 * an instanced bar-chart field and drifting light. Loaded lazily; the SVG hero is the fallback.
 * Colors come from CSS variables so the Gold preset re-tints the scene.
 */
export function HeroScene({ rtl }: { rtl: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 768;
    const weak = (navigator.hardwareConcurrency ?? 4) < 4 || (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4;
    const probe = document.createElement("canvas").getContext("webgl2");
    if (reduce || small || weak || !probe) return;

    let disposed = false;
    let stop = () => {};

    const start = async () => {
      const T3 = await import("three");
      if (disposed) return;
      const css = getComputedStyle(el);
      const cPrimary = new T3.Color(css.getPropertyValue("--scene-primary").trim() || "#3b3ff5");
      const cAccent = new T3.Color(css.getPropertyValue("--scene-accent").trim() || "#fc4e08");
      const cPaper = new T3.Color(css.getPropertyValue("--scene-paper").trim() || "#f7f8fc");
      const dir = rtl ? -1 : 1;
      const gold = document.documentElement.dataset.preset === "gold";

      const renderer = new T3.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.outputColorSpace = T3.SRGBColorSpace;
      renderer.toneMapping = T3.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s ease";
      el.appendChild(renderer.domElement);

      const scene = new T3.Scene();
      scene.fog = new T3.Fog(0x050820, 9, 22);
      const camera = new T3.PerspectiveCamera(34, 1, 0.1, 60);
      camera.position.set(0, 1.4, 10);

      scene.add(new T3.HemisphereLight(0xf2f3fa, 0x0b1033, 1.1));
      const key = new T3.DirectionalLight(0xffffff, 1.6);
      key.position.set(4 * dir, 6, 6);
      scene.add(key);
      const rim = new T3.PointLight(cAccent, 5, 3.2, 2);
      scene.add(rim);

      // Group placed on the visual side (end side in RTL is the left).
      const rig = new T3.Group();
      rig.position.set((gold ? 4.4 : 2.7) * dir, gold ? 0 : 0.2, gold ? -0.6 : 0);
      if (gold) rig.scale.setScalar(0.82);
      scene.add(rig);

      // ── Paper texture: ledger rows, bars, double rule ──
      const paperTex = () => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 680;
        const g = c.getContext("2d")!;
        g.fillStyle = `#${cPaper.getHexString()}`;
        g.fillRect(0, 0, 512, 680);
        g.fillStyle = "#0b1033";
        g.fillRect(48, 56, 170, 14);
        g.fillStyle = "#8a90ad";
        g.fillRect(48, 82, 250, 8);
        g.font = "500 20px monospace";
        g.textAlign = "right";
        g.fillText("WP B·01", 464, 70);
        for (let i = 0; i < 9; i++) {
          const y = 150 + i * 44;
          g.fillStyle = "#dadde9";
          g.fillRect(48, y + 14, 416, 2);
          g.fillStyle = "#9aa0bd";
          g.fillRect(48, y, 110 + ((i * 37) % 70), 9);
          g.fillStyle = "#1a1f3d";
          const w = 60 + ((i * 53) % 130);
          g.fillRect(464 - w, y, w, 9);
        }
        g.fillStyle = "#1a1f3d";
        g.fillRect(280, 566, 184, 3);
        g.fillRect(280, 575, 184, 3);
        g.fillStyle = `#${cPrimary.getHexString()}`;
        g.fillRect(330, 540, 134, 12);
        const t = new T3.CanvasTexture(c);
        t.colorSpace = T3.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      };
      const tex = paperTex();
      const paperGeo = new T3.PlaneGeometry(2.25, 3, 1, 1);
      const papers: { m: THREE.Mesh; base: THREE.Vector3; rot: number; spread: THREE.Vector3 }[] = [];
      const layout = [
        { p: [0.55, 0.15, -0.9], r: 0.16, s: [0.9, 0.35, -0.7] },
        { p: [0.25, 0.05, -0.45], r: 0.07, s: [0.45, 0.15, -0.35] },
        { p: [0, 0, 0], r: -0.05, s: [-0.2, -0.1, 0.4] },
      ];
      layout.forEach((l, i) => {
        const mat = new T3.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22, side: T3.DoubleSide, transparent: true, opacity: i === 2 ? 1 : 0.9 });
        const m = new T3.Mesh(paperGeo, mat);
        m.position.set(l.p[0]! * dir, l.p[1]!, l.p[2]!);
        m.rotation.set(-0.12, -0.32 * dir, l.r * dir);
        rig.add(m);
        const edge = new T3.LineSegments(new T3.EdgesGeometry(paperGeo), new T3.LineBasicMaterial({ color: cPrimary, transparent: true, opacity: 0.55 }));
        m.add(edge);
        papers.push({ m, base: m.position.clone(), rot: l.r * dir, spread: new T3.Vector3(l.s[0]! * dir, l.s[1]!, l.s[2]!) });
      });
      const front = papers[papers.length - 1]!.m;

      // ── 3D audit tick (draws itself) ──
      const tickCurve = new T3.CatmullRomCurve3([new T3.Vector3(-0.78, -1.02, 0.08), new T3.Vector3(-0.5, -1.28, 0.1), new T3.Vector3(0.05, -0.6, 0.12)], false, "catmullrom", 0.05);
      const tickGeo = new T3.TubeGeometry(tickCurve, 64, 0.055, 12, false);
      const tickMat = new T3.MeshStandardMaterial({ color: cAccent, emissive: cAccent, emissiveIntensity: 1.8, roughness: 0.3 });
      const tick = new T3.Mesh(tickGeo, tickMat);
      const tickCount = tickGeo.index!.count;
      tickGeo.setDrawRange(0, 0);
      front.add(tick);
      rim.position.copy(new T3.Vector3(-0.4, -0.9, 1.1)).applyMatrix4(front.matrixWorld);

      // ── Bar field ──
      const cols = 16, rows = 7;
      const barGeo = new T3.BoxGeometry(0.16, 1, 0.16);
      barGeo.translate(0, 0.5, 0);
      const barMat = new T3.MeshStandardMaterial({ color: cPrimary, emissive: cPrimary, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.35, transparent: true, opacity: 0.85 });
      const bars = new T3.InstancedMesh(barGeo, barMat, cols * rows);
      const heights: number[] = [];
      const dummy = new T3.Object3D();
      const color = new T3.Color();
      for (let z = 0; z < rows; z++)
        for (let x = 0; x < cols; x++) {
          const i = z * cols + x;
          const trend = 0.25 + (x / cols) * 1.6;
          heights[i] = Math.max(0.08, trend * (0.55 + 0.45 * Math.sin(x * 0.9 + z * 1.7) ** 2) * (1 - z * 0.08));
          bars.setColorAt(i, color.copy(cPrimary).lerp(cAccent, x === cols - 2 && z === 1 ? 1 : 0));
        }
      if (gold) {
        bars.position.set(-2.7, -2.6, -6.5);
        bars.rotation.y = 0;
      } else {
        bars.position.set(1.2 * dir, -1.9, -5.2);
        bars.rotation.y = -0.35 * dir;
      }
      scene.add(bars);

      // ── Ledger floor ──
      const floor = new T3.GridHelper(40, 60, cPrimary, cPrimary);
      (floor.material as THREE.Material).transparent = true;
      (floor.material as THREE.Material).opacity = 0.12;
      floor.position.y = -1.9;
      scene.add(floor);

      // ── Particles ──
      const N = 520;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 18;
        pos[i * 3 + 1] = Math.random() * 7 - 2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      }
      const ptsGeo = new T3.BufferGeometry();
      ptsGeo.setAttribute("position", new T3.BufferAttribute(pos, 3));
      const pts = new T3.Points(ptsGeo, new T3.PointsMaterial({ color: 0xc4c7ff, size: 0.028, transparent: true, opacity: 0.6, depthWrite: false, blending: T3.AdditiveBlending }));
      scene.add(pts);

      // ── Interaction ──
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => {
        pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
      };
      addEventListener("pointermove", onMove, { passive: true });
      let scrollP = 0;
      const onScroll = () => {
        const r = el.getBoundingClientRect();
        scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w / h < 1.2 ? 44 : 34;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)), { threshold: 0 });
      io.observe(el);

      const clock = new T3.Clock();
      let raf = 0;
      let born = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        born = Math.min(1, born + dt / 2.4);
        const ease = 1 - Math.pow(1 - born, 3);

        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        camera.position.x = pointer.x * 0.6;
        camera.position.y = 1.4 - pointer.y * 0.35 + scrollP * 0.8;
        camera.position.z = 10 - scrollP * 1.4;
        camera.lookAt(0.6 * dir, 0.1 - scrollP * 0.4, 0);

        papers.forEach((p, i) => {
          const fan = scrollP * 1.2;
          p.m.position.set(
            p.base.x + p.spread.x * fan,
            p.base.y + p.spread.y * fan + Math.sin(t * 0.6 + i) * 0.06 + (1 - ease) * (0.8 + i * 0.3),
            p.base.z + p.spread.z * fan,
          );
          p.m.rotation.z = p.rot + Math.sin(t * 0.4 + i * 1.3) * 0.015 + fan * 0.12 * (i - 1) * dir;
          (p.m.material as THREE.MeshStandardMaterial).opacity = (i === 2 ? 1 : 0.9) * ease;
        });
        const drawT = Math.min(1, Math.max(0, (born - 0.55) / 0.35));
        tickGeo.setDrawRange(0, Math.floor(tickCount * (1 - Math.pow(1 - drawT, 3)) / 3) * 3);
        tickMat.emissiveIntensity = 1.6 + Math.sin(t * 2) * 0.25;

        for (let i = 0; i < cols * rows; i++) {
          const x = i % cols, z = Math.floor(i / cols);
          const grow = Math.min(1, Math.max(0, born * 1.6 - x * 0.03 - z * 0.04));
          const h = heights[i]! * (1 - Math.pow(1 - grow, 3)) * (1 + Math.sin(t * 0.8 + x * 0.5 + z) * 0.06);
          dummy.position.set(x * 0.34, 0, -z * 0.42);
          dummy.scale.set(1, Math.max(0.001, h), 1);
          dummy.updateMatrix();
          bars.setMatrixAt(i, dummy.matrix);
        }
        bars.instanceMatrix.needsUpdate = true;

        const arr = ptsGeo.attributes.position!.array as Float32Array;
        for (let i = 0; i < N; i++) {
          arr[i * 3 + 1]! += dt * 0.12;
          if (arr[i * 3 + 1]! > 5) arr[i * 3 + 1] = -2;
        }
        ptsGeo.attributes.position!.needsUpdate = true;
        pts.rotation.y = t * 0.01;

        renderer.render(scene, camera);
      };
      loop();
      requestAnimationFrame(() => {
        renderer.domElement.style.opacity = "1";
        el.closest("[data-hero]")?.setAttribute("data-3d", "on");
      });

      stop = () => {
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", onMove);
        removeEventListener("scroll", onScroll);
        ro.disconnect();
        io.disconnect();
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
          mats.forEach((x: THREE.Material) => x.dispose());
        });
        tex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        el.closest("[data-hero]")?.removeAttribute("data-3d");
      };
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const h = idle ? idle(() => void start(), { timeout: 1200 }) : window.setTimeout(() => void start(), 500);
    return () => {
      disposed = true;
      if (!idle) clearTimeout(h as number);
      stop();
    };
  }, [rtl]);

  return <div ref={host} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />;
}
