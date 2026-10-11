/* Catálogo do site: lê do banco (só o que está publicado) e, se falhar ou vier vazio,
   usa o catálogo fixo de data.js. O site nunca fica sem produtos. */
(function (root) {
  "use strict";
  var B = root.VS_BACKEND;

  function pegar(caminho, ms) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms) : null;
    return fetch(B.url + "/rest/v1/" + caminho, { headers: { apikey: B.anonKey, Accept: "application/json" }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (j) { if (t) clearTimeout(t); return j; }, function (e) { if (t) clearTimeout(t); throw e; });
  }

  function reserva() {
    var grupos = Object.keys(root.VS_GRUPOS).map(function (slug) { return { slug: slug, nome: root.VS_GRUPOS[slug] }; });
    var produtos = root.VS_PRODUTOS.filter(function (p) { return !p.hero; }).map(function (p) {
      return { grupo: p.grupo, tipo: p.tipo, titulo: p.titulo, desc: p.desc, src: "assets/fotos/" + p.img + ".jpg", alt: p.alt };
    });
    return { grupos: grupos, produtos: produtos, origem: "reserva" };
  }

  function carregar() {
    if (!B || !B.url) return Promise.resolve(reserva());
    return Promise.all([
      pegar("categorias?select=slug,nome&visivel=eq.true&order=ordem.asc", 5000),
      pegar("produtos?select=titulo,descricao,imagem_path,alt,tipo_pedido,categorias(slug)&publicado=eq.true&order=ordem.asc", 5000)
    ]).then(function (r) {
      var grupos = r[0], produtos = r[1];
      if (!Array.isArray(grupos) || !Array.isArray(produtos) || !grupos.length || !produtos.length) return reserva();
      return {
        grupos: grupos,
        produtos: produtos.filter(function (p) { return p.categorias && p.categorias.slug; }).map(function (p) {
          return {
            grupo: p.categorias.slug, tipo: p.tipo_pedido, titulo: p.titulo, desc: p.descricao || "",
            src: B.url + "/storage/v1/object/public/catalogo/" + p.imagem_path, alt: p.alt || p.titulo
          };
        }),
        origem: "banco"
      };
    }).catch(function () { return reserva(); });
  }

  root.VSCatalogo = { carregar: carregar };
})(window);
