(function () {
  "use strict";

  var TIERS = {
    earlybird: { price: 25 },
    ga: { price: 40 },
    vip: { price: 75 },
    founder: { price: 150 }
  };
  // Posh Ticketing "All-In Pricing": 10% + $0.99 per ticket, added on top of face value.
  var FEE_RATE = 0.10;
  var FEE_FLAT = 0.99;

  /* ---------- Live availability (real ticket counts from the server) ---------- */
  function applyAvailability(tiers) {
    if (!tiers) return;
    Object.keys(tiers).forEach(function (id) {
      var info = tiers[id];
      if (!info || info.remaining === null || info.remaining === undefined) return;
      var input = document.querySelector('input[name="tier"][value="' + id + '"]');
      if (!input) return;
      var option = input.closest(".tier-option");
      var tag = option.querySelector(".tier-tag");
      // Per-tier remaining counts are intentionally NOT shown — only sold-out state.
      if (info.remaining <= 0) {
        input.disabled = true;
        option.classList.add("soldout");
        if (tag) tag.textContent = "Sold out";
        if (input.checked) {
          var next = document.querySelector('input[name="tier"]:not(:disabled)');
          if (next) {
            next.checked = true;
            next.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    });
  }

  fetch("/all-white-party/availability")
    .then(function (res) { return res.json(); })
    .then(function (data) { applyAvailability(data.tiers); })
    .catch(function () { /* counts are a nice-to-have; never block the page */ });

  /* ---------- Social proof: claimed count + live purchase pop-ups ---------- */
  function timeAgo(iso) {
    var mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + "m ago";
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  }

  fetch("/all-white-party/social")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.totalSold >= 3) {
        var line = document.getElementById("socialProofLine");
        line.textContent = "🎟 " + data.totalSold + " tickets already claimed";
        line.style.display = "";
      }
      var toast = document.getElementById("saleToast");
      var recent = data.recent || [];
      if (!toast || recent.length === 0) return;
      var idx = 0;
      function showNext() {
        var r = recent[idx % recent.length];
        idx++;
        toast.innerHTML =
          '🎟 <span class="st-name"></span> grabbed a ticket<span class="st-time"></span>';
        toast.querySelector(".st-name").textContent = r.name;
        toast.querySelector(".st-time").textContent = timeAgo(r.at);
        toast.classList.add("show");
        setTimeout(function () { toast.classList.remove("show"); }, 5000);
      }
      setTimeout(showNext, 4000);
      setInterval(showNext, 14000);
    })
    .catch(function () { /* social proof is optional */ });

  /* ---------- Sticky ticket bar ---------- */
  var stickyCta = document.getElementById("stickyCta");
  var revealAfter = document.querySelector(".details");

  function onScroll() {
    if (!revealAfter) return;
    var threshold = revealAfter.getBoundingClientRect().bottom + window.scrollY;
    if (window.scrollY > threshold) {
      stickyCta.classList.add("show");
    } else {
      stickyCta.classList.remove("show");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- FAQ accordion ---------- */
  var accItems = document.querySelectorAll(".acc-item");
  accItems.forEach(function (item) {
    var trigger = item.querySelector(".acc-trigger");
    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      accItems.forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

  /* ---------- Press play to set the mood (YouTube IFrame API audio) ---------- */
  var playPill = document.getElementById("playPill");
  var playLabel = document.getElementById("playLabel");
  var ytPlayer = null;

  (function loadYT() {
    var holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = "position:fixed;bottom:0;right:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    holder.innerHTML = '<div id="yt-audio-player" style="width:1px;height:1px"></div>';
    document.body.appendChild(holder);

    window.onYouTubeIframeAPIReady = function () {
      ytPlayer = new window.YT.Player("yt-audio-player", {
        videoId: "muPO1c6pxXg",
        playerVars: { start: 44, autoplay: 0, controls: 0, rel: 0, playsinline: 1 }
      });
    };
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  })();

  playPill.addEventListener("click", function () {
    var playing = playPill.classList.toggle("playing");
    playPill.setAttribute("aria-pressed", playing ? "true" : "false");
    playLabel.textContent = playing ? "Now playing…" : "Press play to set the mood";
    if (ytPlayer) {
      if (playing && ytPlayer.playVideo) ytPlayer.playVideo();
      else if (!playing && ytPlayer.stopVideo) ytPlayer.stopVideo();
    }
  });

  /* ---------- Checkout sheet ---------- */
  var overlay = document.getElementById("checkoutOverlay");
  var sheet = document.getElementById("checkoutSheet");
  var closeBtn = document.getElementById("sheetClose");
  var openTriggers = document.querySelectorAll(".get-tickets-trigger, .sticky-cta");

  var qtyValueEl = document.getElementById("qtyValue");
  var qtyMinus = document.getElementById("qtyMinus");
  var qtyPlus = document.getElementById("qtyPlus");
  var sumSubtotal = document.getElementById("sumSubtotal");
  var sumFee = document.getElementById("sumFee");
  var sumTotal = document.getElementById("sumTotal");
  var submitLabel = document.getElementById("submitLabel");
  var tierInputs = document.querySelectorAll('input[name="tier"]');
  var tierOptions = document.querySelectorAll(".tier-option");

  var qty = 1;
  var MAX_QTY = 10;

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function selectedTier() {
    var checked = document.querySelector('input[name="tier"]:checked');
    return TIERS[checked ? checked.value : "ga"];
  }

  /* Guest name inputs — one per extra ticket, so tickets bought for friends
     carry the friend's name on the door list. */
  var guestNamesWrap = document.getElementById("guestNames");

  function renderGuestInputs() {
    var existing = guestNamesWrap.querySelectorAll("input");
    var values = [];
    existing.forEach(function (inp) { values.push(inp.value); });
    guestNamesWrap.innerHTML = "";
    for (var i = 2; i <= qty; i++) {
      var label = document.createElement("label");
      label.className = "field";
      var span = document.createElement("span");
      span.textContent = "Guest " + i + " name (optional)";
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Friend's name for ticket " + i;
      input.autocomplete = "off";
      input.value = values[i - 2] || "";
      label.appendChild(span);
      label.appendChild(input);
      guestNamesWrap.appendChild(label);
    }
  }

  function updateSummary() {
    var price = selectedTier().price;
    var subtotal = price * qty;
    var fee = qty * (price * FEE_RATE + FEE_FLAT);
    var total = subtotal + fee;
    qtyValueEl.textContent = qty;
    sumSubtotal.textContent = money(subtotal);
    sumFee.textContent = money(fee);
    sumTotal.textContent = money(total);
    submitLabel.textContent = "Pay " + money(total);
    qtyMinus.disabled = qty <= 1;
    qtyPlus.disabled = qty >= MAX_QTY;
    renderGuestInputs();
  }

  qtyMinus.addEventListener("click", function () {
    if (qty > 1) { qty--; updateSummary(); }
  });
  qtyPlus.addEventListener("click", function () {
    if (qty < MAX_QTY) { qty++; updateSummary(); }
  });
  tierInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      tierOptions.forEach(function (opt) { opt.classList.remove("selected"); });
      input.closest(".tier-option").classList.add("selected");
      updateSummary();
    });
  });

  function openSheet() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    if (window.fbq) window.fbq("track", "InitiateCheckout");
  }
  function closeSheet() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  openTriggers.forEach(function (btn) {
    btn.addEventListener("click", openSheet);
  });
  closeBtn.addEventListener("click", closeSheet);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeSheet();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeSheet();
  });

  var payBtns = document.querySelectorAll(".pay-btn");
  payBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      payBtns.forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
    });
  });

  document.getElementById("checkoutSubmit").addEventListener("click", function () {
    var nameInput = document.getElementById("buyerName");
    var buyerName = nameInput.value.trim();
    if (!buyerName) {
      nameInput.focus();
      return;
    }
    var email = sheet.querySelector('input[type="email"]').value.trim();
    if (!email) {
      sheet.querySelector('input[type="email"]').focus();
      return;
    }
    var guestNames = [];
    guestNamesWrap.querySelectorAll("input").forEach(function (inp) {
      guestNames.push(inp.value.trim());
    });
    var checked = document.querySelector('input[name="tier"]:checked');
    var tierId = checked ? checked.value : "ga";
    var newsletterOptIn = document.getElementById("newsletterOptIn").checked;
    if (window.fbq) {
      var p = selectedTier().price;
      window.fbq("track", "AddPaymentInfo", {
        value: (p * qty * (1 + FEE_RATE) + FEE_FLAT * qty).toFixed(2),
        currency: "USD",
        num_items: qty
      });
    }
    submitLabel.textContent = "Redirecting to secure checkout…";
    fetch("/all-white-party/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: tierId, qty: qty }],
        email: email,
        name: buyerName,
        guestNames: guestNames,
        newsletterOptIn: newsletterOptIn
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.url) {
          window.location.href = data.url;
        } else {
          submitLabel.textContent = "Error — " + (data.error || "please try again.");
          setTimeout(updateSummary, 3000);
        }
      })
      .catch(function () {
        submitLabel.textContent = "Error — please try again.";
        setTimeout(updateSummary, 3000);
      });
  });

  var initialChecked = document.querySelector('input[name="tier"]:checked');
  if (initialChecked) initialChecked.closest(".tier-option").classList.add("selected");
  updateSummary();
})();
