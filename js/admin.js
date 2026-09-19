// ====== admin.js — Admin panel logic ======
// Handles: auth state, artwork CRUD, medium CRUD, Instagram connect, settings.

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

async function initAdmin() {
  // 1. Auth state
  updateAuthUI();

  // 2. Wire artwork form
  wireArtworkForm();

  // 3. Wire medium form
  wireMediumForm();

  // 4. Wire Instagram
  wireInstagram();

  // 5. Wire settings
  wireSettings();

  // 6. Load data
  await loadArtworks();
  await loadMediums();
  updateInstagramUI();
}

// ---- Auth ----

async function updateAuthUI() {
  const bar = document.getElementById('admin-auth-bar');
  const label = document.getElementById('admin-auth-label');
  const sub = document.getElementById('admin-auth-sub');
  const signOut = document.getElementById('admin-sign-out');

  if (!bar || !label) return;

  if (window.artfolio?.isDemo) {
    bar.className = 'admin-auth-bar not-auth';
    label.textContent = 'Demo mode';
    sub.textContent = 'No authentication required';
    if (signOut) signOut.hidden = true;
    return;
  }

  try {
    if (!window.artfolio?.supabase) {
      bar.className = 'admin-auth-bar not-auth';
      label.textContent = 'Not connected';
      sub.textContent = 'Supabase not configured';
      if (signOut) signOut.hidden = true;
      return;
    }

    const { data: { user } } = await window.artfolio.supabase.auth.getUser();
    if (user) {
      bar.className = 'admin-auth-bar auth';
      label.textContent = 'Signed in';
      sub.textContent = user.email || user.id;
      if (signOut) {
        signOut.hidden = false;
        signOut.onclick = async () => {
          await window.artfolio.supabase.auth.signOut();
          updateAuthUI();
        };
      }
    } else {
      bar.className = 'admin-auth-bar not-auth';
      label.textContent = 'Not signed in';
      sub.textContent = 'Sign in to manage your collection';
      if (signOut) signOut.hidden = true;
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    bar.className = 'admin-auth-bar not-auth';
    label.textContent = 'Auth unavailable';
    sub.textContent = 'Some features may be limited';
  }
}

// ---- Artworks CRUD ----

function wireArtworkForm() {
  const addBtn = document.getElementById('admin-add-artwork');
  const formCard = document.getElementById('admin-artwork-form-card');
  const form = document.getElementById('admin-artwork-form');
  const formLabel = document.getElementById('admin-form-label');
  const submitBtn = document.getElementById('admin-form-submit');
  const deleteBtn = document.getElementById('admin-form-delete');
  const cancelBtn = document.getElementById('admin-form-cancel');
  const idInput = document.getElementById('artwork-id-input');
  const isEditInput = document.getElementById('artwork-is-edit-input');
  const titleInput = document.getElementById('artwork-title-input');
  const mediumInput = document.getElementById('artwork-medium-input');
  const yearInput = document.getElementById('artwork-year-input');
  const dimsInput = document.getElementById('artwork-dimensions-input');
  const imageUrlInput = document.getElementById('artwork-image-url-input');
  const fileInput = document.getElementById('artwork-file-input');
  const descInput = document.getElementById('artwork-description-input');
  const tagsInput = document.getElementById('artwork-tags-input');

  if (!addBtn) return;

  // Populate medium select on open
  function populateMediumSelect(selected) {
    if (!mediumInput) return;
    const mediums = getCurrentMediumsSync();
    const currentVal = mediumInput.value;
    mediumInput.innerHTML = '<option value="">Select medium…</option>' +
      mediums.map(m => `<option value="${esc(m.name)}" ${m.name === currentVal ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    if (selected && mediums.find(m => m.name === selected)) {
      mediumInput.value = selected;
    }
  }

  addBtn.addEventListener('click', () => {
    formCard.hidden = false;
    formLabel.textContent = 'Add Artwork';
    submitBtn.textContent = 'Save Artwork';
    deleteBtn.hidden = true;
    idInput.value = '';
    isEditInput.value = 'false';
    form.reset();
    populateMediumSelect('');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  cancelBtn?.addEventListener('click', () => {
    formCard.hidden = true;
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      alert('Title is required.');
      return;
    }

    const medium = mediumInput.value;
    if (!medium) {
      alert('Medium is required.');
      return;
    }

    const year = yearInput.value.trim();
    const dimensions = dimsInput.value.trim();
    const imageUrl = imageUrlInput.value.trim();
    const description = descInput.value.trim();
    const tagsStr = tagsInput.value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const isEdit = isEditInput.value === 'true';
    const id = idInput.value;

    // Handle file vs URL
    let finalImageUrl = imageUrl;

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB). Use a URL instead.');
        return;
      }

      if (window.artfolio?.isDemo) {
        if (file.size > 300 * 1024) {
          alert('Demo mode: files over 300KB stored as object URL. Refresh may lose them. Consider using a URL for large files.');
        }
        finalImageUrl = URL.createObjectURL(file);
      } else if (window.artfolio?.supabase) {
        const filePath = `artworks/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await window.artfolio.supabase.storage
          .from('artworks')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Upload failed:', uploadError);
          alert('Image upload failed: ' + (uploadError.message || 'unknown error'));
          return;
        }
        const { data: urlData } = window.artfolio.supabase.storage.from('artworks').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      }
    }

    // Save
    submitBtn.textContent = isEdit ? 'Updating…' : 'Saving…';
    submitBtn.disabled = true;

    const data = {
      title,
      medium,
      year: year || null,
      dimensions: dimensions || null,
      description: description || null,
      tags: tags || null,
      image_url: finalImageUrl || null,
      is_featured: false,
    };

    try {
      if (window.artfolio?.isDemo) {
        const artworks = JSON.parse(localStorage.getItem('artfolio_artworks') || '[]');
        if (isEdit && id) {
          const idx = artworks.findIndex(a => a.id === id);
          if (idx >= 0) artworks[idx] = { ...artworks[idx], ...data };
        } else {
          data.id = crypto.randomUUID();
          data.created_at = new Date().toISOString();
          artworks.push(data);
        }
        localStorage.setItem('artfolio_artworks', JSON.stringify(artworks));
      } else if (window.artfolio?.supabase) {
        if (isEdit && id) {
          await window.artfolio.supabase.from('artworks').update(data).eq('id', id);
        } else {
          data.id = crypto.randomUUID();
          data.created_at = new Date().toISOString();
          await window.artfolio.supabase.from('artworks').insert(data);
        }
      }

      formCard.hidden = true;
      alert(isEdit ? 'Artwork updated.' : 'Artwork added.');
      await loadArtworks();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving artwork: ' + (err.message || err));
    } finally {
      submitBtn.textContent = isEdit ? 'Update Artwork' : 'Save Artwork';
      submitBtn.disabled = false;
    }
  });

  // Delete
  deleteBtn?.addEventListener('click', async () => {
    const id = idInput.value;
    const title = titleInput.value.trim() || 'this artwork';
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      if (window.artfolio?.isDemo) {
        const artworks = JSON.parse(localStorage.getItem('artfolio_artworks') || '[]');
        const filtered = artworks.filter(a => a.id !== id);
        localStorage.setItem('artfolio_artworks', JSON.stringify(filtered));
      } else if (window.artfolio?.supabase) {
        await window.artfolio.supabase.from('artworks').delete().eq('id', id);
      }

      formCard.hidden = true;
      alert('Artwork deleted.');
      await loadArtworks();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Error deleting: ' + (err.message || err));
    }
  });
}

