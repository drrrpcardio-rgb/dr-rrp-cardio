import{n as e,t}from"./guide-dialog-a570rHAe.js";import{i as n,n as r,r as i}from"./procedures-FRizJaA7.js";function a(e){return e.toLowerCase().replace(/haem/g,`hem`).replace(/aem/g,`em`).replace(/oesoph/g,`esoph`).replace(/oedema/g,`edema`).replace(/(\w)isation/g,`$1ization`).replace(/(\w)ised/g,`$1ized`).replace(/(\w)ising/g,`$1izing`).replace(/(\w)ise/g,`$1ize`).replace(/colour/g,`color`).replace(/centre/g,`center`).replace(/fibre/g,`fiber`).replace(/behaviour/g,`behavior`).replace(/labelling/g,`labeling`).replace(/judgement/g,`judgment`)}function o(e){return a([e.name,e.manufacturer,e.type,e.summary,e.overview,e.spec??``,e.tags??``,...e.uses,...e.benefits,...e.considerations].join(` `))}function s(e,t,n){let r=a(t).split(/\s+/).filter(Boolean);return r.length?e.items.filter(e=>{let t=o(e);return r.every(e=>t.includes(e))}):e.items.filter(e=>!n||e.category===n)}function c(e){let t=new Map;for(let n of e.phases)for(let e of n.categories)t.set(e,n);return e.items.map((e,n)=>({item:e,no:n+1,phase:t.get(e.category)}))}e(),t(!1);var l=n,u=`/cath-sim/`,d=e=>`${u}equipment/${e}`,f=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),p=e=>{let t=r(i.items,e);return t.length?`<h3>Used in these procedures</h3><ul class="used-in">${t.map(e=>`<li><a href="${u}procedures/#${e.id}">${f(e.name)}</a></li>`).join(``)}</ul>`:``},m=e=>l.categories.find(t=>t.id===e),h=c(l),g=l.phases,_=h.length,v=e=>String(e).padStart(2,`0`),y=()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches,b=document.getElementById(`app`);b.className=`journey`;var x=e=>h.filter(t=>t.phase.id===e).length,S=l.groups.map(e=>`<span class="tab-part" role="presentation">${f(e.label)}</span>${g.filter(t=>t.group===e.id).map(e=>`<button type="button" role="tab" class="tab" id="tab-${e.id}" data-step="${e.id}" aria-selected="false" aria-controls="eq-step"><span class="t-no">${v(g.indexOf(e)+1)}</span><span class="t-label">${f(e.label)}</span><span class="t-n">${x(e.id)}</span></button>`).join(``)}`).join(``);b.innerHTML=`
  <header class="eq-hero">
    <p class="kicker">Cath lab equipment</p>
    <h1>Pick a step, <em>see its instruments</em></h1>
    <p class="lede">${f(l.intro)}</p>
    <div class="eq-searchrow">
      <div class="j-search">
        <label for="eq-q" class="sr-only">Search all instruments</label>
        <input type="search" id="eq-q" placeholder="Search every instrument: name, maker, use, risk…" autocomplete="off">
        <kbd aria-hidden="true">/</kbd>
      </div>
    </div>
  </header>
  <nav class="eq-tabs" aria-label="Procedure steps"><div class="tab-scroll" role="tablist">${S}</div></nav>
  <p id="eq-count" class="j-count" role="status" aria-live="polite"></p>
  <div class="eq-main" id="eq-step" role="tabpanel">
    <div id="eq-sections"></div>
    <div id="eq-results" hidden></div>
    <p id="eq-empty" class="empty" hidden>Nothing matches. <button type="button" id="eq-clear">Clear search</button></p>
    <nav class="step-nav" id="step-nav" aria-label="Previous and next step"></nav>
    <p class="eq-note">${f(l.note)} Availability and stocking vary by institution. Product photographs belong to their manufacturers and are credited in each instrument's details; drawings marked "Schematic" were made for this site. These are educational summaries and have not yet been reviewed by a cardiologist.</p>
  </div>
  <dialog id="eq-drawer" class="drawer" aria-labelledby="dr-title"><div id="dr-body"></div></dialog>
  <div id="eq-tray" class="tray" hidden role="region" aria-label="Compare instruments">
    <p id="tray-text"></p>
    <button type="button" id="tray-open" class="btn gold">Compare</button>
    <button type="button" id="tray-clear">Clear</button>
  </div>
  <dialog id="eq-compare" class="compare" aria-labelledby="cmp-title"><div id="cmp-body"></div></dialog>`;var C=document.getElementById(`eq-q`),w=document.getElementById(`eq-sections`),T=document.getElementById(`eq-results`),E=document.getElementById(`eq-empty`),D=document.getElementById(`eq-count`),O=document.getElementById(`step-nav`),k=document.getElementById(`eq-drawer`),A=document.getElementById(`dr-body`),j=null,M=0,N=[],P=g.find(e=>e.id===new URLSearchParams(location.search).get(`step`))?.id??g[0].id;function F(e,t=!1){let n=e.item,r=n.photo?`<span class="pl-img${n.photo.schematic?` sch`:``}">${n.photo.schematic?`<b class="pl-sch">Schematic</b>`:``}<img src="${d(n.photo.src)}" alt="" loading="lazy" decoding="async" width="${n.photo.width}" height="${n.photo.height}"${n.photo.plain?` class="plain"`:``}></span>`:`<span class="pl-img none" aria-hidden="true"><i>No photo yet</i></span>`;return`<li class="card">
    <button type="button" class="plate" data-id="${n.id}" aria-haspopup="dialog">
      ${r}
      <span class="pl-no" aria-hidden="true">${v(e.no)}</span>
      <span class="pl-body">
        <span class="pl-type">${f(n.type)}${t?` · ${f(e.phase.label)}`:``}</span>
        <strong class="pl-name">${f(n.name)}</strong>
        <span class="pl-maker">${f(n.manufacturer)}${n.spec?` · ${f(n.spec)}`:``}</span>
        <span class="pl-sum">${f(n.summary)}</span>
      </span>
      <span class="pl-go" aria-hidden="true">Open details ›</span>
      <span class="sr-only">Instrument ${e.no}</span>
    </button>
    <button type="button" class="cmp-toggle" data-cmp="${n.id}" aria-pressed="${N.includes(n.id)}" aria-label="Compare ${f(n.name)}">+ Compare</button>
  </li>`}function I(){let e=g.find(e=>e.id===P),t=g.indexOf(e),n=l.groups.find(t=>t.id===e.group),r=0,i=e.categories.map(e=>{let t=m(e),n=h.filter(t=>t.item.category===e);return r+=n.length,n.length?`<div class="shelf"><div class="shelf-head"><h3>${f(t.label)}</h3><p>${f(t.note)}</p></div><ol class="plates">${n.map(e=>F(e)).join(``)}</ol></div>`:``}).join(``);w.innerHTML=`<section class="phase" id="phase-${e.id}" aria-labelledby="ph-${e.id}">
    <div class="phase-intro"><span class="phase-no" aria-hidden="true">${v(t+1)}</span>
      <div><p class="verb">${f(n.label)} · ${f(e.verb)}</p><h2 id="ph-${e.id}">${f(e.label)}</h2><p class="phase-text">${f(e.intro)}</p></div></div>
    ${i}</section>`,D.textContent=`${r} instruments in this step`;let a=g[t-1],o=g[t+1];O.innerHTML=`${a?`<button type="button" data-go="${a.id}">‹ Previous step: <b>${f(a.label)}</b></button>`:`<span></span>`}${o?`<button type="button" class="next" data-go="${o.id}">Next step: <b>${f(o.label)}</b> ›</button>`:``}`}function L(e,t=!0){P=e,C.value=``,R(),document.querySelectorAll(`.tab`).forEach(n=>{let r=n.dataset.step===e;n.setAttribute(`aria-selected`,String(r)),n.tabIndex=r?0:-1,r&&t&&n.scrollIntoView({block:`nearest`,inline:`center`,behavior:y()?`auto`:`smooth`})});let n=new URL(location.href);n.searchParams.set(`step`,e),history.replaceState(null,``,n.pathname+n.search+location.hash)}function R(){let e=C.value.trim();if(document.querySelector(`.eq-tabs`).classList.toggle(`dim`,!!e),!e){w.hidden=!1,T.hidden=!0,E.hidden=!0,O.hidden=!1,I();return}let t=s(l,e,``),n=new Set(t.map(e=>e.id)),r=h.filter(e=>n.has(e.item.id));w.hidden=!0,T.hidden=!1,O.hidden=!0,T.innerHTML=`<ol class="plates results">${r.map(e=>F(e,!0)).join(``)}</ol>`,E.hidden=r.length>0,D.textContent=r.length===1?`1 instrument matches, across all steps`:`${r.length} instruments match, across all steps`}function z(){document.querySelectorAll(`[data-cmp]`).forEach(e=>{let t=N.includes(e.dataset.cmp);e.setAttribute(`aria-pressed`,String(t)),e.textContent=t?`✓ Comparing`:`+ Compare`})}function B(e,t=!0){let n=h[e-1];if(!n)return;M=e;let r=n.item,i=r.photo,a=m(r.category),o=i?`<figure class="dr-photo">
        <div class="paper"><img src="${d(i.src)}" alt="${f(i.alt)}" width="${i.width}" height="${i.height}" decoding="async"${i.plain?` class="plain"`:``}><span class="photo-fallback" hidden>Image unavailable. See the manufacturer source below.</span></div>
        <figcaption><span>${f(i.caption)}</span>${i.schematic?`<span>Schematic, not a photograph</span>`:`<a href="${f(i.sourceUrl)}" target="_blank" rel="noopener noreferrer">Image: ${f(i.credit)} ↗</a>`}</figcaption>
      </figure>`:`<figure class="dr-photo"><div class="paper nophoto"><span>No manufacturer photograph yet</span></div><figcaption><span>See the manufacturer's page for product images.</span></figcaption></figure>`;A.innerHTML=`
    <div class="dr-bar">
      <p class="dr-where"><b>Instrument ${v(e)}</b> · ${f(n.phase.label)} · ${f(a.name)}</p>
      <div class="dr-nav">
        <button type="button" data-step="-1" aria-label="Previous instrument"${e===1?` disabled`:``}>←</button>
        <button type="button" data-step="1" aria-label="Next instrument"${e===_?` disabled`:``}>→</button>
        <button type="button" data-compare aria-pressed="${N.includes(r.id)}">Compare</button>
        <button type="button" data-close aria-label="Close instrument details">Close ✕</button>
      </div>
    </div>
    <div class="dr-scroll">
      <p class="kicker">${f(r.manufacturer)}</p>
      <h2 id="dr-title">${f(r.name)}</h2>
      <p class="dr-type">${f(r.type)}${r.spec?` <span>${f(r.spec)}</span>`:``}</p>
      ${o}
      <h3>Overview</h3><p>${f(r.overview)}</p>
      <h3>Key clinical uses in the cath lab</h3><ul>${r.uses.map(e=>`<li>${f(e)}</li>`).join(``)}</ul>
      <h3>Main features &amp; benefits</h3><ul>${r.benefits.map(e=>`<li>${f(e)}</li>`).join(``)}</ul>
      <h3 class="warn-h">Safety &amp; important considerations</h3><ul class="safety">${r.considerations.map(e=>`<li>${f(e)}</li>`).join(``)}</ul>
      ${p(r.id)}
      <p class="general-safety">${f(l.generalSafety)}</p>
      <a class="maker-link" href="${f(r.url)}" target="_blank" rel="noopener noreferrer">${f(r.linkLabel??`Manufacturer details & instructions`)} ↗</a>
      <p class="eq-note">${f(l.note)}</p>
    </div>`;let s=A.querySelector(`.dr-photo img`);s?.addEventListener(`error`,()=>{s.hidden=!0,A.querySelector(`.photo-fallback`).hidden=!1},{once:!0}),A.querySelector(`[data-close]`).addEventListener(`click`,()=>k.close()),A.querySelector(`[data-compare]`).addEventListener(`click`,e=>{H(r.id),e.currentTarget.setAttribute(`aria-pressed`,String(N.includes(r.id)))}),A.querySelectorAll(`[data-step]`).forEach(t=>t.addEventListener(`click`,()=>B(e+ +t.dataset.step))),k.open||(j=document.activeElement,k.showModal()),A.querySelector(`.dr-scroll`).scrollTop=0,t&&history.replaceState(null,``,`#${r.id}`)}var V=e=>h.find(t=>t.item.id===e).item.name;function H(e){N=N.includes(e)?N.filter(t=>t!==e):[...N,e].slice(-2),U(),z()}function U(){let e=document.getElementById(`eq-tray`);e.hidden=N.length===0,document.getElementById(`tray-text`).textContent=N.length===2?`Compare: ${V(N[0])} and ${V(N[1])}`:`Compare: ${V(N[0]??``)} (pick one more in its details)`,document.getElementById(`tray-open`).disabled=N.length<2}function W(){let e=N.map(e=>h.find(t=>t.item.id===e).item),t=e=>`<ul>${e.map(e=>`<li>${f(e)}</li>`).join(``)}</ul>`,n=[[`Maker`,e=>f(e.manufacturer)],[`Type`,e=>f(e.type)],[`Specification`,e=>f(e.spec||`Not stated`)],[`In short`,e=>f(e.summary)],[`Key clinical uses`,e=>t(e.uses)],[`Features and benefits`,e=>t(e.benefits)],[`Safety and considerations`,e=>t(e.considerations)]];document.getElementById(`cmp-body`).innerHTML=`
    <div class="dr-bar"><p class="dr-where"><b id="cmp-title">Side by side</b></p><div class="dr-nav"><button type="button" data-cmp-close>Close ✕</button></div></div>
    <div class="dr-scroll"><div class="cmp-grid">
      <div></div>${e.map(e=>`<div class="cmp-head"><div class="paper${e.photo?``:` nophoto`}">${e.photo?`<img src="${d(e.photo.src)}" alt="${f(e.photo.alt)}" width="${e.photo.width}" height="${e.photo.height}"${e.photo.plain?` class="plain"`:``}>`:`<span>No photograph yet</span>`}</div><h3>${f(e.name)}</h3></div>`).join(``)}
      ${n.map(([t,n])=>`<div class="cmp-label">${t}</div>${e.map(e=>`<div class="cmp-cell">${n(e)}</div>`).join(``)}`).join(``)}
    </div><p class="eq-note">${f(l.note)}</p></div>`;let r=document.getElementById(`eq-compare`);document.querySelector(`[data-cmp-close]`).addEventListener(`click`,()=>r.close()),r.showModal()}document.getElementById(`tray-open`).addEventListener(`click`,W),document.getElementById(`tray-clear`).addEventListener(`click`,()=>{N=[],U(),z()}),document.getElementById(`eq-compare`).addEventListener(`click`,e=>{e.target===e.currentTarget&&e.currentTarget.close()}),document.addEventListener(`click`,e=>{let t=e.target.closest(`[data-cmp]`)?.dataset.cmp;if(t){H(t);return}let n=e.target.closest(`.plate`)?.dataset.id;if(!n)return;let r=h.find(e=>e.item.id===n);r&&B(r.no)}),C.addEventListener(`input`,R),document.getElementById(`eq-clear`).addEventListener(`click`,()=>{C.value=``,R(),C.focus()}),document.querySelector(`.tab-scroll`).addEventListener(`click`,e=>{let t=e.target.closest(`.tab`);t&&L(t.dataset.step)}),document.querySelector(`.tab-scroll`).addEventListener(`keydown`,e=>{let t=e.key;if(t!==`ArrowRight`&&t!==`ArrowLeft`)return;e.preventDefault();let n=g.findIndex(e=>e.id===P)+(t===`ArrowRight`?1:-1);g[n]&&(L(g[n].id),document.getElementById(`tab-${g[n].id}`).focus())}),O.addEventListener(`click`,e=>{let t=e.target.closest(`[data-go]`);t&&(L(t.dataset.go,!0),window.scrollTo({top:document.querySelector(`.eq-tabs`).getBoundingClientRect().top+scrollY-70,behavior:y()?`auto`:`smooth`}))}),document.addEventListener(`keydown`,e=>{if(k.open){e.key===`ArrowLeft`&&M>1?(e.preventDefault(),B(M-1)):e.key===`ArrowRight`&&M<_&&(e.preventDefault(),B(M+1));return}let t=e.target;e.key===`/`&&!/^(input|textarea|select)$/i.test(t.tagName)?(e.preventDefault(),C.focus(),C.select()):e.key===`Escape`&&document.activeElement===C&&C.value&&(C.value=``,R())}),k.addEventListener(`close`,()=>{history.replaceState(null,``,location.pathname+location.search),j?.focus?.()}),k.addEventListener(`click`,e=>{e.target===k&&k.close()});var G=h.find(e=>e.item.id===location.hash.slice(1));G&&(P=G.phase.id),L(P,!0),G&&B(G.no,!1);