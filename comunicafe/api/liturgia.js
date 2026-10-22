// TEMPORÁRIO: diagnóstico da página da Canção Nova (será substituído pela versão final)
export default async function handler(req, res) {
  try {
    const r = await fetch("https://liturgia.cancaonova.com/pb/", { headers: { "user-agent": "Mozilla/5.0 (ComunicaFe)" } });
    const html = await r.text();
    const corpo = html.slice(html.indexOf("<body"));
    const texto = corpo.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
    const trechos = [];
    for (const m of texto.matchAll(/(Primeira Leitura|Segunda Leitura|Salmo|Responsório|Evangelho|R\.|—|Liturgia Diária|de 20\d\d)/g)) trechos.push(texto.slice(Math.max(0, m.index - 60), m.index + 160).replace(/\n/g, " ⏎ "));
    const ids = [...corpo.matchAll(/<(?:div|section|li|a|h\d)[^>]*(?:id|class)="([^"]*(?:liturg|leitura|salmo|evangel|tab|data|dia)[^"]*)"[^>]*>/gi)].map(m => m[0]).slice(0, 40);
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.status(200).send(`status ${r.status}\n\nMARCAÇÃO:\n${ids.join("\n")}\n\nTRECHOS:\n${trechos.slice(0, 60).join("\n---\n")}`);
  } catch (e) { res.status(500).send(String(e)); }
}
