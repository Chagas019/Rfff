import { useReducedMotion, useScroll } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * Transição cinematográfica guiada pela rolagem (estilo trailer):
 *  1. capacete gira 360° numa garagem escura;
 *  2. a câmera mergulha na viseira e corta para o circuito;
 *  3. burnout com fumaça, faíscas e distorção de calor;
 *  4. o carro passa rente à tela com borrão de velocidade;
 *  5. capacete em primeiro plano, carro ao fundo e título metálico na fumaça.
 * A rolagem controla a "linha do tempo"; fumaça e partículas têm vida própria.
 * Imagens geradas por IA (Figma AI), sem logotipos — public/cinematic/.
 */

const T_END = 13.4; // duração da linha do tempo (s), mapeada para a rolagem
const IMG_W = 768;
const IMG_H = 1376;
const BASE = '/cinematic';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const rand = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const shake = (t: number, amp: number): [number, number] => [
  Math.sin(t * 61.3) * amp + Math.sin(t * 23.1) * amp * 0.6,
  Math.cos(t * 57.7) * amp + Math.sin(t * 31.9) * amp * 0.5,
];

interface LayerProps { o?: number; s?: number; x?: number; y?: number; ox?: number; oy?: number; blur?: number; bright?: number }
function setLayer(el: HTMLElement | null, { o = 1, s = 1, x = 0, y = 0, ox = 50, oy = 50, blur = 0, bright = 1 }: LayerProps) {
  if (!el) return;
  el.style.opacity = String(o);
  el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
  el.style.transformOrigin = `${ox}% ${oy}%`;
  el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
  el.style.filter = blur > 0.05 || bright !== 1 ? `blur(${blur}px) brightness(${bright})` : 'none';
}

/** Converte um ponto da imagem (fração 0–1) para a tela, considerando object-fit: cover. */
function coverPoint(w: number, h: number, fx: number, fy: number) {
  const sc = Math.max(w / IMG_W, h / IMG_H);
  const dw = IMG_W * sc, dh = IMG_H * sc;
  return { x: (w - dw) / 2 + fx * dw, y: (h - dh) / 2 + fy * dh, scale: sc };
}

