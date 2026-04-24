/**
 * AI Impact Maine — Custom Brand Animations v6
 * All animations use only transform + opacity (GPU composited)
 * Works smoothly on mobile and desktop
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared styles
const WRAP_STYLE = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;';

// ── Custom Animations ─────────────────────────────────────────────────────
// All animations use only transform + opacity for GPU compositing
const ANIMATIONS = {
  // TRAINING — Lightbulb with sparkles of knowledge
  training: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes glow{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
      @keyframes sparkle1{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
      @keyframes sparkle2{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
      @keyframes rise{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(-20px);opacity:0}}
      .bulb{animation:glow 2.5s ease-in-out infinite;transform-origin:60px 50px;will-change:transform,opacity}
      .sp1{animation:sparkle1 2s ease-in-out infinite;transform-origin:30px 30px}
      .sp2{animation:sparkle2 2s ease-in-out .5s infinite;transform-origin:90px 35px}
      .sp3{animation:sparkle1 2s ease-in-out 1s infinite;transform-origin:25px 70px}
      .sp4{animation:sparkle2 2s ease-in-out .3s infinite;transform-origin:95px 75px}
      .r1{animation:rise 3s ease-out infinite;transform-origin:60px 90px}
      .r2{animation:rise 3s ease-out 1s infinite;transform-origin:60px 90px}
    </style>
    <g class="bulb">
      <path d="M60 30 Q45 30 42 48 Q42 58 50 65 L50 72 L70 72 L70 65 Q78 58 78 48 Q75 30 60 30 Z" fill="#3d7f8a" stroke="#c8b89a" stroke-width="2"/>
      <rect x="52" y="75" width="16" height="4" rx="1" fill="#1a2744"/>
      <rect x="54" y="82" width="12" height="3" rx="1" fill="#1a2744"/>
      <path d="M52 52 L55 58 L52 58 L58 66" stroke="#c8b89a" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="30" cy="30" r="3" fill="#c8b89a" class="sp1"/>
    <circle cx="90" cy="35" r="3" fill="#c8b89a" class="sp2"/>
    <circle cx="25" cy="70" r="2.5" fill="#3d7f8a" class="sp3"/>
    <circle cx="95" cy="75" r="2.5" fill="#3d7f8a" class="sp4"/>
    <circle cx="45" cy="92" r="2" fill="#c8b89a" class="r1"/>
    <circle cx="75" cy="92" r="2" fill="#3d7f8a" class="r2"/>
  </svg>`,

  // AUDIT — Magnifying glass scanning over document
  audit: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes scan{0%{transform:translate(-8px,-8px)}50%{transform:translate(8px,8px)}100%{transform:translate(-8px,-8px)}}
      @keyframes glow2{0%,100%{opacity:.7}50%{opacity:1}}
      @keyframes bar1{0%,100%{transform:scaleX(.6)}50%{transform:scaleX(1)}}
      @keyframes bar2{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.75)}}
      @keyframes bar3{0%,100%{transform:scaleX(.85)}50%{transform:scaleX(.5)}}
      .mg{animation:scan 3s ease-in-out infinite;will-change:transform}
      .ring{animation:glow2 1.5s ease-in-out infinite}
      .b1{animation:bar1 2s ease-in-out infinite;transform-origin:left;will-change:transform}
      .b2{animation:bar2 2s ease-in-out .3s infinite;transform-origin:left;will-change:transform}
      .b3{animation:bar3 2s ease-in-out .6s infinite;transform-origin:left;will-change:transform}
    </style>
    <rect x="20" y="20" width="60" height="75" rx="4" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="27" y="30" width="30" height="3" rx="1.5" fill="#c8b89a"/>
    <rect x="27" y="40" width="46" height="2" rx="1" fill="#3d7f8a" class="b1"/>
    <rect x="27" y="48" width="40" height="2" rx="1" fill="#3d7f8a" class="b2"/>
    <rect x="27" y="56" width="44" height="2" rx="1" fill="#3d7f8a" class="b3"/>
    <rect x="27" y="64" width="38" height="2" rx="1" fill="#3d7f8a" class="b1"/>
    <rect x="27" y="72" width="42" height="2" rx="1" fill="#3d7f8a" class="b2"/>
    <rect x="27" y="80" width="36" height="2" rx="1" fill="#3d7f8a" class="b3"/>
    <g class="mg">
      <circle cx="85" cy="75" r="16" fill="rgba(200,184,154,0.1)" stroke="#c8b89a" stroke-width="3" class="ring"/>
      <line x1="96" y1="86" x2="105" y2="95" stroke="#c8b89a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="85" cy="75" r="6" fill="#c8b89a" opacity=".3"/>
    </g>
  </svg>`,

  // SUPPORT — Chat bubbles floating with active dots
  support: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @keyframes dot1{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes dot2{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes dot3{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      .b1{animation:float1 3s ease-in-out infinite;transform-origin:center;will-change:transform}
      .b2{animation:float2 3s ease-in-out 1s infinite;transform-origin:center;will-change:transform}
      .d1{animation:dot1 1.4s ease-in-out infinite;transform-origin:center;will-change:transform,opacity}
      .d2{animation:dot2 1.4s ease-in-out .2s infinite;transform-origin:center;will-change:transform,opacity}
      .d3{animation:dot3 1.4s ease-in-out .4s infinite;transform-origin:center;will-change:transform,opacity}
    </style>
    <g class="b1">
      <path d="M20 30 L65 30 Q72 30 72 37 L72 58 Q72 65 65 65 L35 65 L25 75 L28 65 Q20 65 20 58 Z" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
      <circle cx="36" cy="47" r="3" fill="#c8b89a" class="d1"/>
      <circle cx="46" cy="47" r="3" fill="#c8b89a" class="d2"/>
      <circle cx="56" cy="47" r="3" fill="#c8b89a" class="d3"/>
    </g>
    <g class="b2">
      <path d="M100 55 L55 55 Q48 55 48 62 L48 82 Q48 89 55 89 L85 89 L95 99 L92 89 Q100 89 100 82 Z" fill="#3d7f8a" stroke="#c8b89a" stroke-width="2"/>
      <rect x="58" y="68" width="32" height="3" rx="1.5" fill="white" opacity=".8"/>
      <rect x="58" y="76" width="24" height="3" rx="1.5" fill="white" opacity=".6"/>
    </g>
  </svg>`,

  // FOUNDER — Building with windows lighting up
  founder: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes lite1{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes lite2{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes lite3{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes lite4{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes flag{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
      .w1{animation:lite1 2s ease-in-out infinite}
      .w2{animation:lite2 2s ease-in-out .3s infinite}
      .w3{animation:lite3 2s ease-in-out .6s infinite}
      .w4{animation:lite4 2s ease-in-out .9s infinite}
      .w5{animation:lite1 2s ease-in-out 1.2s infinite}
      .w6{animation:lite2 2s ease-in-out 1.5s infinite}
      .flag{animation:flag 2s ease-in-out infinite;transform-origin:60px 20px;will-change:transform}
    </style>
    <rect x="24" y="40" width="72" height="60" rx="2" fill="#1a2744"/>
    <rect x="24" y="32" width="72" height="12" rx="2" fill="#243558"/>
    <rect x="32" y="48" width="10" height="9" rx="1" fill="#c8b89a" class="w1"/>
    <rect x="48" y="48" width="10" height="9" rx="1" fill="#3d7f8a" class="w2"/>
    <rect x="64" y="48" width="10" height="9" rx="1" fill="#3d7f8a" class="w3"/>
    <rect x="80" y="48" width="10" height="9" rx="1" fill="#c8b89a" class="w4"/>
    <rect x="32" y="62" width="10" height="9" rx="1" fill="#3d7f8a" class="w5"/>
    <rect x="48" y="62" width="10" height="9" rx="1" fill="#c8b89a" class="w6"/>
    <rect x="64" y="62" width="10" height="9" rx="1" fill="#c8b89a" class="w1"/>
    <rect x="80" y="62" width="10" height="9" rx="1" fill="#3d7f8a" class="w2"/>
    <rect x="32" y="76" width="10" height="9" rx="1" fill="#c8b89a" class="w3"/>
    <rect x="48" y="76" width="10" height="9" rx="1" fill="#3d7f8a" class="w4"/>
    <rect x="64" y="76" width="10" height="9" rx="1" fill="#3d7f8a" class="w5"/>
    <rect x="80" y="76" width="10" height="9" rx="1" fill="#c8b89a" class="w6"/>
    <rect x="55" y="90" width="10" height="10" fill="#3d7f8a" opacity=".6"/>
    <g class="flag">
      <line x1="60" y1="20" x2="60" y2="32" stroke="#c8b89a" stroke-width="1.5"/>
      <path d="M60 20 L75 23 L60 27 Z" fill="#c8b89a"/>
    </g>
  </svg>`,

  // KEYNOTE — Microphone with sound waves
  keynote: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes wave1{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}
      @keyframes wave2{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.8);opacity:0}}
      .w1{animation:wave1 2s ease-out infinite;transform-origin:60px 45px;will-change:transform,opacity}
      .w2{animation:wave2 2s ease-out .7s infinite;transform-origin:60px 45px;will-change:transform,opacity}
    </style>
    <circle cx="60" cy="45" r="20" fill="none" stroke="#3d7f8a" stroke-width="1.5" class="w1"/>
    <circle cx="60" cy="45" r="20" fill="none" stroke="#3d7f8a" stroke-width="1.5" class="w2"/>
    <rect x="52" y="30" width="16" height="32" rx="8" fill="#1a2744" stroke="#c8b89a" stroke-width="2"/>
    <rect x="56" y="36" width="8" height="2" rx="1" fill="#c8b89a" opacity=".6"/>
    <rect x="56" y="42" width="8" height="2" rx="1" fill="#c8b89a" opacity=".6"/>
    <rect x="56" y="48" width="8" height="2" rx="1" fill="#c8b89a" opacity=".6"/>
    <path d="M40 60 Q40 80 60 80 Q80 80 80 60" stroke="#1a2744" stroke-width="3" fill="none" stroke-linecap="round"/>
    <line x1="60" y1="80" x2="60" y2="95" stroke="#1a2744" stroke-width="3" stroke-linecap="round"/>
    <line x1="48" y1="95" x2="72" y2="95" stroke="#1a2744" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  // PANEL — Three figures in conversation
  panel: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes talk1{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      @keyframes talk2{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      @keyframes talk3{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .p1{animation:talk1 2s ease-in-out infinite;transform-origin:25px 50px;will-change:transform}
      .p2{animation:talk2 2s ease-in-out .7s infinite;transform-origin:60px 45px;will-change:transform}
      .p3{animation:talk3 2s ease-in-out 1.4s infinite;transform-origin:95px 50px;will-change:transform}
    </style>
    <g class="p1">
      <circle cx="25" cy="42" r="9" fill="#3d7f8a"/>
      <rect x="15" y="54" width="20" height="22" rx="5" fill="#3d7f8a"/>
    </g>
    <g class="p2">
      <circle cx="60" cy="38" r="11" fill="#1a2744" stroke="#c8b89a" stroke-width="2"/>
      <rect x="46" y="52" width="28" height="26" rx="6" fill="#1a2744" stroke="#c8b89a" stroke-width="2"/>
    </g>
    <g class="p3">
      <circle cx="95" cy="42" r="9" fill="#c8b89a"/>
      <rect x="85" y="54" width="20" height="22" rx="5" fill="#c8b89a"/>
    </g>
    <rect x="10" y="80" width="100" height="3" rx="1.5" fill="#243558"/>
    <rect x="10" y="88" width="100" height="3" rx="1.5" fill="#243558" opacity=".5"/>
  </svg>`,

  // WORKSHOP — Laptop with rising activity bars
  workshop: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes bar1{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
      @keyframes bar2{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.6)}}
      @keyframes bar3{0%,100%{transform:scaleY(.7)}50%{transform:scaleY(1)}}
      @keyframes bar4{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(.9)}}
      .b1{animation:bar1 2s ease-in-out infinite;transform-origin:bottom;will-change:transform}
      .b2{animation:bar2 2s ease-in-out .3s infinite;transform-origin:bottom;will-change:transform}
      .b3{animation:bar3 2s ease-in-out .6s infinite;transform-origin:bottom;will-change:transform}
      .b4{animation:bar4 2s ease-in-out .9s infinite;transform-origin:bottom;will-change:transform}
    </style>
    <rect x="20" y="30" width="80" height="55" rx="3" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="25" y="35" width="70" height="45" rx="1" fill="#0f1b30"/>
    <rect x="34" y="65" width="8" height="12" rx="1" fill="#3d7f8a" class="b1"/>
    <rect x="48" y="60" width="8" height="17" rx="1" fill="#c8b89a" class="b2"/>
    <rect x="62" y="55" width="8" height="22" rx="1" fill="#3d7f8a" class="b3"/>
    <rect x="76" y="58" width="8" height="19" rx="1" fill="#c8b89a" class="b4"/>
    <line x1="32" y1="42" x2="88" y2="42" stroke="#3d7f8a" stroke-width="1" opacity=".4"/>
    <rect x="32" y="46" width="24" height="2" rx="1" fill="#c8b89a" opacity=".5"/>
    <rect x="10" y="85" width="100" height="8" rx="2" fill="#243558"/>
    <rect x="50" y="88" width="20" height="2" rx="1" fill="#3d7f8a"/>
  </svg>`,

  // GOVERNANCE — Shield with checkmark drawing
  governance: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes check{0%{stroke-dashoffset:60;opacity:0}40%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
      .sh{animation:pulse 2.5s ease-in-out infinite;transform-origin:60px 60px;will-change:transform}
      .ck{stroke-dasharray:60;animation:check 2s ease-out infinite;will-change:stroke-dashoffset,opacity}
    </style>
    <g class="sh">
      <path d="M60 20 L90 32 L90 60 Q90 85 60 100 Q30 85 30 60 L30 32 Z" fill="#1a2744" stroke="#3d7f8a" stroke-width="2.5"/>
      <path d="M60 26 L84 36 L84 60 Q84 80 60 92 Q36 80 36 60 L36 36 Z" fill="#243558"/>
    </g>
    <polyline points="46,58 56,68 76,46" stroke="#c8b89a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" class="ck"/>
  </svg>`,

  // WORKFORCE — Multiple people with connecting lines
  workforce: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes link1{0%{stroke-dashoffset:30;opacity:0}50%{opacity:1}100%{stroke-dashoffset:0;opacity:.6}}
      @keyframes link2{0%{stroke-dashoffset:30;opacity:0}50%{opacity:1}100%{stroke-dashoffset:0;opacity:.6}}
      @keyframes pop1{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @keyframes pop2{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      .ln1{stroke-dasharray:30;animation:link1 2s ease-out infinite}
      .ln2{stroke-dasharray:30;animation:link2 2s ease-out .5s infinite}
      .p1{animation:pop1 2s ease-in-out infinite;transform-origin:25px 45px}
      .p2{animation:pop2 2s ease-in-out .5s infinite;transform-origin:60px 30px}
      .p3{animation:pop1 2s ease-in-out 1s infinite;transform-origin:95px 45px}
      .p4{animation:pop2 2s ease-in-out 1.5s infinite;transform-origin:60px 80px}
    </style>
    <line x1="25" y1="45" x2="60" y2="30" stroke="#3d7f8a" stroke-width="2" class="ln1"/>
    <line x1="60" y1="30" x2="95" y2="45" stroke="#3d7f8a" stroke-width="2" class="ln2"/>
    <line x1="25" y1="45" x2="60" y2="80" stroke="#3d7f8a" stroke-width="2" class="ln1"/>
    <line x1="95" y1="45" x2="60" y2="80" stroke="#3d7f8a" stroke-width="2" class="ln2"/>
    <circle cx="25" cy="45" r="10" fill="#3d7f8a" class="p1"/>
    <circle cx="60" cy="30" r="12" fill="#c8b89a" class="p2"/>
    <circle cx="95" cy="45" r="10" fill="#3d7f8a" class="p3"/>
    <circle cx="60" cy="80" r="12" fill="#1a2744" stroke="#c8b89a" stroke-width="2" class="p4"/>
  </svg>`,

  // Q&A — Speech bubble with question mark morphing
  qa: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes bubble{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes qFade{0%,50%{opacity:1}55%,100%{opacity:0}}
      @keyframes aFade{0%,50%{opacity:0}55%,100%{opacity:1}}
      .bub{animation:bubble 3s ease-in-out infinite;transform-origin:center;will-change:transform}
      .q{animation:qFade 3s ease-in-out infinite}
      .a{animation:aFade 3s ease-in-out infinite}
    </style>
    <g class="bub">
      <path d="M30 25 L90 25 Q100 25 100 35 L100 70 Q100 80 90 80 L55 80 L42 95 L46 80 Q30 80 30 70 Z" fill="#1a2744" stroke="#c8b89a" stroke-width="2.5"/>
    </g>
    <g class="q">
      <path d="M55 42 Q55 36 60 34 Q65 32 68 36 Q70 40 66 44 L62 50 L62 56" stroke="#c8b89a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="62" cy="66" r="3" fill="#c8b89a"/>
    </g>
    <g class="a">
      <path d="M52 60 L60 36 L68 60" stroke="#3d7f8a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="56" y1="52" x2="64" y2="52" stroke="#3d7f8a" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`,

  // GLOBE — Rotating earth with orbiting dots
  globe: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes pulse3{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .orb1{animation:spin 8s linear infinite;transform-origin:60px 60px;will-change:transform}
      .orb2{animation:spin 5s linear reverse infinite;transform-origin:60px 60px;will-change:transform}
      .core{animation:pulse3 2.5s ease-in-out infinite;transform-origin:60px 60px;will-change:transform}
    </style>
    <g class="core">
      <circle cx="60" cy="60" r="22" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
      <ellipse cx="60" cy="60" rx="22" ry="8" fill="none" stroke="#3d7f8a" stroke-width="1" opacity=".5"/>
      <line x1="38" y1="60" x2="82" y2="60" stroke="#3d7f8a" stroke-width="1" opacity=".5"/>
      <path d="M48 48 Q55 52 52 62 Q56 68 62 65 Q68 62 66 56 Q70 50 74 52" fill="#c8b89a" opacity=".6"/>
    </g>
    <g class="orb1">
      <circle cx="96" cy="60" r="4" fill="#c8b89a"/>
    </g>
    <g class="orb2">
      <circle cx="60" cy="18" r="3" fill="#3d7f8a"/>
    </g>
    <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="#c8b89a" stroke-width="1" stroke-dasharray="3,3" opacity=".3" transform="rotate(-20 60 60)"/>
  </svg>`,

  // CONSTRUCTION — Hard hat with crane arm swinging
  construction: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes swing{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
      .hat{animation:swing 3s ease-in-out infinite;transform-origin:60px 80px;will-change:transform}
    </style>
    <g class="hat">
      <path d="M25 65 Q25 40 60 36 Q95 40 95 65 Z" fill="#c8b89a"/>
      <path d="M25 65 Q25 55 60 55 Q95 55 95 65 Z" fill="#e8dcc0"/>
      <rect x="20" y="65" width="80" height="8" rx="2" fill="#1a2744"/>
      <rect x="54" y="40" width="12" height="6" rx="2" fill="#3d7f8a"/>
      <circle cx="40" cy="65" r="2" fill="#1a2744"/>
      <circle cx="80" cy="65" r="2" fill="#1a2744"/>
    </g>
    <rect x="52" y="80" width="16" height="3" rx="1" fill="#1a2744"/>
  </svg>`,

  // PROFESSIONAL — Briefcase with subtle glow
  professional: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes hover{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      @keyframes shine{0%,100%{opacity:.3}50%{opacity:.8}}
      .case{animation:hover 3s ease-in-out infinite;transform-origin:center;will-change:transform}
      .sh{animation:shine 2s ease-in-out infinite}
    </style>
    <g class="case">
      <rect x="26" y="45" width="68" height="50" rx="5" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
      <path d="M45 45 L45 35 Q45 30 50 30 L70 30 Q75 30 75 35 L75 45" stroke="#3d7f8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="52" y="62" width="16" height="10" rx="1" fill="#c8b89a"/>
      <line x1="26" y1="67" x2="52" y2="67" stroke="#3d7f8a" stroke-width="1.5"/>
      <line x1="68" y1="67" x2="94" y2="67" stroke="#3d7f8a" stroke-width="1.5"/>
      <rect x="35" y="80" width="50" height="2" rx="1" fill="#c8b89a" opacity=".4" class="sh"/>
    </g>
  </svg>`,

  // HEALTHCARE — Heart with pulse line
  healthcare: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes beat{0%,100%{transform:scale(1)}15%,45%{transform:scale(1.1)}30%{transform:scale(1)}}
      @keyframes pulse4{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}
      .heart{animation:beat 1.5s ease-in-out infinite;transform-origin:60px 55px;will-change:transform}
      .line{stroke-dasharray:100;animation:pulse4 2s linear infinite;will-change:stroke-dashoffset}
    </style>
    <g class="heart">
      <path d="M60 90 Q60 90 30 60 Q20 45 32 35 Q44 28 52 38 L60 48 L68 38 Q76 28 88 35 Q100 45 90 60 Z" fill="#1a2744" stroke="#c8b89a" stroke-width="2"/>
      <rect x="56" y="48" width="8" height="18" rx="1" fill="#c8b89a"/>
      <rect x="51" y="53" width="18" height="8" rx="1" fill="#c8b89a"/>
    </g>
    <polyline points="20,100 35,100 40,95 45,105 52,85 58,100 100,100" stroke="#3d7f8a" stroke-width="2.5" fill="none" stroke-linecap="round" class="line"/>
  </svg>`,

  // NONPROFIT — Hands holding heart
  nonprofit: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes glow3{0%,100%{opacity:.8}50%{opacity:1}}
      .heart2{animation:lift 2.5s ease-in-out infinite;transform-origin:center;will-change:transform}
      .gl{animation:glow3 2s ease-in-out infinite}
    </style>
    <g class="heart2">
      <path d="M60 58 Q60 58 42 42 Q36 34 44 30 Q52 26 56 34 L60 40 L64 34 Q68 26 76 30 Q84 34 78 42 Z" fill="#c8b89a" stroke="#1a2744" stroke-width="2" class="gl"/>
    </g>
    <path d="M20 70 Q30 60 45 65 Q55 70 60 78" stroke="#3d7f8a" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M100 70 Q90 60 75 65 Q65 70 60 78" stroke="#3d7f8a" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="28" cy="66" r="4" fill="#3d7f8a"/>
    <circle cx="92" cy="66" r="4" fill="#3d7f8a"/>
  </svg>`,

  // MUNICIPALITY — Government building with flag
  municipality: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes wave3{0%,100%{transform:skewX(-3deg)}50%{transform:skewX(3deg)}}
      @keyframes glow4{0%,100%{opacity:.6}50%{opacity:1}}
      .flag2{animation:wave3 2s ease-in-out infinite;transform-origin:60px 15px;will-change:transform}
      .light{animation:glow4 2s ease-in-out infinite}
    </style>
    <polygon points="15,55 60,25 105,55" fill="#243558" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="18" y="55" width="84" height="45" fill="#1a2744"/>
    <rect x="25" y="60" width="7" height="40" fill="#243558"/>
    <rect x="38" y="60" width="7" height="40" fill="#243558"/>
    <rect x="51" y="60" width="7" height="40" fill="#243558"/>
    <rect x="64" y="60" width="7" height="40" fill="#243558"/>
    <rect x="77" y="60" width="7" height="40" fill="#243558"/>
    <rect x="90" y="60" width="7" height="40" fill="#243558"/>
    <rect x="49" y="75" width="22" height="25" rx="1" fill="#3d7f8a" opacity=".4"/>
    <circle cx="60" cy="88" r="1.5" fill="#c8b89a"/>
    <rect x="15" y="100" width="90" height="4" fill="#1a2744"/>
    <line x1="60" y1="12" x2="60" y2="25" stroke="#c8b89a" stroke-width="1.5"/>
    <g class="flag2">
      <path d="M60 12 L75 15 L60 18 Z" fill="#3d7f8a"/>
    </g>
    <circle cx="30" cy="68" r="2" fill="#c8b89a" class="light"/>
    <circle cx="90" cy="68" r="2" fill="#c8b89a" class="light"/>
  </svg>`,

  // FINANCE — Arrow trending up with dollar
  finance: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes grow{0%{stroke-dashoffset:80}100%{stroke-dashoffset:0}}
      @keyframes pop3{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
      .tr{stroke-dasharray:80;animation:grow 2s linear infinite;will-change:stroke-dashoffset}
      .coin{animation:pop3 2s ease-in-out infinite;transform-origin:90px 30px;will-change:transform}
    </style>
    <line x1="20" y1="15" x2="20" y2="95" stroke="#1a2744" stroke-width="2"/>
    <line x1="20" y1="95" x2="105" y2="95" stroke="#1a2744" stroke-width="2"/>
    <polyline points="25,78 40,65 55,60 70,45 85,35" stroke="#3d7f8a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" class="tr"/>
    <polygon points="25,95 25,78 40,65 55,60 70,45 85,35 85,95" fill="#3d7f8a" opacity=".15"/>
    <polyline points="80,38 85,32 90,38" stroke="#c8b89a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <line x1="85" y1="32" x2="85" y2="42" stroke="#c8b89a" stroke-width="2.5" stroke-linecap="round"/>
    <g class="coin">
      <circle cx="90" cy="30" r="10" fill="#c8b89a" stroke="#1a2744" stroke-width="2"/>
      <text x="90" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a2744">$</text>
    </g>
  </svg>`,

  // SMALL BIZ — Shop storefront with opening awning
  smallbiz: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes open{0%,100%{opacity:1}50%{opacity:.7}}
      @keyframes swing2{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-4deg)}}
      .sign{animation:swing2 3s ease-in-out infinite;transform-origin:60px 20px;will-change:transform}
      .lt{animation:open 1.5s ease-in-out infinite}
    </style>
    <path d="M15 45 L60 25 L105 45 Z" fill="#c8b89a"/>
    <rect x="15" y="45" width="90" height="55" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="22" y="55" width="24" height="22" rx="1" fill="#243558" stroke="#3d7f8a" stroke-width="1"/>
    <line x1="34" y1="55" x2="34" y2="77" stroke="#3d7f8a" stroke-width="0.5"/>
    <line x1="22" y1="66" x2="46" y2="66" stroke="#3d7f8a" stroke-width="0.5"/>
    <rect x="74" y="55" width="24" height="22" rx="1" fill="#243558" stroke="#3d7f8a" stroke-width="1"/>
    <line x1="86" y1="55" x2="86" y2="77" stroke="#3d7f8a" stroke-width="0.5"/>
    <rect x="50" y="55" width="20" height="45" fill="#3d7f8a" opacity=".3"/>
    <rect x="50" y="55" width="20" height="45" stroke="#3d7f8a" stroke-width="1.5" fill="none"/>
    <circle cx="66" cy="78" r="1.5" fill="#c8b89a"/>
    <g class="sign">
      <line x1="60" y1="18" x2="60" y2="28" stroke="#3d7f8a" stroke-width="1.5"/>
      <rect x="48" y="14" width="24" height="8" rx="1" fill="#c8b89a"/>
      <text x="60" y="20" text-anchor="middle" font-size="5" font-weight="bold" fill="#1a2744">OPEN</text>
    </g>
    <circle cx="25" cy="40" r="2" fill="#c8b89a" class="lt"/>
    <circle cx="95" cy="40" r="2" fill="#c8b89a" class="lt"/>
  </svg>`,

  // EDUCATION — Graduation cap with rising lines
  education: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      @keyframes tassel{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
      @keyframes book1{0%,100%{opacity:.5}50%{opacity:1}}
      .cap{animation:bob 3s ease-in-out infinite;transform-origin:center;will-change:transform}
      .tsl{animation:tassel 2s ease-in-out infinite;transform-origin:85px 35px;will-change:transform}
      .bk{animation:book1 2s ease-in-out infinite}
    </style>
    <g class="cap">
      <polygon points="60,25 95,38 60,52 25,38" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
      <polygon points="60,28 90,39 60,48 30,39" fill="#243558"/>
      <rect x="45" y="50" width="30" height="6" fill="#1a2744"/>
      <g class="tsl">
        <line x1="85" y1="38" x2="85" y2="58" stroke="#c8b89a" stroke-width="1.5"/>
        <circle cx="85" cy="60" r="3" fill="#c8b89a"/>
      </g>
    </g>
    <rect x="20" y="75" width="18" height="22" rx="1" fill="#3d7f8a" class="bk"/>
    <rect x="42" y="72" width="18" height="25" rx="1" fill="#c8b89a"/>
    <rect x="64" y="78" width="18" height="19" rx="1" fill="#3d7f8a" class="bk"/>
    <rect x="86" y="75" width="18" height="22" rx="1" fill="#1a2744"/>
    <line x1="22" y1="82" x2="36" y2="82" stroke="white" stroke-width="0.5" opacity=".5"/>
    <line x1="44" y1="79" x2="58" y2="79" stroke="#1a2744" stroke-width="0.5"/>
    <line x1="66" y1="85" x2="80" y2="85" stroke="white" stroke-width="0.5" opacity=".5"/>
    <line x1="88" y1="82" x2="102" y2="82" stroke="white" stroke-width="0.5" opacity=".5"/>
  </svg>`,

  // UNDERWRITING — Mountain peak with flag planted
  underwriting: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes wave4{0%,100%{transform:skewX(-5deg)}50%{transform:skewX(5deg)}}
      @keyframes sun{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}
      .fl{animation:wave4 2s ease-in-out infinite;transform-origin:75px 20px;will-change:transform}
      .sn{animation:sun 3s ease-in-out infinite;transform-origin:30px 30px;will-change:transform,opacity}
    </style>
    <circle cx="30" cy="30" r="8" fill="#c8b89a" class="sn"/>
    <polygon points="20,95 50,45 70,65 85,50 105,95" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <polygon points="50,45 60,55 55,62 50,58 45,62" fill="white" opacity=".3"/>
    <polygon points="85,50 92,58 88,65 84,60" fill="white" opacity=".3"/>
    <line x1="75" y1="18" x2="75" y2="60" stroke="#c8b89a" stroke-width="2"/>
    <g class="fl">
      <path d="M75 18 L92 22 L75 26 Z" fill="#c8b89a"/>
    </g>
  </svg>`,

  // SPONSORSHIP — Handshake
  sponsorship: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes shake{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      @keyframes shine2{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
      .hs{animation:shake 2.5s ease-in-out infinite;transform-origin:center;will-change:transform}
      .sp{animation:shine2 2s ease-in-out infinite;transform-origin:center;will-change:transform,opacity}
    </style>
    <g class="hs">
      <path d="M15 50 L35 45 Q42 46 45 52 L55 55 Q58 56 58 60 Q58 64 54 65 L48 63" fill="#3d7f8a" stroke="#1a2744" stroke-width="2"/>
      <path d="M105 50 L85 45 Q78 46 75 52 L65 55 Q62 56 62 60 Q62 64 66 65 L72 63" fill="#c8b89a" stroke="#1a2744" stroke-width="2"/>
      <rect x="40" y="58" width="40" height="10" rx="5" fill="#1a2744"/>
      <rect x="45" y="61" width="30" height="4" rx="2" fill="#3d7f8a"/>
    </g>
    <circle cx="60" cy="30" r="3" fill="#c8b89a" class="sp"/>
    <circle cx="40" cy="40" r="2" fill="#c8b89a" class="sp" style="animation-delay:0.3s"/>
    <circle cx="80" cy="40" r="2" fill="#c8b89a" class="sp" style="animation-delay:0.6s"/>
  </svg>`,

  // CODESIGN — Rocket launching
  codesign: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes liftoff{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @keyframes flame{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.3) scaleX(0.85)}}
      @keyframes sparks{0%,100%{opacity:0}50%{opacity:1}}
      .rkt{animation:liftoff 1.5s ease-in-out infinite;transform-origin:60px 60px;will-change:transform}
      .fl{animation:flame 0.3s ease-in-out infinite;transform-origin:60px 82px;will-change:transform}
      .spk{animation:sparks 1s ease-in-out infinite}
    </style>
    <g class="rkt">
      <path d="M60 22 Q72 30 74 50 L74 75 Q66 78 60 78 Q54 78 46 75 L46 50 Q48 30 60 22 Z" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
      <path d="M46 50 Q38 58 40 70 L46 72 Z" fill="#3d7f8a"/>
      <path d="M74 50 Q82 58 80 70 L74 72 Z" fill="#3d7f8a"/>
      <circle cx="60" cy="50" r="8" fill="#243558" stroke="#c8b89a" stroke-width="2"/>
      <circle cx="60" cy="50" r="4" fill="#c8b89a" opacity=".6"/>
      <g class="fl">
        <path d="M52 78 Q58 96 60 100 Q62 96 68 78 Z" fill="#c8b89a"/>
        <path d="M55 78 Q58 88 60 92 Q62 88 65 78 Z" fill="#3d7f8a"/>
      </g>
    </g>
    <circle cx="30" cy="35" r="1.5" fill="#c8b89a" class="spk"/>
    <circle cx="90" cy="30" r="1.5" fill="#c8b89a" class="spk" style="animation-delay:0.3s"/>
    <circle cx="25" cy="60" r="1" fill="#3d7f8a" class="spk" style="animation-delay:0.6s"/>
  </svg>`,

  // GRANTS — Trophy with rays
  grants: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes ray{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}
      .tr{animation:bounce 2.5s ease-in-out infinite;transform-origin:60px 70px;will-change:transform}
      .ry{animation:ray 2s ease-in-out infinite;transform-origin:60px 45px}
    </style>
    <g class="tr">
      <path d="M40 28 L80 28 L76 58 Q72 70 60 72 Q48 70 44 58 Z" fill="#c8b89a" stroke="#1a2744" stroke-width="2"/>
      <path d="M40 34 Q30 38 32 50 Q34 56 40 56" stroke="#c8b89a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M80 34 Q90 38 88 50 Q86 56 80 56" stroke="#c8b89a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="54" y="72" width="12" height="12" rx="1" fill="#c8b89a"/>
      <rect x="44" y="84" width="32" height="6" rx="2" fill="#c8b89a"/>
      <path d="M60 38 L63 46 L71 46 L65 51 L67 59 L60 54 L53 59 L55 51 L49 46 L57 46 Z" fill="#1a2744"/>
    </g>
    <circle cx="60" cy="20" r="2" fill="#c8b89a" class="ry"/>
    <circle cx="38" cy="30" r="2" fill="#c8b89a" class="ry" style="animation-delay:0.3s"/>
    <circle cx="82" cy="30" r="2" fill="#c8b89a" class="ry" style="animation-delay:0.6s"/>
  </svg>`,

  // BIZ SERVICES — Server stack with data pulse
  bizservices: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes blink1{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes blink2{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes data{0%{transform:translateX(-20px);opacity:0}50%{opacity:1}100%{transform:translateX(20px);opacity:0}}
      .b1{animation:blink1 1.5s ease-in-out infinite}
      .b2{animation:blink2 1.5s ease-in-out infinite}
      .dt{animation:data 2s linear infinite;will-change:transform,opacity}
    </style>
    <rect x="28" y="25" width="64" height="20" rx="3" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="28" y="50" width="64" height="20" rx="3" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <rect x="28" y="75" width="64" height="20" rx="3" fill="#1a2744" stroke="#3d7f8a" stroke-width="2"/>
    <circle cx="36" cy="35" r="2" fill="#3d7f8a" class="b1"/>
    <circle cx="44" cy="35" r="2" fill="#c8b89a" class="b2"/>
    <rect x="54" y="33" width="30" height="4" rx="1" fill="#3d7f8a" opacity=".4"/>
    <circle cx="36" cy="60" r="2" fill="#c8b89a" class="b2"/>
    <circle cx="44" cy="60" r="2" fill="#3d7f8a" class="b1"/>
    <rect x="54" y="58" width="30" height="4" rx="1" fill="#3d7f8a" opacity=".4"/>
    <circle cx="36" cy="85" r="2" fill="#3d7f8a" class="b1"/>
    <circle cx="44" cy="85" r="2" fill="#c8b89a" class="b2"/>
    <rect x="54" y="83" width="30" height="4" rx="1" fill="#3d7f8a" opacity=".4"/>
    <line x1="60" y1="45" x2="60" y2="50" stroke="#3d7f8a" stroke-width="1" opacity=".5"/>
    <line x1="60" y1="70" x2="60" y2="75" stroke="#3d7f8a" stroke-width="1" opacity=".5"/>
    <circle cx="60" cy="60" r="2" fill="#c8b89a" class="dt"/>
  </svg>`,
};

// Fallback for any key not defined
const DEFAULT_ANIM = ANIMATIONS.bizservices;

// ── Mounting logic ────────────────────────────────────────────────────────
const mounted = new WeakSet();

function mountAnimation(el) {
  if (mounted.has(el)) return;
  const key = el.dataset.lottie;
  const height = el.dataset.lottieHeight || '120px';

  el.innerHTML = '';
  el.style.cssText += `overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:${height};`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = WRAP_STYLE;

  let svg = ANIMATIONS[key] || DEFAULT_ANIM;

  // If user prefers reduced motion, strip animations but keep static SVG
  if (prefersReduced) {
    svg = svg.replace(/<style>[\s\S]*?<\/style>/g, '');
  }

  wrapper.innerHTML = svg;
  const svgEl = wrapper.querySelector('svg');
  if (svgEl) {
    svgEl.style.cssText = 'width:100%;height:100%;max-width:100%;max-height:100%;display:block;';
  }

  el.appendChild(wrapper);
  mounted.add(el);
}

// ── Intersection Observer ─────────────────────────────────────────────────
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      mountAnimation(entry.target);
      // Keep observing to control play state
      const svgEl = entry.target.querySelector('svg');
      if (svgEl) {
        svgEl.querySelectorAll('[class]').forEach(el => {
          el.style.animationPlayState = 'running';
        });
      }
    } else if (mounted.has(entry.target)) {
      // Pause when off-screen to save battery
      const svgEl = entry.target.querySelector('svg');
      if (svgEl) {
        svgEl.querySelectorAll('[class]').forEach(el => {
          el.style.animationPlayState = 'paused';
        });
      }
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '100px 0px 100px 0px'
});

// ── Init ──────────────────────────────────────────────────────────────────
function initLotties() {
  document.querySelectorAll('[data-lottie]').forEach(el => {
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight + 300 && rect.bottom > -300;
    if (inView) {
      mountAnimation(el);
    }
    lazyObserver.observe(el);
  });
  // Safety net
  setTimeout(() => {
    document.querySelectorAll('[data-lottie]').forEach(el => mountAnimation(el));
  }, 800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLotties);
} else {
  initLotties();
}

window.addEventListener('load', () => {
  document.querySelectorAll('[data-lottie]').forEach(el => mountAnimation(el));
});
