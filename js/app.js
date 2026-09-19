/* ============================================
   Artfolio — Main Application
   ============================================ */

(function () {
  'use strict';

  var state = {
    artworks: [],
    mediums: [],
    igPosts: [],
    igLastTimestamp: null,
    igPollTimer: null,
    lightboxOpen: false,
    lightboxItems: [],
    lightboxIndex: 0,
    igPreviewOpen: false,
    igPreviewIndex: 0,
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ===== Mobile Menu ===== */

  function initMobileMenu() {
    var toggle = $('menu-toggle');
    var menu = $('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var isOpen = menu.hasAttribute('hidden');
      if (isOpen) menu.removeAttribute('hidden');
      else menu.setAttribute('hidden', '');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.setAttribute('hidden', '');
      });
    });
  }

  /* ===== Gallery ===== */

  async function initGallery() {
    try {
      const artRes = await fetch('/api/artworks');
      const arts = await artRes.json();
      state.artworks = Array.isArray(arts) ? arts : [];

      const medRes = await fetch('/api/mediums');
      const meds = await medRes.json();
      state.mediums = Array.isArray(meds) ? meds : [];
    } catch (err) {
      console.warn('Failed to load from API, using demo data:', err);
      state.artworks = window.demoArtworks || [];
      state.mediums = window.demoMediums || [];
    }

    renderFilterButtons();
    renderGallery(state.artworks);
    updateAboutSection();
    updateHeroStats();
  }

  function renderFilterButtons() {
    var bar = $('filter-bar');
    if (!bar) return;

    var existing = bar.querySelectorAll('.filter-btn:not([data-filter="all"])');
    existing.forEach(function (b) { b.remove(); });

    var allBtn = bar.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.textContent = 'All (' + state.artworks.length + ')';

    state.mediums.forEach(function (m) {
      var count = state.artworks.filter(function (a) { return a.medium === m.name; }).length;
      if (!count) return;
      var btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = m.name;
      btn.textContent = m.name + ' (' + count + ')';
      btn.addEventListener('click', function () { filterArtworks(m.name); });
      bar.appendChild(btn);
    });
  }

  async function filterArtworks(medium) {
    var btns = document.querySelectorAll('#filter-bar .filter-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.filter === medium || (medium === 'all' && b.dataset.filter === 'all'));
    });

    var filtered;
    if (medium === 'all') {
      filtered = state.artworks;
    } else {
      filtered = state.artworks.filter(function (a) { return a.medium === medium; });
    }

    renderGallery(filtered);
  }

  function renderGallery(artworks) {
    var grid = $('gallery-grid');
    var empty = $('gallery-empty');
    if (!grid) return;

    if (!artworks.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    grid.innerHTML = artworks.map(function (art, i) {
      var imgSrc = art.image_url || art.placeholder_url || '';
      var isFeatured = art.is_featured;
      var featuredClass = isFeatured ? ' featured' : '';
      var badgeHtml = isFeatured
        ? '<div class="gallery-item-badge"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg></div>'
        : '';

      return '' +
        '<article class="gallery-item' + featuredClass + '" data-index="' + i + '">' +
          '<img class="gallery-item-image" src="' + imgSrc + '" alt="' + esc(art.title) + '" loading="lazy">' +
          '<div class="gallery-item-overlay">' +
            '<div class="gallery-item-title">' + esc(art.title) + '</div>' +
            '<div class="gallery-item-meta">' + esc(art.medium) + (art.year ? ' · ' + esc(art.year) : '') + '</div>' +
          '</div>' +
          badgeHtml +
        '</article>';
    }).join('');

    grid.querySelectorAll('.gallery-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.dataset.index, 10);
        openLightbox(idx);
      });
    });
  }

  /* ===== Lightbox ===== */

  function openLightbox(index) {
    if (!state.artworks.length) return;
    state.lightboxItems = state.artworks;
    state.lightboxIndex = Math.max(0, Math.min(index, state.artworks.length - 1));
    state.lightboxOpen = true;

    var lb = $('lightbox');
    if (!lb) return;
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderLightbox();
  }

  function closeLightbox() {
    var lb = $('lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    setTimeout(function () { lb.hidden = true; }, 300);
    document.body.style.overflow = '';
    state.lightboxOpen = false;
  }

  function lightboxPrev() {
    if (!state.lightboxItems.length) return;
    state.lightboxIndex = (state.lightboxIndex - 1 + state.lightboxItems.length) % state.lightboxItems.length;
    renderLightbox();
  }

  function lightboxNext() {
    if (!state.lightboxItems.length) return;
    state.lightboxIndex = (state.lightboxIndex + 1) % state.lightboxItems.length;
    renderLightbox();
  }

  function renderLightbox() {
    var art = state.lightboxItems[state.lightboxIndex];
    if (!art) return;

    var img = $('lightbox-image');
    var title = $('lightbox-title');
    var details = $('lightbox-details');
    var desc = $('lightbox-description');
    var counter = $('lightbox-counter');

    if (img) img.src = art.image_url || art.placeholder_url || '';
    if (title) title.textContent = art.title;
    if (details) details.textContent = [art.medium, art.year, art.dimensions].filter(Boolean).join(' · ');
    if (desc) desc.textContent = art.description || '';
    if (counter) counter.textContent = (state.lightboxIndex + 1) + ' / ' + state.lightboxItems.length;
  }

  function wireLightbox() {
    var lb = $('lightbox');
    if (!lb) return;

    $('lightbox-close').addEventListener('click', closeLightbox);
    $('lightbox-prev').addEventListener('click', lightboxPrev);
    $('lightbox-next').addEventListener('click', lightboxNext);

    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
  }

  /* ===== Instagram Feed ===== */

  async function loadIgFeed() {
    var token = localStorage.getItem('artfolio_instagram_token');
    var userId = localStorage.getItem('artfolio_instagram_user_id');

    if (!token || !userId) {
      showIgNotConnected();
      return;
    }

    showIgLoading();

    try {
      var posts = await fetchInstagramMedia(token, userId, 48);
      state.igPosts = posts;
      state.igLastTimestamp = posts.length ? posts[0].timestamp : null;
      renderIgGrid(posts);
      startIgPolling();
    } catch (err) {
      console.warn('IG feed error:', err);
      showIgError();
    }
  }

  function showIgLoading() {
    var loading = $('ig-loading');
    var feed = $('ig-feed');
    var notConnected = $('ig-not-connected');
    var empty = $('ig-empty');

    if (loading) loading.hidden = false;
    if (feed) feed.hidden = true;
    if (notConnected) notConnected.hidden = true;
    if (empty) empty.hidden = true;
  }

  function showIgNotConnected() {
    var loading = $('ig-loading');
    var feed = $('ig-feed');
    var notConnected = $('ig-not-connected');
    var empty = $('ig-empty');

    if (loading) loading.hidden = true;
    if (feed) feed.hidden = true;
    if (empty) empty.hidden = true;
    if (notConnected) notConnected.hidden = false;
  }

  function showIgError() {
    var loading = $('ig-loading');
    var feed = $('ig-feed');
    var notConnected = $('ig-not-connected');
    var empty = $('ig-empty');

    if (loading) loading.hidden = true;
    if (feed) feed.hidden = true;
    if (empty) empty.hidden = true;
    if (notConnected) {
      notConnected.hidden = false;
      notConnected.querySelector('p').innerHTML = 'Couldn\'t load Instagram feed. <a href="admin.html">Check connection →</a>';
    }
  }

  function renderIgGrid(posts) {
    var grid = $('ig-grid');
    var loading = $('ig-loading');
    var feed = $('ig-feed');
    var empty = $('ig-empty');
    var notConnected = $('ig-not-connected');

    if (!grid) return;

    if (loading) loading.hidden = true;
    if (notConnected) notConnected.hidden = true;
    if (empty) empty.hidden = true;

    if (!posts.length) {
      if (feed) feed.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }

    if (feed) feed.hidden = false;

    var layout = buildMosaicLayout(posts.length);

    grid.innerHTML = posts.map(function (post, i) {
      var sizeClass = layout[i] || '';
      var videoClass = post.is_video ? ' video' : '';
      var imgSrc = post.thumbnail_url || post.image_url || '';
      var caption = post.caption ? post.caption.replace(/<[^>]*>/g, '').slice(0, 80) : '';

      return '' +
        '<div class="ig-tile ' + sizeClass + videoClass + '" data-index="' + i + '">' +
          '<img src="' + imgSrc + '" alt="' + esc(caption) + '" loading="lazy">' +
          '<div class="ig-tile-overlay">' +
            (post.is_video
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>') +
          '</div>' +
          (caption ? '<div class="ig-tile-caption"><div class="ig-tile-caption-text">' + esc(caption) + '</div></div>' : '') +
        '</div>';
    }).join('');

    grid.querySelectorAll('.ig-tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var idx = parseInt(tile.dataset.index, 10);
        openIgPreview(idx);
      });
    });

    updateHeroStats();
  }

  function buildMosaicLayout(count) {
    var layout = [];
    var i = 0;
    while (i < count) {
      var r = Math.random();
      if (r < 0.15 && i + 3 < count) {
        layout.push('large');
        i += 4;
      } else if (r < 0.4 && i + 1 < count) {
        layout.push('medium');
        i += 2;
      } else {
        layout.push('');
        i += 1;
      }
    }
    while (layout.length > count) layout.pop();
    return layout;
  }

  /* ===== IG Preview ===== */

  function openIgPreview(index) {
    if (!state.igPosts.length) return;
    state.igPreviewIndex = Math.max(0, Math.min(index, state.igPosts.length - 1));
    state.igPreviewOpen = true;

    var preview = $('ig-preview');
    if (!preview) return;
    preview.hidden = false;
    void preview.offsetWidth;
    preview.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderIgPreview();
  }

  function closeIgPreview() {
    var preview = $('ig-preview');
    if (!preview) return;
    preview.classList.remove('open');
    setTimeout(function () { preview.hidden = true; }, 300);
    document.body.style.overflow = '';
    state.igPreviewOpen = false;
  }

  function igPreviewPrev() {
    if (!state.igPosts.length) return;
    state.igPreviewIndex = (state.igPreviewIndex - 1 + state.igPosts.length) % state.igPosts.length;
    renderIgPreview();
  }

  function igPreviewNext() {
    if (!state.igPosts.length) return;
    state.igPreviewIndex = (state.igPreviewIndex + 1) % state.igPosts.length;
    renderIgPreview();
  }

  function renderIgPreview() {
    var post = state.igPosts[state.igPreviewIndex];
    if (!post) return;

    var img = $('ig-preview-image');
    var caption = $('ig-preview-caption');
    var timestamp = $('ig-preview-timestamp');
    var counter = $('ig-preview-counter');

    if (img) img.src = post.thumbnail_url || post.image_url || '';
    if (caption) caption.textContent = post.caption || '';
    if (timestamp) {
      var d = post.timestamp ? new Date(post.timestamp * 1000) : null;
      timestamp.textContent = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    }
    if (counter) counter.textContent = (state.igPreviewIndex + 1) + ' / ' + state.igPosts.length;
  }

  function wireIgPreview() {
    var preview = $('ig-preview');
    if (!preview) return;

    $('ig-preview-close').addEventListener('click', closeIgPreview);
    $('ig-preview-prev').addEventListener('click', igPreviewPrev);
    $('ig-preview-next').addEventListener('click', igPreviewNext);

    preview.addEventListener('click', function (e) {
      if (e.target === preview) closeIgPreview();
    });
  }

  /* ===== IG Auto-Update Polling ===== */

  function startIgPolling() {
    stopIgPolling();
    state.igPollTimer = setInterval(function () {
      pollForNewPosts();
    }, 120000);
  }

  function stopIgPolling() {
    if (state.igPollTimer) {
      clearInterval(state.igPollTimer);
      state.igPollTimer = null;
    }
  }

  async function pollForNewPosts() {
    var token = localStorage.getItem('artfolio_instagram_token');
    var userId = localStorage.getItem('artfolio_instagram_user_id');
    if (!token || !userId) return;

    var liveEl = $('ig-live');
    var liveText = $('ig-live-text');

    if (liveEl) liveEl.classList.add('updating');
    if (liveText) liveText.textContent = 'Updating…';

    try {
      var newPosts = await fetchInstagramMedia(token, userId, 48, state.igLastTimestamp);

      if (liveEl) liveEl.classList.remove('updating');

      if (!newPosts.length) {
        if (liveText) liveText.textContent = 'Live';
        return;
      }

      var existingIds = {};
      state.igPosts.forEach(function (p) { existingIds[p.ig_id] = true; });

      var added = newPosts.filter(function (p) { return !existingIds[p.ig_id]; });
      if (!added.length) {
        if (newPosts.length) state.igLastTimestamp = newPosts[0].timestamp;
        if (liveText) liveText.textContent = 'Live';
        return;
      }

      added.forEach(function (p) { p._new = true; });
      state.igPosts = added.concat(state.igPosts);
      state.igLastTimestamp = newPosts.length ? newPosts[0].timestamp : state.igLastTimestamp;

      renderIgGrid(state.igPosts);
      updateHeroStats();

      if (liveText) {
        liveText.textContent = '+' + added.length + ' new';
        setTimeout(function () {
          if (liveText) liveText.textContent = 'Live';
        }, 3000);
      }
    } catch (err) {
      if (liveEl) liveEl.classList.remove('updating');
      if (liveText) liveText.textContent = 'Live';
      console.warn('IG poll error:', err);
    }
  }

  /* ===== Stats ===== */

  function updateHeroStats() {
    var works = $('hero-works');
    var mediums = $('hero-mediums');
    var ig = $('hero-ig');

    if (works) works.textContent = state.artworks.length || 0;
    if (mediums) mediums.textContent = state.mediums.length || 0;
    if (ig) ig.textContent = state.igPosts.length || 0;
  }

  function updateAboutSection() {
    var list = $('about-mediums-list');
    if (list) {
      list.textContent = state.mediums.length
        ? state.mediums.map(function (m) { return m.name; }).join(' · ')
        : '—';
    }
  }

  /* ===== Init ===== */

  async function init() {
    initMobileMenu();
    await initGallery();
    await loadIgFeed();
    wireLightbox();
    wireIgPreview();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.lightboxOpen) closeLightbox();
        else if (state.igPreviewOpen) closeIgPreview();
      }
      if (state.lightboxOpen) {
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
      }
      if (state.igPreviewOpen) {
        if (e.key === 'ArrowLeft') igPreviewPrev();
        if (e.key === 'ArrowRight') igPreviewNext();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.artfolioApp = {
    reloadArtworks: initGallery,
    reloadIgFeed: loadIgFeed,
    forceIgPoll: pollForNewPosts,
  };

})();
