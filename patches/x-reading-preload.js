/* moo-x-reading-mode-v2: colors only, x.com only */
(()=>{
  if (!(location.hostname === 'x.com' || location.hostname.endsWith('.x.com'))) return;
  const css = `
    body, body * { font-family: Menlo, Monaco, 'Courier New', monospace !important; font-size: 12px !important; font-weight: normal !important; }
    :root { color-scheme: dark !important; background-color: #1e1e1e !important; }
    html, body { background-color: #1e1e1e !important; color: #8b949e !important; }
    body * { border-color: #2b2d2e !important; }
    body div, body main, body section, body article, body header, body nav, body aside { background-color: transparent !important; }
    body [role="menu"], body [role="dialog"], body [data-testid="Dropdown"], body [data-testid="sheetDialog"], body [data-testid="HoverCard"] { background-color: #252526 !important; }
    body [role="menu"] [role="menuitem"], body [data-testid="Dropdown"] [role="menuitem"] { background-color: #252526 !important; }
    body [role="menu"] [role="menuitem"]:hover, body [role="menu"] [role="menuitem"]:focus-visible, body [data-testid="Dropdown"] [role="menuitem"]:hover { background-color: #303033 !important; }
    body span, body p, body h1, body h2, body h3, body label, body button { color: #8b949e !important; }
    body a, body a span { color: #8b949e !important; }
    body input, body textarea, body select, [contenteditable="true"], [role="dialog"], [role="menu"] { background-color: #252526 !important; color: #8b949e !important; }
    [data-testid="User-Name"] *, [data-testid="User-Name"] a span { color: #8b949e !important; }
    [data-testid="User-Name"] a:first-child span { color: #8b949e !important; }
    [data-testid="tweetText"], [data-testid="tweetText"] span { color: #8b949e !important; }
    [data-testid="tweetText"] a, [data-testid="tweetText"] a span { color: #8b949e !important; }
    [data-testid="tweet"] [role="group"] *, [data-testid="tweet"] time { color: #8b949e !important; }
    [data-testid="tweet"] [role="group"] [data-testid="unlike"] *, [data-testid="tweet"] [role="group"] [data-testid="unretweet"] * { color: #8b949e !important; }
    body svg { color: #8b949e !important; }
    [data-testid="Tweet-User-Avatar"], [data-testid^="UserAvatar-Container-"], img[src*="/profile_images/"], img[src*="/default_profile_images/"] { visibility: hidden !important; }
    img[src*="/emoji/"], img[src*="/twemoji/"], img[alt="emoji"] { visibility: hidden !important; }
    [data-testid="User-Name"] svg, [data-testid="User-Name"] img, [data-testid="icon-verified"], [data-testid="UserAffiliateBadge"], .moo-emoji-image { display: none !important; }
    article[data-testid="tweet"] .moo-avatar-column { display: none !important; width: 0 !important; min-width: 0 !important; flex-basis: 0 !important; margin: 0 !important; padding: 0 !important; }
    [data-testid="FloatingActionButtons_Tweet_Button"], a[href="/compose/post"][role="button"] { display: none !important; }
    article.moo-ad-covered { position: relative !important; background: var(--moo-media-mask-background, #1e1e1e) !important; pointer-events: none !important; cursor: default !important; }
    article.moo-ad-covered::after { content: "" !important; position: absolute !important; inset: 0 !important; background: var(--moo-media-mask-background, #1e1e1e) !important; opacity: 1 !important; z-index: 2147483647 !important; pointer-events: none !important; }
    article.moo-ad-covered * { visibility: hidden !important; pointer-events: none !important; animation: none !important; transition: none !important; }
    :root body .moo-media-dim:not(.moo-media-revealed), :root body .moo-media-dim:not(.moo-media-revealed):hover { opacity: 0.1 !important; transition: none !important; animation: none !important; }
    .moo-posted-notice { display: none !important; }
    * { scrollbar-color: #424242 #1e1e1e; }
  `;
  const install = () => {
    if (!document.documentElement || document.getElementById('moo-x-reading-mode')) return;
    const style = document.createElement('style');
    style.id = 'moo-x-reading-mode'; style.textContent = css;
    document.documentElement.prepend(style);
  };
  const emoji = /(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*[\u{E0020}-\u{E007F}]*)/gu;
  let hoverMedia, hoverTimer;
  function cancelMediaHover() {
    clearTimeout(hoverTimer);
    hoverMedia?.classList.remove('moo-media-revealed');
    hoverMedia = undefined;
  }
  function startMediaHover(media) {
    if (media === hoverMedia) return;
    cancelMediaHover();
    if (!media || media.closest('.moo-ad-covered')) return;
    hoverMedia = media;
    hoverTimer = setTimeout(() => {
      if (hoverMedia === media && media.isConnected && media.matches(':hover') && !media.closest('.moo-ad-covered')) media.classList.add('moo-media-revealed');
    }, 2000);
  }
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    startMediaHover(event.target instanceof Element ? event.target.closest('.moo-media-dim') : null);
  }, true);
  document.addEventListener('pointerout', event => {
    if (hoverMedia && !(event.relatedTarget instanceof Node && hoverMedia.contains(event.relatedTarget))) cancelMediaHover();
  }, true);
  window.addEventListener('blur', cancelMediaHover);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMediaHover(); });
  const mediaIdentities = new WeakMap();
  function update() {
    install();
    document.querySelectorAll('.moo-posted-notice').forEach(node => node.classList.remove('moo-posted-notice'));
    document.querySelectorAll('[role="button"], button, [role="status"], [data-testid="toast"]').forEach(node => {
      if (node.closest('article, [contenteditable="true"]')) return;
      if (/^(?:↑\s*)?(?:已发布|已發佈|已發佈的貼文|Posted|Posted successfully)$/i.test(node.textContent.trim())) node.classList.add('moo-posted-notice');
    });
    const background = [document.body, document.documentElement].filter(Boolean).map(node => getComputedStyle(node).backgroundColor).find(color => color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)');
    if (background) document.documentElement.style.setProperty('--moo-media-mask-background', background);
    document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
      const labelled = [...article.querySelectorAll('span')].some(span => {
        if (span.children.length || span.closest('[data-testid="tweetText"], [data-testid="User-Name"]')) return false;
        return /^(广告|廣告|Ad|Promoted|推广|推廣)$/i.test(span.textContent.trim());
      });
      article.classList.toggle('moo-ad-covered', labelled || !!article.closest('[data-testid="placementTracking"]'));
    });
    document.querySelectorAll('.moo-avatar-column').forEach(node => node.classList.remove('moo-avatar-column'));
    document.querySelectorAll('article[data-testid="tweet"] [data-testid="Tweet-User-Avatar"], article[data-testid="tweet"] [data-testid^="UserAvatar-Container-"]').forEach(avatar => {
      let column = avatar;
      // Stop before the ancestor that also owns the tweet body or controls.
      for (let parent = avatar.parentElement, depth = 0; parent && depth < 8; parent = parent.parentElement, depth++) {
        if (parent.matches('article') || parent.querySelector('[data-testid="User-Name"], [data-testid="tweetText"], [data-testid="reply"], [data-testid="like"], [data-testid="retweet"]')) break;
        column = parent;
      }
      column.classList.add('moo-avatar-column');
    });
    // Always recompute ownership: X can reuse the same node for another post.
    const selector = '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="videoComponent"], [data-testid="card.layoutLarge.media"], [data-testid="card.layoutSmall.media"]';
    const candidates = new Set(document.querySelectorAll(selector));
    const decoration = '[data-testid="User-Name"], [data-testid="Tweet-User-Avatar"], [data-testid^="UserAvatar-Container-"]';
    document.querySelectorAll('article img, article video, [data-testid="card.wrapper"] img, article [style*="background-image"]').forEach(surface => {
      const src = surface.getAttribute('src') || '';
      if (surface.closest(decoration) || /\/(?:profile_images|default_profile_images|emoji|twemoji|hashflags)\//i.test(src) || surface.classList.contains('moo-emoji-image')) return;
      if (surface.tagName !== 'IMG' && surface.tagName !== 'VIDEO' && getComputedStyle(surface).backgroundImage === 'none') return;
      candidates.add(surface);
    });
    // Apply opacity once to the outermost media surface; never counter it with opacity:1.
    const targets = new Set([...candidates].filter(node => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (candidates.has(parent)) return false;
      }
      return true;
    }));
    document.querySelectorAll('.moo-media-covered, .moo-media-surface, .moo-video-dimmed').forEach(node => node.classList.remove('moo-media-covered', 'moo-media-surface', 'moo-video-dimmed'));
    document.querySelectorAll('.moo-media-dim').forEach(node => {
      if (!targets.has(node)) { if (node === hoverMedia) cancelMediaHover(); node.classList.remove('moo-media-dim', 'moo-media-revealed'); }
    });
    targets.forEach(node => {
      const image = node.matches('img, video') ? node : node.querySelector('img, video');
      const identity = (image?.getAttribute('src') || '') + '|' + (image?.getAttribute('poster') || '') + '|' + getComputedStyle(node).backgroundImage;
      if (mediaIdentities.has(node) && mediaIdentities.get(node) !== identity) {
        if (node === hoverMedia) cancelMediaHover();
        node.classList.remove('moo-media-revealed');
      }
      mediaIdentities.set(node, identity);
      node.classList.add('moo-media-dim');
    });
    if (hoverMedia && (!hoverMedia.isConnected || hoverMedia.closest('.moo-ad-covered'))) cancelMediaHover();
    document.querySelectorAll('img').forEach(image => {
      const src = image.getAttribute('src') || '';
      const alt = image.getAttribute('alt') || '';
      emoji.lastIndex = 0;
      const isEmoji = emoji.test(alt) || /\/(?:emoji|twemoji|hashflags)\//i.test(src) || /\/[0-9a-f]{4,6}(?:-[0-9a-f]{4,6})*[.][^/]*svg/i.test(src);
      image.classList.toggle('moo-emoji-image', isEmoji);
    });
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, {
      acceptNode(node) { return node.parentElement?.closest('script,style,input,textarea,[contenteditable="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    let node;
    while ((node = walker.nextNode())) {
      const clean = node.nodeValue.replace(emoji, '');
      if (clean !== node.nodeValue) node.nodeValue = clean;
    }
  }
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const ad = event.target.closest('.moo-ad-covered') || event.target.closest('[data-testid="cellInnerDiv"]')?.querySelector('article.moo-ad-covered');
    if (ad) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('play', event => {
    if (event.target instanceof HTMLMediaElement) {
      // Ordinary video playback belongs to X; suppress only advertising video.
      if (event.target.closest('.moo-ad-covered')) event.target.pause();
    }
  }, true);
  let pending = false;
  const options = {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['src', 'poster', 'style', 'data-testid']};
  const observer = new MutationObserver(() => {
    if (!pending) { pending = true; setTimeout(() => { pending = false; run(); }, 100); }
  });
  function run() {
    observer.disconnect();
    try { if (document.documentElement) update(); } finally { observer.observe(document, options); }
  }
  run();
})();
