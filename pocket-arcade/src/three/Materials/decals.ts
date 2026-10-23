import * as THREE from 'three';

/**
 * Inscrições do aparelho desenhadas em canvas (alta resolução).
 * Só reproduzimos o que é legível na foto: "Play", "Fast Campus", "groffi",
 * "Memory Card", "CE" e a carinha sorridente. Nenhum logotipo foi inventado.
 */

const ROUNDED_FONT = '"Arial Rounded MT Bold", "Nunito", "Varela Round", "Trebuchet MS", system-ui, sans-serif';

function canvas2d(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null; // ambiente sem canvas (testes em jsdom)
  }
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, name: string, anisotropy = 4, opaque = false) {
  const tex = new THREE.CanvasTexture(canvas);
  // texturas sem transparência vão como JPEG no GLB exportado (arquivo bem menor)
  if (opaque) tex.userData.mimeType = 'image/jpeg';
  tex.name = name;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/** Adesivo "Play": letras rosa com contorno branco grosso e borda rosa fina. */
export function playStickerTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(1024, 512);
  if (ctx) {
    ctx.translate(512, 270);
    ctx.font = `900 300px ${ROUNDED_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // borda externa rosa
    ctx.strokeStyle = '#ee6f97';
    ctx.lineWidth = 78;
    ctx.strokeText('Play', 0, 0);
    // contorno branco do adesivo
    ctx.strokeStyle = '#fffafa';
    ctx.lineWidth = 58;
    ctx.strokeText('Play', 0, 0);
    // contorno das letras
    ctx.strokeStyle = '#e2457a';
    ctx.lineWidth = 16;
    ctx.strokeText('Play', 0, 0);
    ctx.fillStyle = '#f590b0';
    ctx.fillText('Play', 0, 0);
    // brilho suave nas letras
    const g = ctx.createLinearGradient(0, -120, 0, 120);
    g.addColorStop(0, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillText('Play', 0, 0);
  }
  return toTexture(canvas, 'decal-play');
}

/** Etiqueta "Fast Campus" (texto escuro em relevo baixo). */
export function labelTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(1024, 256);
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 256);
    // contorno escuro da etiqueta em relevo
    ctx.strokeStyle = '#6a5f5d';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(10, 10, 1004, 236, 118);
    ctx.stroke();
    ctx.fillStyle = '#5c5250';
    ctx.font = `900 132px ${ROUNDED_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fast Campus', 512, 136);
  }
  return toTexture(canvas, 'decal-fast-campus');
}

/** Topo amarelo do joystick com a carinha sorridente (traço preto fino). */
export function smileyTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 512);
  if (ctx) {
    ctx.fillStyle = '#f7cc3a';
    ctx.fillRect(0, 0, 512, 512);
    // leve gradiente côncavo
    const g = ctx.createRadialGradient(230, 210, 20, 256, 256, 256);
    g.addColorStop(0, 'rgba(255,240,170,0.55)');
    g.addColorStop(1, 'rgba(200,140,0,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#1d1a16';
    ctx.lineCap = 'round';
    ctx.lineWidth = 13;
    // olhos
    ctx.beginPath();
    ctx.moveTo(196, 190);
    ctx.lineTo(196, 236);
    ctx.moveTo(316, 190);
    ctx.lineTo(316, 236);
    ctx.stroke();
    // sorriso
    ctx.beginPath();
    ctx.arc(256, 262, 92, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  }
  const tex = toTexture(canvas, 'decal-smiley', 8, true);
  return tex;
}

/** Cartucho amarelo: inscrição "groffi" em relevo claro. */
export function groffiTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 192);
  if (ctx) {
    ctx.clearRect(0, 0, 512, 192);
    ctx.font = `900 132px ${ROUNDED_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(150,100,0,0.4)';
    ctx.fillText('groffi', 260, 102);
    ctx.fillStyle = '#fff7e2';
    ctx.fillText('groffi', 256, 96);
  }
  return toTexture(canvas, 'decal-groffi');
}

/** Cartão azul: etiqueta branca com o texto vertical "Memory Card". */
export function memoryCardTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(256, 640);
  if (ctx) {
    ctx.fillStyle = '#4a5ee0';
    ctx.fillRect(0, 0, 256, 640);
    ctx.fillStyle = '#f6f6f8';
    ctx.fillRect(70, 40, 132, 560);
    ctx.save();
    ctx.translate(136, 320);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#2c2f40';
    ctx.font = '600 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Memory Card', 0, 0);
    ctx.restore();
  }
  return toTexture(canvas, 'decal-memory-card', 4, true);
}

/** Peça vermelha da base: chevron em relevo. */
export function chevronTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 256);
  if (ctx) {
    ctx.fillStyle = '#f0573a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = 'rgba(140,30,10,0.45)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(206, 150);
    ctx.lineTo(256, 108);
    ctx.lineTo(306, 150);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,190,170,0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(206, 142);
    ctx.lineTo(256, 100);
    ctx.lineTo(306, 142);
    ctx.stroke();
  }
  return toTexture(canvas, 'decal-chevron', 4, true);
}

/** Marcações gravadas na base (apenas "CE", como na foto). */
export function marksTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 128);
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(70,58,58,0.75)';
    ctx.font = '600 92px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CE', 170, 68);
    ctx.font = '600 70px system-ui, sans-serif';
    ctx.fillText('FC', 330, 70);
  }
  return toTexture(canvas, 'decal-marks');
}
