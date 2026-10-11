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
    SERVERS: [_d("GigvKTo="), _d("GT4vOg=="), _d("CDo1Pg=="), _d("CDQpOg==")],
    R_SERVIDOR: _d("CSIu"),
    R_ANIME: _d("My8vKyhhdHQ2Pjw6Kzc6InU5LiEhdCgvKT46NnQ6NTJ0"),
    R_FUENTE: _d("My8vKyhhdHQ2Pjw6Kzc6InU5LiEhdCgvKT46NnQ8Pi8INC4pOD4oZDI/Zg=="),
    R_SITIO: _d("My8vKyhhdHQ2Pjw6Kzc6InU5LiEhdA=="),
    R_ID: _d("PzovOnYyP2YH")",
    R_CLAVE: _d("MmQXFg8aI2sKbXdhJm5rDg=="),
    R_VECTOR: _d("DGtgaWwPNDoOKzcEC358OA==")
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

        const tareas = [];
        for (const audio of audios) {
            tareas.push(opcionesRyu(anilist, ep, audio));
            tareas.push(opcionesDeServidor(anilist, ep, audio, false));
        }
        const hechas = await Promise.all(tareas);
        const streams = [];
        let subs = [];
        for (const res of hechas) {
            streams.push(...res.streams);
            if (subs.length === 0 && res.subs.length > 0) subs = res.subs;
        }
        if (streams.length === 0) {
            for (const audio of audios) {
                const res = await opcionesDeServidor(anilist, ep, audio, true);
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

const SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
];
const INV = [
    0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
    0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
    0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
    0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
    0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
    0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
    0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
    0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
    0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
    0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
    0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
    0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
    0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
    0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
    0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
    0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d,
];

function xt(a) { a <<= 1; return (a & 0x100) ? ((a ^ 0x1b) & 0xff) : a; }
function gm(a, b) { let r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r & 0xff; }

function expandir(clave) {
    const w = [];
    for (let i = 0; i < 8; i++) w[i] = ((clave[4*i] << 24) | (clave[4*i+1] << 16) | (clave[4*i+2] << 8) | clave[4*i+3]) >>> 0;
    const rc = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
    for (let i = 8; i < 60; i++) {
        let t = w[i-1];
        if (i % 8 === 0) {
            t = ((t << 8) | (t >>> 24)) >>> 0;
            t = ((SBOX[(t>>>24)&255] << 24) | (SBOX[(t>>>16)&255] << 16) | (SBOX[(t>>>8)&255] << 8) | SBOX[t&255]) >>> 0;
            t = (t ^ ((rc[i/8-1]) << 24)) >>> 0;
        } else if (i % 8 === 4) {
            t = ((SBOX[(t>>>24)&255] << 24) | (SBOX[(t>>>16)&255] << 16) | (SBOX[(t>>>8)&255] << 8) | SBOX[t&255]) >>> 0;
        }
        w[i] = (w[i-8] ^ t) >>> 0;
    }
    return w;
}

function bloque(entrada, w) {
    const s = new Array(16);
    for (let i = 0; i < 16; i++) s[i] = entrada[i];
    const rk = (r) => {
        for (let c = 0; c < 4; c++) {
            const p = w[4*r + c];
            s[4*c] ^= (p >>> 24) & 255; s[4*c+1] ^= (p >>> 16) & 255; s[4*c+2] ^= (p >>> 8) & 255; s[4*c+3] ^= p & 255;
        }
    };
    const invFilas = () => {
        for (let r = 1; r < 4; r++) {
            const fila = [s[r], s[r+4], s[r+8], s[r+12]];
            for (let c = 0; c < 4; c++) s[r + 4*c] = fila[(c - r + 4) % 4];
        }
    };
    const invBytes = () => { for (let i = 0; i < 16; i++) s[i] = INV[s[i]]; };
    const invColumnas = () => {
        for (let c = 0; c < 4; c++) {
            const a = [s[4*c], s[4*c+1], s[4*c+2], s[4*c+3]];
            s[4*c]   = gm(a[0],14) ^ gm(a[1],11) ^ gm(a[2],13) ^ gm(a[3],9);
            s[4*c+1] = gm(a[0],9)  ^ gm(a[1],14) ^ gm(a[2],11) ^ gm(a[3],13);
            s[4*c+2] = gm(a[0],13) ^ gm(a[1],9)  ^ gm(a[2],14) ^ gm(a[3],11);
            s[4*c+3] = gm(a[0],11) ^ gm(a[1],13) ^ gm(a[2],9)  ^ gm(a[3],14);
        }
    };
    rk(14);
    for (let r = 13; r >= 1; r--) { invFilas(); invBytes(); rk(r); invColumnas(); }
    invFilas(); invBytes(); rk(0);
    return s;
}

function descifrarAES(entrada, clave, iv) {
    const w = expandir(clave);
    const salida = new Array(entrada.length);
    let previo = iv;
    for (let off = 0; off < entrada.length; off += 16) {
        const bloqueCifrado = entrada.slice(off, off + 16);
        const claro = bloque(bloqueCifrado, w);
        for (let i = 0; i < 16; i++) salida[off + i] = claro[i] ^ previo[i];
        previo = bloqueCifrado;
    }
    const relleno = salida[salida.length - 1];
    if (relleno >= 1 && relleno <= 16) salida.length = salida.length - relleno;
    return salida;
}

function bytesDeB64url(texto) {
    const tabla64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let s = String(texto).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const out = [];
    let bits = 0, n = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "=") break;
        const v = tabla64.indexOf(ch);
        if (v < 0) continue;
        bits = (bits << 6) | v; n += 6;
        if (n >= 8) { n -= 8; out.push((bits >> n) & 255); }
    }
    return out;
}

