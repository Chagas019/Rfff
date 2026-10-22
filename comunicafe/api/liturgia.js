// TEMPORÁRIO: diagnóstico da página da Canção Nova (será substituído pela versão final)
export default async function handler(req, res) {
  try {
    const r = await fetch("https://liturgia.cancaonova.com/pb/", { headers: { "user-agent": "Mozilla/5.0 (ComunicaFe)" } });
    const html = await r.text();
    const i = Math.max(0, html.search(/Leitura/i) - 3000);
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.status(200).send(`status ${r.status} tamanho ${html.length}\n\n` + html.slice(i, i + 14000));
  } catch (e) { res.status(500).send(String(e)); }
}
