/* ============================================
   Artfolio — Instagram API Client
   ============================================ */

(function () {
  'use strict';

  var API_BASE = 'https://graph.instagram.com';

  /**
   * Fetch recent media from Instagram Basic Display API.
   */
  window.fetchInstagramMedia = function (accessToken, userId, limit, before) {
    return new Promise(function (resolve, reject) {
      var url = API_BASE + '/me/media?' +
        'fields=id,caption,media_type,media_url,thumbnail_url,permalink,username,timestamp&' +
        'limit=' + Math.min(limit || 48, 50) +
        '&access_token=' + encodeURIComponent(accessToken);

      if (before != null) {
        url += '&before=' + encodeURIComponent(String(before));
      }

      fetch(url, { mode: 'cors' })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (data) {
              throw new Error(data.error_message || 'HTTP ' + res.status);
            }).catch(function () {
              throw new Error('HTTP ' + res.status);
            });
          }
          return res.json();
        })
        .then(function (data) {
          var raw = data.data || [];
          var posts = raw.map(function (item) {
            if (!item) return null;
            var mediaType = item.media_type || 'IMAGE';
            var isVideo = mediaType === 'VIDEO';
            return {
              ig_id: item.id,
              username: item.username || 'jagans_artfolio',
              caption: item.caption ? item.caption.text || '' : '',
              media_type: mediaType,
              is_video: isVideo,
              image_url: isVideo ? (item.thumbnail_url || '') : (item.media_url || ''),
              thumbnail_url: item.thumbnail_url || (isVideo ? item.thumbnail_url : item.media_url) || '',
              permalink: item.permalink || '',
              timestamp: item.timestamp ? parseInt(item.timestamp, 10) : null,
            };
          }).filter(Boolean);
          resolve(posts);
        })
        .catch(reject);
    });
  };

})();
