/* Inside Your Heart — angiogram scene.
   Three stacked SVG layers in one 800×500 stage:
     body   top-down view of the patient on the table; its viewBox is the "camera" (zooms to wrist/groin/chest)
     heart  close-up of the heart: catheter in the left main, dye filling the arteries, X-ray look, blockage marker
     inset  round close-up "under the skin": numbing injection, sheath, then the wristband / hand pressure
   CV.angiogram(canvas) returns a build(tl) function for the player, plus setAccess(). */
(function () {
  "use strict";
  var CV = window.CV;

  var CAM = {
    base: "0 0 800 500",
    radial: "120 352 300 187.5",
    femoral: "432 184 300 187.5",
    chest: "160 167 220 137.5",
  };
  var SKIN = "#e5b48f", SKIN_D = "#c98f6a", GOWN = "#cddcea", DRAPE = "#1f7488";

  // One heartbeat of ECG, 45 px wide, returns to baseline
  var BEAT = "l8 0 l3 -3 l3 3 l4 0 l2 4 l3 -26 l3 30 l2 -8 l6 0 l4 -6 l4 6 l3 0";

  function bodyMarkup() {
    return '' +
      '<defs>' +
        '<linearGradient id="ab-drape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a8aa0"/><stop offset="1" stop-color="' + DRAPE + '"/></linearGradient>' +
        '<linearGradient id="ab-gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2ecf5"/><stop offset="1" stop-color="#b9cbdc"/></linearGradient>' +
        '<filter id="ab-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<rect x="-400" y="-300" width="1600" height="1100" fill="#0a1233"/>' +
      '<g stroke="#16245a" stroke-width="1">' +
        '<path d="M0 100H800M0 200H800M0 300H800M0 400H800M100 0V500M200 0V500M300 0V500M400 0V500M500 0V500M600 0V500M700 0V500"/>' +
      '</g>' +
      // IV pole + bag + line
      '<g id="a-iv" opacity="0">' +
        '<line x1="292" y1="6" x2="292" y2="140" stroke="#5b7392" stroke-width="3"/>' +
        '<line x1="270" y1="12" x2="314" y2="12" stroke="#5b7392" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="276" y="16" width="32" height="46" rx="8" fill="#dbeafe" fill-opacity=".85" stroke="#93c5fd"/>' +
        '<rect x="280" y="34" width="24" height="24" rx="5" fill="#93c5fd" fill-opacity=".6"/>' +
        '<rect x="288" y="64" width="8" height="16" rx="3" fill="#e2e8f0" fill-opacity=".8"/>' +
        '<circle class="drip" cx="292" cy="68" r="1.8" fill="#60a5fa"/>' +
        '<path id="a-iv-tube" d="M292 80 C292 120 318 132 330 150 C336 158 340 162 341 166" fill="none" stroke="#e2e8f0" stroke-width="2" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '</g>' +
      // Monitor
      '<g id="a-monitor" opacity="0">' +
        '<rect x="560" y="18" width="210" height="108" rx="12" fill="#04101f" stroke="#2b4f78" stroke-width="2"/>' +
        '<path class="ecg-sweep" d="M572 62 ' + BEAT + ' ' + BEAT + ' ' + BEAT + ' ' + BEAT + '" fill="none" stroke="#34d399" stroke-width="2" stroke-linejoin="round" pathLength="100"/>' +
        '<path d="M572 104 c10 0 12 -12 22 -12 c10 0 10 12 22 12 c10 0 12 -12 22 -12 c10 0 10 12 22 12 c10 0 12 -12 22 -12 c10 0 10 12 22 12 c10 0 12 -12 22 -12 c10 0 10 12 22 12" fill="none" stroke="#38bdf8" stroke-width="1.6" opacity=".8"/>' +
        '<text x="760" y="40" text-anchor="end" fill="#34d399" font-size="13" font-weight="700" font-family="Manrope, sans-serif">HR 72</text>' +
        '<text x="760" y="86" text-anchor="end" fill="#38bdf8" font-size="11" font-weight="700" font-family="Manrope, sans-serif">SpO₂ 98%</text>' +
      '</g>' +
      // Table + arm board
      '<rect x="60" y="150" width="700" height="186" rx="24" fill="#17324f" stroke="#26496f" stroke-width="2"/>' +
      '<rect x="72" y="160" width="676" height="166" rx="18" fill="#1d3d60"/>' +
      '<rect x="168" y="300" width="100" height="192" rx="16" fill="#17324f" stroke="#26496f" stroke-width="2"/>' +
      '<rect x="178" y="312" width="80" height="170" rx="12" fill="#1d3d60"/>' +
      // Legs under the sterile drape, with the groin window
      '<path d="M466 186 L742 196 C760 197 768 210 768 222 L768 262 C768 276 760 286 742 287 L466 300 Z" fill="url(#ab-drape)"/>' +
      '<path d="M520 243 L762 242" stroke="#155e6e" stroke-width="2"/>' +
      '<ellipse cx="754" cy="219" rx="12" ry="17" fill="#3197ad"/><ellipse cx="754" cy="265" rx="12" ry="17" fill="#3197ad"/>' +
      '<rect id="a-groin" x="510" y="265" width="40" height="27" rx="6" fill="' + SKIN + '" stroke="#155e6e" stroke-width="2"/>' +
      // Torso (gown)
      '<path d="M160 196 C160 180 176 176 196 176 L470 182 C488 183 498 196 498 210 L498 272 C498 288 488 300 470 301 L196 307 C176 307 160 302 160 288 Z" fill="url(#ab-gown)"/>' +
      '<g fill="#9fb6cc" opacity=".55"><circle cx="250" cy="215" r="2"/><circle cx="300" cy="260" r="2"/><circle cx="350" cy="214" r="2"/><circle cx="400" cy="262" r="2"/><circle cx="440" cy="222" r="2"/><circle cx="280" cy="290" r="2"/><circle cx="380" cy="292" r="2"/><circle cx="220" cy="252" r="2"/></g>' +
      '<path d="M160 226 L184 242 L160 258 Z" fill="' + SKIN + '"/>' +
      // Left arm (along the body, IV in the forearm)
      '<path d="M200 186 L238 180" stroke="url(#ab-gown)" stroke-width="32" stroke-linecap="round"/>' +
      '<path d="M232 181 C282 172 330 168 380 168" stroke="' + SKIN + '" stroke-width="25" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="397" cy="168" rx="18" ry="12" fill="' + SKIN + '"/>' +
      '<rect x="333" y="161" width="16" height="14" rx="3" fill="#f8fafc" stroke="#cbd5e1"/>' +
      // Right arm out on the arm board
      '<path d="M204 296 L210 392" stroke="' + SKIN + '" stroke-width="30" stroke-linecap="round"/>' +
      '<path d="M210 392 L216 452" stroke="' + SKIN + '" stroke-width="25" stroke-linecap="round"/>' +
      '<path d="M202 290 L205 318" stroke="url(#ab-gown)" stroke-width="35" stroke-linecap="round"/>' +
      '<ellipse cx="218" cy="474" rx="14" ry="19" fill="' + SKIN + '"/>' +
      '<ellipse cx="232" cy="466" rx="5" ry="9" fill="' + SKIN_D + '" transform="rotate(-20 232 466)"/>' +
      '<path d="M207 446 L227 445" stroke="' + SKIN_D + '" stroke-width="1.2" opacity=".7"/>' +
      // Head and neck
      '<rect x="138" y="229" width="26" height="27" fill="' + SKIN + '"/>' +
      '<ellipse cx="112" cy="242" rx="36" ry="31" fill="' + SKIN + '"/>' +
      '<path d="M112 211 C90 211 76 226 76 242 C76 258 90 273 112 273 C100 262 96 252 96 242 C96 232 100 222 112 211 Z" fill="#2d2018"/>' +
      '<ellipse cx="112" cy="210" rx="6" ry="4" fill="' + SKIN_D + '"/><ellipse cx="112" cy="274" rx="6" ry="4" fill="' + SKIN_D + '"/>' +
      '<ellipse cx="140" cy="242" rx="5" ry="4" fill="' + SKIN_D + '"/>' +
      // ECG electrodes with leads to the monitor
      '<g id="a-ecg" opacity="0">' +
        '<path d="M230 200 C300 120 450 96 560 80 M230 284 C330 150 460 110 560 92 M424 196 C470 150 520 110 560 100" fill="none" stroke="#64748b" stroke-width="1.4"/>' +
        '<g class="a-el"><circle cx="230" cy="200" r="8" fill="#f1f5f9" stroke="#94a3b8"/><circle cx="230" cy="200" r="2.5" fill="#64748b"/></g>' +
        '<g class="a-el"><circle cx="230" cy="284" r="8" fill="#f1f5f9" stroke="#94a3b8"/><circle cx="230" cy="284" r="2.5" fill="#64748b"/></g>' +
        '<g class="a-el"><circle cx="424" cy="196" r="8" fill="#f1f5f9" stroke="#94a3b8"/><circle cx="424" cy="196" r="2.5" fill="#64748b"/></g>' +
      '</g>' +
      // "See-through" arteries for the catheter route
      '<g id="a-vessels" opacity="0" fill="none" stroke-linecap="round" stroke="#ef5350">' +
        '<path d="M268 214 C262 232 274 252 300 262 C318 268 334 258 340 240 C346 222 336 204 318 204 C304 204 296 210 288 208 C280 206 272 208 268 214 Z" fill="#c53030" fill-opacity=".85" stroke="none"/>' +
        '<path d="M284 248 C262 250 242 252 228 246 C212 240 214 226 232 226 L470 236" stroke-width="9" opacity=".85"/>' +
        '<path d="M222 248 C214 258 206 268 202 282 L206 300 L210 392 L216 452" stroke-width="4" opacity=".85"/>' +
        '<path d="M470 236 C490 246 505 262 528 278 L740 284 M470 236 C490 228 505 216 528 210 L740 204" stroke-width="5" opacity=".85"/>' +
        '<path d="M226 244 C200 244 172 244 150 244 M232 228 C222 214 212 200 202 190" stroke-width="3" opacity=".7"/>' +
      '</g>' +
      // Entry-site rings
      '<circle id="a-ring-radial" cx="216" cy="446" r="12" fill="none" stroke="#f5c542" stroke-width="2.5" opacity="0"/>' +
      '<circle id="a-ring-femoral" cx="528" cy="278" r="12" fill="none" stroke="#f5c542" stroke-width="2.5" opacity="0"/>' +
      // Sheaths seen from outside
      '<g id="a-sheath-radial" opacity="0"><line x1="217" y1="462" x2="214" y2="438" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/><rect x="211" y="460" width="13" height="12" rx="3" fill="#14b8a6"/><path d="M222 466 C236 470 244 480 250 492" stroke="#94a3b8" stroke-width="1.6" fill="none"/></g>' +
      '<g id="a-sheath-femoral" opacity="0"><line x1="548" y1="290" x2="530" y2="279" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/><rect x="545" y="285" width="13" height="12" rx="3" fill="#14b8a6"/></g>' +
      // Catheter routes (drawn with stroke-dashoffset) and the travelling tip
      '<path id="a-path-radial" d="M216 452 L210 392 L206 300 L202 282 C206 268 214 258 222 250 C236 251 262 250 282 249" fill="none" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '<path id="a-path-femoral" d="M528 278 C505 262 490 246 470 236 L232 227 C214 228 212 242 228 246 C244 251 262 250 282 249" fill="none" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '<circle id="a-tip" cx="216" cy="452" r="4" fill="#f5c542" filter="url(#ab-glow)" opacity="0"/>' +
      // Haemostasis seen from outside: wristband or fingers pressing on the groin
      '<g id="a-band-radial" opacity="0"><rect x="196" y="434" width="42" height="18" rx="5" fill="#14b8a6"/><ellipse cx="217" cy="443" rx="10" ry="6" fill="#99f6e4"/><rect x="236" y="438" width="12" height="10" rx="2" fill="#0f766e"/></g>' +
      '<g id="a-band-femoral" opacity="0"><circle cx="528" cy="278" r="13" fill="#f8fafc"/><g fill="' + SKIN + '" stroke="' + SKIN_D + '"><rect x="520" y="248" width="9" height="30" rx="4.5"/><rect x="530" y="246" width="9" height="32" rx="4.5"/><rect x="540" y="250" width="9" height="28" rx="4.5"/></g></g>';
  }

  function insetMarkup() {
    var cx = 590, cy = 250, r = 168;
    return '' +
      '<defs>' +
        '<clipPath id="ai-clip"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' +
        '<linearGradient id="ai-lumen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c0b12"/><stop offset=".5" stop-color="#8a1c24"/><stop offset="1" stop-color="#3f0910"/></linearGradient>' +
        '<filter id="ai-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity=".5"/></filter>' +
      '</defs>' +
      '<line id="a-leader" x1="272" y1="250" x2="' + (cx - r) + '" y2="250" stroke="#f5c542" stroke-width="2" stroke-dasharray="5 5" opacity="0"/>' +
      '<g id="a-inset" opacity="0">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0e2745" filter="url(#ai-shadow)"/>' +
        '<g clip-path="url(#ai-clip)">' +
          '<rect x="400" y="80" width="400" height="50" fill="#0e2745"/>' +
          '<rect x="400" y="130" width="400" height="22" fill="#d99572"/>' +
          '<rect x="400" y="152" width="400" height="24" fill="#eab08f"/>' +
          '<rect x="400" y="176" width="400" height="260" fill="#f3cdb0"/>' +
          '<g fill="#f7dcc6" opacity=".7"><circle cx="470" cy="210" r="14"/><circle cx="520" cy="228" r="11"/><circle cx="650" cy="205" r="15"/><circle cx="700" cy="232" r="10"/><circle cx="480" cy="380" r="16"/><circle cx="560" cy="392" r="12"/><circle cx="660" cy="384" r="15"/></g>' +
          // artery
          '<rect x="400" y="264" width="400" height="72" fill="#c0504a"/>' +
          '<rect x="400" y="264" width="400" height="10" fill="#e07a73" opacity=".7"/>' +
          '<rect x="400" y="275" width="400" height="50" fill="url(#ai-lumen)"/>' +
          '<g id="ai-cells"></g>' +
          // numbing bleb
          '<ellipse id="a-bleb" cx="558" cy="168" rx="30" ry="15" fill="#7dd3fc" opacity=".5"/>' +
          // puncture needle, sheath
          '<path id="a-needle" d="M760 50 L532 278" stroke="#e2e8f0" stroke-width="3" fill="none" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
          '<g id="a-sh" fill="none" stroke-linecap="round">' +
            '<path d="M780 30 L540 270 C528 282 514 292 490 296 L410 300" stroke="#64748b" stroke-width="15" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
            '<path d="M780 30 L540 270 C528 282 514 292 490 296 L410 300" stroke="#e2e8f0" stroke-width="10" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
          '</g>' +
          // puncture hole in the artery wall, and the plug that seals it
          '<ellipse id="a-hole" cx="547" cy="268" rx="7" ry="4" fill="#3f0910" opacity="0"/>' +
          '<ellipse id="a-seal" cx="547" cy="267" rx="8" ry="4" fill="#fde68a" opacity="0"/>' +
          // anaesthetic syringe: outer group places + angles it, inner group slides along the needle
          '<g transform="translate(558 168) rotate(140) translate(-70 0)"><g id="a-syr">' +
            '<line x1="0" y1="0" x2="70" y2="0" stroke="#e2e8f0" stroke-width="2.2"/>' +
            '<rect x="-14" y="-5" width="14" height="10" rx="2" fill="#94a3b8"/>' +
            '<rect x="-134" y="-12" width="120" height="24" rx="4" fill="#e2e8f0" fill-opacity=".35" stroke="#cbd5e1" stroke-width="2"/>' +
            '<rect x="-100" y="-9" width="84" height="18" rx="2" fill="#7dd3fc" fill-opacity=".7"/>' +
            '<rect x="-108" y="-11" width="8" height="22" fill="#475569"/>' +
            '<rect x="-180" y="-3" width="74" height="6" fill="#94a3b8"/>' +
            '<rect x="-186" y="-13" width="8" height="26" rx="2" fill="#94a3b8"/>' +
          '</g></g>' +
          // wristband (radial) or fingers (femoral) pressing down
          '<g id="a-press-radial" opacity="0">' +
            '<rect x="440" y="88" width="300" height="28" rx="8" fill="#14b8a6"/>' +
            '<ellipse id="a-bladder" cx="562" cy="116" rx="64" ry="14" fill="#99f6e4" opacity=".9"/>' +
          '</g>' +
          '<g id="a-press-femoral" opacity="0" fill="#e5b48f" stroke="#c98f6a" stroke-width="2">' +
            '<rect x="512" y="10" width="34" height="118" rx="17"/><rect x="550" y="0" width="34" height="128" rx="17"/><rect x="588" y="14" width="34" height="114" rx="17"/>' +
          '</g>' +
          '<text x="520" y="147" text-anchor="middle" font-size="14" font-weight="700" fill="#7c2d12" font-family="Manrope, sans-serif">Skin</text>' +
          '<text x="700" y="358" text-anchor="end" font-size="14" font-weight="700" fill="#7f1d1d" font-family="Manrope, sans-serif">Artery</text>' +
        '</g>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#f5c542" stroke-width="3"/>' +
        '<text x="' + cx + '" y="' + (cy - r - 12) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#e6eef7" font-family="Manrope, sans-serif">Close-up under the skin</text>' +
      '</g>';
  }

  // Heart close-up: coronary arteries (left system filled by the catheter in the left main)
  var V = {
    lm: "M424 214 C438 218 450 222 462 228",
    lad: "M462 228 C470 262 474 300 476 340 C478 390 480 440 474 498",
    d1: "M471 296 C490 312 508 326 526 350",
    d2: "M476 374 C494 390 508 404 518 430",
    lcx: "M462 228 C492 228 518 244 534 270 C544 288 548 310 546 336",
    om: "M538 286 C526 310 522 334 526 364",
    rca: "M390 216 C352 222 322 238 300 268 C278 300 270 340 278 382 C288 424 318 456 360 474",
    am: "M286 338 C306 350 326 356 348 358",
  };
  var HEART = "M300 205 C238 214 220 300 248 368 C280 440 372 482 474 498 C512 456 548 392 552 318 C556 250 520 206 464 204 C428 202 398 214 366 208 C344 204 322 202 300 205 Z";

  function heartMarkup() {
    var base = "", glow = "", core = "";
    Object.keys(V).forEach(function (k) {
      base += '<path d="' + V[k] + '" stroke="#7f1d1d" stroke-width="10" opacity=".55"/><path d="' + V[k] + '" stroke="#ea8f8f" stroke-width="7"/>';
      if (k !== "rca" && k !== "am") {
        glow += '<path class="dye-' + k + '" d="' + V[k] + '" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>';
        core += '<path class="dye-' + k + '" d="' + V[k] + '" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>';
      }
    });
    return '' +
      '<defs>' +
        '<radialGradient id="ah-fill" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#b8484b"/><stop offset=".6" stop-color="#8a2a30"/><stop offset="1" stop-color="#5a161d"/></radialGradient>' +
        '<filter id="ah-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>' +
        '<filter id="ah-noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .55 0"/></filter>' +
        '<radialGradient id="ah-vig" cx="50%" cy="50%" r="65%"><stop offset=".55" stop-color="#2b2f36" stop-opacity="0"/><stop offset="1" stop-color="#2b2f36" stop-opacity=".85"/></radialGradient>' +
      '</defs>' +
      '<rect width="800" height="500" fill="#0a1233"/>' +
      '<g id="ah-color">' +
        '<path d="M446 -10 C446 60 436 130 418 192" stroke="#c95b56" stroke-width="64" fill="none"/>' +
        '<ellipse cx="408" cy="206" rx="46" ry="24" fill="#c95b56"/>' +
        '<path d="' + HEART + '" fill="url(#ah-fill)"/>' +
        '<path d="M262 260 C246 300 250 340 268 372" stroke="#e7a3a3" stroke-opacity=".18" stroke-width="16" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      '<g id="ah-xray" opacity="0">' +
        '<rect width="800" height="500" fill="#b5b9be"/>' +
        '<g fill="none" stroke="#9ca1a7" stroke-width="12" opacity=".6"><path d="M90 120 C250 60 550 60 720 130"/><path d="M70 220 C250 150 560 150 740 230"/><path d="M60 330 C240 260 560 260 750 340"/><path d="M80 440 C260 370 560 370 740 450"/></g>' +
        '<path d="' + HEART + '" fill="#a3a8ae"/>' +
        '<rect width="800" height="500" filter="url(#ah-noise)" opacity=".22"/>' +
        '<rect width="800" height="500" fill="url(#ah-vig)"/>' +
      '</g>' +
      '<g id="ah-base" fill="none" stroke-linecap="round">' + base + '</g>' +
      '<g id="ah-glow" fill="none" stroke-linecap="round" stroke="#99f6e4" stroke-width="14" filter="url(#ah-blur)" opacity=".9">' + glow + '</g>' +
      '<g id="ah-core" fill="none" stroke-linecap="round" stroke="#ffffff" stroke-width="6.5">' + core + '</g>' +
      '<ellipse id="ah-puff" cx="416" cy="210" rx="24" ry="13" fill="#e0fffb" opacity="0"/>' +
      '<g id="ah-plaque" fill="#f5c542"><ellipse cx="472.4" cy="330" rx="2.6" ry="12"/><ellipse cx="478.4" cy="333" rx="2.4" ry="10"/></g>' +
      '<path id="ah-cath" d="M446 -10 C446 70 436 140 420 182 C412 202 414 212 424 214" fill="none" stroke="#e2e8f0" stroke-width="4.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '<g id="ah-cine" opacity="0" font-family="ui-monospace, Consolas, monospace" font-size="15" fill="#1f2937" font-weight="700">' +
        '<text x="24" y="34">LAO 40°  CRA 25°</text><text x="24" y="478">15 fps · cine</text>' +
        '<circle cx="726" cy="29" r="6" fill="#dc2626"/><text x="740" y="34">REC</text>' +
      '</g>' +
      '<g id="ah-marker" opacity="0">' +
        '<circle class="pulse-ring" cx="475.5" cy="331" r="18" fill="none" stroke="#f59e0b" stroke-width="3"/>' +
        '<circle cx="475.5" cy="331" r="18" fill="none" stroke="#f59e0b" stroke-width="3"/>' +
        '<path d="M492 322 L560 292" stroke="#f59e0b" stroke-width="2.5"/>' +
        '<rect x="556" y="270" width="190" height="40" rx="20" fill="#f59e0b"/>' +
        '<text x="651" y="296" text-anchor="middle" font-size="17" font-weight="800" fill="#0a1233" font-family="Manrope, sans-serif">Blockage, about 85%</text>' +
      '</g>';
  }

  CV.angiogram = function (canvas) {
    var NS = "http://www.w3.org/2000/svg";
    function layer(cls, vb, markup) {
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", vb);
      s.setAttribute("class", cls);
      s.setAttribute("aria-hidden", "true");
      s.setAttribute("focusable", "false");
      s.innerHTML = markup;
      canvas.appendChild(s);
      return s;
    }
    var body = layer("sc-body", CAM.base, bodyMarkup());
    var heart = layer("sc-heart", "0 0 800 500", heartMarkup());
    var inset = layer("sc-inset", "0 0 800 500", insetMarkup());
    heart.style.opacity = 0;
    inset.style.pointerEvents = "none";

    function $(id) { return canvas.querySelector("#" + id); }
    var q = function (sel) { return canvas.querySelectorAll(sel); };

    // Blood keeps flowing in the close-up artery (it stays open under the band)
    var insetFlow = new CV.FlowField($("ai-cells"), {
      x0: 400, x1: 790, edges: function () { return [276, 324]; }, count: 16, speed: 90, refW: 48,
    });
    CV.watch(canvas, insetFlow);

    var access = "radial";
    var prog = { p: 0 };

    var E = {
      iv: $("a-iv"), ivTube: $("a-iv-tube"), monitor: $("a-monitor"), ecg: $("a-ecg"), electrodes: q(".a-el"),
      vessels: $("a-vessels"), tip: $("a-tip"), inset: $("a-inset"), leader: $("a-leader"),
      syr: $("a-syr"), bleb: $("a-bleb"), needle: $("a-needle"), sheath: q("#a-sh path"), hole: $("a-hole"), seal: $("a-seal"),
      bladder: $("a-bladder"),
      dye: function (k) { return q(".dye-" + k); }, dyeAll: q("#ah-glow path, #ah-core path"),
      base: $("ah-base"), glow: $("ah-glow"), core: q("#ah-core path"), xray: $("ah-xray"), cine: $("ah-cine"),
      plaque: q("#ah-plaque ellipse"), cath: $("ah-cath"), puff: $("ah-puff"), marker: $("ah-marker"),
    };
    function site() {
      return {
        ring: $("a-ring-" + access), sheath: $("a-sheath-" + access), path: $("a-path-" + access),
        band: $("a-band-" + access), press: $("a-press-" + access), cam: CAM[access],
      };
    }

    function reset() {
      var all = ["radial", "femoral"];
      gsap.set(body, { attr: { viewBox: CAM.base } });
      gsap.set([E.iv, E.monitor, E.ecg, E.vessels, E.tip, E.inset, E.leader, E.hole, E.seal, E.marker, E.cine, E.xray, E.puff], { opacity: 0 });
      gsap.set(E.monitor, { y: -12 });
      gsap.set(E.electrodes, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(E.ivTube, { strokeDashoffset: 1 });
      gsap.set(E.inset, { svgOrigin: "590 250", scale: 0.85 });
      gsap.set(E.syr, { x: -140 });
      gsap.set(E.bleb, { scale: 0, opacity: 0.5, transformOrigin: "50% 50%" });
      gsap.set(E.needle, { strokeDashoffset: 1, opacity: 1 });
      gsap.set(E.sheath, { strokeDashoffset: 1 });
      gsap.set(E.bladder, { scaleY: 0.2, transformOrigin: "50% 0%" });
      gsap.set(E.seal, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set(E.hole, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set(heart, { opacity: 0 });
      gsap.set(E.dyeAll, { strokeDashoffset: 1 });
      gsap.set(E.cath, { strokeDashoffset: 1, stroke: "#e2e8f0" });
      gsap.set(E.core, { stroke: "#ffffff" });
      gsap.set(E.plaque, { fill: "#f5c542" });
      gsap.set([E.base, E.glow], { opacity: 1 });
      gsap.set(E.glow, { opacity: 0.9 });
      gsap.set(E.marker, { svgOrigin: "475.5 331", scale: 0.6 });
      all.forEach(function (a) {
        gsap.set([$("a-ring-" + a), $("a-sheath-" + a), $("a-band-" + a), $("a-press-" + a)], { opacity: 0 });
        gsap.set($("a-press-" + a), { y: -50 });
        gsap.set($("a-path-" + a), { strokeDashoffset: 1 });
      });
      prog.p = 0;
    }

    function build(tl) {
      reset();
      var S = site();
      var len = S.path.getTotalLength();
      function drawCath() {
        S.path.style.strokeDashoffset = 1 - prog.p;
        var pt = S.path.getPointAtLength(prog.p * len);
        E.tip.setAttribute("cx", pt.x);
        E.tip.setAttribute("cy", pt.y);
      }
      drawCath();

      // 1 · Preparation: monitor, ECG pads, IV line
      tl.addLabel("s0")
        .to(E.monitor, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to(E.ecg, { opacity: 1, duration: 0.5 }, "<0.2")
        .to(E.electrodes, { scale: 1, duration: 0.45, stagger: 0.15, ease: "back.out(2.2)" }, "<")
        .to(E.iv, { opacity: 1, duration: 0.6 }, "<0.3")
        .to(E.ivTube, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, "<0.2")
        .addLabel("e0");

      // 2 · Local anaesthesia at the entry site
      tl.addLabel("s1")
        .to(body, { attr: { viewBox: S.cam }, duration: 1.4, ease: "power2.inOut" })
        .to(S.ring, { opacity: 1, duration: 0.4 }, "-=0.3")
        .to([E.inset, E.leader], { opacity: 1, duration: 0.6 }, "<")
        .to(E.inset, { scale: 1, duration: 0.6, ease: "power2.out" }, "<")
        .to(E.syr, { x: 0, duration: 0.9, ease: "power2.out" })
        .to(E.bleb, { scale: 1, duration: 1.1, ease: "power1.out" })
        .to(E.syr, { x: -170, duration: 0.7, ease: "power2.in" }, "+=0.15")
        .addLabel("e1");

      // 3 · Needle, then the sheath slides into the artery
      tl.addLabel("s2")
        .to(E.bleb, { opacity: 0, duration: 0.8 })
        .to(E.needle, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, "<")
        .to(E.sheath, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, "+=0.2")
        .to(E.needle, { opacity: 0, duration: 0.4 }, "<0.3")
        .to(S.sheath, { opacity: 1, duration: 0.5 }, "<")
        .addLabel("e2");

      // 4 · Catheter travels to the heart
      tl.addLabel("s3")
        .to([E.inset, E.leader], { opacity: 0, duration: 0.5 })
        .to(E.inset, { scale: 0.9, duration: 0.5 }, "<")
        .to(S.ring, { opacity: 0, duration: 0.4 }, "<")
        .to(body, { attr: { viewBox: CAM.base }, duration: 1.2, ease: "power2.inOut" }, "<")
        .to(E.vessels, { opacity: 1, duration: 0.8 }, "-=0.5")
        .to(E.tip, { opacity: 1, duration: 0.2 })
        .to(prog, { p: 1, duration: 3, ease: "power1.inOut", onUpdate: drawCath })
        .to(body, { attr: { viewBox: CAM.chest }, duration: 1.2, ease: "power2.inOut" }, "-=0.5")
        .to(heart, { opacity: 1, duration: 0.7 }, "-=0.4")
        .to(E.cath, { strokeDashoffset: 0, duration: 1, ease: "power1.out" }, "-=0.3")
        .addLabel("e3");

      // 5 · Dye fills the left coronary tree
      tl.addLabel("s4")
        .to(E.puff, { opacity: 0.85, duration: 0.25 })
        .to(E.dye("lm"), { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<")
        .to(E.puff, { opacity: 0, duration: 0.9 }, ">")
        .to(E.dye("lad"), { strokeDashoffset: 0, duration: 1.8, ease: "none" }, "<")
        .to(E.dye("lcx"), { strokeDashoffset: 0, duration: 1.2, ease: "none" }, "<")
        .to(E.dye("d1"), { strokeDashoffset: 0, duration: 0.7, ease: "none" }, "<0.45")
        .to(E.dye("om"), { strokeDashoffset: 0, duration: 0.7, ease: "none" }, "<0.05")
        .to(E.dye("d2"), { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<0.45")
        .addLabel("e4");

      // 6 · X-ray view, blockage marked
      tl.addLabel("s5")
        .to(E.xray, { opacity: 1, duration: 1 })
        .to(E.base, { opacity: 0, duration: 1 }, "<")
        .to(E.glow, { opacity: 0, duration: 1 }, "<")
        .to(E.core, { stroke: "#23272e", duration: 1 }, "<")
        .to(E.cath, { stroke: "#2b3038", duration: 1 }, "<")
        .to(E.plaque, { fill: "#a3a8ae", duration: 1 }, "<")
        .to(E.cine, { opacity: 1, duration: 0.6 }, "-=0.3")
        .to(E.marker, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, "+=0.2")
        .addLabel("e5");

      // 7 · Catheter out, sheath out, pressure to seal
      tl.addLabel("s6")
        .to(E.marker, { opacity: 0, duration: 0.4 })
        .to(heart, { opacity: 0, duration: 0.8 }, "<")
        .to(body, { attr: { viewBox: S.cam }, duration: 1.4, ease: "power2.inOut" }, "<")
        .to(prog, { p: 0, duration: 1.6, ease: "power1.inOut", onUpdate: drawCath }, "<0.3")
        .to(E.vessels, { opacity: 0, duration: 0.6 }, "-=0.4")
        .to(E.tip, { opacity: 0, duration: 0.2 }, "<")
        .to([E.inset, E.leader], { opacity: 1, duration: 0.5 })
        .to(E.inset, { scale: 1, duration: 0.5 }, "<")
        .to(E.sheath, { strokeDashoffset: 1, duration: 1, ease: "power1.in" })
        .to(S.sheath, { opacity: 0, duration: 0.4 }, "<0.5")
        .to(E.hole, { opacity: 1, duration: 0.2 }, "<0.3")
        .to(S.press, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to(E.bladder, { scaleY: 1, duration: 0.6, ease: "power1.out" }, "<0.4")
        .to(S.band, { opacity: 1, duration: 0.6 }, "<")
        .to(E.hole, { scale: 0.3, opacity: 0, duration: 1.2 }, "+=0.2")
        .to(E.seal, { opacity: 1, duration: 0.8 }, "<0.3")
        .addLabel("e6");
    }

    // Groin window only stands out when the femoral route is chosen
    function setAccess(a) {
      access = a;
      $("a-groin").setAttribute("stroke", a === "femoral" ? "#f5c542" : "#155e6e");
    }

    return { build: build, setAccess: setAccess };
  };
})();