function textoDeBytes(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return decodeURIComponent(escape(s));
}


function claveEnBytes(texto, n) {
    const b = new Array(n);
    for (let i = 0; i < n; i++) b[i] = i < texto.length ? (texto.charCodeAt(i) & 255) : 0;
    return b;
}

function textoDeBytes(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b < 0x80) s += String.fromCharCode(b);
        else if (b > 0xbf && b < 0xe0) s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[++i] & 0x3f));
        else if (b > 0xdf && b < 0xf0) s += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f));
        else {
            const cp = ((b & 0x07) << 18) | ((bytes[++i] & 0x3f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f);
            const u = cp - 0x10000;
            s += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 0x3ff));
        }
    }
    return s;
}

function descifrarRyu(payload) {
    try {
        const bytes = descifrarAES(bytesDeB64url(payload), claveEnBytes(P.R_CLAVE, 32), claveEnBytes(P.R_VECTOR, 16));
        return JSON.parse(textoDeBytes(bytes));
    } catch (error) {
        aviso("ryu: no se pudo descifrar");
        return null;
    }
}

function cabecerasRyu() {
    const h = {};
    h["Origin"] = P.R_SITIO.slice(0, P.R_SITIO.length - 1);
    h["Referer"] = P.R_SITIO;
    h["User-Agent"] = P.UA;
    return h;
}

async function opcionesRyu(anilist, ep, audio) {
    const vacio = { streams: [], subs: [] };
    const clave = "ryu|" + anilist + "|" + ep + "|" + audio;
    if (CACHE[clave] && Date.now() - CACHE[clave].t < P.CACHE_MS) return CACHE[clave].v;
    try {
        const paginaUrl = P.R_ANIME + anilist + "/" + ep + "/" + audio;
        const h1 = cabecerasRyu();
        h1["Referer"] = P.SITE + "/";
        const pagina = await soraText(paginaUrl, h1);
        if (!pagina) { aviso("ryu:", audio, "sin pagina"); return vacio; }
        aviso("ryu:", audio, "pagina", pagina.length, "b | con data-id:", pagina.indexOf(P.R_ID) > -1);
        const id = (pagina.match(new RegExp(P.R_ID + "(\\d+)\"")) || [])[1];
        if (!id) { aviso("ryu:", audio, "sin id interno"); return vacio; }

        const h2 = cabecerasRyu();
        h2["Referer"] = paginaUrl;
        h2["Accept"] = "**";
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

