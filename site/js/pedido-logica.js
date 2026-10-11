/* Regras do pedido sem DOM e sem rede (testadas em tests/pedido-logica.test.mjs).
   A mensagem aqui deve ser idêntica à que o servidor monta (supabase/functions/criar-lead/validar.ts):
   o teste compara as duas para todos os tipos de pedido. */
(function (root) {
  "use strict";

  function texto(v) { return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim() : ""; }

  function montarMensagem(p) {
    var linhas = ["Olá, Viviane! Vim pelo site e quero um orçamento.", "", "*Pedido:* " + p.tipoRotulo];
    if (texto(p.pecaRef)) linhas.push("*Peça que gostei:* " + texto(p.pecaRef));
    (p.campos || []).forEach(function (c) {
      var v = texto(c.valor);
      if (v) linhas.push("*" + c.rotulo + ":* " + v);
    });
    if (texto(p.detalhes)) linhas.push("*Detalhes:* " + texto(p.detalhes));
    linhas.push("", "Meu nome é " + texto(p.nome) + ".");
    return linhas.join("\n");
  }

  /* Corpo enviado à função "criar-lead". Sem mensagem pronta: o servidor remonta a sua. */
  function montarCorpo(e) {
    var campos = {}, rotulos = {};
    (e.campos || []).forEach(function (c) { var v = texto(c.valor); if (v) { campos[c.id] = v; rotulos[c.id] = c.rotulo; } });
    return {
      tipo: e.tipo,
      nome: texto(e.nome),
      whatsapp: String(e.whatsapp || ""),
      aceite: e.aceite === true,
      campos: campos,
      rotulos: rotulos,
      detalhes: texto(e.detalhes),
      peca_ref: texto(e.pecaRef),
      como_conheceu: texto(e.comoConheceu),
      origem: e.origem || {},
      pagina: e.pagina || "",
      site: e.armadilha || "",
      turnstile: e.turnstile || ""
    };
  }

  root.VSPedido = { montarMensagem: montarMensagem, montarCorpo: montarCorpo };
})(typeof window !== "undefined" ? window : globalThis);
