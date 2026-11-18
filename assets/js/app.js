/* Minalie storefront: không cần build, mở trực tiếp hoặc đặt lên bất kỳ nơi lưu trữ web tĩnh nào. */
(function () {
  "use strict";
  var C = window.CONFIG, P = window.PRODUCTS, COLS = window.COLLECTIONS, GROUPS = window.GROUPS, STOCK = window.STOCK;

  /* ---------- tiện ích ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫"; };
  var params = new URLSearchParams(location.search);
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };
  // Thông tin khách của đơn vừa đặt chỉ sống trong tab hiện tại (đóng tab là mất), không lưu lâu dài trong trình duyệt.
  var sstore = {
    get: function (k, d) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };
  try { localStorage.removeItem("mn_last_order"); } catch (e) { /* bản cũ lưu đơn lâu dài: xóa đi */ }
  var byId = function (id) { return P.filter(function (p) { return p.id === id; })[0]; };
  var colorByCode = function (code) { for (var i = 0; i < P.length; i++) for (var j = 0; j < P[i].colors.length; j++) if (P[i].colors[j].code === code) return { p: P[i], c: P[i].colors[j] }; return null; };
  var earlyActive = function () { return new Date() <= new Date(C.earlyDeadline); };
  var preorderActive = function () { return new Date() < new Date(C.launchAt); };
  var isPre = function (p) { return !!(p.preorder && preorderActive()); };

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- tồn kho và giá ---------- */
  function stockOf(code, size) { var n = (STOCK[code] && STOCK[code][size]) || 0; return Math.min(n, C.stockCap || 5); }
  function avail(p, mode, color, size) {
    if (mode.id === "bo") return Math.min(stockOf(color.code, size), stockOf(color.pairCode, size));
    return stockOf(color.code, size);
  }
  function soldOutAll(p, mode) {
    return p.colors.every(function (c) { return p.sizes.every(function (s) { return avail(p, mode, c, s) <= 0; }); });
  }
  function priceFor(mode, colorId) {
    var v = mode.priceByColor ? mode.priceByColor[colorId] : mode.price;
    if (typeof v === "number") return { now: v };
    return earlyActive() ? { now: v.early, was: v.late } : { now: v.late };
  }
  function priceHtml(pr) { return '<div class="price"><span class="now">' + fmt(pr.now) + "</span>" + (pr.was ? '<span class="was">' + fmt(pr.was) + "</span>" : "") + "</div>"; }
  function firstImage(p) { for (var i = 0; i < p.colors.length; i++) if (p.colors[i].images && p.colors[i].images.length) return p.colors[i].images[0]; return ""; }
  function placeholder(name) { return '<div class="ph" role="img" aria-label="' + esc(name || "Ảnh") + ', ảnh sắp có"><svg class="ph-art" viewBox="0 0 120 160" aria-hidden="true"><path d="M44 8c4 10 28 10 32 0l22 16-10 24-12-6v104H44V42l-12 6L22 24z"/></svg><div class="mono">M</div>' + (name ? '<div class="cap">' + esc(name) + "</div>" : "") + '<div class="cap soon">Ảnh sắp có</div></div>'; }

  /* ---------- giỏ hàng, yêu thích ---------- */
  var cart = store.get("mn_cart", []);
  var wish = store.get("mn_wish", []);
  function saveCart() { store.set("mn_cart", cart); updateBadges(); }
  function lineKey(l) { return [l.pid, l.mode, l.color, l.size].join("|"); }
  function lineInfo(l) {
    var p = byId(l.pid); if (!p) return null;
    var mode = p.modes.filter(function (m) { return m.id === l.mode; })[0]; var color = p.colors.filter(function (c) { return c.id === l.color; })[0];
    if (!mode || !color) return null;
    return { p: p, mode: mode, color: color, price: priceFor(mode, color.id), max: avail(p, mode, color, l.size) };
  }
  function rowsFor(l) {
    var i = lineInfo(l), rows = [];
    var name = function (p, c) { return p.name + " - " + c.name; };
    if (i.mode.id === "bo") {
      rows.push({ code: i.color.code, name: name(i.p, i.color), size: l.size, qty: l.qty, note: "Bộ: áo" });
      var pr = colorByCode(i.color.pairCode);
      rows.push({ code: i.color.pairCode, name: pr ? name(pr.p, pr.c) : i.color.pairName, size: l.size, qty: l.qty, note: "Bộ: quần" });
    } else {
      var note = i.mode.id === "ao" && i.p.id === "marine-set" ? "Chỉ áo" : i.mode.id === "quan" && i.p.id === "marine-set" ? "Chỉ quần" : "";
      rows.push({ code: i.color.code, name: name(i.p, i.color), size: l.size, qty: l.qty, note: note });
    }
    return rows;
  }
  function totals(payment) {
    var sub = 0;
    cart.forEach(function (l) { var i = lineInfo(l); if (i) sub += i.price.now * l.qty; });
    var ship = sub === 0 ? 0 : (sub >= C.freeShipFrom || payment === "bank") ? 0 : C.shipFee;
    return { sub: sub, ship: ship, total: sub + ship };
  }
  function limitMsg(max, size) {
    return max >= (C.stockCap || 5)
      ? "Mỗi lần đặt tối đa " + max + " sản phẩm mỗi size. Cần số lượng lớn hơn, vui lòng nhắn Zalo " + C.hotline + "."
      : "Chỉ còn " + max + " sản phẩm size " + size + ".";
  }
  function addToCart(l) {
    var i = lineInfo(l); var ex = cart.filter(function (x) { return lineKey(x) === lineKey(l); })[0];
    var q = (ex ? ex.qty : 0) + l.qty;
    if (q > i.max) { toast(limitMsg(i.max, l.size)); return false; }
    if (ex) ex.qty = q; else cart.push(l);
    saveCart(); return true;
  }
  function updateBadges() {
    var n = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    var b = $("#cart-count"); if (b) { b.textContent = n; b.style.display = n ? "grid" : "none"; }
    var w = $("#wish-count"); if (w) { w.textContent = wish.length; w.style.display = wish.length ? "grid" : "none"; }
  }
  function toggleWish(pid) {
    var i = wish.indexOf(pid); if (i >= 0) wish.splice(i, 1); else wish.push(pid);
    store.set("mn_wish", wish); updateBadges();
  }

  /* ---------- danh sách thẻ sản phẩm ---------- */
  function listEntries(kind) {
    var out = [];
    if (kind === "moi-nhat") {
      P.forEach(function (p) { if (p.isNew) out.push({ p: p, m: p.modes[0] }); });
    } else if (kind === "yeu-thich") {
      P.forEach(function (p) { if (wish.indexOf(p.id) >= 0) out.push({ p: p, m: p.modes[0] }); });
    } else if (GROUPS[kind]) {
      P.forEach(function (p) { p.modes.forEach(function (m) { if ((m.groups || []).indexOf(kind) >= 0) out.push({ p: p, m: m }); }); });
    } else if (kind && kind.indexOf("c:") === 0) {
      P.forEach(function (p) { if (p.collection === kind.slice(2)) out.push({ p: p, m: p.modes[0] }); });
    } else {
      P.forEach(function (p) { out.push({ p: p, m: p.modes[0] }); });
    }
    return out;
  }
  function card(e) {
    var p = e.p, m = e.m, img = firstImage(p), pr = priceFor(m, p.colors[0].id);
    var name = p.name + (m.suffix ? " – " + m.suffix : "");
    var tag = isPre(p) ? '<span class="tag rose">Đặt trước</span>' : p.isNew ? '<span class="tag">Mới</span>' : "";
    var dots = p.colors.map(function (c) { return '<span class="dot" title="' + esc(c.name) + '" style="background:' + c.hex + '"></span>'; }).join("");
    var out = soldOutAll(p, m) ? '<div class="soldall">Hết hàng</div>' : "";
    return '<article class="card"><a class="pic-link" href="san-pham.html?id=' + p.id + "&mode=" + m.id + '" aria-label="' + esc(name) + '" tabindex="-1"><div class="img">' +
      (img ? '<img loading="lazy" src="' + img + '" alt="' + esc(name) + '">' : placeholder(p.name)) + tag + out + "</div></a>" +
      '<button class="heart' + (wish.indexOf(p.id) >= 0 ? " on" : "") + '" data-wish="' + p.id + '" aria-label="Yêu thích ' + esc(p.name) + '"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg></button>' +
      '<div class="meta"><a class="name" href="san-pham.html?id=' + p.id + "&mode=" + m.id + '">' + esc(name) + "</a>" + priceHtml(pr) + '<div class="dots">' + dots + "</div></div></article>";
  }
  function gridHtml(list, cls) { return list.length ? '<div class="grid-products' + (cls ? " " + cls : "") + '">' + list.map(card).join("") + "</div>" : '<p class="empty">Chưa có sản phẩm trong mục này.</p>'; }
  function secHead(num, title, href, label) { return '<div class="sh" data-rv><span class="num" aria-hidden="true">' + num + "</span><h2>" + title + "</h2>" + (href ? '<a class="more" href="' + href + '">' + (label || "Xem tất cả") + "</a>" : "") + "</div>"; }
  function marquee(a, b) {
    var seg = function (arr) { var one = arr.map(function (t) { return "<span>" + t + '</span><i>✦</i>'; }).join(""); return '<div class="mq-track"><div class="mq-seq">' + one + one + '</div><div class="mq-seq">' + one + one + "</div></div>"; };
    return '<section class="mq" aria-hidden="true"><div class="mq-row">' + seg(a) + '</div><div class="mq-row rev">' + seg(b) + "</div></section>";
  }

  /* ---------- khung trang ---------- */
  var ICON = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  var NAV = [
    { t: "Mới nhất", h: "moi-nhat.html" },
    { t: "Bộ sưu tập", h: "bo-suu-tap.html" },
    { t: "Trang phục", h: "danh-muc.html", sub: [["Tất cả", "danh-muc.html"], ["Áo", "danh-muc.html?nhom=ao"], ["Váy", "danh-muc.html?nhom=vay"], ["Quần", "danh-muc.html?nhom=quan"], ["Set", "danh-muc.html?nhom=set"]] },
    { t: "Giới thiệu", h: "gioi-thieu.html" },
    { t: "Liên hệ", h: "lien-he.html" }
  ];
  function renderChrome() {
    var nav = NAV.map(function (n) {
      if (!n.sub) return '<a href="' + n.h + '">' + n.t + "</a>";
      return '<div class="has-sub"><a href="' + n.h + '">' + n.t + '</a><div class="sub">' + n.sub.map(function (s) { return '<a href="' + s[1] + '">' + s[0] + "</a>"; }).join("") + "</div></div>";
    }).join("");
    var drawer = NAV.map(function (n) {
      if (!n.sub) return '<a href="' + n.h + '">' + n.t + "</a>";
      return "<details><summary>" + n.t + "</summary>" + n.sub.map(function (s) { return '<a href="' + s[1] + '">' + s[0] + "</a>"; }).join("") + "</details>";
    }).join("");
    $("#site-header").innerHTML =
      '<div class="announce">Miễn phí vận chuyển cho đơn từ ' + fmt(C.freeShipFrom) + " và đơn chuyển khoản · Đổi hàng trong 3 ngày</div>" +
      '<header class="header"><div class="bar"><div class="left"><button class="icon-btn menu-btn" id="open-menu" aria-label="Mở menu">' + ICON.menu + '</button><nav class="nav" aria-label="Chính">' + nav + '</nav></div>' +
      '<a class="logo" href="index.html" aria-label="Minalie, về trang chủ">Minalie</a>' +
      '<div class="right"><button class="icon-btn" id="open-search" aria-label="Tìm kiếm">' + ICON.search + '</button>' +
      '<a class="icon-btn" href="danh-muc.html?nhom=yeu-thich" aria-label="Yêu thích">' + ICON.heart + '<span class="badge" id="wish-count" style="display:none">0</span></a>' +
      '<a class="icon-btn" href="gio-hang.html" aria-label="Giỏ hàng">' + ICON.bag + '<span class="badge" id="cart-count" style="display:none">0</span></a></div></div></header>' +
      '<div class="scrim" id="scrim"></div><aside class="drawer" id="drawer" aria-label="Menu"><button class="icon-btn close" id="close-menu" aria-label="Đóng menu">' + ICON.close + "</button><div style=\"height:44px\"></div>" + drawer + "</aside>" +
      '<div class="search-panel" id="search-panel" role="dialog" aria-label="Tìm kiếm"><div class="field"><input id="search-input" type="search" placeholder="Tìm sản phẩm" autocomplete="off"><button class="icon-btn" id="close-search" aria-label="Đóng tìm kiếm">' + ICON.close + '</button></div><div class="results" id="search-results"></div></div>';
    $("#site-footer").innerHTML =
      '<footer class="footer"><div class="wrap"><div class="cols"><div><div class="flogo">Minalie</div><p>' + esc(C.slogan) + " " + esc(C.sloganVi) + '</p><p style="font-size:14px">Thời trang nữ thiết kế cho người làm việc bằng tri thức.</p></div>' +
      '<div><h4>Khám phá</h4><a href="moi-nhat.html">Mới nhất</a><a href="bo-suu-tap.html">Bộ sưu tập</a><a href="danh-muc.html">Trang phục</a><a href="gioi-thieu.html">Giới thiệu</a></div>' +
      '<div><h4>Hỗ trợ</h4><a href="doi-tra.html">Đổi hàng, giao hàng và thanh toán</a><a href="chinh-sach-bao-mat.html">Chính sách bảo mật</a><a href="lien-he.html">Liên hệ</a><a href="gio-hang.html">Giỏ hàng</a></div>' +
      '<div><h4>Liên hệ</h4><a href="' + C.hotlineHref + '">Hotline: ' + C.hotline + '</a><a href="' + C.zalo + '" target="_blank" rel="noopener">Zalo: ' + C.hotline + '</a><a href="mailto:' + C.email + '">' + C.email + "</a><span style=\"font-size:14.5px;display:block;padding:4px 0\">" + C.address + '</span><a href="' + C.fanpage + '" target="_blank" rel="noopener">Facebook</a><a href="' + C.instagram + '" target="_blank" rel="noopener">Instagram</a><a href="' + C.shopee + '" target="_blank" rel="noopener">Shopee</a></div></div>' +
      '<div class="fword" aria-hidden="true">Minalie</div><div class="legal">© ' + new Date().getFullYear() + " Minalie. Bảo lưu mọi quyền.</div></div></footer>" +
      '<a class="zalo" href="' + C.zalo + '" target="_blank" rel="noopener" aria-label="Nhắn Zalo">Zalo</a><div class="toast" id="toast" role="status" aria-live="polite"></div><div class="modal" id="modal" role="dialog" aria-modal="true"><div class="box"><button class="x" id="modal-x" aria-label="Đóng">×</button><div id="modal-body"></div></div></div>';

    var open = function (id, on) { $(id).classList[on ? "add" : "remove"]("open"); };
    $("#open-menu").onclick = function () { open("#drawer", true); open("#scrim", true); };
    var closeAll = function () { open("#drawer", false); open("#scrim", false); open("#search-panel", false); };
    $("#close-menu").onclick = closeAll; $("#scrim").onclick = closeAll;
    $("#open-search").onclick = function () { open("#search-panel", true); open("#scrim", true); $("#search-input").focus(); };
    $("#close-search").onclick = closeAll;
    $("#search-input").addEventListener("input", function (e) {
      var q = e.target.value.trim().toLowerCase(); var box = $("#search-results");
      if (!q) { box.innerHTML = ""; return; }
      var res = P.filter(function (p) { return (p.name + " " + p.summary).toLowerCase().indexOf(q) >= 0; }).map(function (p) { return { p: p, m: p.modes[0] }; });
      box.innerHTML = res.length ? gridHtml(res) : '<p class="empty">Không tìm thấy sản phẩm phù hợp.</p>';
    });
    $("#modal-x").onclick = closeModal; $("#modal").addEventListener("click", function (e) { if (e.target.id === "modal") closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(); closeModal(); } });
    document.addEventListener("click", function (e) {
      var h = e.target.closest("[data-wish]");
      if (h) { e.preventDefault(); toggleWish(h.getAttribute("data-wish")); h.classList.toggle("on"); }
    });
    updateBadges();
  }
  function openModal(html) { $("#modal-body").innerHTML = html; $("#modal").classList.add("open"); }
  function closeModal() { $("#modal").classList.remove("open"); }

  var app = function () { return $("#app"); };
  function setTitle(t, d) {
    document.title = t ? t + " | Minalie" : "Minalie | Elegance in Ease";
    var m = $('meta[name="description"]'); if (m && d) m.setAttribute("content", d);
  }
  function crumbs(items) { return '<div class="crumbs wrap"><a href="index.html">Trang chủ</a>' + items.map(function (i) { return "<span>›</span>" + (i[1] ? '<a href="' + i[1] + '">' + esc(i[0]) + "</a>" : esc(i[0])); }).join("") + "</div>"; }

  /* ---------- trang chủ ---------- */
  function pageHome() {
    setTitle("", "Minalie: Elegance in Ease, thanh lịch trong sự thoải mái. Thời trang nữ thiết kế. Elise Dress, Marine Set, áo dài Nhiên.");
    var feat = byId("elise-dress"), mar = byId("marine-set");
    var tiles = COLS.map(function (c, i) {
      var p = P.filter(function (x) { return x.collection === c.id; })[0]; var img = p ? firstImage(p) : "";
      return '<a class="tile t' + (i + 1) + (img ? "" : " noimg") + '" href="bo-suu-tap.html?c=' + c.id + '"><div class="bg">' + (img ? '<img loading="lazy" src="' + img + '" alt="">' : '<span class="big-m" aria-hidden="true">M</span>') + '</div><div class="over"><span class="tno" aria-hidden="true">0' + (i + 1) + "</span><h3>" + esc(c.name) + "</h3><p>" + esc(c.blurb) + "</p></div></a>";
    }).join("");
    var perks = [["Giao toàn quốc", "Dự kiến 3 – 5 ngày qua Shopee Express."], ["Miễn phí vận chuyển", "Đơn từ " + fmt(C.freeShipFrom) + " hoặc đơn chuyển khoản."], ["Đổi hàng 3 ngày", "Đổi màu hoặc size, đổi 1:1 nếu lỗi sản xuất."], ["Tư vấn size", "Theo chiều cao và cân nặng, có bảng số đo từng mẫu."]];
    app().innerHTML =
      '<section class="hero"><div class="wrap hero-in"><p class="kick"><span>Minalie</span><span>Bộ sưu tập mới</span><span>2026</span></p>' +
      '<h1><span class="ln a">Elegance</span><span class="ln b">in</span><span class="ln c"><em>Ease.</em></span></h1>' +
      '<div class="hero-pics"><figure class="p1"><img src="' + firstImage(feat) + '" alt="Elise Dress màu trắng kem"></figure><figure class="p2" data-par="-0.06"><img src="' + firstImage(mar) + '" alt="Marine Set màu xanh than"></figure><div class="stamp" aria-hidden="true"><span>Elise<br>Dress</span></div></div>' +
      '<div class="hero-copy"><p class="sub-vi">Thanh lịch trong sự thoải mái.</p><p class="lead">Thời trang nữ thiết kế cho người làm việc bằng tri thức: thoải mái khi ngồi nhiều giờ, chỉn chu khi bước vào lớp học, phòng họp hay màn hình cuộc gọi.</p><div class="actions"><a class="btn" href="moi-nhat.html">Khám phá mới nhất</a><a class="btn ghost" href="gioi-thieu.html">Về Minalie</a></div></div></div></section>' +
      marquee(["Elegance in Ease", "Thoải mái", "Chỉn chu", "Ứng dụng"], ["Tự tin", "Động lực", "Trí tuệ", "Thẩm mỹ"]) +
      '<section class="sec"><div class="wrap">' + secHead("01", "Mới ra mắt", "moi-nhat.html") + gridHtml(listEntries("moi-nhat"), "rail") + "</div></section>" +
      '<section class="words"><div class="wrap"><span class="eyebrow">Minalie thiết kế gì?</span><div class="big"><span data-rv><b>Timeless designs.</b><small>Thiết kế vượt thời gian</small></span><span data-rv><b>Thoughtful details.</b><small>Chi tiết tinh tế</small></span><span data-rv><b>Everyday comfort.</b><small>Thoải mái mỗi ngày</small></span></div><div class="words-foot" data-rv><p>Chất liệu ít nhăn, thoáng mát, giữ dáng. Phom suông nhẹ, dễ phối với những món đã có trong tủ đồ.</p><a class="btn" href="gioi-thieu.html">Đọc triết lý thiết kế</a></div></div></section>' +
      '<section class="sec dark"><div class="wrap">' + secHead("02", "Bộ sưu tập", "bo-suu-tap.html") + '<div class="tiles">' + tiles + "</div></div></section>" +
      '<section class="sec"><div class="wrap">' + secHead("03", "Cam kết mua sắm") + '<div class="perks">' + perks.map(function (k, i) { return '<div class="perk" data-rv><span class="pn" aria-hidden="true">0' + (i + 1) + "</span><b>" + k[0] + "</b>" + k[1] + "</div>"; }).join("") + "</div></div></section>";
  }

  /* ---------- danh mục, bộ sưu tập ---------- */
  function pageCategory(kind, title) {
    kind = kind || params.get("nhom") || "";
    var name = title || (kind === "yeu-thich" ? "Yêu thích" : GROUPS[kind] || "Trang phục");
    setTitle(name, "Minalie: " + name);
    var list = listEntries(kind);
    var sub = kind ? "" : '<div class="chips" style="margin:12px 0 0">' + ["ao", "vay", "quan", "set"].map(function (g) { return '<a class="chip swatch" href="danh-muc.html?nhom=' + g + '">' + GROUPS[g] + "</a>"; }).join("") + "</div>";
    app().innerHTML = crumbs([["Trang phục", kind && kind !== "yeu-thich" && kind !== "moi-nhat" ? "danh-muc.html" : ""]].concat(kind && kind !== "moi-nhat" ? [[name, ""]] : [])) +
      '<div class="wrap"><div class="page-head"><span class="eyebrow">Minalie · Trang phục</span><h1>' + esc(name) + '</h1><p class="count">' + list.length + " sản phẩm</p>" + (kind === "moi-nhat" ? "" : sub) + "</div>" + gridHtml(list) + '<div style="height:64px"></div></div>';
  }
  function pageNew() { pageCategory("moi-nhat", "Mới nhất"); }
  function pageCollections() {
    var c = params.get("c");
    if (c) {
      var col = COLS.filter(function (x) { return x.id === c; })[0] || COLS[0];
      setTitle(col.name, col.blurb);
      app().innerHTML = crumbs([["Bộ sưu tập", "bo-suu-tap.html"], [col.name, ""]]) + '<div class="wrap"><div class="page-head"><span class="eyebrow">Bộ sưu tập</span><h1>' + esc(col.name) + '</h1><p class="count">' + esc(col.blurb) + "</p></div>" + gridHtml(listEntries("c:" + col.id)) + '<div style="height:64px"></div></div>';
      return;
    }
    setTitle("Bộ sưu tập", "Các bộ sưu tập của Minalie");
    var tiles = COLS.map(function (cc, i) {
      var p = P.filter(function (x) { return x.collection === cc.id; })[0]; var img = p ? firstImage(p) : "";
      return '<a class="tile t' + (i + 1) + (img ? "" : " noimg") + '" href="bo-suu-tap.html?c=' + cc.id + '"><div class="bg">' + (img ? '<img loading="lazy" src="' + img + '" alt="">' : '<span class="big-m" aria-hidden="true">M</span>') + '</div><div class="over"><span class="tno" aria-hidden="true">0' + (i + 1) + '</span><h3>' + esc(cc.name) + "</h3><p>" + esc(cc.blurb) + "</p></div></a>";
    }).join("");
    app().innerHTML = crumbs([["Bộ sưu tập", ""]]) + '<div class="wrap"><div class="page-head"><span class="eyebrow">Minalie</span><h1>Bộ sưu tập</h1></div><div class="tiles big">' + tiles + '</div><div style="height:64px"></div></div>';
  }

  /* ---------- chi tiết sản phẩm ---------- */
  var S = {};
  function pagePDP() {
    var p = byId(params.get("id")) || P[0];
    var mode = p.modes.filter(function (m) { return m.id === params.get("mode"); })[0] || p.modes[0];
    var color = p.colors.filter(function (c) { return c.id === params.get("color"); })[0] || p.colors[0];
    S = { p: p, mode: mode, color: color, size: "", img: 0, qty: 1 };
    setTitle(p.name, p.summary);
    renderPDP();
  }
  function sizeTables(g) {
    var tbl = function (head, rows) {
      return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return i === 0 ? "<th>" + esc(c) + "</th>" : "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    };
    var h = "";
    if (g.type === "weight") {
      h += "<h4>Gợi ý chọn size</h4>" + tbl(g.fitHead, g.fit) + "<h4>Số đo sản phẩm (cm)</h4>" + tbl(g.measureHead, g.measures);
      h += "<h4>Độ dài theo chiều cao</h4><ul>" + g.lengths.map(function (l) { return "<li>" + esc(l[0]) + ": " + esc(l[1]) + "</li>"; }).join("") + "</ul>";
    } else if (g.type === "table") {
      h += g.tables.map(function (t) { return "<h4>" + esc(t.title) + "</h4>" + tbl(t.head, t.rows); }).join("");
    }
    return h + '<p style="color:var(--muted);font-size:13.5px">' + esc(g.note) + "</p>";
  }
  function recommend(p, h, w) {
    var g = p.sizeGuide; if (g.type !== "weight" || !w) return "Vui lòng nhập cân nặng.";
    var rec = ""; g.weightBreaks.forEach(function (b) { if (w >= b[1] && w < b[2]) rec = b[0]; });
    if (w < g.weightRange[0] - 2 || w > g.weightRange[1] + 2) return "Số đo nằm ngoài bảng gợi ý. Vui lòng nhắn Zalo " + C.hotline + " để được tư vấn.";
    var out = "Gợi ý size <b>" + rec + "</b>.";
    if (p.sizes.indexOf(rec) < 0) out += " Size này hiện đã hết, nên chọn size lớn hơn hoặc nhắn Zalo để được tư vấn.";
    else if (S.color && avail(p, S.mode, S.color, rec) <= 0) out += " Size này đã hết ở màu đang chọn; có thể chọn màu khác hoặc size lớn hơn.";
    if (h) { var idx = g.lengths.length === 4 ? (h < 155 ? 0 : h < 160 ? 1 : h < 167 ? 2 : 3) : (h < 155 ? 0 : h < 160 ? 1 : 2); out += " Độ dài với chiều cao " + h + "cm: " + g.lengths[idx][1] + "."; }
    return out;
  }
  function openCalc() {
    var p = S.p, g = p.sizeGuide;
    if (g.type !== "weight") { openModal("<h3>Công cụ đo size</h3><p>" + esc(g.note || "Vui lòng so số đo với bảng size hoặc nhắn Zalo để được tư vấn.") + '</p><p><a class="btn" href="' + C.zalo + '" target="_blank" rel="noopener">Nhắn Zalo ' + C.hotline + "</a></p>"); return; }
    openModal("<h3>Công cụ đo size</h3><p>Nhập chiều cao và cân nặng để nhận gợi ý size cho " + esc(p.name) + '.</p><div class="calc"><label>Chiều cao (cm)<input id="calc-h" type="number" inputmode="numeric" min="130" max="190" placeholder="Ví dụ 158"></label><label>Cân nặng (kg)<input id="calc-w" type="number" inputmode="numeric" min="30" max="100" placeholder="Ví dụ 52"></label></div><div class="calc-out" id="calc-out" aria-live="polite">Kết quả hiện ở đây.</div>');
    var run = function () { $("#calc-out").innerHTML = recommend(p, parseInt($("#calc-h").value, 10) || 0, parseFloat($("#calc-w").value) || 0); };
    $("#calc-h").addEventListener("input", run); $("#calc-w").addEventListener("input", run);
  }
  function renderPDP() {
    var p = S.p, mode = S.mode, color = S.color, pr = priceFor(mode, color.id), pre = isPre(p);
    var imgs = color.images || []; var cur = imgs[S.img] || "";
    var thumbs = imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (s, i) { return '<button class="thumb' + (i === S.img ? " on" : "") + '" data-img="' + i + '" aria-label="Ảnh ' + (i + 1) + '"><img src="' + s + '" alt=""></button>'; }).join("") + "</div>" : "";
    var modes = p.modes.length > 1 ? '<div class="field-label"><span>Cách mua</span><b>' + esc(mode.label) + '</b></div><div class="chips">' + p.modes.map(function (m) { return '<button class="chip' + (m.id === mode.id ? " on" : "") + '" data-mode="' + m.id + '">' + esc(m.label) + "</button>"; }).join("") + "</div>" : "";
    var colors = '<div class="field-label"><span>Màu</span><b>' + esc(color.name) + '</b></div><div class="chips">' + p.colors.map(function (c) { return '<button class="chip swatch' + (c.id === color.id ? " on" : "") + '" data-color="' + c.id + '"><i style="background:' + c.hex + '"></i>' + esc(c.name) + "</button>"; }).join("") + "</div>";
    var sizes = '<div class="field-label"><span>Kích cỡ</span><b>' + (S.size || "Chưa chọn") + '</b></div><div class="chips" role="group" aria-label="Kích cỡ">' + p.sizes.map(function (s) { var n = avail(p, mode, color, s); return '<button class="chip' + (S.size === s ? " on" : "") + (n <= 0 ? " out" : "") + '" data-size="' + s + '"' + (n <= 0 ? ' disabled title="Hết hàng" aria-label="Size ' + s + ', hết hàng"' : "") + ">" + s + "</button>"; }).join("") + "</div>" +
      (p.sizes.some(function (s) { return avail(p, mode, color, s) <= 0; }) ? '<p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">Size mờ là đã hết hàng.</p>' : "");
    var pairNote = mode.id === "bo" ? '<div class="note-box">Bộ gồm áo dài Nhiên ' + esc(color.name.toLowerCase()) + " và " + esc(color.pairName) + ".</div>" : "";
    var earlyNote = pr.was ? '<span class="early">Giá mua sớm đến hết 10/11</span>' : "";
    var preNote = pre ? '<div class="note-box"><b>Đặt trước.</b> Mở bán chính thức lúc 20:00 ngày 05/11/2026. Đơn đặt trước được giữ hàng theo thứ tự đặt, Minalie xác nhận qua số điện thoại.</div>' : "";
    var related = P.filter(function (x) { return x.id !== p.id; }).slice(0, 4).map(function (x) { return { p: x, m: x.modes[0] }; });
    var code = color.code + (mode.id === "bo" ? " + " + color.pairCode : "");
    app().innerHTML = crumbs([["Trang phục", "danh-muc.html"], [p.name, ""]]) +
      '<div class="wrap"><div class="pdp"><div class="gallery' + (thumbs ? " has-thumbs" : "") + '">' + thumbs + '<div class="main-img">' + (cur ? '<img src="' + cur + '" alt="' + esc(p.name + " " + color.name) + '">' : placeholder(p.name)) + (pre ? '<span class="tag rose">Đặt trước</span>' : p.isNew ? '<span class="tag">Mới</span>' : "") + "</div></div>" +
      '<div class="info"><h1>' + esc(p.name) + '</h1><div class="code">Mã sản phẩm: ' + esc(code) + "</div>" + priceHtml(pr) + earlyNote + preNote + pairNote + modes + colors + sizes +
      '<div class="links"><button class="linkbtn" id="b-calc">Công cụ đo size</button><button class="linkbtn" id="b-guide">Hướng dẫn chọn size</button></div>' +
      '<div class="err" id="err" role="alert"></div><div class="cta"><button class="btn ghost" id="b-add">' + (pre ? "Đặt trước" : "Thêm vào giỏ") + '</button><button class="btn" id="b-buy">Thanh toán</button></div>' +
      '<div class="acc"><details open><summary>Mô tả</summary><div class="body"><p>' + esc(p.summary) + "</p><ul>" + p.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + '</ul></div></details><details><summary>Đổi trả &amp; giao hàng</summary><div class="body"><ul><li>Đổi hàng trong 3 ngày kể từ ngày nhận.</li><li>Giao toàn quốc qua Shopee Express, dự kiến 3 – 5 ngày.</li><li>Phí vận chuyển ' + fmt(C.shipFee) + ", miễn phí cho đơn từ " + fmt(C.freeShipFrom) + ' hoặc đơn chuyển khoản.</li></ul><a class="linkbtn" href="doi-tra.html">Xem đầy đủ chính sách</a></div></details></div></div></div>' +
      '<div class="sh pdp-more"><h2>Sản phẩm liên quan</h2></div>' + gridHtml(related) + '<div style="height:64px"></div></div>';
    bindPDP();
  }
  function bindPDP() {
    var root = app();
    root.onclick = function (e) {
      var t = e.target.closest("button"); if (!t) return;
      var p = S.p;
      if (t.dataset.img) { S.img = +t.dataset.img; renderPDP(); }
      else if (t.dataset.mode) { S.mode = p.modes.filter(function (m) { return m.id === t.dataset.mode; })[0]; S.size = ""; renderPDP(); }
      else if (t.dataset.color) { S.color = p.colors.filter(function (c) { return c.id === t.dataset.color; })[0]; S.img = 0; if (S.size && avail(p, S.mode, S.color, S.size) <= 0) S.size = ""; renderPDP(); }
      else if (t.dataset.size) { S.size = t.dataset.size; renderPDP(); }
      else if (t.id === "b-calc") openCalc();
      else if (t.id === "b-guide") openModal("<h3>Hướng dẫn chọn size</h3>" + sizeTables(p.sizeGuide) + '<p><a class="btn" href="' + C.zalo + '" target="_blank" rel="noopener">Nhắn Zalo để được tư vấn</a></p>');
      else if (t.id === "b-add" || t.id === "b-buy") {
        if (!S.size) { $("#err").textContent = "Vui lòng chọn kích cỡ."; return; }
        if (addToCart({ pid: p.id, mode: S.mode.id, color: S.color.id, size: S.size, qty: 1 })) {
          if (t.id === "b-buy") location.href = "thanh-toan.html"; else toast(isPre(p) ? "Đã thêm đơn đặt trước vào giỏ." : "Đã thêm vào giỏ hàng.");
        }
      }
    };
  }

  /* ---------- giỏ hàng ---------- */
  function pageCart() {
    setTitle("Giỏ hàng", "Giỏ hàng Minalie");
    var t = totals("cod");
    var lines = cart.map(function (l, idx) {
      var i = lineInfo(l); if (!i) return "";
      var img = i.color.images && i.color.images[0];
      return '<div class="line"><div class="im">' + (img ? '<img src="' + img + '" alt="">' : placeholder("")) + '</div><div><div class="t"><a href="san-pham.html?id=' + i.p.id + "&mode=" + i.mode.id + '">' + esc(i.p.name) + "</a></div><div class=\"s\">" + esc(i.mode.label) + " · " + esc(i.color.name) + " · Size " + l.size + (isPre(i.p) ? " · Đặt trước" : "") + "</div>" + priceHtml(i.price) +
        '<div><div class="qty"><button data-q="-1" data-i="' + idx + '" aria-label="Giảm">−</button><span>' + l.qty + '</span><button data-q="1" data-i="' + idx + '" aria-label="Tăng">+</button></div><button class="rm" data-rm="' + idx + '">Xóa</button></div></div></div>';
    }).join("");
    app().innerHTML = crumbs([["Giỏ hàng", ""]]) + '<div class="wrap"><div class="page-head"><h1>Giỏ hàng</h1></div>' +
      (cart.length ? '<div class="two"><div>' + lines + '</div><aside class="sum"><h3>Tóm tắt</h3><div class="r"><span>Tạm tính</span><span>' + fmt(t.sub) + '</span></div><div class="r"><span>Vận chuyển</span><span>' + (t.ship ? fmt(t.ship) : "Miễn phí") + '</span></div><p style="font-size:12.5px;color:var(--muted)">Phí vận chuyển ' + fmt(C.shipFee) + "; miễn phí cho đơn từ " + fmt(C.freeShipFrom) + ' hoặc chuyển khoản.</p><div class="r total"><span>Tổng</span><span>' + fmt(t.total) + '</span></div><a class="btn block" href="thanh-toan.html" style="margin-top:14px">Tiến hành thanh toán</a></aside></div>'
        : '<p class="empty">Giỏ hàng đang trống.</p><p><a class="btn" href="danh-muc.html">Xem trang phục</a></p>') + '<div style="height:48px"></div></div>';
    app().onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.rm) { cart.splice(+b.dataset.rm, 1); saveCart(); pageCart(); }
      if (b.dataset.q) {
        var l = cart[+b.dataset.i], q = l.qty + +b.dataset.q, i = lineInfo(l);
        if (q < 1) return; if (q > i.max) { toast(limitMsg(i.max, l.size)); return; }
        l.qty = q; saveCart(); pageCart();
      }
    };
  }

  /* ---------- thanh toán ---------- */
  var payment = "cod";
  function pageCheckout() {
    setTitle("Thanh toán", "Thanh toán đơn hàng Minalie");
    var done = sstore.get("mn_last_order", null);
    if (params.get("xong") && done) return renderDone(done);
    if (!cart.length) { app().innerHTML = crumbs([["Thanh toán", ""]]) + '<div class="wrap"><div class="page-head"><h1>Thanh toán</h1></div><p class="empty">Giỏ hàng đang trống.</p><p><a class="btn" href="danh-muc.html">Xem trang phục</a></p></div>'; return; }
    var t = totals(payment);
    var hasPre = cart.some(function (l) { var i = lineInfo(l); return i && isPre(i.p); });
    var sum = cart.map(function (l) { var i = lineInfo(l); return '<div class="r"><span>' + esc(i.p.name) + " · " + esc(i.mode.label) + " · " + esc(i.color.name) + " · " + l.size + " × " + l.qty + "</span><span>" + fmt(i.price.now * l.qty) + "</span></div>"; }).join("");
    app().innerHTML = crumbs([["Giỏ hàng", "gio-hang.html"], ["Thanh toán", ""]]) + '<div class="wrap"><div class="page-head"><h1>Thanh toán</h1></div>' +
      (C.orderEndpoint ? "" : '<div class="warn-banner"><b>Chế độ thử.</b> Website chưa kết nối nhận đơn (orderEndpoint đang để trống), đơn sẽ không được gửi đi.</div>') +
      '<form class="two" id="co" novalidate><div class="form"><h3 style="font-size:26px;color:var(--green)">Thông tin giao nhận</h3>' +
      '<label>Họ và tên<input name="name" autocomplete="name" required></label><label>Số điện thoại<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="Ví dụ 0912345678"></label><label>Địa chỉ nhận hàng<textarea name="address" autocomplete="street-address" required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"></textarea></label><label>Ghi chú (không bắt buộc)<textarea name="note"></textarea></label>' +
      '<h3 style="font-size:26px;color:var(--green);margin-top:10px">Thanh toán</h3><div class="pay" id="pay"><label class="' + (payment === "cod" ? "on" : "") + '"><input type="radio" name="pay" value="cod"' + (payment === "cod" ? " checked" : "") + '><span>Thanh toán khi nhận hàng (COD)<small>Phí vận chuyển ' + fmt(C.shipFee) + ", miễn phí cho đơn từ " + fmt(C.freeShipFrom) + '.</small></span></label><label class="' + (payment === "bank" ? "on" : "") + '"><input type="radio" name="pay" value="bank"' + (payment === "bank" ? " checked" : "") + '><span>Chuyển khoản ngân hàng<small>Miễn phí vận chuyển. Nội dung chuyển khoản: số điện thoại + tên.</small></span></label></div>' +
      '<div class="err" id="err" role="alert"></div></div><aside class="sum"><h3>Đơn hàng</h3>' + sum + '<div class="r" style="border-top:1px solid var(--line);margin-top:8px"><span>Tạm tính</span><span>' + fmt(t.sub) + '</span></div><div class="r"><span>Vận chuyển</span><span>' + (t.ship ? fmt(t.ship) : "Miễn phí") + '</span></div><div class="r total"><span>Tổng</span><span>' + fmt(t.total) + "</span></div>" +
      (hasPre ? '<p style="font-size:13px;color:var(--muted)">Đơn có sản phẩm đặt trước (mở bán 20:00 ngày 05/11/2026). Minalie sẽ giữ hàng và xác nhận qua số điện thoại.</p>' : "") +
      '<p style="font-size:12.5px;color:var(--muted);margin:14px 0 0">Thông tin chỉ dùng để xử lý đơn hàng. Xem <a href="chinh-sach-bao-mat.html" style="text-decoration:underline">Chính sách bảo mật</a>.</p><button class="btn block" type="submit" id="place" style="margin-top:10px">Đặt hàng</button></aside></form><div style="height:48px"></div></div>';
    $("#pay").addEventListener("change", function (e) { payment = e.target.value; var f = $("#co"); var keep = { name: f.name.value, phone: f.phone.value, address: f.address.value, note: f.note.value }; pageCheckout(); var f2 = $("#co"); Object.keys(keep).forEach(function (k) { f2[k].value = keep[k]; }); });
    $("#co").addEventListener("submit", function (e) { e.preventDefault(); placeOrder(e.target); });
  }
  function orderId() { var d = new Date(); var p2 = function (n) { return ("0" + n).slice(-2); }; return "MN" + String(d.getFullYear()).slice(2) + p2(d.getMonth() + 1) + p2(d.getDate()) + "-" + Math.floor(1000 + Math.random() * 9000); }
  function placeOrder(f) {
    var name = f.name.value.trim(), phone = f.phone.value.replace(/[\s.\-]/g, ""), address = f.address.value.trim(), note = f.note.value.trim();
    var err = $("#err");
    if (!name) { err.textContent = "Vui lòng nhập họ và tên."; f.name.focus(); return; }
    if (!/^(0|\+?84)\d{9}$/.test(phone)) { err.textContent = "Số điện thoại chưa đúng. Vui lòng kiểm tra lại."; f.phone.focus(); return; }
    if (address.length < 10) { err.textContent = "Vui lòng nhập địa chỉ đầy đủ."; f.address.focus(); return; }
    for (var k = 0; k < cart.length; k++) { var inf = lineInfo(cart[k]); if (cart[k].qty > inf.max) { err.textContent = "Sản phẩm " + inf.p.name + " size " + cart[k].size + " không đủ số lượng. Vui lòng cập nhật giỏ hàng."; return; } }
    err.textContent = "";
    var t = totals(payment), rows = [], preorder = false;
    cart.forEach(function (l) { var i = lineInfo(l); if (isPre(i.p)) preorder = true; rows = rows.concat(rowsFor(l)); });
    var order = { id: orderId(), createdAt: new Date().toISOString(), customer: { name: name, phone: phone, address: address }, note: note, payment: payment === "bank" ? "Chuyển khoản" : "COD", subtotal: t.sub, shipping: t.ship, total: t.total, preorder: preorder, rows: rows,
      lines: cart.map(function (l) { var i = lineInfo(l); return { name: i.p.name, mode: i.mode.label, color: i.color.name, size: l.size, qty: l.qty, price: i.price.now }; }) };
    var btn = $("#place"); btn.disabled = true; btn.textContent = "Đang gửi đơn...";
    var finish = function (sent) { order.sent = sent; sstore.set("mn_last_order", order); cart = []; saveCart(); history.replaceState(null, "", "thanh-toan.html?xong=1"); params = new URLSearchParams(location.search); renderDone(order); };
    if (!C.orderEndpoint) { finish(false); return; }
    fetch(C.orderEndpoint, { method: "POST", body: JSON.stringify(order) }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok) finish(true); else throw new Error((j && j.error) || "Không gửi được đơn");
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Đặt hàng";
      err.innerHTML = "Chưa gửi được đơn. Vui lòng thử lại, hoặc nhắn Zalo <a href=\"" + C.zalo + "\" target=\"_blank\" rel=\"noopener\" style=\"text-decoration:underline\">" + C.hotline + "</a>.";
    });
  }
  function copyBtn(v) { return '<button class="copy" type="button" data-copy="' + esc(v) + '">Sao chép</button>'; }
  function renderDone(o) {
    setTitle("Đặt hàng thành công", "");
    var bank = o.payment === "Chuyển khoản";
    var content = o.customer.phone + " " + o.customer.name;
    app().innerHTML = '<div class="wrap"><div class="done">' +
      (o.sent ? "" : '<div class="warn-banner"><b>Chế độ thử.</b> Đơn này chưa được gửi đến Minalie vì website chưa kết nối nhận đơn.</div>') +
      '<span class="eyebrow">Mã đơn ' + esc(o.id) + "</span><h1>Cảm ơn đã đặt hàng.</h1><p>Tổng thanh toán: <b>" + fmt(o.total) + "</b> (" + esc(o.payment) + ").</p>" +
      (bank ? '<div class="bank"><div class="r"><span>Ngân hàng</span><b>' + esc(C.bank.name) + '</b></div><div class="r"><span>Số tài khoản</span><b>' + esc(C.bank.number) + "</b>" + copyBtn(C.bank.number.replace(/\s/g, "")) + '</div><div class="r"><span>Chủ tài khoản</span><b>' + esc(C.bank.holder) + '</b></div><div class="r"><span>Số tiền</span><b>' + fmt(o.total) + "</b>" + copyBtn(String(o.total)) + '</div><div class="r"><span>Nội dung</span><b>' + esc(content) + "</b>" + copyBtn(content) + "</div></div>" +
        '<p>Sau khi chuyển khoản, vui lòng nhắn bill thanh toán thành công qua <a href="' + C.fanpage + '" target="_blank" rel="noopener" style="text-decoration:underline">fanpage</a> hoặc <a href="' + C.zalo + '" target="_blank" rel="noopener" style="text-decoration:underline">Zalo ' + C.hotline + "</a> để Minalie xác nhận đơn.</p>" : "<p>Minalie sẽ xác nhận đơn qua số điện thoại " + esc(o.customer.phone) + ".</p>") +
      (o.preorder ? "<p>Đơn có sản phẩm đặt trước: mở bán chính thức lúc 20:00 ngày 05/11/2026. Minalie giữ hàng cho đơn này.</p>" : "") +
      '<h3 style="font-size:24px;margin:24px 0 8px">Chi tiết</h3>' + o.lines.map(function (l) { return '<div class="r" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span>' + esc(l.name) + " · " + esc(l.mode) + " · " + esc(l.color) + " · " + l.size + " × " + l.qty + "</span><span>" + fmt(l.price * l.qty) + "</span></div>"; }).join("") +
      '<p style="margin-top:24px"><a class="btn" href="danh-muc.html">Tiếp tục mua sắm</a></p></div></div>';
    app().onclick = function (e) { var b = e.target.closest("[data-copy]"); if (b) { (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).then(function () { toast("Đã sao chép."); }, function () { toast("Không sao chép được, vui lòng chép tay."); }); } };
  }

  /* ---------- trang nội dung ---------- */
  function pageAbout() {
    setTitle("Giới thiệu", "Minalie thiết kế gì: thoải mái, chỉn chu, ứng dụng. Elegance in Ease: thanh lịch trong sự thoải mái.");
    var el = byId("elise-dress"), im1 = el.colors[1].images[0], im2 = firstImage(byId("marine-set"));
    var four = [["Chất liệu", "Bền, ít nhăn, thoáng mát, thấm hút, giữ dáng, không bai nhão, không xù. Ví dụ: tweed không co giãn của Elise Dress, đũi tre mỏng của Marine Set, tơ nhăn của áo dài Nhiên."], ["Phom dáng", "Suông nhẹ, không bó eo, vừa người khi ngồi lâu. Có bảng số đo và gợi ý theo chiều cao, cân nặng cho từng mẫu."], ["Chi tiết", "Cổ sen và cúc bọc vải, túi ẩn bên hông, túi ngực và đai thắt eo, cúc vàng nhỏ trên vai. Đủ tinh tế để nổi bật mà không phô."], ["Màu sắc", "Ngũ cốc, kem, xanh than, xanh rêu, hồng tôm. Dễ phối với đồ đã có trong tủ. Áo và quần có thể mua riêng."]];
    app().innerHTML = crumbs([["Giới thiệu", ""]]) + '<article class="mag">' +
      '<header class="wrap mag-head"><span class="eyebrow">Về Minalie</span><h1 data-rv>Minalie thiết kế <em>cho ai</em>, và để làm gì?</h1></header>' +
      '<section class="wrap mag-lead"><div class="txt" data-rv><p class="dropcap">Minalie là thương hiệu thời trang nữ thiết kế dành cho những người làm việc bằng tri thức: giáo viên, giảng viên, chuyên gia, người làm việc tự do và chủ doanh nghiệp nhỏ.</p>' +
      '<ul class="qs"><li>Mặc gì để ngồi họp cả buổi mà vẫn chỉn chu?</li><li>Một chiếc váy đứng lớp có thể không cần là ủi mỗi sáng?</li><li>Đồ mặc ở nhà có thể lên hình trong một cuộc gọi quan trọng?</li></ul></div>' +
      '<div class="figs" data-rv><figure class="f1"><img src="' + im1 + '" alt="Elise Dress màu xanh than"></figure><figure class="f2" data-par="-0.05"><img src="' + im2 + '" alt="Marine Set màu xanh than"></figure></div></section>' +
      '<section class="mag-quote"><div class="wrap"><blockquote data-rv>Minalie tạo nên những sản phẩm <em>thoải mái</em>, <em>chỉn chu</em> và <em>ứng dụng</em>.</blockquote></div></section>' +
      '<section class="wrap thoughtful" data-rv><span class="eyebrow">Minalie</span><h2>A Thoughtful <em>Way</em> to Dress</h2><p>Minalie tin rằng vẻ đẹp không cần đến sự cầu kỳ. Một thiết kế vừa vặn, chất liệu dễ chịu và những chi tiết được chăm chút đủ để người phụ nữ cảm thấy tự tin, thanh lịch trong mọi khoảnh khắc thường ngày.</p></section>' +
      '<section class="wrap mag-two"><div class="lbl" data-rv><span class="num" aria-hidden="true">01</span><h2>Elegance in Ease</h2></div><div class="cols2"><div data-rv><h3>Thanh lịch</h3><p>Gọn gàng, thanh lịch, đúng chỗ đúng dịp: bước vào lớp học, phòng họp hay màn hình cuộc gọi mà không cần chỉnh sửa gì thêm. Là những chi tiết nhỏ nhưng đủ để trang phục có dáng và có chất.</p></div><div data-rv><h3>Thoải mái</h3><p>Người làm việc bằng tri thức thường ngồi nhiều giờ. Trang phục phải đủ thoáng, đủ nhẹ, không ôm bó, không nhăn sau một ngày dài, để người mặc tập trung vào việc của mình.</p></div></div>' +
      '<h3 class="pairs-t" data-rv>Sự kết hợp giữa hai điều tưởng đối lập</h3><div class="pairs"><div data-rv>Công sở và ở nhà</div><div data-rv>Thanh lịch và thoải mái</div><div data-rv>Gọn gàng và đa dụng</div></div></section>' +
      '<section class="mag-id"><div class="wrap"><div class="lbl" data-rv><span class="num" aria-hidden="true">02</span><h2>Bản sắc</h2></div><p class="idp" data-rv>Minalie dành cho những người vừa có tri thức vừa có gu. Trang phục không chỉ để đẹp mà để người mặc thấy tự tin, có động lực và tập trung.</p><p class="idw" data-rv><b>Tự tin.</b> <b>Động lực.</b> <b>Trí tuệ.</b> <b>Thẩm mỹ.</b></p></div></section>' +
      '<section class="wrap mag-four"><div class="lbl" data-rv><span class="num" aria-hidden="true">03</span><h2>Triển khai trong thiết kế: bốn yếu tố</h2></div><div class="four">' + four.map(function (f, i) { return '<div class="fe fe' + (i + 1) + '" data-rv><span class="fn" aria-hidden="true">0' + (i + 1) + "</span><h3>" + f[0] + "</h3><p>" + f[1] + "</p></div>"; }).join("") + '</div><p class="limit" data-rv>Mỗi mẫu may số lượng giới hạn.</p></section>' +
      '<section class="wrap mag-end"><div class="lbl" data-rv><span class="num" aria-hidden="true">04</span><h2>Cam kết mua sắm</h2></div><ul data-rv><li>Tư vấn size theo chiều cao và cân nặng.</li><li>Đổi hàng trong 3 ngày kể từ ngày nhận.</li><li>Giao toàn quốc, miễn phí vận chuyển cho đơn từ ' + fmt(C.freeShipFrom) + ' hoặc đơn chuyển khoản.</li></ul><p data-rv><a class="btn" href="danh-muc.html">Xem trang phục</a></p></section></article>';
  }
  function pageContact() {
    setTitle("Liên hệ", "Liên hệ Minalie: hotline, Zalo, email, fanpage, Instagram, Shopee.");
    app().innerHTML = crumbs([["Liên hệ", ""]]) + '<div class="wrap"><div class="prose"><div class="page-head" style="padding-bottom:0"><h1>Liên hệ</h1></div><p style="margin-top:16px">Minalie tư vấn size, xác nhận đơn và hỗ trợ đổi hàng qua các kênh dưới đây.</p><div class="contact-grid">' +
      '<a href="' + C.hotlineHref + '"><small>Hotline</small><b>' + C.hotline + '</b></a><a href="' + C.zalo + '" target="_blank" rel="noopener"><small>Zalo</small><b>' + C.hotline + '</b></a><a href="mailto:' + C.email + '"><small>Email</small><b>' + C.email + '</b></a><a href="#" onclick="return false"><small>Địa chỉ</small><b>' + C.address + '</b></a>' +
      '<a href="' + C.fanpage + '" target="_blank" rel="noopener"><small>Facebook</small><b>minali.store.official</b></a><a href="' + C.instagram + '" target="_blank" rel="noopener"><small>Instagram</small><b>minali.store.official</b></a><a href="' + C.shopee + '" target="_blank" rel="noopener"><small>Shopee</small><b>minali.store</b></a></div></div></div>';
  }
  function pagePrivacy() {
    setTitle("Chính sách bảo mật", "Chính sách bảo mật của Minalie: thông tin khách cung cấp khi đặt hàng được dùng và bảo vệ thế nào.");
    app().innerHTML = crumbs([["Chính sách bảo mật", ""]]) + '<div class="wrap"><div class="prose"><div class="page-head" style="padding-bottom:0"><h1>Chính sách bảo mật</h1></div>' +
      '<p style="margin-top:16px;color:var(--muted)">Cập nhật lần cuối: 18/11/2026.</p>' +
      '<p>Minalie tôn trọng thông tin của khách. Trang này giải thích Minalie thu thập thông tin nào khi khách đặt hàng trên website, dùng để làm gì và khách có thể liên hệ thế nào về thông tin của mình.</p>' +
      '<h2>1. Thông tin thu thập</h2><p>Khi đặt hàng, Minalie thu thập:</p><ul><li>Họ và tên, số điện thoại, địa chỉ nhận hàng.</li><li>Ghi chú của khách (nếu có) và hình thức thanh toán đã chọn (COD hoặc chuyển khoản).</li><li>Nội dung đơn hàng: sản phẩm, màu, size, số lượng, tổng tiền.</li></ul><p>Website không có tài khoản người dùng, không thu mật khẩu và không thu thông tin thẻ ngân hàng. Khách chuyển khoản trực tiếp qua ngân hàng của mình.</p>' +
      '<h2>2. Mục đích sử dụng</h2><ul><li>Xác nhận đơn, giữ hàng (kể cả đơn đặt trước) và liên hệ với khách về đơn hàng.</li><li>Đóng gói và giao hàng; đối soát thanh toán chuyển khoản.</li><li>Hỗ trợ đổi hàng theo chính sách đổi hàng.</li></ul><p>Minalie không bán thông tin của khách và không dùng thông tin đó cho quảng cáo của bên thứ ba.</p>' +
      '<h2>3. Nơi lưu trữ và chia sẻ</h2><ul><li>Thông tin đơn hàng được gửi đến bảng tính (Google Sheet) và email của Minalie, thuộc dịch vụ của Google.</li><li>Để giao hàng, Minalie chia sẻ tên, số điện thoại và địa chỉ nhận hàng với đơn vị vận chuyển (hiện là Shopee Express).</li><li>Minalie chỉ giữ thông tin trong thời gian cần thiết để xử lý đơn, đổi hàng và đối soát.</li></ul>' +
      '<h2>4. Trình duyệt của khách</h2><ul><li>Giỏ hàng và danh sách yêu thích được lưu ngay trong trình duyệt của khách, Minalie không nhận được các thông tin này cho đến khi khách đặt hàng.</li><li>Thông tin của đơn vừa đặt chỉ hiển thị trong tab đang mở để khách xem lại, và mất khi khách đóng tab.</li><li>Website không dùng công cụ phân tích hay quảng cáo theo dõi khách.</li><li>Phông chữ của website được tải từ Google Fonts, nên địa chỉ IP của khách được gửi đến Google khi mở trang.</li></ul>' +
      '<h2>5. Liên kết bên ngoài</h2><p>Website có liên kết đến fanpage Facebook, Instagram, Shopee và Zalo. Các nền tảng này có chính sách riêng về thông tin cá nhân.</p>' +
      '<h2>6. Quyền của khách</h2><p>Khách có thể liên hệ để hỏi, kiểm tra, sửa hoặc đề nghị xóa thông tin của mình mà Minalie đang giữ. Minalie sẽ phản hồi trong thời gian sớm nhất, trừ phần thông tin cần giữ để hoàn tất đơn hàng đang xử lý.</p><p>Liên hệ: hotline và Zalo ' + C.hotline + ' · email ' + C.email + ' · ' + C.address + '.</p>' +
      '<h2>7. Thay đổi chính sách</h2><p>Minalie có thể cập nhật chính sách này khi cách làm việc thay đổi. Ngày cập nhật gần nhất nằm ở đầu trang.</p></div></div>';
  }
  function pagePolicy() {
    setTitle("Đổi hàng, giao hàng và thanh toán", "Chính sách đổi hàng, giao hàng và thanh toán của Minalie.");
    app().innerHTML = crumbs([["Đổi hàng, giao hàng và thanh toán", ""]]) + '<div class="wrap"><div class="prose"><div class="page-head" style="padding-bottom:0"><h1>Đổi hàng, giao hàng và thanh toán</h1></div>' +
      '<h2>Chính sách đổi hàng</h2><p>Minalie hỗ trợ đổi hàng trong vòng 3 ngày kể từ ngày nhận hàng.</p><p><b>Điều kiện:</b> sản phẩm còn nguyên tem mác, hóa đơn và chưa qua sử dụng. Giá bộ (set) là giá bán thường, không phải hàng khuyến mại. Minalie đổi 1:1 cho sản phẩm lỗi do sản xuất (vải, may, size, nhầm mẫu) và chịu 100% phí vận chuyển. Với sản phẩm đổi theo nhu cầu của khách: được đổi màu, size hoặc sản phẩm có giá trị bằng hoặc cao hơn; khách chịu 100% phí vận chuyển. Chỉ áp dụng 01 lần đổi duy nhất cho mỗi đơn hàng. Chính sách chỉ áp dụng cho đổi hàng, không hoàn tiền.</p>' +
      '<h3>Quy trình</h3><ul><li><b>01.</b> Liên hệ hotline hoặc nhắn Zalo ' + C.hotline + ' trong vòng 3 ngày kể từ khi nhận hàng.</li><li><b>02.</b> Minalie gửi địa chỉ nhận hàng đổi qua Zalo hoặc điện thoại. Gửi sản phẩm về địa chỉ đó: còn nguyên tem mác, hóa đơn và chưa qua sử dụng.</li><li><b>03.</b> Đổi theo nhu cầu: đổi màu, size hoặc sản phẩm có giá trị bằng hoặc cao hơn.</li></ul>' +
      '<h2>Giao hàng</h2><ul><li>Giao hàng toàn quốc qua Shopee Express, dự kiến 3 – 5 ngày.</li><li>Phí vận chuyển đồng giá ' + fmt(C.shipFee) + '.</li><li>Miễn phí vận chuyển cho đơn từ ' + fmt(C.freeShipFrom) + ' và cho mọi đơn thanh toán bằng chuyển khoản.</li></ul>' +
      '<h2>Thanh toán</h2><ul><li>Thanh toán khi nhận hàng (COD).</li><li>Chuyển khoản ngân hàng: thông tin tài khoản hiện ngay sau khi đặt hàng và chọn chuyển khoản. Nội dung chuyển khoản: số điện thoại + tên. Sau khi chuyển khoản, nhắn bill thanh toán thành công qua fanpage hoặc Zalo để Minalie xác nhận đơn.</li></ul>' +
      '<h2>Đặt trước</h2><p>Sản phẩm đặt trước (áo dài Nhiên và quần đi kèm) được giữ hàng theo thứ tự đặt. Mở bán chính thức lúc 20:00 ngày 05/11/2026. Giá mua sớm áp dụng đến hết ngày 10/11/2026.</p></div></div>';
  }

  /* ---------- hiệu ứng cuộn (chỉ thêm vào, không ẩn nội dung nếu JS lỗi) ---------- */
  var parOn = false, parTick = false;
  function initFx() {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = $$("#app [data-rv], #app .grid-products:not(.rail) .card");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    els.forEach(function (el, i) { el.classList.add("rv"); el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
    if (!parOn) {
      parOn = true;
      var upd = function () {
        parTick = false; if (window.innerWidth < 760) return;
        var vh = window.innerHeight;
        $$("#app [data-par]").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-par"))).toFixed(1) + "px"); });
      };
      window.addEventListener("scroll", function () { if (!parTick) { parTick = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener("resize", upd);
      upd();
    }
  }

  /* ---------- khởi động ---------- */
  function route() {
    var pg = document.body.getAttribute("data-page");
    ({ home: pageHome, category: pageCategory, news: pageNew, collections: pageCollections, product: pagePDP, cart: pageCart, checkout: pageCheckout, about: pageAbout, contact: pageContact, policy: pagePolicy, privacy: pagePrivacy }[pg] || pageHome)();
    window.scrollTo(0, 0);
    initFx();
  }
  renderChrome();
  route();
  if (C.stockEndpoint) {
    fetch(C.stockEndpoint).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.stock) { Object.keys(j.stock).forEach(function (k) { STOCK[k] = j.stock[k]; }); var sel = S.size; route(); void sel; }
    }).catch(function () { /* giữ tồn kho tĩnh */ });
  }
})();
