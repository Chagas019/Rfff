/** GLSL dos materiais do globo. */

export const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const earthFragment = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uWater;
  uniform vec3 uSun;
  uniform vec3 uRim;
  uniform float uExposure;
  uniform float uNightBoost;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 s = normalize(uSun);
    float ndl = dot(n, s);
    float dayMix = smoothstep(-0.16, 0.24, ndl);

    // dia: levemente dessaturado e frio, para combinar com o fundo preto
    vec3 day = texture2D(uDay, vUv).rgb;
    float luma = dot(day, vec3(0.299, 0.587, 0.114));
    day = mix(vec3(luma) * vec3(1.1, 0.93, 0.74), day, 0.3);
    vec3 lit = day * (0.03 + 0.92 * max(ndl, 0.0));

    // noite: luzes das cidades em âmbar
    vec3 night = texture2D(uNight, vUv).rgb;
    night = pow(night, vec3(1.5)) * vec3(1.0, 0.55, 0.22) * 1.9 * uNightBoost;

    vec3 col = mix(night + day * 0.018, lit, dayMix);

    // reflexo especular apenas na água
    float water = texture2D(uWater, vUv).r;
    vec3 h = normalize(s + v);
    float nh = max(dot(n, h), 0.0);
    float spec = pow(nh, 520.0) * 0.4 * water * dayMix;
    col += spec * vec3(1.0, 0.9, 0.78);

    // borda luminosa (fresnel)
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
    col += fres * uRim * (0.12 + 0.75 * smoothstep(-0.4, 0.6, ndl));

    gl_FragColor = vec4(col * uExposure, 1.0);
    #include <colorspace_fragment>
  }
`;

export const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosV = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    float d = dot(normalize(vNormalV), normalize(-vPosV));
    float rim = clamp(-d, 0.0, 1.0);
    float glow = pow(rim, 2.4) * 1.6;
    gl_FragColor = vec4(uColor * glow * uIntensity, glow * uIntensity);
  }
`;

export const backdropFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p);
    float core = pow(1.0 - smoothstep(0.0, 0.5, d), 2.6);
    // faixa horizontal tênue: um "horizonte" de luz atrás do planeta
    float band = exp(-pow(p.y * 26.0, 2.0)) * (1.0 - smoothstep(0.15, 0.5, abs(p.x)));
    vec3 col = uColor * core * 0.42 + uColor2 * band * 0.12;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

export const uvVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const arcFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDraw;
  uniform float uOpacity;
  uniform float uHead;
  varying vec2 vUv;
  void main() {
    float t = vUv.x;
    if (t > uDraw) discard;
    float ends = smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.96, t);
    float head = uHead >= 0.0 ? smoothstep(0.14, 0.0, abs(t - uHead)) : 0.0;
    float tip = smoothstep(0.06, 0.0, uDraw - t) * step(uDraw, 0.999);
    float a = (0.5 + head * 1.5 + tip * 1.2) * ends * uOpacity;
    gl_FragColor = vec4(uColor * (0.7 + head * 1.6 + tip), a);
  }
`;

export const highlightVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const highlightFragment = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec3 uOrigin;
  uniform float uProgress;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying vec3 vLocal;
  void main() {
    vec4 m = texture2D(uMask, vUv);
    float fill = m.r;
    float edge = m.g;
    float dist = acos(clamp(dot(vLocal, uOrigin), -1.0, 1.0));
    float revealed = smoothstep(uProgress, uProgress - 0.18, dist);
    float wave = smoothstep(0.16, 0.0, abs(dist - uProgress));
    float pulse = 0.82 + 0.18 * sin(uTime * 2.2 - dist * 7.0);
    float a = (fill * (0.2 * revealed * pulse + wave * 0.7) + edge * (0.75 * revealed + wave)) * uOpacity;
    vec3 col = mix(uColorA, uColorB, clamp(wave + edge * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(col * a, a);
  }
`;

export const particlesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float ang = uTime * (0.012 + aSeed * 0.03);
    float c = cos(ang), s = sin(ang);
    vec3 p = vec3(position.x * c - position.z * s, position.y + sin(uTime * 0.2 + aSeed * 20.0) * 0.04, position.x * s + position.z * c);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.5 + aSeed) / max(0.1, -mv.z);
    vAlpha = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed * 1.6) + aSeed * 50.0));
    vColor = aColor;
  }
`;

export const particlesFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a, a * vAlpha * uOpacity);
  }
`;
