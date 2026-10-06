/**
 * AuraSound Horizon Pro - Interactive Product Configurator
 * Full Integration with Local Node/Express Backend (GET /api/product & POST /api/customizations)
 */

$(document).ready(function () {
  'use strict';

  // Base URL pointing to the local Node/Express backend
  const BACKEND_BASE_URL = 'http://localhost:5000/api';

  // -------------------------------------------------------------------------
  // Application State
  // -------------------------------------------------------------------------
  const state = {
    basePrice: 399,
    currentPrice: 399,
    productName: "AuraSound Horizon Pro Studio Edition",
    isVipUnlocked: false,
    view: 'front',
    wireframe: false,
    exploded: false,
    config: {
      cupColor: '#141519',
      cupName: 'Obsidian Matte',
      cupCost: 0,
      bandColor: '#121316',
      bandName: 'Midnight Nappa',
      bandCost: 0,
      cushionColor: '#141518',
      cushionName: 'Protein Memory Foam',
      cushionCost: 0,
      accentColor: '#64748b',
      accentName: 'Matte Gunmetal',
      accentCost: 0,
      engravingText: 'AURASOUND',
      engravingFont: "'Space Grotesk', sans-serif",
      engravingCost: 0,
      sheen: 35,
      tension: 'Clamping: Relaxed (Studio 3.2N)'
    }
  };

  // -------------------------------------------------------------------------
  // Synthesizer Audio Engine
  // -------------------------------------------------------------------------
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playClickSound(freq = 780, duration = 0.04) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playVipFanfare() {
    try {
      const ctx = getAudioContext();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + (idx * 0.08);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {}
  }

  function showToast(message) {
    const $toast =$('#toastNotice');
    $('#toastMsg').text(message);
    $toast.addClass('active');
    setTimeout(() => {
      $toast.removeClass('active');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // FLOW 1: Frontend -> AJAX GET -> Express -> JSON Response -> Frontend
  // -------------------------------------------------------------------------
  function fetchLocalProductData() {
    const targetUrl = `${BACKEND_BASE_URL}/product`;

    console.group(`[jQuery.ajax GET] Requesting ${targetUrl}`);
    console.log('Sending asynchronous GET to Express backend...');

    $.ajax({
      url: targetUrl,
      type: 'GET',
      dataType: 'json',
      cache: false,
      timeout: 6000,
      beforeSend: function () {
        $('#btnFetchApiProduct').addClass('loading').prop('disabled', true);
        $('#apiProductCard').addClass('fetching');
        $('#apiAlertBanner').slideUp(150).empty();
      },
      success: function (response, textStatus, jqXHR) {
        console.log('>>> [AJAX GET SUCCESS] HTTP Status:', jqXHR.status);
        console.log('Payload Received from Express:', response);
        console.groupEnd();

        const product = response.data;
        state.basePrice = product.basePrice;
        state.productName = product.name;

        // Dynamic DOM Updates via jQuery
        $('#apiProductTitle').text(product.name);
        $('#apiProductDesc').text(`Flagship engineered with ${product.specs.driver}. Tuned to absolute neutral acoustic reference.`);
        $('#apiCategoryTag').text(product.category);
        $('#apiBrand').text(product.brand);
        $('#apiBaseMSRP').text(`$${product.basePrice}.00`);
        $('#apiSkuId').text(`#${product.id}`);
        $('#apiWarranty').text(product.warranty);
        $('#apiRating').html(`<i class="fa-solid fa-star"></i> 5.0 Express Live`);

        $('#summaryModelTitle').text(product.name);
        $('#specBasePrice').text(`$${product.basePrice}.00`);
        $('#specCategory').text(product.category);
        $('#specStockStatus').text(`${product.stock} Units Left`);

        recalculatePrice();

        $('#apiAlertBanner')
          .removeClass('error')
          .addClass('success')
          .html(`<i class="fa-solid fa-server"></i> Connected to local Express backend (<strong>GET /api/product</strong>). Predefined data loaded.`)
          .slideDown(250);

        showToast(`Loaded ${product.name} from Express`);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('>>> [AJAX GET ERROR] Could not reach Express server:');
        console.error('Status:', jqXHR.status, '| Text:', textStatus, '| Error:', errorThrown);
        console.groupEnd();

        $('#apiAlertBanner')
          .removeClass('success')
          .addClass('error')
          .html(`<i class="fa-solid fa-circle-exclamation"></i> <strong>Backend Offline:</strong> Ensure <code>node server.js</code> is running on port 5000.`)
          .slideDown(250);

        showToast('Local backend GET request failed');
      },
      complete: function () {
        $('#btnFetchApiProduct').removeClass('loading').prop('disabled', false);
        $('#apiProductCard').removeClass('fetching');
      }
    });
  }

  // -------------------------------------------------------------------------
  // FLOW 2: Frontend -> AJAX POST -> Express -> Request Body -> JSON Response
  // -------------------------------------------------------------------------
  function submitCustomizationOrder() {
    const targetUrl = `${BACKEND_BASE_URL}/customizations`;

    // 1. Prepare configuration JavaScript Object
    const configurationPayload = {
      productName: state.productName,
      basePrice: state.basePrice,
      finalPrice: state.currentPrice,
      customizations: {
        earcupColor: state.config.cupName,
        earcupHex: state.config.cupColor,
        isExoticFinish: !!state.config.cupTexture,
        headbandMaterial: state.config.bandName,
        headbandHex: state.config.bandColor,
        cushionVariant: state.config.cushionName,
        hardwareAccent: state.config.accentName,
        tensionProfile: state.config.tension,
        customLaserEngraving: state.config.engravingText.trim() || "NONE",
        engravingTypography: state.config.engravingFont,
        sheenPercentage: state.config.sheen
      },
      vipTierApplied: state.isVipUnlocked,
      submittedAt: new Date().toISOString()
    };

    console.group(`[jQuery.ajax POST] Dispatching payload to ${targetUrl}`);
    console.log('Original JavaScript Object:', configurationPayload);
    // Explicitly demonstrate conversion of JavaScript object into JSON string:
    const jsonStringPayload = JSON.stringify(configurationPayload);
    console.log('Serialized JSON String payload:', jsonStringPayload);

    const $btn =$('#btnAddToCart');
    const originalBtnHtml = $btn.html();

    $.ajax({
      url: targetUrl,
      type: 'POST',
      contentType: 'application/json; charset=UTF-8', // Crucial for Express express.json()
      dataType: 'json',
      data: jsonStringPayload, // Transmit JSON string
      timeout: 8000,
      beforeSend: function () {
        $btn.prop('disabled', true).html('<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting to Express...');
      },
      success: function (response, textStatus, jqXHR) {
        console.log('>>> [AJAX POST SUCCESS] HTTP Status:', jqXHR.status);
        console.log('Response returned from Express backend:', response);
        console.groupEnd();

        const order = response.order;

        // Render confirmation details inside Order Modal
        const receiptHtml = `
          <div class="receipt-row" style="color:var(--accent-cyan); font-weight:700;">
            <span>Express Order ID</span>
            <span>${order.orderId}</span>
          </div>
          <div class="receipt-row">
            <span>Product Base</span>
            <span>${order.details.productName}</span>
          </div>
          <div class="receipt-row">
            <span>Driver Shell</span>
            <span>${order.details.customizations.earcupColor}</span>
          </div>
          <div class="receipt-row">
            <span>Arch Cushion</span>
            <span>${order.details.customizations.headbandMaterial}</span>
          </div>
          <div class="receipt-row">
            <span>Ear Pads</span>
            <span>${order.details.customizations.cushionVariant}</span>
          </div>
          <div class="receipt-row">
            <span>Metal Accents</span>
            <span>${order.details.customizations.hardwareAccent}</span>
          </div>
          <div class="receipt-row">
            <span>Laser Monogram</span>
            <span>${order.details.customizations.customLaserEngraving}</span>
          </div>
          <div class="receipt-row">
            <span>Backend Status</span>
            <span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> ${order.status}</span>
          </div>
          <div class="receipt-row">
            <span>Total Billed</span>
            <span style="color:var(--accent-cyan); font-size:1.1rem;">$${order.details.finalPrice}.00 USD</span>
          </div>
        `;

        $('#orderReceiptDetails').html(receiptHtml);
        $('#modalOrderSuccess').css('display', 'flex').hide().fadeIn(250);

        if (typeof confetti === 'function') {
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
        playVipFanfare();
        showToast(`Order ${order.orderId} Registered on Express!`);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('>>> [AJAX POST ERROR] Request Failed:');
        console.error('Status:', jqXHR.status, '| Text:', textStatus, '| Error:', errorThrown);
        console.groupEnd();

        showToast('POST Error: Unable to record order on server.');
        alert(`Express POST Error (${jqXHR.status}): Verify that 'node server.js' is running on port 5000.`);
      },
      complete: function () {
        $btn.prop('disabled', false).html(originalBtnHtml);
      }
    });
  }

  // Connect Buttons
  $('#btnFetchApiProduct').on('click', function () {
    playClickSound(700);
    fetchLocalProductData();
  });

  $('#btnAddToCart').on('click', function () {
    playClickSound(850);
    submitCustomizationOrder();
  });

  // -------------------------------------------------------------------------
  // Configurator Color, Swatches, and Calculation Engine
  // -------------------------------------------------------------------------
  function recalculatePrice() {
    let total = state.basePrice;
    total += state.config.cupCost;
    total += state.config.bandCost;
    total += state.config.cushionCost;
    total += state.config.accentCost;
    total += state.config.engravingCost;

    state.currentPrice = total;

    $({ val: parseInt($('#priceDisplay').text(), 10) || total }).animate(
      { val: total },
      {
        duration: 300,
        easing: 'swing',
        step: function () {
          $('#priceDisplay').text(Math.floor(this.val));
        },
        complete: function () {
          $('#priceDisplay').text(total);
        }
      }
    );

    $('#specFinishName').text(state.config.cupName);
    $('#summaryConfigSubtitle').text(`${state.config.cupName} • ${state.config.bandName}`);
  }

  function applyColorToVisualizer() {
    const cfg = state.config;

    if (cfg.cupTexture === 'gold') {
      $('#earHousingLeft, #earHousingRight').css({
        background: 'linear-gradient(135deg, #ffd700, #b8860b, #daa520)',
        borderColor: '#fef08a'
      });
      $('#ambientGlow').css('background', 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)');
    } else if (cfg.cupTexture === 'carbon') {
      $('#earHousingLeft, #earHousingRight').css({
        background: '#18181b',
        borderColor: '#3f3f46'
      });
      $('#ambientGlow').css('background', 'radial-gradient(circle, rgba(100, 116, 139, 0.25) 0%, transparent 70%)');
    } else if (cfg.cupTexture === 'damascus') {
      $('#earHousingLeft, #earHousingRight').css({
        background: 'repeating-radial-gradient(circle at 0 0, #334155, #1e293b 8px, #0f172a 16px)',
        borderColor: '#94a3b8'
      });
      $('#ambientGlow').css('background', 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)');
    } else {
      $('#earHousingLeft, #earHousingRight').css({
        background: cfg.cupColor,
        borderColor: 'rgba(255, 255, 255, 0.12)'
      });
      $('#ambientGlow').css('background', `radial-gradient(circle, ${cfg.cupColor}55 0%, transparent 70%)`);
    }

    $('#earPadLeft, #earPadRight').css('background', cfg.cushionColor);
    $('#ringLeft, #ringRight').css('borderColor', cfg.accentColor);
    $('#cushion-stop-top').attr('stop-color', cfg.bandColor);
    $('#cushion-stop-bot').attr('stop-color', '#090a0d');

    const engraveText = cfg.engravingText.trim();
    if (engraveText.length > 0) {
      $('#engravingLeft, #engravingRight')
        .text(engraveText)
        .css('fontFamily', cfg.engravingFont)
        .show();
    } else {
      $('#engravingLeft, #engravingRight').text('').hide();
    }
  }

  // -------------------------------------------------------------------------
  // Configurator Tabs, Viewports, and Interactive Controls
  // -------------------------------------------------------------------------
  $('.config-tabs-nav').on('click', '.tab-btn', function () {
    playClickSound(640);
    const targetTab = $(this).data('tab');
    $('.tab-btn').removeClass('active');$(this).addClass('active');
    $('.tab-pane').removeClass('active');$(`#tab-${targetTab}`).addClass('active');
  });

  $('.hotspot').on('click', function () {
    playClickSound(800);
    const jumpTab = $(this).data('tab');$(`.tab-btn[data-tab="${jumpTab}"]`).trigger('click');
  });

  $('#cupSwatches').on('click', '.swatch-item', function () {
    playClickSound(520);
    $('#cupSwatches .swatch-item').removeClass('active');
    $(this).addClass('active');
    state.config.cupColor = $(this).data('color');
    state.config.cupName = $(this).data('name');
    state.config.cupCost = parseInt($(this).data('cost'), 10) || 0;
    state.config.cupTexture = null;
    applyColorToVisualizer();
    recalculatePrice();
    showToast(`Applied ${state.config.cupName}`);
  });

  $('#headbandSwatches').on('click', '.swatch-item', function () {
    playClickSound(540);
    $('#headbandSwatches .swatch-item').removeClass('active');
    $(this).addClass('active');
    state.config.bandColor = $(this).data('color');
    state.config.bandName = $(this).data('name');
    state.config.bandCost = parseInt($(this).data('cost'), 10) || 0;
    applyColorToVisualizer();
    recalculatePrice();
    showToast(`Equipped ${state.config.bandName}`);
  });

  $('#cushionOptions').on('click', '.option-card', function () {
    playClickSound(500);
    $('#cushionOptions .option-card').removeClass('active');
    $('#cushionOptions .option-card .card-radio i').attr('class', 'fa-solid fa-circle');
    $(this).addClass('active');$(this).find('.card-radio i').attr('class', 'fa-solid fa-circle-check');
    state.config.cushionColor = $(this).data('cushion-color');
    state.config.cushionName = $(this).data('cushion-name');
    state.config.cushionCost = parseInt($(this).data('cost'), 10) || 0;
    applyColorToVisualizer();
    recalculatePrice();
    showToast(`Fitted with ${state.config.cushionName}`);
  });

  $('#accentSwatches').on('click', '.swatch-item', function () {
    playClickSound(620);
    $('#accentSwatches .swatch-item').removeClass('active');
    $(this).addClass('active');
    state.config.accentColor = $(this).data('accent');
    state.config.accentName = $(this).data('name');
    state.config.accentCost = parseInt($(this).data('cost'), 10) || 0;
    applyColorToVisualizer();
    recalculatePrice();
    showToast(`Accents: ${state.config.accentName}`);
  });

  $('#sheenRange').on('input', function () {
    const val = $(this).val();
    state.config.sheen = val;
    $('#finishSheenLabel').text(`Reflectivity: ${val}%`);
    const opacityVal = 0.2 + (val / 100) * 0.45;
    $('.band-highlight').css('stroke', `rgba(255, 255, 255, ${opacityVal})`);
  });

  $('#tensionGroup').on('click', '.pill-opt', function () {
    playClickSound(700);
    $('#tensionGroup .pill-opt').removeClass('active');
    $(this).addClass('active');
    state.config.tension = $(this).data('tension');
    showToast(state.config.tension);
  });

  $('#engravingInput').on('keyup input', function () {
    const rawVal = $(this).val();
    state.config.engravingText = rawVal;
    state.config.engravingCost = rawVal.trim().length > 0 ? 25 : 0;
    applyColorToVisualizer();
    recalculatePrice();
  });

  $('#btnClearEngraving').on('click', function () {
    playClickSound(400);
    $('#engravingInput').val('').trigger('input');
  });

  $('#engraveFontGroup').on('click', '.pill-opt', function () {
    playClickSound(600);
    $('#engraveFontGroup .pill-opt').removeClass('active');
    $(this).addClass('active');
    state.config.engravingFont = $(this).data('font');
    applyColorToVisualizer();
  });

  // Perspective Controls
  $('.view-switchers').on('click', '.view-btn', function () {
    playClickSound(750);
    $('.view-btn').removeClass('active');$(this).addClass('active');
    const view = $(this).data('view');
    state.view = view;
    $('#productAssembly').removeClass('view-front view-side view-flat').addClass(`view-${view}`);
  });

  $('#btn-explode-view').on('click', function () {
    playClickSound(600);
    state.exploded = !state.exploded;
    $(this).toggleClass('active', state.exploded);$('#productAssembly').toggleClass('exploded', state.exploded);
    showToast(state.exploded ? 'Exploded Architectural View' : 'Assembled Perspective');
  });

  $('#btn-toggle-wireframe').on('click', function () {
    playClickSound(650);
    state.wireframe = !state.wireframe;
    $(this).toggleClass('active', state.wireframe);$('#productAssembly').toggleClass('wireframe', state.wireframe);
    showToast(state.wireframe ? 'Acoustic Wireframe' : 'Solid Shell');
  });

  $('#btn-reset-config').on('click', function () {
    playClickSound(420);
    $('#cupSwatches .swatch-item:first').trigger('click');
    $('#headbandSwatches .swatch-item:first').trigger('click');
    $('#cushionOptions .option-card:first').trigger('click');
    $('#accentSwatches .swatch-item:first').trigger('click');
    $('#engravingInput').val('AURASOUND').trigger('input');
    $('.view-btn[data-view="front"]').trigger('click');
    if (state.exploded) $('#btn-explode-view').trigger('click');
    if (state.wireframe) $('#btn-toggle-wireframe').trigger('click');
    showToast('Reset to Horizon Pro Baseline');
  });

  // VIP Atelier Simulated Purchase
  $('#btn-unlock-vip-header, #btn-trigger-purchase-modal').on('click', function () {
    playClickSound(800);
    if (state.isVipUnlocked) {
      $('.tab-btn[data-tab="vip"]').trigger('click');
      showToast('VIP Atelier already active');
      return;
    }
    $('#modalVipPurchase').css('display', 'flex').hide().fadeIn(250);
  });

  $('#btnConfirmVipPurchase').on('click', function () {
    const $btn = $(this);$btn.addClass('processing').prop('disabled', true);
    playClickSound(900);

    setTimeout(() => {
      $btn.removeClass('processing').prop('disabled', false);$('#modalVipPurchase').fadeOut(200);
      state.isVipUnlocked = true;

      if (typeof confetti === 'function') {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }
      playVipFanfare();

      $('#vipLockedVeil').slideUp(350);
      $('#vipControlsArea').removeClass('disabled-area');
      $('#btn-unlock-vip-header')
        .html('<i class="fa-solid fa-gem"></i> VIP Atelier Active')
        .css({ background: 'rgba(245, 158, 11, 0.25)', borderColor: '#fbbf24' });

      $('.tab-btn[data-tab="vip"]').trigger('click');
      showToast('VIP Atelier Unlocked!');
    }, 1100);
  });

  $('#vipExoticSwatches').on('click', '.swatch-item', function () {
    if (!state.isVipUnlocked) {
      $('#modalVipPurchase').css('display', 'flex').hide().fadeIn(200);
      return;
    }
    playClickSound(780);
    $('#cupSwatches .swatch-item').removeClass('active');
    $('#vipExoticSwatches .swatch-item').removeClass('active');
    $(this).addClass('active');

    state.config.cupColor = $(this).data('color');
    state.config.cupTexture = $(this).data('texture');
    state.config.cupName = $(this).data('name');
    state.config.cupCost = parseInt($(this).data('cost'), 10) || 0;

    applyColorToVisualizer();
    recalculatePrice();
    showToast(`Equipped Exotic: ${state.config.cupName}`);
  });

  // Promotional Media Showcase Modal & Waveform Visualizer
  $('#btn-promo-video').on('click', function () {
    playClickSound(700);
    $('#modalPromoVideo').css('display', 'flex').hide().fadeIn(250);
    initWaveformVisualizer();
  });

  let waveAnimFrame = null;
  let wavePlaying = false;
  let soundOsc = null;

  function initWaveformVisualizer() {
    const canvas = document.getElementById('waveformVisualizer');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let step = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      for (let x = 0; x < width; x++) {
        const freqMultiplier = wavePlaying ? 0.04 : 0.015;
        const amplitude = wavePlaying ? 40 : 15;
        const y = mid + Math.sin(x * freqMultiplier + step) * amplitude * Math.cos(x * 0.005);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step += 0.06;
      waveAnimFrame = requestAnimationFrame(render);
    }
    if (waveAnimFrame) cancelAnimationFrame(waveAnimFrame);
    render();
  }

  $('#btnToggleMediaSound').on('click', function () {
    const ctx = getAudioContext();
    if (!wavePlaying) {
      soundOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      soundOsc.type = 'triangle';
      soundOsc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      soundOsc.connect(gain);
      gain.connect(ctx.destination);
      soundOsc.start();
      wavePlaying = true;
      $(this).html('<i class="fa-solid fa-volume-xmark"></i> Mute Soundscape');
    } else {
      if (soundOsc) {
        soundOsc.stop();
        soundOsc.disconnect();
      }
      wavePlaying = false;
      $(this).html('<i class="fa-solid fa-volume-high"></i> Toggle Acoustic Soundscape');
    }
  });

  // Modal dismiss handlers
  $('[data-close]').on('click', function () {
    playClickSound(400);
    const targetModalId = $(this).data('close');$(`#${targetModalId}`).fadeOut(200);
  });

  $('.modal-overlay').on('click', function (e) {
    if ($(e.target).hasClass('modal-overlay')) {$(this).fadeOut(200);
    }
  });

  // -------------------------------------------------------------------------
  // Initial Boot: Execute initial AJAX GET query to Express backend
  // -------------------------------------------------------------------------
  applyColorToVisualizer();
  fetchLocalProductData();
});