export function CinematicScroll() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasBack = useRef<HTMLCanvasElement>(null);
  const canvasFront = useRef<HTMLCanvasElement>(null);
  const refs = {
    s1: useRef<HTMLDivElement>(null), helmetWrap: useRef<HTMLDivElement>(null), helmet: useRef<HTMLDivElement>(null),
    shine: useRef<HTMLDivElement>(null), s2: useRef<HTMLDivElement>(null), s3: useRef<HTMLDivElement>(null),
    s4: useRef<HTMLDivElement>(null), s4ghost: useRef<HTMLDivElement>(null), s5: useRef<HTMLDivElement>(null),
    helmet5: useRef<HTMLDivElement>(null), title: useRef<HTMLDivElement>(null), t1: useRef<HTMLDivElement>(null),
    t2: useRef<HTMLDivElement>(null), t3: useRef<HTMLDivElement>(null), flash: useRef<HTMLDivElement>(null),
    hint: useRef<HTMLDivElement>(null), bar: useRef<HTMLDivElement>(null),
  };
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  useEffect(() => {
    if (reduce) return;
    const smoke = [0, 1, 2].map((i) => { const im = new Image(); im.src = `${BASE}/smoke${i}.webp`; return im; });
    let raf = 0;
    let tSmooth = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' });
    if (sectionRef.current) io.observe(sectionRef.current);

    const fitCanvas = (c: HTMLCanvasElement | null) => {
      if (!c) return null;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const ctx = c.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    };

    const smokeCloud = (ctx: CanvasRenderingContext2D, clock: number, o: { cx: number; cy: number; spread: number; count: number; size: number; alpha: number; drift?: number; seed?: number }) => {
      const { cx, cy, spread, count, size, alpha, drift = 60, seed = 0 } = o;
      if (alpha <= 0.002) return;
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < count; i++) {
        const r = rand(i + seed * 100);
        const life = (clock * 0.35 + r) % 1;
        const x = cx + (rand(i + 7 + seed) - 0.5) * spread + life * drift * (rand(i + 9) - 0.3) * 3;
        const y = cy + (rand(i + 11 + seed) - 0.5) * spread * 0.45 - life * drift * 1.4;
        const s = size * (0.6 + rand(i + 13) * 0.8) * (1 + life);
        ctx.globalAlpha = alpha * Math.sin(Math.PI * life) * (0.5 + rand(i + 15) * 0.5);
        ctx.save(); ctx.translate(x, y); ctx.rotate(clock * 0.15 * (rand(i + 17) - 0.5) + r * 6);
        if (smoke[i % 3].complete) ctx.drawImage(smoke[i % 3], -s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };
    const particles = (ctx: CanvasRenderingContext2D, clock: number, w: number, h: number, alpha: number) => {
      if (alpha <= 0.002) return;
      for (let i = 0; i < 110; i++) {
        const px = rand(i) * w + Math.sin(clock * 0.6 + i) * 30;
        const py = (((rand(i + 1) * h - clock * 40 * (0.3 + rand(i + 2))) % h) + h) % h;
        const sz = 0.6 + rand(i + 3) * 2.4;
        ctx.globalAlpha = alpha * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 6 + i))) * (0.4 + rand(i + 4) * 0.6);
        ctx.fillStyle = i % 5 === 0 ? '#ff5a4a' : i % 7 === 0 ? '#7fb5ff' : '#e8eef5';
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const sparks = (ctx: CanvasRenderingContext2D, clock: number, x: number, y: number, count: number, dir: number, alpha: number, scale: number) => {
      if (alpha <= 0.002) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < count; i++) {
        const life = (clock * 1.8 + rand(i)) % 1;
        const ang = (dir < 0 ? Math.PI : 0) + (rand(i + 3) - 0.5) * 1.1 - 0.25;
        const sp = (300 + rand(i + 5) * 700) * scale;
        const px = x + Math.cos(ang) * sp * life, py = y + Math.sin(ang) * sp * life + life * life * 260 * scale;
        const len = (18 + rand(i + 9) * 30) * scale;
        ctx.strokeStyle = `rgba(255,${(170 + rand(i) * 70) | 0},${(60 + rand(i + 1) * 60) | 0},${alpha * (1 - life)})`;
        ctx.lineWidth = 1.2 + rand(i + 2) * 1.4;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(ang) * len, py - Math.sin(ang) * len); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    const speedLines = (ctx: CanvasRenderingContext2D, clock: number, w: number, h: number, alpha: number) => {
      if (alpha <= 0.002) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 34; i++) {
        const y = rand(i) * h; const len = (0.3 + rand(i + 1) * 0.6) * w;
        const x = (((rand(i + 2) * w * 1.6 - clock * 3.5 * w * (0.6 + rand(i + 3))) % (w * 1.6)) + w * 1.6) % (w * 1.6) - w * 0.2;
        const g = ctx.createLinearGradient(x, 0, x + len, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,${i % 4 ? 230 : 80},${i % 4 ? 230 : 60},${alpha * 0.5})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x, y, len, 1 + rand(i + 4) * 2.5);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const clock = now / 1000;
      const target = scrollYProgress.get() * T_END;
      tSmooth += (target - tSmooth) * 0.12; // suaviza a rolagem
      const t = tSmooth;
      const stage = stageRef.current; if (!stage) return;
      const w = stage.clientWidth, h = stage.clientHeight;
      const back = fitCanvas(canvasBack.current), front = fitCanvas(canvasFront.current);
      back?.clearRect(0, 0, w, h); front?.clearRect(0, 0, w, h);
      const k = Math.min(w / 1080, h / 1920) * 1.6; // escala dos efeitos

      // Cena 1 — garagem, capacete gira 360°
      setLayer(refs.s1.current, { o: 1 - seg(t, 3.55, 3.75), s: lerp(1.02, 1.16, easeInOut(seg(t, 0, 3.6))), y: -20 * seg(t, 0, 3.6) });
      const hp = coverPoint(w, h, 389.5 / IMG_W, 661 / IMG_H);
      const helmetW = (293 / IMG_W) * IMG_W * hp.scale * 1.05;
      const helmet = refs.helmet.current;
      if (helmet) {
        helmet.style.width = `${helmetW}px`; helmet.style.height = `${helmetW * (336 / 293)}px`;
        helmet.style.left = `${hp.x - helmetW / 2}px`; helmet.style.top = `${hp.y - (helmetW * (336 / 293)) / 2}px`;
        const spin = easeInOut(seg(t, 0.25, 2.75)) * 360;
        const edge = Math.pow(Math.abs(Math.cos((spin * Math.PI) / 180)), 0.5);
        const dive = easeIn(seg(t, 2.85, 3.75));
        const sc = lerp(1, 9, dive);
        helmet.style.transformOrigin = '27% 47%';
        helmet.style.transform = `translateY(${Math.sin(clock * 2.1) * 12 * (1 - dive)}px) rotateY(${spin}deg) rotateX(${Math.sin(clock * 1.3) * 6}deg) rotateZ(${Math.sin(clock * 0.9) * 4}deg) scale(${sc})`;
        helmet.style.filter = `blur(${(1 - edge) * 3 + dive * 14}px)`;
      }
      if (refs.helmetWrap.current) refs.helmetWrap.current.style.opacity = String(1 - seg(t, 3.6, 3.8));
      if (refs.shine.current) {
        const sx = lerp(-60, 160, (clock * 0.55) % 1);
        refs.shine.current.style.background = `linear-gradient(105deg, transparent ${sx - 18}%, rgba(255,255,255,.55) ${sx}%, rgba(120,170,255,.25) ${sx + 6}%, transparent ${sx + 20}%)`;
      }
      if (front && t < 3.8) particles(front, clock, w, h, 1 - seg(t, 3.2, 3.7));
      if (back && t < 3.8) smokeCloud(back, clock, { cx: w / 2, cy: h * 0.6, spread: w * 0.9, count: 8, size: w * 0.9, alpha: 0.16 * (1 - seg(t, 3.3, 3.7)), drift: 40, seed: 1 });

      // Cena 2 — viseira
      setLayer(refs.s2.current, { o: seg(t, 3.55, 3.8) * (1 - seg(t, 5.0, 5.15)), s: lerp(1.9, 3.2, easeIn(seg(t, 3.6, 5.15))), ox: 52, oy: 46, blur: lerp(10, 0, seg(t, 3.6, 3.95)) + seg(t, 4.7, 5.15) * 10 });

      // Cena 3 — burnout
      const s3o = seg(t, 5.05, 5.2) * (1 - seg(t, 8.6, 8.8));
      const [sx3, sy3] = shake(clock, (3 + 6 * seg(t, 7.6, 8.6)) * k * 0.6);
      const accel = easeIn(seg(t, 7.9, 8.75));
      setLayer(refs.s3.current, { o: s3o, s: lerp(1.22, 1.04, easeOut(seg(t, 5.05, 6.3))) + accel * 0.75, ox: 55, oy: 58, x: sx3, y: sy3, blur: accel * 12, bright: lerp(1.3, 1, seg(t, 5.05, 5.5)) });
      if (s3o > 0.002) {
        const wheel = coverPoint(w, h, 300 / 1080, 1235 / 1920);
        if (back) {
          smokeCloud(back, clock, { cx: wheel.x - 60 * k, cy: wheel.y - 150 * k, spread: 520 * k, count: 14, size: 780 * k, alpha: 0.5 * s3o, drift: 160 * k, seed: 3 });
          smokeCloud(back, clock + 3, { cx: w * 0.65, cy: h * 0.5, spread: 700 * k, count: 8, size: 900 * k, alpha: 0.14 * s3o, drift: 120 * k, seed: 4 });
        }
        if (front) sparks(front, clock, wheel.x, wheel.y, 50, -1, s3o, k);
      }

      // Cena 4 — passagem rente à tela
      const s4o = seg(t, 8.65, 8.8) * (1 - seg(t, 10.65, 10.85));
      const pass = easeInOut(seg(t, 8.65, 10.8));
      const [sx4, sy4] = shake(clock, (9 + 10 * Math.sin(Math.PI * pass)) * k * 0.6);
      const dx = (190 / 1080) * w;
      setLayer(refs.s4.current, { o: s4o, s: lerp(1.45, 1.12, pass), x: lerp(dx, -dx * 0.85, pass) + sx4, y: sy4, ox: 45, oy: 62, blur: lerp(4, 1, seg(t, 8.65, 9.1)) + seg(t, 10.4, 10.8) * 10 });
      setLayer(refs.s4ghost.current, { o: s4o * 0.35, s: lerp(1.45, 1.12, pass), x: lerp(dx, -dx * 0.85, pass) + sx4 + 70 * k, y: sy4, ox: 45, oy: 62, blur: 10 });
      if (s4o > 0.002) {
        if (front) { speedLines(front, clock, w, h, s4o); sparks(front, clock, w * 0.83, h * 0.6, 34, 1, s4o, k); }
        if (back) smokeCloud(back, clock, { cx: w * 0.83, cy: h * 0.68, spread: 400 * k, count: 6, size: 700 * k, alpha: 0.28 * s4o, drift: 200 * k, seed: 5 });
      }

      // Cena 5 — final com título
      const s5o = seg(t, 10.75, 11.0);
      const fin = seg(t, 10.75, T_END);
      setLayer(refs.s5.current, { o: s5o, s: lerp(1.18, 1.06, easeOut(fin)), oy: 55, blur: 3, bright: 0.55 });
      const h5 = refs.helmet5.current;
      if (h5) {
        const hw = Math.min(w * 0.62, h * 0.38);
        h5.style.width = `${hw}px`; h5.style.height = `${hw * (336 / 293)}px`;
        h5.style.left = `${w / 2 - hw / 2}px`; h5.style.bottom = `${-hw * 0.12}px`;
        h5.style.opacity = String(s5o);
        h5.style.visibility = s5o < 0.002 ? 'hidden' : 'visible';
        h5.style.transform = `translateY(${lerp(hw * 0.35, 0, easeOut(seg(t, 10.8, 12)))+ Math.sin(clock * 2) * 8}px) rotateY(${lerp(-28, 14, easeOut(fin))}deg) rotateZ(${Math.sin(clock) * 2}deg)`;
      }
      if (s5o > 0.002) {
        if (back) smokeCloud(back, clock, { cx: w / 2, cy: h * 0.5, spread: w * 1.1, count: 14, size: Math.max(w, h) * 0.55, alpha: 0.3 * s5o, drift: 70 * k, seed: 6 });
        if (front) { smokeCloud(front, clock + 1, { cx: w / 2, cy: h * 0.92, spread: w * 1.2, count: 10, size: Math.max(w, h) * 0.5, alpha: 0.3 * s5o, drift: 50 * k, seed: 7 }); particles(front, clock, w, h, 0.6 * s5o); }
      }
      const ti = easeOut(seg(t, 11.3, 12.4));
      const title = refs.title.current;
      if (title) {
        title.style.opacity = String(ti);
        title.style.transform = `translateY(${lerp(90, 0, ti)}px) scale(${lerp(1.25, 1, ti)})`;
        title.style.filter = ti < 0.999 ? `blur(${lerp(16, 0, ti)}px)` : 'none';
      }
      if (refs.t1.current) {
        refs.t1.current.style.letterSpacing = `${lerp(0.2, 0.02, ti)}em`;
        const sp = lerp(-30, 130, seg(t, 12.2, 13.2));
        refs.t1.current.style.backgroundImage = `linear-gradient(100deg, transparent ${sp - 10}%, rgba(255,255,255,.95) ${sp}%, transparent ${sp + 10}%), linear-gradient(180deg,#ffffff 0%,#d9dde3 30%,#7d838c 48%,#f4f6f8 52%,#9aa1aa 70%,#e8ebef 100%)`;
      }
      if (refs.t2.current) refs.t2.current.style.opacity = String(seg(t, 11.9, 12.5));
      if (refs.t3.current) refs.t3.current.style.opacity = String(seg(t, 12.2, 12.8));

      // flashes de transição
      const fl = Math.max(
        Math.exp(-Math.pow((t - 3.72) / 0.06, 2)) * 0.9,
        Math.exp(-Math.pow((t - 5.1) / 0.07, 2)),
        Math.exp(-Math.pow((t - 8.72) / 0.05, 2)) * 0.8,
        Math.exp(-Math.pow((t - 10.8) / 0.07, 2)) * 0.9,
      );
      if (refs.flash.current) refs.flash.current.style.opacity = String(fl);
      if (refs.hint.current) refs.hint.current.style.opacity = String(1 - seg(t, 0.3, 1));
      if (refs.bar.current) refs.bar.current.style.width = `${(t / T_END) * 100}%`;
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (reduce) {
    return (
      <section className="container-grid grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-4" aria-label="Sequência cinematográfica">
        {['garage', 'visor', 'burnout', 'flyby'].map((n) => (
          <img key={n} src={`${BASE}/${n}.webp`} alt="" className="aspect-[9/16] w-full rounded-2xl object-cover" loading="lazy" />
        ))}
      </section>
    );
  }

  const cover = 'absolute inset-0 h-full w-full object-cover';
  const layer = 'absolute inset-0 will-change-transform';
  return (
    <section ref={sectionRef} className="relative h-[600vh] bg-black" aria-label="Sequência cinematográfica: do capacete à pista">
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden bg-black">
        <div ref={refs.s1} className={layer}><img src={`${BASE}/garage.webp`} alt="Garagem escura com luzes vermelhas e azuis" className={cover} /></div>
        <div ref={refs.helmetWrap} className="absolute inset-0" style={{ perspective: 1600 }}>
          <div ref={refs.helmet} className="absolute [transform-style:preserve-3d]">
            <img src={`${BASE}/helmet.webp`} alt="Capacete de corrida flutuando" className="h-full w-full" />
            <div ref={refs.shine} className="absolute inset-0 mix-blend-screen" style={{ WebkitMaskImage: `url(${BASE}/helmet.webp)`, WebkitMaskSize: '100% 100%', maskImage: `url(${BASE}/helmet.webp)`, maskSize: '100% 100%' }} />
          </div>
        </div>
        <div ref={refs.s2} className={layer} style={{ opacity: 0 }}><img src={`${BASE}/visor.webp`} alt="Reflexo do circuito na viseira" className={cover} loading="lazy" /></div>
        <div ref={refs.s3} className={layer} style={{ opacity: 0 }}><img src={`${BASE}/burnout.webp`} alt="Carro de Fórmula 1 fazendo burnout com fumaça" className={cover} loading="lazy" /></div>
        <div ref={refs.s4} className={layer} style={{ opacity: 0 }}><img src={`${BASE}/flyby.webp`} alt="Carro passando rente à câmera em alta velocidade" className={cover} loading="lazy" /></div>
        <div ref={refs.s4ghost} className={`${layer} mix-blend-screen`} style={{ opacity: 0 }}><img src={`${BASE}/flyby.webp`} alt="" className={cover} loading="lazy" /></div>
        <div ref={refs.s5} className={layer} style={{ opacity: 0 }}><img src={`${BASE}/burnout.webp`} alt="" className={cover} loading="lazy" /></div>
        <canvas ref={canvasBack} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
        <div className="absolute inset-0" style={{ perspective: 1600 }}>
          <div ref={refs.helmet5} className="absolute" style={{ opacity: 0 }}>
            <img src={`${BASE}/helmet.webp`} alt="" className="h-full w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]" />
          </div>
        </div>
        <canvas ref={canvasFront} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />

        <div ref={refs.title} className="absolute inset-x-0 top-[16%] px-4 text-center" style={{ opacity: 0 }}>
          <div
            ref={refs.t1}
            className="font-display whitespace-nowrap text-[17vw] font-black italic leading-none sm:text-[9rem]"
            style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 2px 0 #5d636b) drop-shadow(0 4px 0 #40454c) drop-shadow(0 6px 0 #2b2f35) drop-shadow(0 10px 18px rgba(0,0,0,.8)) drop-shadow(0 0 30px rgba(225,6,0,.35))' }}
          >
            GRID F1
          </div>
          <div ref={refs.t2} className="mt-4 text-sm font-bold uppercase tracking-[0.4em] text-white sm:text-2xl" style={{ textShadow: '0 0 18px rgba(225,6,0,.8)' }}>The race never stops</div>
          <div ref={refs.t3} className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-race-400 sm:text-base">A experiência da velocidade</div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(0,0,0,.75)_100%)]" aria-hidden />
        <div ref={refs.flash} className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 0 }} aria-hidden />
        <div ref={refs.hint} className="pointer-events-none absolute inset-x-0 bottom-16 text-center">
          <p className="label text-white/80">Role para começar</p>
        </div>
        <div className="absolute bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div ref={refs.bar} className="h-full bg-race" style={{ width: 0 }} />
        </div>
        <p className="absolute bottom-3 right-4 text-[10px] text-zinc-500">Imagens geradas por IA (Figma AI)</p>
      </div>
    </section>
  );
}
