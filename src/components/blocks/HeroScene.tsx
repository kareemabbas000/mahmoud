"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * Hero centrepiece: a real-time 3D sculpture of the SCO mark — the square frame in clear-coated
 * cobalt enamel, the audit tick in glowing ember metal that draws itself — with working-paper cards
 * and light nodes orbiting it. Studio reflections come from a generated RoomEnvironment.
 * Cursor tilts the sculpture; scroll turns it. Lazy, paused off-screen; mobile/low-power use the SVG fallback.
 */
export function HeroScene({ rtl }: { rtl: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 1024;
    const weak = (navigator.hardwareConcurrency ?? 4) < 4;
    const gl2 = document.createElement("canvas").getContext("webgl2");
    if (reduce || small || weak || !gl2) return;

    let disposed = false;
    let stop = () => {};

    const start = async () => {
      const [T3, { RoomEnvironment }] = await Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]);
      if (disposed) return;
      const dark = document.documentElement.dataset.theme === "dark";
      const dir = rtl ? -1 : 1;

      const renderer = new T3.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.outputColorSpace = T3.SRGBColorSpace;
      renderer.toneMapping = T3.ACESFilmicToneMapping;
      renderer.toneMappingExposure = dark ? 1.0 : 1.15;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.4s ease";
      el.appendChild(renderer.domElement);

      const scene = new T3.Scene();
      const pmrem = new T3.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const camera = new T3.PerspectiveCamera(30, 1, 0.1, 80);
      camera.position.set(0, 0.2, 11);

      const key = new T3.DirectionalLight(0xffffff, 1.4);
      key.position.set(-3 * dir, 5, 6);
      scene.add(key);
      const ember = new T3.PointLight(0xff6a2b, 30, 8, 1.8);
      const cool = new T3.PointLight(0x5b63ff, 25, 9, 1.8);

      const rig = new T3.Group();
      rig.position.set(2.9 * dir, 0.1, 0);
      scene.add(rig);
      const mark = new T3.Group();
      rig.add(mark);

      // Frame: rounded square ring, extruded.
      const S = 2.4, t = 0.38, r = 0.2;
      const rounded = (w: number, h: number, rad: number) => {
        const p = new T3.Shape();
        const x = -w / 2, y = -h / 2;
        p.moveTo(x + rad, y);
        p.lineTo(x + w - rad, y);
        p.quadraticCurveTo(x + w, y, x + w, y + rad);
        p.lineTo(x + w, y + h - rad);
        p.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
        p.lineTo(x + rad, y + h);
        p.quadraticCurveTo(x, y + h, x, y + h - rad);
        p.lineTo(x, y + rad);
        p.quadraticCurveTo(x, y, x + rad, y);
        return p;
      };
      const outer = rounded(S, S, r);
      outer.holes.push(rounded(S - 2 * t, S - 2 * t, r * 0.5) as unknown as THREE.Path);
      const frameGeo = new T3.ExtrudeGeometry(outer, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 16 });
      frameGeo.center();
      const frameMat = new T3.MeshPhysicalMaterial({ color: 0x1d20d8, metalness: 0.35, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4 });
      mark.add(new T3.Mesh(frameGeo, frameMat));

      // Tick from the logo's own geometry (viewBox units → scene units, centred on the frame).
      const k = S / 32;
      const P = (x: number, y: number) => new T3.Vector3((x - 20) * k, -(y - 25) * k, 0.32);
      const path = new T3.CurvePath<THREE.Vector3>();
      path.add(new T3.LineCurve3(P(11, 25.5), P(18.5, 33)));
      path.add(new T3.LineCurve3(P(18.5, 33), P(44, 6)));
      const tickGeo = new T3.TubeGeometry(path as unknown as THREE.Curve<THREE.Vector3>, 160, 0.2, 20, false);
      const tickMat = new T3.MeshPhysicalMaterial({ color: 0xff5a1f, emissive: 0xff4a0a, emissiveIntensity: 0.55, metalness: 0.55, roughness: 0.22, clearcoat: 1, envMapIntensity: 1.2 });
      const tickCount = tickGeo.index!.count;
      tickGeo.setDrawRange(0, 0);
      mark.add(new T3.Mesh(tickGeo, tickMat));
      const capGeo = new T3.SphereGeometry(0.2, 24, 16);
      const capA = new T3.Mesh(capGeo, tickMat);
      capA.position.copy(P(11, 25.5));
      const capB = new T3.Mesh(capGeo, tickMat);
      capB.position.copy(P(44, 6));
      capA.visible = capB.visible = false;
      mark.add(capA, capB);
      ember.position.copy(P(30, 18)).add(new T3.Vector3(0, 0, 1.2));
      cool.position.set(-2.2, 1.6, 2);
      mark.add(ember, cool);

      // Soft contact shadow.
      const sh = document.createElement("canvas");
      sh.width = sh.height = 128;
      const g = sh.getContext("2d")!;
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, dark ? "rgba(0,0,0,0.55)" : "rgba(11,16,51,0.28)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const shTex = new T3.CanvasTexture(sh);
      const shadow = new T3.Mesh(new T3.PlaneGeometry(4.2, 1.2), new T3.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, -2.05, 0);
      rig.add(shadow);

      // Orbiting working papers + light nodes.
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 340;
      const x = c.getContext("2d")!;
      x.fillStyle = "#fbfcff";
      x.fillRect(0, 0, 256, 340);
      x.fillStyle = "#0b1033";
      x.fillRect(24, 28, 90, 9);
      for (let i = 0; i < 7; i++) {
        x.fillStyle = "#dfe2ee";
        x.fillRect(24, 70 + i * 32, 208, 2);
        x.fillStyle = "#9aa0bd";
        x.fillRect(24, 60 + i * 32, 60 + ((i * 29) % 50), 6);
        x.fillStyle = "#1a1f3d";
        const w = 40 + ((i * 41) % 70);
        x.fillRect(232 - w, 60 + i * 32, w, 6);
      }
      x.fillStyle = "#fc4e08";
      x.fillRect(150, 300, 82, 7);
      const ptex = new T3.CanvasTexture(c);
      ptex.colorSpace = T3.SRGBColorSpace;
      ptex.anisotropy = 4;
      const pgeo = new T3.PlaneGeometry(0.62, 0.82);
      const pmat = new T3.MeshStandardMaterial({ map: ptex, roughness: 0.6, side: T3.DoubleSide, emissive: 0xffffff, emissiveMap: ptex, emissiveIntensity: 0.18 });
      const orbit = new T3.Group();
      orbit.rotation.set(0.42, 0, -0.18 * dir);
      rig.add(orbit);
      const sats: { m: THREE.Object3D; a: number; r: number; s: number; y: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const m = new T3.Mesh(pgeo, pmat);
        orbit.add(m);
        sats.push({ m, a: (i / 7) * Math.PI * 2, r: 2.6 + (i % 3) * 0.25, s: 0.12 + (i % 2) * 0.04, y: ((i % 3) - 1) * 0.25 });
      }
      const nodeGeo = new T3.SphereGeometry(0.05, 16, 12);
      for (let i = 0; i < 10; i++) {
        const m = new T3.Mesh(nodeGeo, new T3.MeshBasicMaterial({ color: i % 3 === 0 ? 0xff6a2b : 0x8f97ff }));
        orbit.add(m);
        sats.push({ m, a: (i / 10) * Math.PI * 2 + 0.3, r: 3.3, s: 0.2, y: 0 });
      }

      const pt = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => {
        pt.tx = (e.clientX / innerWidth - 0.5) * 2;
        pt.ty = (e.clientY / innerHeight - 0.5) * 2;
      };
      addEventListener("pointermove", onMove, { passive: true });
      let sp = 0;
      const onScroll = () => {
        const b = el.getBoundingClientRect();
        sp = Math.min(1, Math.max(0, -b.top / Math.max(1, b.height)));
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      const resize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight, false);
        camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)));
      io.observe(el);

      const clock = new T3.Clock();
      let raf = 0;
      let born = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const time = clock.elapsedTime;
        born = Math.min(1, born + dt / 2.2);
        const e = 1 - Math.pow(1 - born, 3);
        pt.x += (pt.tx - pt.x) * 0.06;
        pt.y += (pt.ty - pt.y) * 0.06;

        mark.position.y = (1 - e) * -1.6 + Math.sin(time * 0.9) * 0.06;
        mark.scale.setScalar(0.7 + 0.3 * e);
        mark.rotation.y = (-0.55 + pt.x * 0.35 + Math.sin(time * 0.35) * 0.08) * dir + sp * 1.4 * dir;
        mark.rotation.x = 0.12 + pt.y * 0.18 - sp * 0.3;

        const d = Math.min(1, Math.max(0, (born - 0.45) / 0.45));
        const de = 1 - Math.pow(1 - d, 3);
        tickGeo.setDrawRange(0, Math.floor((tickCount * de) / 3) * 3);
        capA.visible = d > 0.02;
        capB.visible = d > 0.98;
        tickMat.emissiveIntensity = 0.5 + Math.sin(time * 2.2) * 0.15;

        sats.forEach((s) => {
          s.a += dt * s.s;
          s.m.position.set(Math.cos(s.a) * s.r, s.y + Math.sin(s.a * 2) * 0.1, Math.sin(s.a) * s.r * 0.55);
          s.m.rotation.y = -s.a + Math.PI / 2;
          s.m.scale.setScalar(e);
        });
        orbit.rotation.y = pt.x * 0.15;
        rig.position.y = 0.1 + sp * 1.2;
        camera.position.x = pt.x * 0.25;
        camera.lookAt(rig.position.x * 0.35, 0.1, 0);
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
          mats.forEach((y: THREE.Material) => y.dispose());
        });
        envTex.dispose();
        pmrem.dispose();
        ptex.dispose();
        shTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        el.closest("[data-hero]")?.removeAttribute("data-3d");
      };
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => void start(), { timeout: 900 });
    else setTimeout(() => void start(), 400);
    return () => {
      disposed = true;
      stop();
    };
  }, [rtl]);

  return <div ref={host} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />;
}
