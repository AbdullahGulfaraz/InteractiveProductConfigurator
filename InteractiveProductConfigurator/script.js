/**
 * AuraSound Horizon Pro - Interactive Product Configurator
 * jQuery Driven Event Architecture, Dynamic Vector Rendering & Audio Synthesis
 */

$(document).ready(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // Application State
  // -------------------------------------------------------------------------
  const state = {
    basePrice: 399,
    currentPrice: 399,
    isVipUnlocked: false,
    view: 'front', // 'front', 'side', 'flat'
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
  // Synthesizer Audio Engine (Web Audio API)
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

  // Tactile click tone
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
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Triumphant VIP Unlock Chime
  function playVipFanfare() {
    try {
      const ctx = getAudioContext();
      const notes = [440, 554.37, 659.25, 880]; // A Major Chord
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

  // -------------------------------------------------------------------------
  // Core UI & Price Sync Engine
  // -------------------------------------------------------------------------
  function recalculatePrice() {
    let total = state.basePrice;
    total += state.config.cupCost;
    total += state.config.bandCost;
    total += state.config.cushionCost;
    total += state.config.accentCost;
    total += state.config.engravingCost;

    state.currentPrice = total;

    // Smooth numerical tweening with jQuery animate
    $({ val: parseInt($('#priceDisplay').text(), 10) || total }).animate(
      { val: total },
      {
        duration: 350,
        easing: 'swing',
        step: function () {
          $('#priceDisplay').text(Math.floor(this.val));
        },
        complete: function () {
          $('#priceDisplay').text(total);
        }
      }
    );

    // Sync spec text
    $('#specFinishName').text(state.config.cupName);
    $('#summaryConfigSubtitle').text(`${state.config.cupName} • ${state.config.bandName}`);
  }

  // Display user notification toast
  function showToast(message) {
    const $toast =$('#toastNotice');
    $('#toastMsg').text(message);
    $toast.addClass('active');
    setTimeout(() => {
      $toast.removeClass('active');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // Visualizer DOM Modifications (Dynamic Vector Color & Perspective Updates)
  // -------------------------------------------------------------------------
  function applyColorToVisualizer() {
    const cfg = state.config;

    // Cups finish & dynamic styling
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

    // Ear cushions update
    $('#earPadLeft, #earPadRight').css('background', cfg.cushionColor);

    // Accent rings update
    $('#ringLeft, #ringRight').css('borderColor', cfg.accentColor);

    // SVG Headband Cushions & Stop Colors
    $('#cushion-stop-top').attr('stop-color', cfg.bandColor);
    $('#cushion-stop-bot').attr('stop-color', '#090a0d');

    // Laser Engraving Text & Font
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
  // jQuery Event Handling: Tabs, Swatches & Customizer Controls
  // -------------------------------------------------------------------------

  // 1. Tab Switching
  $('.config-tabs-nav').on('click', '.tab-btn', function () {
    playClickSound(640);
    const targetTab = $(this).data('tab');

    $('.tab-btn').removeClass('active');$(this).addClass('active');

    $('.tab-pane').removeClass('active');$(`#tab-${targetTab}`).addClass('active');
  });

  // 2. Interactive Hotspots jumps to relative tab
  $('.hotspot').on('click', function () {
    playClickSound(800);
    const jumpTab = $(this).data('tab');$(`.tab-btn[data-tab="${jumpTab}"]`).trigger('click');
  });

  // 3. Earcup Swatches
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

  // 4. Headband Swatches
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

  // 5. Cushion Options Cards
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

  // 6. Accent Rings Swatches
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

  // 7. Sheen Slider
  $('#sheenRange').on('input', function () {
    const val = $(this).val();
    state.config.sheen = val;
    $('#finishSheenLabel').text(`Reflectivity: ${val}%`);
    const opacityVal = 0.2 + (val / 100) * 0.45;
    $('.band-highlight').css('stroke', `rgba(255, 255, 255, ${opacityVal})`);
  });

  // 8. Tension Profile Selection
  $('#tensionGroup').on('click', '.pill-opt', function () {
    playClickSound(700);
    $('#tensionGroup .pill-opt').removeClass('active');
    $(this).addClass('active');
    state.config.tension = $(this).data('tension');
    showToast(state.config.tension);
  });

  // 9. Engraving Input & Font Selection
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

  // -------------------------------------------------------------------------
  // Viewport Camera & Exploded State Controls
  // -------------------------------------------------------------------------
  $('.view-switchers').on('click', '.view-btn', function () {
    playClickSound(750);
    $('.view-btn').removeClass('active');$(this).addClass('active');

    const view = $(this).data('view');
    state.view = view;

    $('#productAssembly')
      .removeClass('view-front view-side view-flat')
      .addClass(`view-${view}`);
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
    showToast(state.wireframe ? 'Acoustic Wireframe Enabled' : 'Shaded Solid Model');
  });

  $('#btn-reset-config').on('click', function () {
    playClickSound(420);
    // Reset to defaults
    $('#cupSwatches .swatch-item:first').trigger('click');
    $('#headbandSwatches .swatch-item:first').trigger('click');
    $('#cushionOptions .option-card:first').trigger('click');
    $('#accentSwatches .swatch-item:first').trigger('click');
    $('#engravingInput').val('AURASOUND').trigger('input');
    $('.view-btn[data-view="front"]').trigger('click');
    if (state.exploded) $('#btn-explode-view').trigger('click');
    if (state.wireframe) $('#btn-toggle-wireframe').trigger('click');
    showToast('Reset to Horizon Pro Reference Standard');
  });

  // -------------------------------------------------------------------------
  // Simulated VIP Purchase & Premium Customization Flow
  // -------------------------------------------------------------------------
  $('#btn-unlock-vip-header, #btn-trigger-purchase-modal').on('click', function () {
    playClickSound(800);
    if (state.isVipUnlocked) {
      $('.tab-btn[data-tab="vip"]').trigger('click');
      showToast('VIP Atelier already unlocked!');
      return;
    }
    $('#modalVipPurchase').css('display', 'flex').hide().fadeIn(250);
  });

  $('#btnConfirmVipPurchase').on('click', function () {
    const $btn = $(this);$btn.addClass('processing').prop('disabled', true);
    playClickSound(900);

    // Simulate Network Payment Processing Delay
    setTimeout(() => {
      $btn.removeClass('processing').prop('disabled', false);$('#modalVipPurchase').fadeOut(200);

      // Unlock VIP State
      state.isVipUnlocked = true;

      // Celebrate with confetti
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      playVipFanfare();

      // DOM Updates for VIP Tier
      $('#vipLockedVeil').slideUp(350);
      $('#vipControlsArea').removeClass('disabled-area');
      $('#btn-unlock-vip-header')
        .html('<i class="fa-solid fa-gem"></i> VIP Atelier Active')
        .css({ background: 'rgba(245, 158, 11, 0.25)', borderColor: '#fbbf24' });

      $('.tab-btn[data-tab="vip"]').trigger('click');
      showToast('VIP Atelier Unlocked! Rare materials are now selectable.');
    }, 1200);
  });

  // VIP Exotic Swatches Click
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

  // -------------------------------------------------------------------------
  // Promotional Media Showcase Modal & Waveform Canvas
  // -------------------------------------------------------------------------
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

      // Second harmonic wave
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      for (let x = 0; x < width; x++) {
        const y = mid + Math.cos(x * 0.02 - step * 1.2) * (wavePlaying ? 25 : 8);
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

  // Toggle ambient acoustic test sound in film modal
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

  // -------------------------------------------------------------------------
  // Order Confirmation Modal & Spec Export
  // -------------------------------------------------------------------------
  $('#btnAddToCart').on('click', function () {
    playClickSound(850);
    const cfg = state.config;

    const receiptHtml = `
      <div class="receipt-row">
        <span>Base Acoustic Chassis</span>
        <span>$399.00</span>
      </div>
      <div class="receipt-row">
        <span>Finish (${cfg.cupName})</span>
        <span>${cfg.cupCost > 0 ? '+$' + cfg.cupCost + '.00' : 'Included'}</span>
      </div>
      <div class="receipt-row">
        <span>Arch Material (${cfg.bandName})</span>
        <span>${cfg.bandCost > 0 ? '+$' + cfg.bandCost + '.00' : 'Included'}</span>
      </div>
      <div class="receipt-row">
        <span>Cushions (${cfg.cushionName})</span>
        <span>${cfg.cushionCost > 0 ? '+$' + cfg.cushionCost + '.00' : 'Included'}</span>
      </div>
      <div class="receipt-row">
        <span>Hardware (${cfg.accentName})</span>
        <span>${cfg.accentCost > 0 ? '+$' + cfg.accentCost + '.00' : 'Standard'}</span>
      </div>
      ${cfg.engravingText.trim().length > 0 ? `
      <div class="receipt-row">
        <span>Laser Engraving ("${cfg.engravingText.trim()}")</span>
        <span>+$25.00</span>
      </div>` : ''}
      <div class="receipt-row">
        <span>Total Commission</span>
        <span style="color:var(--accent-cyan);">$${state.currentPrice}.00 USD</span>
      </div>
    `;

    $('#orderReceiptDetails').html(receiptHtml);
    $('#modalOrderSuccess').css('display', 'flex').hide().fadeIn(250);

    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }
  });

  $('#btn-save-spec').on('click', function () {
    playClickSound(550);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'aurasound-horizon-pro-spec.json');
    dlAnchor.click();
    showToast('Acoustic specification downloaded');
  });

  $('#btn-share-config').on('click', function () {
    playClickSound(550);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Configurator link copied to clipboard!');
    } else {
      showToast('Sharing link generated');
    }
  });

  // Modal dismiss buttons
  $('[data-close]').on('click', function () {
    playClickSound(400);
    const targetModalId = $(this).data('close');$(`#${targetModalId}`).fadeOut(200);

    if (targetModalId === 'modalPromoVideo') {
      if (wavePlaying && soundOsc) {
        soundOsc.stop();
        wavePlaying = false;
        $('#btnToggleMediaSound').html('<i class="fa-solid fa-volume-high"></i> Toggle Acoustic Soundscape');
      }
      if (waveAnimFrame) cancelAnimationFrame(waveAnimFrame);
    }
  });

  // Close modals on clicking backdrop
  $('.modal-overlay').on('click', function (e) {
    if ($(e.target).hasClass('modal-overlay')) {$(this).fadeOut(200);
      if ($(this).attr('id') === 'modalPromoVideo') {
        if (wavePlaying && soundOsc) {
          soundOsc.stop();
          wavePlaying = false;
        }
        if (waveAnimFrame) cancelAnimationFrame(waveAnimFrame);
      }
    }
  });

  // Initial render boot
  applyColorToVisualizer();
  recalculatePrice();
});