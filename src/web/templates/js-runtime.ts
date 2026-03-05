export const APP_JS_RUNTIME = `
(function () {
  var state = {
    payload: null,
    cardIndex: {},
    actionPlanExpanded: {},
    loading: false,
    staticExport: Boolean(window.__AGENTABLE_STATIC_EXPORT),
  };

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fmtRelative(iso) {
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }

    var diff = Date.now() - date.getTime();
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + 'm ago';
    var hours = Math.floor(min / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    var months = Math.floor(days / 30);
    if (months < 12) return months + 'mo ago';
    var years = Math.floor(months / 12);
    return years + 'y ago';
  }

  function levelBySegment(index) {
    if (index < 20) return 1;
    if (index < 40) return 2;
    if (index < 60) return 3;
    if (index < 80) return 4;
    return 5;
  }

  function statusClass(status) {
    if (status === 'pass') return 'status-pass';
    if (status === 'fail') return 'status-fail';
    if (status === 'skip') return 'status-skip';
    return 'status-unverified';
  }

  function collectCards(payload) {
    var index = {};
    Object.keys(payload.criteriaByCategory).forEach(function (category) {
      payload.criteriaByCategory[category].forEach(function (card) {
        index[card.id] = card;
      });
    });
    return index;
  }

  function renderSegments(score) {
    var filled = Math.max(0, Math.min(100, Math.round(score)));
    var html = '';
    for (var i = 0; i < 100; i += 1) {
      var cls = i < filled ? 'fill-' + levelBySegment(i) : '';
      html += '<div class="segment ' + cls + '"></div>';
    }
    return html;
  }
`;
