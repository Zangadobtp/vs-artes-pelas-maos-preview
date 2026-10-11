/* VS Artes pelas Mãos — comportamento do site (sem dependências) */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var CFG = window.VS_CONFIG, PEDIDOS = window.VS_PEDIDOS;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- menu mobile ---------- */
  var menuBtn = $(".menu-btn"), nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }); });
  }

  if (menuBtn && nav) {
    var closeMenu = function () { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { closeMenu(); menuBtn.focus(); } });
    document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !e.target.closest(".site-header")) closeMenu(); });
  }

  /* o botão flutuante do WhatsApp sai da frente do formulário */
  var waFloat = $(".wa-float"), formSec = $("#orcamento");
  if (waFloat && formSec && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { waFloat.classList.toggle("hide", en[0].isIntersecting); }, { threshold: 0.15 }).observe(formSec);
  }

  /* ---------- aparecer ao rolar ---------- */
  var io = null;
  if ("IntersectionObserver" in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  }
  function reveal(els) { els.forEach(function (t) { if (io) io.observe(t); else t.classList.add("in"); }); }
  reveal($$(".reveal, .fan"));
  $$(".fan .sticker").forEach(function (s, i) { s.style.setProperty("--i", i); });

  /* ---------- galeria e filtros: montados com DOM (textContent), nunca innerHTML ----------
     O texto do catálogo vem do banco e é editado no painel: tratar como não confiável. */
  var gallery = $("#gallery"), filtersBox = $(".filters"), chips = [];

  function filter(grupo, scroll) {
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.grupo === grupo)); });
    $$(".piece", gallery).forEach(function (el) {
      var show = grupo === "todos" || el.dataset.grupo === grupo;
      el.hidden = !show;
      if (show) { el.classList.remove("in"); void el.offsetWidth; el.classList.add("in"); }
    });
    if (scroll) $("#catalogo").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function renderFilters(grupos) {
    filtersBox.textContent = "";
    chips = [];
    [{ slug: "todos", nome: "Todas" }].concat(grupos).forEach(function (g, i) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.dataset.grupo = g.slug;
      b.setAttribute("aria-pressed", String(i === 0)); b.textContent = g.nome;
      b.addEventListener("click", function () { filter(g.slug); });
      filtersBox.appendChild(b); chips.push(b);
    });
  }

  function renderGallery(produtos) {
    gallery.textContent = "";
    var novos = produtos.map(function (p, i) {
      var fig = document.createElement("figure");
      fig.className = "piece reveal"; fig.dataset.grupo = p.grupo;
      fig.style.setProperty("--i", i % 3);
      var wrap = document.createElement("div");
      wrap.className = "sticker";
      wrap.style.setProperty("--tilt-hover", (((i % 3) - 1) * 0.8 || -0.8) + "deg");
      var img = document.createElement("img");
      img.src = p.src; img.alt = p.alt || p.titulo; img.loading = "lazy"; img.decoding = "async";
      wrap.appendChild(img);
      var cap = document.createElement("figcaption");
      var h3 = document.createElement("h3"); h3.textContent = p.titulo;
      var desc = document.createElement("p"); desc.textContent = p.desc;
      var btn = document.createElement("button");
      btn.className = "want"; btn.type = "button"; btn.dataset.tipo = p.tipo; btn.dataset.peca = p.titulo;
      btn.textContent = "Quero um assim \u2192";
      cap.appendChild(h3); cap.appendChild(desc); cap.appendChild(btn);
      fig.appendChild(wrap); fig.appendChild(cap);
      gallery.appendChild(fig);
      return fig;
    });
    reveal(novos);
  }

  $$("[data-filtro]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); filter(a.dataset.filtro, true); });
  });

  window.VSCatalogo.carregar().then(function (cat) {
    renderFilters(cat.grupos);
    renderGallery(cat.produtos);
    /* links do topo para categorias que não existem mais (a dona pode ocultar ou apagar) somem */
    var slugs = cat.grupos.map(function (g) { return g.slug; });
    $$(".tags a[data-filtro]").forEach(function (a) {
      if (slugs.indexOf(a.dataset.filtro) < 0) { var li = a.closest("li"); if (li) li.remove(); }
    });
  });
  /* ---------- formulário de orçamento ---------- */
  var form = $("#form-orcamento"), tipoSel = $("#tipo"), dyn = $("#dyn");
  var pecaRef = "";
  if (tipoSel) {
    tipoSel.innerHTML = '<option value="">Escolha o que você quer</option>' + Object.keys(PEDIDOS).map(function (k) {
      return '<option value="' + k + '">' + PEDIDOS[k].rotulo + "</option>";
    }).join("");
  }
  function renderCampos() {
    var def = PEDIDOS[tipoSel.value];
    dyn.innerHTML = "";
    if (!def) return;
    def.campos.forEach(function (c, i) {
      var wide = !c.tipo && (c.id === "ideia" || c.id === "itens");
      var f = document.createElement("div");
      f.className = "field" + (wide ? " wide" : "");
      f.style.animationDelay = (i * 50) + "ms";
      var inp = c.id === "ideia"
        ? '<textarea id="f_' + c.id + '" name="' + c.id + '" placeholder="' + (c.dica || "") + '"></textarea>'
        : '<input id="f_' + c.id + '" name="' + c.id + '" type="' + (c.tipo || "text") + '"' + (c.tipo === "number" ? ' min="1" inputmode="numeric"' : "") + ' placeholder="' + (c.dica || "") + '" autocomplete="off">';
      f.innerHTML = '<label for="f_' + c.id + '">' + c.rotulo + ' <span class="opt">(opcional)</span></label>' + inp;
      dyn.appendChild(f);
    });
  }
  if (tipoSel) tipoSel.addEventListener("change", function () { pecaRef = ""; clearErr(tipoSel); renderCampos(); });

  /* botões "Quero um assim" e CTAs com data-pedido */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".want, [data-pedido]");
    if (!b || !tipoSel) return;
    var tipo = b.dataset.tipo || b.dataset.pedido;
    if (tipo && PEDIDOS[tipo]) { tipoSel.value = tipo; renderCampos(); }
    pecaRef = b.dataset.peca || "";
    var target = $("#orcamento");
    if (b.tagName === "BUTTON" || b.dataset.pedido) {
      if (b.tagName === "A") e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setTimeout(function () { var first = $("#dyn input, #dyn textarea") || $("#nome"); if (first) first.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    }
  });

  function err(el, msg) {
    el.setAttribute("aria-invalid", "true");
    var holder = el.closest(".field, .check");
    var span = holder.querySelector(".err");
    if (!span) { span = document.createElement("div"); span.className = "err"; span.setAttribute("role", "alert"); holder.appendChild(span); }
    span.textContent = msg;
  }
  function clearErr(el) {
    el.removeAttribute("aria-invalid");
    var holder = el.closest(".field, .check"); var s = holder && holder.querySelector(".err"); if (s) s.remove();
  }
  ["nome", "whats", "consent"].forEach(function (id) { var el = $("#" + id); if (el) el.addEventListener("input", function () { clearErr(el); }); });

  /* origem do contato (para medir Google Ads depois) */
  var params = new URLSearchParams(location.search), origem = {};
  ["utm_source", "utm_medium", "utm_campaign", "gclid"].forEach(function (k) {
    var v = params.get(k); if (v) { try { sessionStorage.setItem("vs_" + k, v); } catch (x) {} }
    try { var s = sessionStorage.getItem("vs_" + k); if (s) origem[k] = s; } catch (x) {}
  });

  function digits(s) { return (s || "").replace(/\D/g, ""); }

  /* Turnstile (anti-robô da Cloudflare) só carrega quando a pessoa chega perto do formulário. */
  var B = window.VS_BACKEND || {}, tsWidget = null, tsToken = "", tsCarregando = false;
  function carregarTurnstile() {
    if (tsCarregando || !B.turnstileSiteKey || !B.url) return;
    tsCarregando = true;
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = function () {
      try {
        tsWidget = window.turnstile.render("#turnstile", {
          sitekey: B.turnstileSiteKey, appearance: "interaction-only",
          callback: function (tk) { tsToken = tk; },
          "expired-callback": function () { tsToken = ""; },
          "error-callback": function () { tsToken = ""; }
        });
      } catch (x) { /* sem anti-robô: o pedido ainda abre o WhatsApp */ }
    };
    document.head.appendChild(s);
  }
  if (form && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { carregarTurnstile(); ob.disconnect(); } }, { rootMargin: "400px" }).observe(form);
  } else if (form) { carregarTurnstile(); }

  function esperarToken(ms) {
    return new Promise(function (ok) {
      var t0 = Date.now();
      (function ver() { if (tsToken || Date.now() - t0 > ms) ok(tsToken); else setTimeout(ver, 150); })();
    });
  }

  function enviarPedido(corpo) {
    if (!B.url) return Promise.reject(new Error("sem servidor"));
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
    return fetch(B.url + "/functions/v1/criar-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), signal: ctl.signal })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error("http " + r.status); return r.json(); },
            function (e) { clearTimeout(t); throw e; });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      [["tipo", tipoSel.value, "Escolha o que você quer pedir."],
       ["nome", $("#nome").value.trim(), "Diga seu nome."]].forEach(function (c) {
        if (!c[1]) { err($("#" + c[0]), c[2]); ok = false; firstBad = firstBad || $("#" + c[0]); }
      });
      var w = digits($("#whats").value);
      if (w.length < 10 || w.length > 13) { err($("#whats"), "Informe o WhatsApp com DDD. Ex.: 71 99999-9999"); ok = false; firstBad = firstBad || $("#whats"); }
      if (!$("#consent").checked) { err($("#consent"), "Preciso do seu aceite para falar com você."); ok = false; firstBad = firstBad || $("#consent"); }
      if (!ok) { firstBad.focus(); return; }

      var def = PEDIDOS[tipoSel.value];
      var estado = {
        tipo: tipoSel.value, tipoRotulo: def.rotulo, nome: $("#nome").value, whatsapp: w, aceite: true,
        campos: def.campos.map(function (c) { var el = $("#f_" + c.id); return { id: c.id, rotulo: c.rotulo, valor: el ? el.value : "" }; }),
        detalhes: $("#detalhes").value, pecaRef: pecaRef, comoConheceu: $("#origem").value,
        origem: origem, pagina: location.pathname, armadilha: $("#site").value
      };
      var msg = window.VSPedido.montarMensagem(estado);

      /* A tela de WhatsApp aparece na hora; o registro no sistema acontece em paralelo. */
      var status = $("#status-envio");
      status.textContent = "Registrando o seu pedido…";
      $("#preview").textContent = msg;
      $("#wa-open").href = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg);
      form.hidden = true;
      var done = $("#done"); done.classList.add("show"); done.setAttribute("tabindex", "-1"); done.focus();

      (B.url ? esperarToken(5000) : Promise.reject(new Error("sem servidor"))).then(function (tk) {
        estado.turnstile = tk;
        return enviarPedido(window.VSPedido.montarCorpo(estado));
      }).then(function () {
        status.textContent = "Pedido registrado. Agora é só enviar a mensagem no WhatsApp.";
        if (window.VSMarketing) window.VSMarketing.converter("pedido");
      }).catch(function () {
        /* reserva: guarda neste aparelho e segue; a Viviane recebe pelo WhatsApp do mesmo jeito */
        try { var all = JSON.parse(localStorage.getItem("vs_leads_pendentes") || "[]"); all.push({ criado_em: new Date().toISOString(), tipo: estado.tipo, nome: estado.nome.trim(), mensagem: msg }); localStorage.setItem("vs_leads_pendentes", JSON.stringify(all.slice(-20))); } catch (x) {}
        status.textContent = B.preview
          ? "Prévia: nada foi registrado de verdade. No site publicado, o pedido é guardado no sistema da Viviane."
          : "Não consegui registrar agora, mas é só enviar a mensagem no WhatsApp que a Viviane recebe do mesmo jeito.";
      }).then(function () {
        tsToken = "";
        try { if (window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget); } catch (x) {}
      });
    });
    $("#novo-pedido").addEventListener("click", function () {
      $("#done").classList.remove("show"); form.hidden = false; form.reset(); dyn.innerHTML = ""; pecaRef = ""; $("#tipo").focus();
    });
  }
  /* ---------- linha de costura que acompanha a rolagem (só telas largas) ---------- */
  var svg = $(".stitch-line");
  if (svg && !reduce) {
    var path = $("#stitch-path"), maskPath = $("#stitch-mask-path"), main = $("main");
    var total = 0;
    var build = function () {
      var W = main.clientWidth, H = main.clientHeight;
      if (W < 1320) { svg.style.display = "none"; return; }
      svg.style.display = "";
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      /* uma costura em ondas suaves na margem esquerda, fora do conteúdo */
      var gut = (W - 1180) / 2 - 40, amp = 11, step = 220, pts = [];
      for (var y = 100, k0 = 0; y < H - 80; y += step, k0++) pts.push([gut + (k0 % 2 ? amp : -amp), y]);
      var d = "M" + gut + " 40";
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k], prev = k ? pts[k - 1] : [gut, 40], half = (p[1] - prev[1]) / 2;
        d += " C" + prev[0] + " " + (prev[1] + half) + " " + p[0] + " " + (p[1] - half) + " " + p[0] + " " + p[1];
      }
      d += " L" + gut + " " + (H - 40);
      path.setAttribute("d", d); maskPath.setAttribute("d", d);
      total = maskPath.getTotalLength();
      maskPath.style.strokeDasharray = total;
      update();
    };
    var update = function () {
      if (!total) return;
      var r = main.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
      maskPath.style.strokeDashoffset = total * (1 - prog);
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", build);
    window.addEventListener("load", build);
    build();
  }

  /* Google Ads: só liga com a tag configurada e o aceite do visitante */
  if (window.VSMarketing) {
    window.VSMarketing.init();
    document.addEventListener("click", function (e) { if (e.target.closest("#wa-open, [data-wa], .wa-float")) window.VSMarketing.converter("whatsapp"); });
  }

  /* ano no rodapé */
  var y = $("#ano"); if (y) y.textContent = new Date().getFullYear();
  /* links de WhatsApp genéricos */
  $$("[data-wa]").forEach(function (a) {
    a.href = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent("Olá, Viviane! Vim pelo site e queria conversar sobre um pedido.");
  });
})();
