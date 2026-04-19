const https = require("https");
const fs    = require("fs");
const path  = require("path");

module.exports = async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(404).send("Not found");

  try {
    const data = await fetchJson(`https://coldfact.up.railway.app/share/${id}`);
    if (data.detail) return res.status(404).send("Not found");

    const score   = Math.round(data.vci_score || 0);
    const verdict = (data.verdict || "").toUpperCase();
    const title   = data.title   || "Credibility Report";
    const summary = (data.summary || "").slice(0, 200);
    const ogTitle = `${title} — VCI ${score} ${verdict} | Verdad Score`;
    const ogDesc  = summary || `Credibility score: ${score}/100 · ${verdict} · Powered by Verdad Score`;
    const ogUrl   = `https://verdadscore.com/share/${id}`;
    const ogImage = `https://verdadscore.com/og-default.png`;

    const html = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");

    const injected = html.replace("<head>", `<head>
    <meta property="og:title"       content="${esc(ogTitle)}" />
    <meta property="og:description" content="${esc(ogDesc)}" />
    <meta property="og:url"         content="${ogUrl}" />
    <meta property="og:type"        content="article" />
    <meta property="og:site_name"   content="Verdad Score" />
    <meta property="og:image"       content="${ogImage}" />
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${esc(ogTitle)}" />
    <meta name="twitter:description" content="${esc(ogDesc)}" />
    <meta name="twitter:image"       content="${ogImage}" />
    <title>${esc(ogTitle)}</title>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).send(injected);

  } catch(e) {
    res.status(500).send("Error: " + e.message);
  }
};

function esc(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => {
      let body = "";
      r.on("data", c => body += c);
      r.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}