async function loadArtworks(filterMedium) {
  const list = document.getElementById('admin-artworks-list');
  const countEl = document.getElementById('admin-artwork-count');
  const mediumFilters = document.getElementById('admin-medium-filters');

  if (!list) return;

  let artworks;

  try {
    if (window.artfolio?.isDemo) {
      artworks = JSON.parse(localStorage.getItem('artfolio_artworks') || '[]');
    } else if (window.artfolio?.supabase) {
      let query = window.artfolio.supabase.from('artworks').select('*').order('created_at', { ascending: false });
      if (filterMedium && filterMedium !== 'all') {
        const medium = getCurrentMediumsSync().find(m => m.slug === filterMedium);
        if (medium) {
          query = query.eq('medium', medium.name);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      artworks = data || [];
    } else {
      artworks = [];
    }
  } catch (err) {
    console.error('Failed to load artworks:', err);
    list.innerHTML = '<p style="color:#fc7981;font-family:var(--font-mono);font-size:12px;">Failed to load artworks. Check console.</p>';
    return;
  }

  if (countEl) countEl.textContent = `${artworks.length} artwork${artworks.length !== 1 ? 's' : ''}`;

  if (artworks.length === 0) {
    list.innerHTML = `
      <div class="admin-empty">
        <div class="admin-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </div>
        <p class="admin-empty-text">No artworks yet. Click "+ Add Artwork" to add your first piece.</p>
      </div>
    `;
    return;
  }

  // Build medium filter chips
  if (mediumFilters) {
    const usedMediums = [...new Set(artworks.map(a => a.medium).filter(Boolean))];
    const allChip = mediumFilters.querySelector('[data-filter="all"]');
    if (allChip) allChip.remove();
    mediumFilters.innerHTML = '';
    const newAll = document.createElement('button');
    newAll.className = 'admin-filter-chip active';
    newAll.dataset.filter = 'all';
    newAll.textContent = 'All';
    mediumFilters.appendChild(newAll);

    usedMediums.forEach(m => {
      const chip = document.createElement('button');
      chip.className = 'admin-filter-chip';
      chip.dataset.filter = m;
      chip.textContent = m;
      chip.addEventListener('click', () => {
        mediumFilters.querySelectorAll('.admin-filter-chip').forEach(c =>
          c.classList.toggle('active', c === chip)
        );
        loadArtworks(m);
      });
      mediumFilters.appendChild(chip);
    });
  }

  list.innerHTML = artworks.map(art => {
    const hasImage = art.image_url && !art.image_url.startsWith('blob:');
    return `
      <div class="artwork-row" data-id="${art.id}">
        ${hasImage ? `
          <div class="artwork-thumb">
            <img src="${art.image_url}" alt="${esc(art.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'artwork-thumb-no-img\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'m21 15-5-5L5 21\\'/></svg></div>';">
          </div>
        ` : `
          <div class="artwork-thumb-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
        `}
        <div class="artwork-info">
          <div class="artwork-info-title">${esc(art.title)}</div>
          <div class="artwork-info-meta">${esc(art.medium)}${art.year ? ` · ${esc(art.year)}` : ''}</div>
          <div class="artwork-info-tags">${(art.tags || []).slice(0, 4).map(t => `<span class="artwork-tag-pill">${esc(t)}</span>`).join('')}${(art.tags || []).length > 4 ? `<span class="artwork-tag-pill">+${(art.tags || []).length - 4}</span>` : ''}</div>
        </div>
        <div class="artwork-row-actions">
          <button class="btn-admin btn-admin-xs edit-artwork-btn" data-id="${art.id}" data-title="${esc(art.title)}">Edit</button>
          <button class="btn-admin btn-admin-xs btn-admin-danger delete-artwork-btn" data-id="${art.id}" data-title="${esc(art.title)}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Wire edit buttons
  list.querySelectorAll('.edit-artwork-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      let art = null;

      if (window.artfolio?.isDemo) {
        const artworks = JSON.parse(localStorage.getItem('artfolio_artworks') || '[]');
        art = artworks.find(a => a.id === id);
      } else if (window.artfolio?.supabase) {
        const { data, error } = await window.artfolio.supabase
          .from('artworks').select('*').eq('id', id).single();
        if (error) {
          alert('Failed to load: ' + (error.message || 'unknown'));
          return;
        }
        art = data;
      }

      if (art) {
        showArtworkForm(art);
      }
    });
  });

  // Wire delete buttons
  list.querySelectorAll('.delete-artwork-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      // Reuse the delete handler from wireArtworkForm
      const deleteBtn = document.getElementById('admin-form-delete');
      // Trigger via form if open, otherwise direct delete
      if (document.getElementById('admin-artwork-form-card').hidden) {
        // Not in form — do direct delete
        (async () => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
          try {
            if (window.artfolio?.isDemo) {
              const artworks = JSON.parse(localStorage.getItem('artfolio_artworks') || '[]');
              localStorage.setItem('artfolio_artworks', JSON.stringify(artworks.filter(a => a.id !== id)));
            } else if (window.artfolio?.supabase) {
              await window.artfolio.supabase.from('artworks').delete().eq('id', id);
            }
            alert('Artwork deleted.');
            await loadArtworks();
          } catch (err) {
            alert('Error: ' + (err.message || err));
          }
        })();
      } else {
        // Form is open — populate and show delete button
        const formCard = document.getElementById('admin-artwork-form-card');
        const idInput2 = document.getElementById('artwork-id-input');
        const titleInput2 = document.getElementById('artwork-title-input');
        const isEditInput2 = document.getElementById('artwork-is-edit-input');

        idInput2.value = id;
        titleInput2.value = title;
        isEditInput2.value = 'true';
        // Find the artwork and populate the rest
        // (user can see the title and confirm delete)
        document.getElementById('admin-form-delete').hidden = false;
        document.getElementById('admin-form-label').textContent = `Delete: ${title}`;
      }
    });
  });
}

function showArtworkForm(artwork) {
  const formCard = document.getElementById('admin-artwork-form-card');
  const formLabel = document.getElementById('admin-form-label');
  const submitBtn = document.getElementById('admin-form-submit');
  const deleteBtn = document.getElementById('admin-form-delete');
  const idInput = document.getElementById('artwork-id-input');
  const isEditInput = document.getElementById('artwork-is-edit-input');
  const titleInput = document.getElementById('artwork-title-input');
  const mediumInput = document.getElementById('artwork-medium-input');
  const yearInput = document.getElementById('artwork-year-input');
  const dimsInput = document.getElementById('artwork-dimensions-input');
  const imageUrlInput = document.getElementById('artwork-image-url-input');
  const fileInput = document.getElementById('artwork-file-input');
  const descInput = document.getElementById('artwork-description-input');
  const tagsInput = document.getElementById('artwork-tags-input');

  if (!formCard) return;

  formCard.hidden = false;
  formLabel.textContent = `Edit: ${artwork.title}`;
  submitBtn.textContent = 'Update Artwork';
  deleteBtn.hidden = false;
  idInput.value = artwork.id;
  isEditInput.value = 'true';
  titleInput.value = artwork.title || '';
  yearInput.value = artwork.year || '';
  dimsInput.value = artwork.dimensions || '';
  imageUrlInput.value = artwork.image_url || '';
  descInput.value = artwork.description || '';
  tagsInput.value = (artwork.tags || []).join(', ');
  fileInput.value = '';

  // Populate medium select
  const mediums = getCurrentMediumsSync();
  if (mediumInput) {
    const currentVal = mediumInput.value;
    mediumInput.innerHTML = '<option value="">Select medium…</option>' +
      mediums.map(m => `<option value="${esc(m.name)}" ${m.name === artwork.medium ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    if (artwork.medium && mediums.find(m => m.name === artwork.medium)) {
      mediumInput.value = artwork.medium;
    }
  }

  formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getCurrentMediumsSync() {
  if (window.artfolio?.isDemo) {
    return JSON.parse(localStorage.getItem('artfolio_mediums') || '[]');
  }
  if (window._mediums) return window._mediums;
  return [];
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ---- Mediums CRUD ----

function wireMediumForm() {
  const addBtn = document.getElementById('admin-add-medium-btn');
  const formDiv = document.getElementById('admin-medium-form');
  const nameInput = document.getElementById('medium-name-input');
  const colorInput = document.getElementById('medium-color-input');
  const saveBtn = document.getElementById('admin-medium-form-save');
  const cancelBtn = document.getElementById('admin-medium-form-cancel');

  let editingId = null;

  addBtn?.addEventListener('click', () => {
    formDiv.style.display = 'block';
    nameInput.value = '';
    colorInput.value = '#c9a96e';
    saveBtn.textContent = 'Add Medium';
    editingId = null;
    nameInput.focus();
  });

  cancelBtn?.addEventListener('click', () => {
    formDiv.style.display = 'none';
  });

  saveBtn?.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('Medium name is required.');
      return;
    }

    const color = colorInput.value;

    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;

    try {
      if (window.artfolio?.isDemo) {
        const mediums = JSON.parse(localStorage.getItem('artfolio_mediums') || '[]');
        if (editingId) {
          const idx = mediums.findIndex(m => m.id === editingId);
          if (idx >= 0) mediums[idx] = { ...mediums[idx], name, color };
        } else {
          mediums.push({ id: crypto.randomUUID(), name, slug: slugify(name), color });
        }
        localStorage.setItem('artfolio_mediums', JSON.stringify(mediums));
      } else if (window.artfolio?.supabase) {
        if (editingId) {
          await window.artfolio.supabase.from('mediums').update({ name, color }).eq('id', editingId);
        } else {
          await window.artfolio.supabase.from('mediums').insert({ name, slug: slugify(name), color });
        }
      }

      formDiv.style.display = 'none';
      alert('Medium saved.');
      await loadMediums();
      await loadArtworks();
    } catch (err) {
      console.error('Save medium failed:', err);
      alert('Error: ' + (err.message || err));
    } finally {
      saveBtn.textContent = editingId ? 'Update Medium' : 'Add Medium';
      saveBtn.disabled = false;
    }
  });

  // Expose editing state for edit buttons
  window._adminEditMediumId = function(id) {
    editingId = id;
    // This would need the medium data — load it
    (async () => {
      let medium;
      if (window.artfolio?.isDemo) {
        const mediums = JSON.parse(localStorage.getItem('artfolio_mediums') || '[]');
        medium = mediums.find(m => m.id === id);
      } else if (window.artfolio?.supabase) {
        const { data, error } = await window.artfolio.supabase.from('mediums').eq('id', id).single();
        if (error) return;
        medium = data;
      }
      if (medium) {
        nameInput.value = medium.name;
        colorInput.value = medium.color || '#c9a96e';
        saveBtn.textContent = 'Update Medium';
        editingId = id;
        formDiv.style.display = 'block';
        nameInput.focus();
      }
    })();
  };

  window._adminCancelMediumEdit = function() {
    formDiv.style.display = 'none';
    editingId = null;
  };
}

async function loadMediums() {
  const list = document.getElementById('admin-mediums-list');

  if (!list) return;

  let mediums;

  try {
    if (window.artfolio?.isDemo) {
      mediums = JSON.parse(localStorage.getItem('artfolio_mediums') || '[]');
    } else if (window.artfolio?.supabase) {
      const { data, error } = await window.artfolio.supabase.from('mediums').select('*');
      if (error) throw error;
      mediums = data || [];
      window._mediums = mediums;
    } else {
      mediums = [];
    }
  } catch (err) {
    console.error('Failed to load mediums:', err);
    list.innerHTML = '<p style="color:#fc7981;font-family:var(--font-mono);font-size:12px;">Failed to load mediums.</p>';
    return;
  }

  if (mediums.length === 0) {
    list.innerHTML = `
      <div class="admin-empty">
        <div class="admin-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <p class="admin-empty-text">No mediums defined. Add mediums as you create artworks.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = mediums.map(m => `
    <div class="medium-row" data-id="${m.id}">
      <div class="medium-color-swatch" style="background:${m.color || '#888'};"></div>
      <div class="medium-row-info">
        <div class="medium-row-name">${esc(m.name)}</div>
        <div class="medium-row-slug">${esc(m.slug || slugify(m.name))}</div>
      </div>
      <div class="medium-row-actions">
        <button class="btn-admin btn-admin-xs edit-medium-btn" data-id="${m.id}">Edit</button>
        <button class="btn-admin btn-admin-xs btn-admin-danger delete-medium-btn" data-id="${m.id}" data-name="${esc(m.name)}">Delete</button>
      </div>
    </div>
  `).join('');

  // Wire edit buttons
  list.querySelectorAll('.edit-medium-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window._adminEditMediumId(btn.dataset.id);
    });
  });

  // Wire delete buttons
  list.querySelectorAll('.delete-medium-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`Delete "${name}"? Artworks using this medium will lose their medium association.`)) return;

      try {
        if (window.artfolio?.isDemo) {
          const mediums = JSON.parse(localStorage.getItem('artfolio_mediums') || '[]');
          localStorage.setItem('artfolio_mediums', JSON.stringify(mediums.filter(m => m.id !== id)));
        } else if (window.artfolio?.supabase) {
          await window.artfolio.supabase.from('mediums').delete().eq('id', id);
        }

        await loadMediums();
        await loadArtworks();
        alert('Medium deleted.');
      } catch (err) {
        console.error('Delete medium failed:', err);
        alert('Error: ' + (err.message || err));
      }
    });
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ---- Instagram ----

function wireInstagram() {
  const connectBtn = document.getElementById('admin-ig-connect-btn');
  const disconnectBtn = document.getElementById('admin-ig-disconnect-btn');
  const refreshBtn = document.getElementById('admin-ig-refresh-btn');
  const clientIdInput = document.getElementById('admin-ig-client-id-input');
  const clientSecretInput = document.getElementById('admin-ig-client-secret-input');

  // Load saved credentials
  const savedId = localStorage.getItem('artfolio_instagram_client_id');
  const savedSecret = localStorage.getItem('artfolio_instagram_client_secret');
  if (savedId) clientIdInput.value = savedId;
  if (savedSecret) clientSecretInput.value = savedSecret;

  connectBtn?.addEventListener('click', async () => {
    const clientId = clientIdInput.value.trim();
    const clientSecret = clientSecretInput.value.trim();

    if (!clientId || !clientSecret) {
      alert('Please enter both Client ID and Client Secret.');
      return;
    }

    // Save credentials
    localStorage.setItem('artfolio_instagram_client_id', clientId);
    localStorage.setItem('artfolio_instagram_client_secret', clientSecret);

    // Open OAuth popup
    const redirectUri = window.location.origin + '/instagram-callback.html';
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic&response_type=code`;

    const authWindow = window.open(authUrl, 'instagram_auth', 'width=600,height=700');
    if (!authWindow) {
      alert('Please allow popups to connect Instagram.');
      return;
    }

    // Poll
    const startTime = Date.now();
    let pollInterval = null;

    const poll = async () => {
      try {
        if (authWindow.closed) {
          clearInterval(pollInterval);
          const code = localStorage.getItem('artfolio_instagram_auth_code');
          if (code) {
            localStorage.removeItem('artfolio_instagram_auth_code');
            await exchangeInstagramCode(code, redirectUri);
          } else {
            alert('Authorization window was closed. Please try again.');
          }
          return;
        }

        if (Date.now() - startTime > 300000) {
          clearInterval(pollInterval);
          authWindow.close();
          alert('Authorization timed out. Please try again.');
          return;
        }
      } catch {
        clearInterval(pollInterval);
      }
    };

    pollInterval = setInterval(poll, 500);
  });

  disconnectBtn?.addEventListener('click', () => {
    if (!confirm('Disconnect Instagram? This cannot be undone.')) return;
    localStorage.removeItem('artfolio_instagram_token');
    localStorage.removeItem('artfolio_instagram_user_id');
    localStorage.removeItem('artfolio_instagram_username');
    localStorage.removeItem('artfolio_instagram_last_update');
    window.location.reload();
  });

  refreshBtn?.addEventListener('click', async () => {
    refreshBtn.textContent = 'Loading…';
    refreshBtn.disabled = true;
    await window.loadInstagramFeed();
    refreshBtn.textContent = 'Refresh feed';
    refreshBtn.disabled = false;
    alert('Feed refreshed!');
  });
}

async function exchangeInstagramCode(code, redirectUri) {
  const clientId = localStorage.getItem('artfolio_instagram_client_id');
  const clientSecret = localStorage.getItem('artfolio_instagram_client_secret');

  try {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem('artfolio_instagram_token', data.access_token);
      localStorage.setItem('artfolio_instagram_user_id', data.user_id);
      localStorage.setItem('artfolio_instagram_username', data.meta?.username || '');

      updateInstagramUI();
      await window.loadInstagramFeed();
      alert('Instagram connected successfully!');
    } else {
      alert('Failed: ' + (data.error_message || 'unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error during token exchange.');
  }
}

function updateInstagramUI() {
  const statusEl = document.getElementById('admin-ig-status');
  const connectedView = document.getElementById('admin-ig-connected-view');
  const notConnectedView = document.getElementById('admin-ig-not-connected-view');
  const expiryEl = document.getElementById('admin-ig-expiry');

  const token = localStorage.getItem('artfolio_instagram_token');
  const userId = localStorage.getItem('artfolio_instagram_user_id');

  if (token && userId) {
    if (connectedView) connectedView.style.display = 'block';
    if (notConnectedView) notConnectedView.style.display = 'none';
    if (statusEl) statusEl.textContent = 'Connected';
    if (expiryEl) {
      const expiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      expiryEl.textContent = expiry.toLocaleDateString();
    }
  } else {
    if (connectedView) connectedView.style.display = 'none';
    if (notConnectedView) notConnectedView.style.display = 'block';
    if (statusEl) statusEl.textContent = 'Not connected';
  }
}

// ---- Settings ----

function wireSettings() {
  const saveBtn = document.getElementById('admin-settings-save-btn');
  const statusEl = document.getElementById('admin-settings-status');

  saveBtn?.addEventListener('click', async () => {
    const siteTitle = document.getElementById('admin-site-title-input').value.trim();
    const artistName = document.getElementById('admin-artist-name-input').value.trim();
    const artistEmail = document.getElementById('admin-artist-email-input').value.trim();
    const siteSubtitle = document.getElementById('admin-site-subtitle-input').value.trim();

    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;
    statusEl.innerHTML = '';

    const settings = { site_title: siteTitle, artist_name: artistName, artist_email: artistEmail, site_subtitle: siteSubtitle };

    try {
      if (window.artfolio?.isDemo) {
        localStorage.setItem('artfolio_settings', JSON.stringify(settings));
      } else if (window.artfolio?.supabase) {
        const existing = await window.artfolio.supabase.from('settings').select('*').single();
        if (existing) {
          await window.artfolio.supabase.from('settings').update(settings).eq('id', existing.id);
        } else {
          await window.artfolio.supabase.from('settings').insert(settings);
        }
      }

      statusEl.innerHTML = '<div class="admin-status admin-status-success">✓ Settings saved.</div>';
      // Update the live site if open
      updateLiveSiteSettings(settings);
    } catch (err) {
      console.error('Settings save failed:', err);
      statusEl.innerHTML = '<div class="admin-status admin-status-error">✗ ' + (err.message || 'Error saving settings') + '</div>';
    } finally {
      saveBtn.textContent = 'Save Settings';
      saveBtn.disabled = false;
    }
  });
}

function updateLiveSiteSettings(settings) {
  // Update elements on the live site if it's open in another tab
  // This is done via localStorage + storage event
  localStorage.setItem('artfolio_settings_changed', JSON.stringify(settings));

  // Also update immediately if this is the main tab
  if (document.getElementById('hero-count')) {
    document.title = settings.site_title || "Jagan's Artfolio";
  }
}

// Listen for settings changes from admin (cross-tab)
window.addEventListener('storage', (e) => {
  if (e.key === 'artfolio_settings_changed') {
    try {
      const settings = JSON.parse(e.newValue);
      applySettings(settings);
    } catch {}
  }
});

function applySettings(settings) {
  if (!settings) return;

  if (document.title !== settings.site_title) {
    document.title = settings.site_title || "Jagan's Artfolio";
  }

  const artistEl = document.querySelector('.hero-sub');
  if (artistEl && settings.site_subtitle) {
    // Only update if it matches the default
    if (artistEl.textContent.includes('Multiple mediums')) {
      artistEl.textContent = settings.site_subtitle;
    }
  }
}
