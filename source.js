// build 2026-10-11
var _d=function(b){var t="";if(typeof atob==="function"){t=atob(b)}else{var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",i=0,r="",e,f,g,h;do{e=c.indexOf(b.charAt(i++));f=c.indexOf(b.charAt(i++));g=c.indexOf(b.charAt(i++));h=c.indexOf(b.charAt(i++));r+=String.fromCharCode((e<<2)|(f>>4))+(f!==64?String.fromCharCode(((f&15)<<4)|(g>>2)):"")+(g!==64?String.fromCharCode(((g&3)<<6)|h):"")}while(i<b.length);t=r}var o="";for(var k=0;k<t.length;k++){o+=String.fromCharCode(t.charCodeAt(k)^91)}return o};
const S = {
    SITE: _d("My8vKyhhdHQzMjo1MjY+dTYo"),
    SEARCH_Q: _d("dCg+Oik4M2QqZg=="),
    DETAILS: _d("dD8+LzoyNyh0"),
    WATCH: _d("dCw6Lzgzdg=="),
    EPISODE: _d("dj4rMig0Pz52"),
    PLAYER: _d("My8vKyhhdHQvKSI+Njk+P3UuKHU4OA=="),
    P_EMBED: _d("dD42OT4/dDo1MjY+dA=="),
    P_BOOT: _d("dDorMnQ5NDQvKC8pOis="),
    P_DATA: _d("dDorMnQoLyk+OjYEPzovOg=="),
    P_FILE: _d("dCh0"),
    MASTER_TICKET: _d("GRQUDwgPCRoLBA8SGBAeDw=="),
    H_BOOT: _d("A3YPKSIeNjk+P3YZNDQvKC8pOis="),
    H_NONCE: _d("A3YeNjk+P3YVNDU4Pg=="),
    UA: _d("FjQhMjc3OnRudWt7cxY6ODI1LzQoM2B7EjUvPjd7Fjo4exQIewN7amsEam4EbHJ7GisrNz4MPjkQMi90bmhsdWhte3MQEw8WF3d7NzIwPnscPjgwNHJ7GDMpNDY+dGpoanVrdWt1a3sIOj06KTJ0bmhsdWht"),
    CACHE_MS: 1500000,
    ANILIST_VAR: _d("OjUyNzIoLxI/"),
    H_SUB: _d("PzovOnYzOih2KC45"),
    H_DUB: _d("PzovOnYzOih2Py45"),
    SERVERS: [_d("GigvKTo="), _d("GT4vOg=="), _d("CDo1Pg=="), _d("CDQpOg==")]
};
const P = S;

function aviso() {
    console.log("G: " + Array.prototype.slice.call(arguments).join(" "));
}

async function searchResults(keyword) {
    try {
        const html = await soraText(`${P.SITE}${P.SEARCH_Q}${encodeURIComponent(keyword)}`);
        if (!html) return JSON.stringify([]);

        const out = [];
        for (const trozo of html.split('<div class="film-poster').slice(1)) {
            const slug = (trozo.match(/\/details\/([^"\/]+)"/) || [])[1];
            if (!slug) continue;
            const title = (trozo.match(/data-ename="([^"]*)"/) || [])[1]
                || (trozo.match(/class="dynamic-name"[^>]*>([^<]{1,140})</) || [])[1] || "";
            const img = (trozo.match(/data-src="(https?:\/\/[^"]+)"/) || [])[1]
                || (trozo.match(/<img[^>]+src="(https?:\/\/[^"]+)"/) || [])[1] || "";
            out.push({ title: limpiar(title) || "Sin titulo", image: img, href: `anime/${slug}` });
            if (out.length >= 30) break;
        }
        if (out.length === 0) aviso("busqueda: sin tarjetas en la respuesta");
        return JSON.stringify(out);
    } catch (error) {
        aviso("busqueda: error");
        return JSON.stringify([]);
    }
}

async function extractDetails(url) {
    try {
        const slug = String(url).replace(/^anime\//, "");
        const html = await soraText(`${P.SITE}${P.DETAILS}${slug}`);
        if (!html) return JSON.stringify([{ description: "Sin descripcion", aliases: "", airdate: "" }]);

        const desc = (html.match(new RegExp('id="synopsis-text">([\\s\\S]{0,2000}?)<\\/div>')) || [])[1] || "";
        const aired = (html.match(/Aired:?\s*<\/span>\s*([^<]{3,40})</) || [])[1] || "";
        const tipo = (html.match(/"@type"\s*:\s*"(TVSeries|Movie)"/) || [])[1] || "Anime";
        const generos = [...html.matchAll(/\/genre\/([a-z0-9\-]+)"/g)].map((m) => limpiar(m[1]).replace(/-/g, " ")).slice(0, 4);

        return JSON.stringify([{
            description: limpiar(desc) || "Sin descripcion",
            aliases: [tipo.replace("TVSeries", "Serie").replace("Movie", "Pelicula"), generos.join(", ")].filter(Boolean).join(" · "),
            airdate: aired ? `Emitido: ${limpiar(aired)}` : ""
        }]);
    } catch (error) {
        aviso("ficha: error");
        return JSON.stringify([{ description: "Sin descripcion", aliases: "", airdate: "" }]);
    }
}

async function extractEpisodes(url) {
    try {
        const partes = String(url).replace(/^anime\//, "").match(/^(.*)-([^-]+)$/);
        if (!partes) return JSON.stringify([]);
        const titulo = partes[1];
        const id = partes[2];

        const html = await soraText(`${P.SITE}${P.WATCH}${titulo}${P.EPISODE}1-${id}`);
        if (!html) return JSON.stringify([]);

        const out = [];
        const re = new RegExp(`data-episode="(\\d+)"[\\s\\S]{0,260}?${P.H_SUB}="(\\d)"[\\s\\S]{0,120}?${P.H_DUB}="(\\d)"`, "g");
        for (const m of html.matchAll(re)) {
            out.push({
                href: `anime/${titulo}/${id}/${m[1]}`,
                number: Number(m[1]),
                title: ""
            });
        }
        aviso(`episodios: ${out.length} (sub y dub por episodio incluidos)`);
        return JSON.stringify(out);
    } catch (error) {
        aviso("episodios: error");
        return JSON.stringify([]);
    }
}

async function extractStreamUrl(url) {
    aviso("fuente: piden", String(url).slice(0, 150));
    try {
        const partes = normalizar(url);
        if (!partes) { aviso("fuente: direccion no reconocida"); return null; }
        const titulo = partes.titulo, id = partes.id, ep = partes.ep;

        const watch = `${P.SITE}${P.WATCH}${titulo}${P.EPISODE}${ep}-${id}`;
        const html = await soraText(watch);
        if (!html) { aviso("fuente: pagina sin respuesta"); return null; }

        const anilist = (html.match(new RegExp("var\\s+" + P.ANILIST_VAR + "\\s*=\\s*(\\d+)")) || [])[1];
        if (!anilist) { aviso("fuente: sin id de catalogo"); return null; }

        const bloqueEp = html.split(`data-episode="${ep}"`)[1] || "";
        const haySub = ((bloqueEp.match(new RegExp(P.H_SUB + '="(\\d)"')) || [])[1] || "0") === "1";
        const hayDub = ((bloqueEp.match(new RegExp(P.H_DUB + '="(\\d)"')) || [])[1] || "0") === "1";

        const audios = [];
        if (haySub) audios.push("sub");
        if (hayDub) audios.push("dub");
        if (audios.length === 0) audios.push("sub");

        const streams = [];
        let subs = [];
        for (let pasada = 0; pasada < 2 && streams.length === 0; pasada++) {
            for (const audio of audios) {
                const res = await opcionesDeServidor(anilist, ep, audio, pasada > 0);
                streams.push(...res.streams);
                if (subs.length === 0 && res.subs.length > 0) subs = res.subs;
            }
        }

        if (streams.length === 0) { aviso("fuente: el proveedor no devolvio opciones"); return null; }
        aviso(`fuente: ${streams.length} opciones (sub/dub)`);

        const salida = { streams: streams };
        if (subs.length > 0) salida.subtitles = subs;
        return JSON.stringify(salida);
    } catch (error) {
        aviso("fuente: error");
        return null;
    }
}

const CACHE = {};

async function opcionesDeServidor(anilist, ep, audio, forzar) {
    const vacio = { streams: [], subs: [] };
    const clave = `${anilist}|${ep}|${audio}`;
    if (!forzar && CACHE[clave] && Date.now() - CACHE[clave].t < P.CACHE_MS) {
        aviso("fuente:", audio, "de la memoria del dia");
        return CACHE[clave].v;
    }
    try {
        const embedUrl = `${P.PLAYER}${P.P_EMBED}${anilist}/${ep}/${audio}`;
        const embed = await soraText(embedUrl, cabecerasProveedor(embedUrl));
        if (!embed) { aviso(audio, "sin pagina del proveedor"); return vacio; }
        const ticket = (embed.match(new RegExp(P.MASTER_TICKET + "\\s*=\\s*\"([^\"]+)\"")) || [])[1];
        if (!ticket) { aviso(audio, "la pagina no trae ticket:", embed.length, "b"); return vacio; }
        aviso(audio, "ticket", ticket.length, "caracteres");

        const hb = cabecerasProveedor(embedUrl);
        hb[P.H_BOOT] = ticket;
        const boot = await soraJsonLog(`${P.PLAYER}${P.P_BOOT}`, hb, "POST", "", `${audio} bootstrap`);
        const nonce = boot && boot.embedNonce ? boot.embedNonce : "";
        aviso(audio, "nonce:", nonce ? "si" : "no");

        const hc = cabecerasProveedor(embedUrl);
        if (nonce) hc[P.H_NONCE] = nonce;
        const data = await soraJsonLog(`${P.PLAYER}${P.P_DATA}?id=${anilist}&episode=${ep}&season=1&audio=${audio}`, hc, "GET", null, `${audio} catalogo`);
        if (!data || !data.providers) { aviso(audio, "sin datos del proveedor"); return vacio; }

        const streams = [];
        const subs = [];
        for (const prov of data.providers) {
            const nombre = prov.name || P.SERVERS[streams.length % P.SERVERS.length] || "Servidor";
            for (const q of (prov.qualities || []).slice(0, 3)) {
                if (!q.token) continue;
                const etiqueta = `${nombre} · ${q.name || "Auto"} (${audio === "sub" ? "Sub" : "Dub"})`;
                const master = `${P.PLAYER}${P.P_FILE}${q.token}.m3u8`;
                const variantes = await resolverMaster(master, embedUrl);
                if (variantes.length === 0) {
                    streams.push({ title: etiqueta, streamUrl: master, headers: cabecerasStream() });
                    continue;
                }
                for (const v of variantes) {
                    streams.push({
                        title: v.calidad && variantes.length > 1 ? `${etiqueta} ${v.calidad}` : etiqueta,
                        streamUrl: v.url,
                        headers: cabecerasStream()
                    });
                }
            }
            for (const c of (prov.captions || [])) {
                if (c.url) subs.push(c.label || c.lang || "Subtitulo", c.url);
            }
        }
        const salida = { streams: streams, subs: subs };
        if (streams.length > 0) CACHE[clave] = { t: Date.now(), v: salida };
        return salida;
    } catch (error) {
        aviso("fuente:", audio, "error");
        return vacio;
    }
}

async function resolverMaster(masterUrl, embedUrl) {
    try {
        const texto = await soraText(masterUrl, cabecerasProveedor(embedUrl));
        if (!texto || texto.indexOf("#EXTM3U") !== 0) { aviso("master: sin playlist"); return []; }
        const salida = [];
        const lineas = texto.split("\n");
        for (let i = 0; i < lineas.length; i++) {
            if (lineas[i].indexOf("#EXT-X-STREAM-INF") !== 0) continue;
            const url = (lineas[i + 1] || "").trim();
            if (url.indexOf("http") !== 0) continue;
            const alto = (lineas[i].match(/RESOLUTION=\d+x(\d+)/) || [])[1] || "";
            salida.push({ url: url, calidad: alto ? `${alto}p` : "" });
        }
        if (salida.length === 0 && texto.indexOf("#EXTINF") > -1) salida.push({ url: masterUrl, calidad: "" });
        return salida.slice(0, 2);
    } catch (error) {
        aviso("master: error");
        return [];
    }
}

function limpiar(texto) {
    return String(texto || "")
        .replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&#0?39;/g, "'")
        .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\s+/g, " ").trim();
}

function normalizar(url) {
    const texto = String(url || "");
    let m = texto.match(/anime\/(.*)\/([^\/]+)\/(\d+)$/);
    if (m) return { titulo: m[1], id: m[2], ep: m[3] };

    const corte = texto.indexOf(P.EPISODE);
    if (corte > -1) {
        const antes = texto.slice(0, corte);
        const resto = texto.slice(corte + P.EPISODE.length).split(/[-\/?#]/);
        const sitio = antes.lastIndexOf(P.WATCH);
        const titulo = sitio > -1 ? antes.slice(sitio + P.WATCH.length) : "";
        if (titulo && resto[0] && resto[1]) return { titulo: titulo, id: resto[1], ep: resto[0] };
    }

    m = texto.match(/(?:details\/|anime\/)(.+)-([^-?&#\/]+)$/);
    if (m) return { titulo: m[1], id: m[2], ep: "1" };
    return null;
}

function cabecerasStream() {
    const h = {};
    h["Origin"] = P.PLAYER;
    h["Referer"] = `${P.PLAYER}/`;
    h["User-Agent"] = P.UA;
    return h;
}

function cabecerasProveedor(embedUrl) {
    const h = {};
    h["Origin"] = P.PLAYER;
    h["Referer"] = embedUrl;
    h["Accept"] = "*/*";
    h["Accept-Language"] = "en-US,en;q=0.9";
    h["sec-fetch-site"] = "same-origin";
    h["sec-fetch-mode"] = "cors";
    h["sec-fetch-dest"] = "empty";
    h["Priority"] = "u=1, i";
    h["Cache-Control"] = "no-cache";
    return h;
}

async function soraJsonLog(url, headers, method, body, etiqueta) {
    try {
        const resp = await soraFetch(url, { headers: headers || {}, method: method || "GET", body: body ?? null });
        if (!resp) { aviso("fuente:", etiqueta, "sin respuesta"); return null; }
        let texto = "";
        try { texto = await resp.text(); } catch (error) { texto = ""; }
        if (resp.status && resp.status !== 200) {
            aviso("fuente:", etiqueta, "respondio", resp.status, String(texto).slice(0, 100));
        }
        try { return JSON.parse(texto); } catch (error) { aviso("fuente:", etiqueta, "sin JSON"); return null; }
    } catch (error) {
        aviso("fuente:", etiqueta, "error");
        return null;
    }
}

async function soraText(url, headers) {
    try {
        const resp = await soraFetch(url, { headers: headers || {} });
        if (!resp) { aviso("sin respuesta de", String(url).slice(0, 80)); return null; }
        const texto = await resp.text();
        if (resp.status && resp.status !== 200) aviso("respondio", resp.status, "->", String(texto).slice(0, 110));
        return texto;
    } catch (error) {
        return null;
    }
}

async function soraJson(url, headers, method, body) {
    try {
        const resp = await soraFetch(url, { headers: headers || {}, method: method || "GET", body: body ?? null });
        if (!resp) return null;
        return await resp.json();
    } catch (error) {
        return null;
    }
}

async function soraFetch(url, options = {}) {
    const headers = options.headers || {};
    const method = options.method || "GET";
    const body = options.body ?? null;
    const cabeceras = { "User-Agent": P.UA };
    for (const k in headers) cabeceras[k] = headers[k];
    try {
        return await fetchv2(url, cabeceras, method, body);
    } catch (e) {
        try {
            return await fetch(url, { headers: cabeceras, method: method, body: body });
        } catch (error) {
            return null;
        }
    }
}

