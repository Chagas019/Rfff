/**
 * Matemática geográfica pura (sem Three.js), usada pelo globo 3D, pelo mapa 2D e pelos testes.
 *
 * Convenção do globo (a mesma da textura equirretangular em uma SphereGeometry):
 * - longitude -180° fica em -X, longitude 0° em +X, longitude 90°E em -Z;
 * - latitude +90° fica em +Y.
 */

export const DEG = Math.PI / 180;
export const EARTH_RADIUS_KM = 6371;

export type Vec3 = [number, number, number];

export interface LatLon {
  lat: number;
  lon: number;
}

/** Converte latitude/longitude em um ponto na esfera de raio `r`. */
export function latLonToVec3(lat: number, lon: number, r = 1): Vec3 {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/** Operação inversa de `latLonToVec3` (o vetor não precisa estar normalizado). */
export function vec3ToLatLon([x, y, z]: Vec3): LatLon {
  const r = Math.hypot(x, y, z) || 1;
  const lat = 90 - Math.acos(Math.min(1, Math.max(-1, y / r))) / DEG;
  const lon = Math.atan2(-z, x) / DEG;
  return { lat, lon: normalizeLon(lon) };
}

/** Mantém a longitude no intervalo [-180, 180). */
export function normalizeLon(lon: number): number {
  const l = ((((lon + 180) % 360) + 360) % 360) - 180;
  return Object.is(l, -0) ? 0 : l;
}

/** Normaliza um ângulo em radianos para (-π, π]. */
export function wrapAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r <= -Math.PI) r += Math.PI * 2;
  if (r > Math.PI) r -= Math.PI * 2;
  return r;
}

/** Retorna o ângulo equivalente a `to` mais próximo de `from` (caminho mais curto). */
export function nearestAngle(from: number, to: number): number {
  return from + wrapAngle(to - from);
}

/**
 * Rotação do grupo do globo (ordem XYZ) que coloca `lat/lon` de frente para uma câmera em +Z.
 */
export function rotationToFace(lat: number, lon: number): { x: number; y: number } {
  return { x: lat * DEG, y: -Math.PI / 2 - lon * DEG };
}

/** Distância do grande círculo (haversine), em quilômetros. */
export function greatCircleKm(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ângulo central (radianos) entre dois pontos da esfera. */
export function centralAngle(a: LatLon, b: LatLon): number {
  return greatCircleKm(a, b) / EARTH_RADIUS_KM;
}

/**
 * Pontos de controle de um arco 3D entre duas cidades.
 * A altura cresce com a distância, para que rotas longas "voem" mais alto.
 */
export function arcControlPoints(a: LatLon, b: LatLon, r = 1): [Vec3, Vec3, Vec3, Vec3] {
  const angle = centralAngle(a, b);
  const lift = r * (1 + 0.08 + angle * 0.22);
  const start = latLonToVec3(a.lat, a.lon, r);
  const end = latLonToVec3(b.lat, b.lon, r);
  const c1 = slerpOnSphere(start, end, 0.25, lift);
  const c2 = slerpOnSphere(start, end, 0.75, lift);
  return [start, c1, c2, end];
}

/** Interpolação esférica entre dois vetores, projetada no raio informado. */
export function slerpOnSphere(a: Vec3, b: Vec3, t: number, radius: number): Vec3 {
  const na = normalize(a);
  const nb = normalize(b);
  const dot = Math.min(1, Math.max(-1, na[0] * nb[0] + na[1] * nb[1] + na[2] * nb[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return [na[0] * radius, na[1] * radius, na[2] * radius];
  const s = Math.sin(omega);
  const k1 = Math.sin((1 - t) * omega) / s;
  const k2 = Math.sin(t * omega) / s;
  return [(na[0] * k1 + nb[0] * k2) * radius, (na[1] * k1 + nb[1] * k2) * radius, (na[2] * k1 + nb[2] * k2) * radius];
}

export function normalize([x, y, z]: Vec3): Vec3 {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/** Projeção equirretangular recortada usada no mapa 2D (latitudes entre `top` e `bottom`). */
export function projectEquirect(lat: number, lon: number, width: number, height: number, top = 78, bottom = -58) {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((top - lat) / (top - bottom)) * height,
  };
}

/** Remove acentos e caixa para buscas ("São Paulo" encontra "sao paulo"). */
export function foldText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Suavização exponencial independente da taxa de quadros. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
