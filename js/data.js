/* ============================================
   Artfolio — Supabase Client
   ============================================ */

const SUPABASE_URL = 'https://xdpdvumhadugsuufvanu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_88IMYPLB3FTZ56a6-bXybQ_PFd940X8';

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function sbFetch(path, options) {
  const headers = Object.assign({}, SUPABASE_HEADERS, options.headers || {});
  const res = await fetch(SUPABASE_URL + path, Object.assign({}, options, { headers }));
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch (e) {}
    throw new Error(err.message || 'HTTP ' + res.status);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ===== Artworks ===== */

window.getArtworks = async function (filter) {
  let path = '/rest/v1/artworks?is_published=eq.true&select=*&order=created_at.desc';
  if (filter && filter !== 'all') {
    path += '&medium=eq.' + encodeURIComponent(filter);
  }
  return sbFetch(path);
};

window.getArtwork = async function (id) {
  return sbFetch('/rest/v1/artworks?id=eq.' + id + '&select=*');
};

window.getAllArtworks = async function () {
  return sbFetch('/rest/v1/artworks?select=*&order=created_at.desc');
};

/* ===== Mediums ===== */

window.getMediums = async function () {
  return sbFetch('/rest/v1/mediums?select=*&order=name.asc');
};

/* ===== Settings ===== */

window.getSettings = async function () {
  const result = await sbFetch('/rest/v1/settings?select=*');
  return result && result.length ? result[0] : {
    site_title: "Jagan's Artfolio",
    artist_name: 'Jagan',
    instagram_username: 'jagans_artfolio',
  };
};

/* ===== Insert (admin — requires service_role, handled separately) ===== */

window.insertArtwork = async function (artwork) {
  return sbFetch('/rest/v1/artworks', {
    method: 'POST',
    body: JSON.stringify(artwork),
  });
};

window.updateArtwork = async function (id, updates) {
  return sbFetch('/rest/v1/artworks?id=eq.' + id, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

window.deleteArtwork = async function (id) {
  return sbFetch('/rest/v1/artworks?id=eq.' + id, {
    method: 'DELETE',
  });
};

window.insertMedium = async function (medium) {
  return sbFetch('/rest/v1/mediums', {
    method: 'POST',
    body: JSON.stringify(medium),
  });
};

window.updateMedium = async function (id, updates) {
  return sbFetch('/rest/v1/mediums?id=eq.' + id, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

window.deleteMedium = async function (id) {
  return sbFetch('/rest/v1/mediums?id=eq.' + id, {
    method: 'DELETE',
  });
};
