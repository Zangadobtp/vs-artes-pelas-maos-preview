/* Google Ads: medição de conversões, só com o consentimento do visitante (LGPD).
   Desligado por padrão: sem tagId em config.js, nada carrega, nada é gravado e nenhum aviso aparece.
   Para ligar, veja docs/deploy.md (seção Google Ads). */
(function (root) {
  "use strict";
  var cfg = (root.VS_BACKEND && root.VS_BACKEND.googleAds) || {};
  var CHAVE = "vs_consent_v1";

  /* Formatos estritos: o valor entra numa URL de script, então nada de texto livre. */
  function tagValida(v) { return typeof v === "string" && /^(AW|G|GT)-[A-Za-z0-9]{6,20}$/.test(v); }
  function conversaoValida(v) { return typeof v === "string" && /^AW-[0-9]{6,15}\/[A-Za-z0-9_-]{6,40}$/.test(v); }
  function ativo() { return tagValida(cfg.tagId); }

  function ler() { try { return root.localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { root.localStorage.setItem(CHAVE, v); } catch (e) { /* sem armazenamento: pergunta de novo na próxima visita */ } }

  var carregado = false;
  function carregarGtag() {
    if (carregado || !ativo() || typeof document === "undefined") return;
    carregado = true;
    root.dataLayer = root.dataLayer || [];
    root.gtag = function () { root.dataLayer.push(arguments); };
    root.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
    root.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    root.gtag("js", new Date());
    root.gtag("config", cfg.tagId);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.tagId);
    document.head.appendChild(s);
  }

  /* "pedido" = pedido registrado no sistema; "whatsapp" = clique para abrir o WhatsApp. */
  function converter(tipo) {
    if (!ativo() || ler() !== "aceito" || typeof root.gtag !== "function") return;
    var rotulo = tipo === "pedido" ? cfg.conversaoPedido : tipo === "whatsapp" ? cfg.conversaoWhatsapp : null;
    if (!conversaoValida(rotulo)) return;
    root.gtag("event", "conversion", { send_to: rotulo });
  }

  function fecharAviso() { var el = document.getElementById("aviso-cookies"); if (el) el.remove(); }

  function mostrarAviso() {
    if (document.getElementById("aviso-cookies")) return;
    var caixa = document.createElement("div");
    caixa.id = "aviso-cookies"; caixa.setAttribute("role", "region"); caixa.setAttribute("aria-label", "Aviso de cookies");
    var p = document.createElement("p");
    p.textContent = "Usamos cookies do Google Ads só se você aceitar, para medir se nossos anúncios trazem pedidos. O site funciona igual sem eles. ";
    var a = document.createElement("a");
    a.href = "privacidade.html"; a.textContent = "Política de privacidade"; a.target = "_blank"; a.rel = "noopener";
    p.appendChild(a);
    var botoes = document.createElement("div");
    botoes.className = "cookies-botoes";
    var recusar = document.createElement("button");
    recusar.type = "button"; recusar.className = "btn btn--ghost"; recusar.textContent = "Recusar";
    recusar.addEventListener("click", function () { gravar("recusado"); fecharAviso(); });
    var aceitar = document.createElement("button");
    aceitar.type = "button"; aceitar.className = "btn"; aceitar.textContent = "Aceitar";
    aceitar.addEventListener("click", function () { gravar("aceito"); fecharAviso(); carregarGtag(); });
    botoes.appendChild(recusar); botoes.appendChild(aceitar);
    caixa.appendChild(p); caixa.appendChild(botoes);
    document.body.appendChild(caixa);
  }

  function reabrir() { if (ativo()) mostrarAviso(); }

  function init() {
    var prefs = document.getElementById("cookie-prefs");
    if (!ativo()) { if (prefs) prefs.hidden = true; return; }
    if (prefs) { prefs.hidden = false; prefs.addEventListener("click", reabrir); }
    var c = ler();
    if (c === "aceito") carregarGtag();
    else if (c !== "recusado") mostrarAviso();
  }

  root.VSMarketing = { init: init, ativo: ativo, converter: converter, reabrir: reabrir, _puro: { tagValida: tagValida, conversaoValida: conversaoValida } };
})(window);
