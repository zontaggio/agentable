import { WebReportPayload } from '../types';

export const APP_CSS = `
@import url('https://fonts.cdnfonts.com/css/tiktok-sans');

:root {
  --bg: #070e11;
  --bg-2: #0d161a;
  --panel: #111b20;
  --panel-2: #18242a;
  --line: #294049;
  --text: #edf4f5;
  --muted: #9db2b9;
  --pass: #66d6a5;
  --fail: #e38364;
  --skip: #7c9198;
  --unverified: #8fa0c4;
  --advanced: #f06a74;
  --intermediate: #62b7ff;
  --basic: #b8e06e;
  --shadow: rgba(0, 0, 0, 0.45);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: radial-gradient(circle at 88% 8%, #16272d, #060c0f 55%);
  color: var(--text);
  min-height: 100%;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
}

body::before {
  content: '';
  pointer-events: none;
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle at 15% 20%, rgba(98, 183, 255, 0.09), transparent 25%),
    radial-gradient(circle at 82% 12%, rgba(184, 224, 110, 0.08), transparent 22%),
    radial-gradient(circle at 30% 90%, rgba(255, 255, 255, 0.03), transparent 18%);
  mix-blend-mode: screen;
}

#app {
  position: relative;
  max-width: 1500px;
  margin: 0 auto;
  padding: 26px 24px 64px;
}

.page-title {
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  font-size: 30px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #f3fbfc;
}

.panel {
  background: linear-gradient(160deg, rgba(16, 27, 32, 0.94), rgba(11, 19, 23, 0.94));
  border: 1px solid var(--line);
  box-shadow: 0 18px 30px var(--shadow);
}

.hero {
  padding: 20px;
  margin-bottom: 20px;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.repo-chip {
  display: flex;
  align-items: center;
  gap: 14px;
}

.level-badge {
  width: 42px;
  height: 42px;
  background: linear-gradient(145deg, #9fe17f, #63b879);
  color: #112015;
  font-weight: 700;
  display: grid;
  place-items: center;
  clip-path: polygon(50% 0%, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%);
}

.repo-name {
  font-size: 24px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  font-weight: 600;
  line-height: 1;
}

.repo-path {
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  width: 38px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 17px;
}

.icon-btn:hover {
  border-color: #4e8493;
  background: rgba(98, 183, 255, 0.12);
}

.last-updated {
  color: var(--muted);
  font-size: 14px;
  margin-right: 8px;
}

.summary-line {
  display: flex;
  justify-content: flex-end;
  margin: 14px 0 8px;
  color: var(--muted);
  font-size: 14px;
}

.summary-strong {
  color: #f2ece7;
  font-weight: 600;
}

.segment-wrapper {
  margin-top: 4px;
}

.segments {
  display: grid;
  grid-template-columns: repeat(100, minmax(0, 1fr));
  gap: 4px;
}

.segment {
  height: 20px;
  background: #152127;
}

.segment.fill-1 {
  background: linear-gradient(180deg, #e76f51, #c85a42);
}

.segment.fill-2 {
  background: linear-gradient(180deg, #f4a261, #d98d4f);
}

.segment.fill-3 {
  background: linear-gradient(180deg, #e9c46a, #c3a24f);
}

.segment.fill-4 {
  background: linear-gradient(180deg, #58bac1, #4199a3);
}

.segment.fill-5 {
  background: linear-gradient(180deg, #7ce5c7, #4cbd9d);
}

.level-scale {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin-top: 8px;
  color: #9f8f85;
  font-size: 13px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.9fr;
  gap: 16px;
  margin-bottom: 18px;
  align-items: start;
}

.analytics-card {
  padding: 18px;
}

.analytics-title {
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.chart-wrap {
  width: 100%;
  min-height: 330px;
  margin-top: 12px;
}

.radar-wrap {
  position: relative;
}

.radar-tooltip {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -120%);
  pointer-events: none;
  background: rgba(8, 14, 17, 0.92);
  border: 1px solid #5f7d89;
  color: #ecf4f7;
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 7px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 120ms ease;
  z-index: 4;
}

.radar-tooltip.show {
  opacity: 1;
}

.radar-hover-target {
  cursor: pointer;
}

.radar-axis-label {
  fill: #95aeb6;
  font-size: 11px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
}

.radar-axis-label:hover {
  fill: #edf4f5;
}

.accordion-indicator {
  width: 10px;
  height: 10px;
  border-right: 2px solid #87a6b4;
  border-bottom: 2px solid #87a6b4;
  transform: rotate(45deg);
  transition: transform 140ms ease;
  margin-right: 4px;
}

details[open] > summary .accordion-indicator {
  transform: rotate(225deg);
}

.category-section {
  margin-top: 18px;
}

.category-head {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 14px;
}

.category-summary {
  list-style: none;
  cursor: pointer;
}

.category-summary::-webkit-details-marker {
  display: none;
}

.category-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-8px);
  padding-top: 0;
  transition:
    max-height 340ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 240ms ease,
    padding-top 220ms ease;
}

details[open] > .category-content {
  max-height: 1800px;
  opacity: 1;
  transform: translateY(0);
  padding-top: 12px;
}

@keyframes accordionCardIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

details[open] > .category-content .criterion-card {
  animation: accordionCardIn 280ms ease both;
}

details[open] > .category-content .criterion-card:nth-child(2n) {
  animation-delay: 25ms;
}

details[open] > .category-content .criterion-card:nth-child(3n) {
  animation-delay: 45ms;
}

details[open] > .category-content .criterion-card:nth-child(4n) {
  animation-delay: 65ms;
}

@media (prefers-reduced-motion: reduce) {
  .category-content {
    transition: none;
    transform: none;
  }

  details[open] > .category-content .criterion-card {
    animation: none;
  }
}

.category-name {
  font-size: 24px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  font-weight: 600;
}

.category-line {
  border-bottom: 1px dashed #47616b;
  transform: translateY(2px);
}

.category-score {
  font-size: 24px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

.criterion-card {
  text-align: left;
  border: 1px solid #274049;
  background: linear-gradient(180deg, #1d2a30, #182328);
  color: var(--text);
  min-height: 154px;
  padding: 13px;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.criterion-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid transparent;
  transition: border-color 160ms ease;
  z-index: 1;
}

.criterion-card:hover::after {
  border-color: #7ab5c8;
}

.criterion-card.status-pass {
  background: linear-gradient(180deg, #1e2f2b, #1a2724);
}

.criterion-card.status-fail {
  background: linear-gradient(180deg, #4f2c26, #432521);
}

.criterion-card.status-unverified,
.criterion-card.status-skip {
  background: linear-gradient(180deg, #263136, #212a2e);
}

.card-badge {
  position: absolute;
  top: 13px;
  left: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 0.03em;
  color: #d3c5bc;
  z-index: 1;
}

.badge-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.badge-dot.badge-BASIC {
  background: var(--basic);
}

.badge-dot.badge-INTERMEDIATE {
  background: var(--intermediate);
}

.badge-dot.badge-ADVANCED {
  background: var(--advanced);
}

.card-name {
  margin-top: 30px;
  font-size: 18px;
  line-height: 1.24;
}

.card-hint {
  margin-top: auto;
  font-size: 11px;
  color: #a9c7cf;
  opacity: 0.9;
}

.card-score {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #47646d;
  background: #1d2a30;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  color: #ecf3f5;
  letter-spacing: 0.01em;
  line-height: 1;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
  z-index: 3;
}

.criterion-card.status-pass .card-score {
  background: #193229;
  border-color: #5aa98b;
}

.criterion-card.status-fail .card-score {
  background: #3a241f;
  border-color: #ca816a;
}

.criterion-card.status-skip .card-score,
.criterion-card.status-unverified .card-score {
  background: #233138;
  border-color: #6d8087;
}

.warning-panel {
  margin-top: 22px;
  padding: 12px 16px;
  border-left: 4px solid #5baad2;
  background: rgba(91, 170, 210, 0.14);
  color: #d4edf8;
}

.warning-panel h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.warning-panel ul {
  margin: 0;
  padding-left: 20px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 10, 0.75);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 20;
}

.modal-backdrop.open {
  display: flex;
}

.modal {
  width: min(1100px, 100%);
  background: linear-gradient(180deg, #18242a, #10191d);
  border: 1px solid #46616b;
  box-shadow: 0 28px 48px rgba(0, 0, 0, 0.5);
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.modal-title {
  font-size: 36px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  line-height: 1.05;
  letter-spacing: 0.01em;
  margin: 10px 0 0;
}

.close-btn {
  border: 1px solid #49606a;
  background: transparent;
  color: #f3e8df;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}

.modal-card {
  padding: 14px 16px;
  border: 1px solid #39515a;
  background: rgba(255, 255, 255, 0.02);
}

.modal-label {
  color: #bea89c;
  font-size: 14px;
  margin-bottom: 6px;
}

.modal-value {
  font-size: 24px;
  font-family: 'TikTok Sans', 'TikTokSans', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
}

.modal-reason {
  margin-top: 18px;
  font-size: 19px;
  line-height: 1.3;
  color: #efdfd4;
}

.modal-evidence {
  margin-top: 16px;
  color: #cdb9ad;
  font-size: 15px;
}

.modal-evidence ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.modal-improve {
  margin-top: 16px;
  color: #d9ecef;
  font-size: 15px;
}

.modal-improve ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

@media (max-width: 1050px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  #app {
    padding: 14px 12px 30px;
  }

  .hero,
  .analytics-card {
    padding: 14px;
  }

  .repo-name {
    font-size: 22px;
  }

  .category-name,
  .category-score {
    font-size: 20px;
  }

  .card-name {
    font-size: 17px;
  }

  .modal-title {
    font-size: 28px;
  }

  .summary-line {
    flex-direction: column;
    gap: 6px;
  }

  .category-head {
    grid-template-columns: auto 1fr auto;
  }

  .category-head .accordion-indicator {
    display: none;
  }
}
`;

export const APP_JS = `
(function () {
  var state = {
    payload: null,
    cardIndex: {},
    loading: false,
    staticExport: Boolean(window.__AGENTABLE_STATIC_EXPORT),
  };

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
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

  function polarToCartesian(cx, cy, radius, angle) {
    var rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function radarPolygon(categories, width, height) {
    var cx = width / 2;
    var cy = height / 2;
    var radius = Math.min(width, height) * 0.36;
    var sides = categories.length;
    var points = [];
    var rings = '';
    var axes = '';
    var hoverTargets = '';
    var labels = '';

    for (var ring = 1; ring <= 4; ring += 1) {
      var ringPts = [];
      for (var i = 0; i < sides; i += 1) {
        var a = (360 / sides) * i;
        var p = polarToCartesian(cx, cy, (radius * ring) / 4, a);
        ringPts.push(p.x.toFixed(2) + ',' + p.y.toFixed(2));
      }
      rings += '<polygon points="' + ringPts.join(' ') + '" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />';
    }

    for (var i2 = 0; i2 < sides; i2 += 1) {
      var aa = (360 / sides) * i2;
      var p2 = polarToCartesian(cx, cy, radius, aa);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p2.x.toFixed(2) + '" y2="' + p2.y.toFixed(2) + '" stroke="rgba(255,255,255,0.11)" stroke-width="1" />';
    }

    for (var i3 = 0; i3 < sides; i3 += 1) {
      var angle = (360 / sides) * i3;
      var valueRadius = radius * (categories[i3].score / 100);
      var pp = polarToCartesian(cx, cy, valueRadius, angle);
      points.push(pp.x.toFixed(2) + ',' + pp.y.toFixed(2));

      var hp = polarToCartesian(cx, cy, radius * 1.03, angle);
      var categoryLabel = categories[i3] && categories[i3].label ? categories[i3].label : 'Category';
      var categoryScore = categories[i3] && typeof categories[i3].score === 'number' ? Math.round(categories[i3].score) : 0;
      hoverTargets +=
        '<circle class="radar-hover-target" data-radar-category="' + escapeHtml(categoryLabel) + '" data-radar-score="' + categoryScore + '" cx="' +
        hp.x.toFixed(2) + '" cy="' + hp.y.toFixed(2) + '" r="24" fill="rgba(255,255,255,0.002)" stroke="transparent" pointer-events="all">' +
        '<title>' + escapeHtml(categoryLabel) + ' (' + categoryScore + '%)</title>' +
        '</circle>';

      var lp = polarToCartesian(cx, cy, radius * 1.2, angle);
      var anchor = 'middle';
      if (lp.x < cx - 12) {
        anchor = 'end';
      } else if (lp.x > cx + 12) {
        anchor = 'start';
      }
      labels +=
        '<text class="radar-axis-label" data-radar-category="' + escapeHtml(categoryLabel) + '" data-radar-score="' + categoryScore + '" x="' +
        lp.x.toFixed(2) + '" y="' + lp.y.toFixed(2) + '" text-anchor="' + anchor + '" dominant-baseline="middle">' +
        escapeHtml(categoryLabel) +
        '</text>';
    }

    return {
      rings: rings,
      axes: axes,
      hoverTargets: hoverTargets,
      labels: labels,
      shape: '<polygon points="' + points.join(' ') + '" fill="rgba(98,183,255,0.24)" stroke="#63c0d4" stroke-width="2" />',
      points: points
        .map(function (pt) {
          var split = pt.split(',');
          return '<circle cx="' + split[0] + '" cy="' + split[1] + '" r="3" fill="#63c0d4" />';
        })
        .join(''),
    };
  }

  function renderRadar(categories) {
    var width = 480;
    var height = 360;
    var data = radarPolygon(categories, width, height);

    return (
      '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%" role="img" aria-label="Pass rate by category">' +
      data.rings +
      data.axes +
      data.shape +
      data.points +
      data.hoverTargets +
      data.labels +
      '</svg>'
    );
  }

  function renderTimeline(history) {
    var width = 860;
    var height = 360;

    if (!history || history.length === 0) {
      return '<div style="height:360px;display:grid;place-items:center;color:#9b8d84">No history yet</div>';
    }

    var minT = Date.parse(history[0].timestamp);
    var maxT = Date.parse(history[history.length - 1].timestamp);
    if (maxT === minT) {
      maxT = minT + 1;
    }

    var points = history.map(function (item) {
      var x = 48 + ((Date.parse(item.timestamp) - minT) / (maxT - minT)) * (width - 96);
      var y = height - 36 - ((item.level - 1) / 4) * (height - 84);
      return { x: x, y: y, level: item.level, stamp: item.timestamp };
    });

    var path = points
      .map(function (p, idx) {
        return (idx === 0 ? 'M ' : 'L ') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
      })
      .join(' ');

    var labels = '';
    for (var l = 1; l <= 5; l += 1) {
      var yLine = height - 36 - ((l - 1) / 4) * (height - 84);
      labels += '<line x1="42" y1="' + yLine.toFixed(2) + '" x2="' + (width - 22) + '" y2="' + yLine.toFixed(2) + '" stroke="rgba(255,255,255,0.1)" />';
      labels += '<text x="12" y="' + (yLine + 4).toFixed(2) + '" fill="#9f9288" font-size="14">' + l + '</text>';
    }

    var pointsSvg = points
      .map(function (p) {
        return '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="4" fill="#66d6a5" />';
      })
      .join('');

    var first = new Date(history[0].timestamp).toLocaleDateString();
    var last = new Date(history[history.length - 1].timestamp).toLocaleDateString();

    return (
      '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%" role="img" aria-label="Level over time">' +
      labels +
      '<path d="' + path + '" fill="none" stroke="#63c0d4" stroke-width="3" />' +
      pointsSvg +
      '<text x="48" y="' + (height - 10) + '" fill="#9f9288" font-size="13">' + escapeHtml(first) + '</text>' +
      '<text x="' + (width - 120) + '" y="' + (height - 10) + '" fill="#9f9288" font-size="13">' + escapeHtml(last) + '</text>' +
      '</svg>'
    );
  }

  function renderCards(cards) {
    return cards
      .map(function (card) {
        return (
          '<button class="criterion-card ' + statusClass(card.status) + '" data-card-id="' + escapeHtml(card.id) + '">' +
          '<div class="card-badge">' +
          '<span class="badge-dot badge-' + escapeHtml(card.badge) + '"></span>' +
          '<span>' + escapeHtml(card.badge) + '</span>' +
          '</div>' +
          '<div class="card-name">' + escapeHtml(card.name) + '</div>' +
          (card.status !== 'pass' ? '<div class="card-hint">Improve tips available</div>' : '') +
          '<div class="card-score">' + escapeHtml(card.scoreLabel) + '</div>' +
          '</button>'
        );
      })
      .join('');
  }

  function renderCategorySections(payload) {
    return payload.categories
      .map(function (category) {
        var cards = payload.criteriaByCategory[category.id] || [];
        return (
          '<details class="panel hero category-section">' +
          '<summary class="category-head category-summary">' +
          '<div class="category-name">' + escapeHtml(category.label) + '</div>' +
          '<div class="category-line"></div>' +
          '<div class="category-score">' + Math.round(category.score) + '%</div>' +
          '<span class="accordion-indicator" aria-hidden="true"></span>' +
          '</summary>' +
          '<div class="category-content"><div class="cards-grid">' + renderCards(cards) + '</div></div>' +
          '</details>'
        );
      })
      .join('');
  }

  function handleRadarMove(event) {
    var wrap = event.currentTarget;
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    var tooltip = wrap.querySelector('.radar-tooltip');
    if (!(tooltip instanceof HTMLElement)) {
      return;
    }

    var target = event.target;
    if (!(target instanceof Element)) {
      tooltip.classList.remove('show');
      return;
    }

    var hit = target.closest('[data-radar-category]');
    if (!hit) {
      tooltip.classList.remove('show');
      return;
    }

    var category = hit.getAttribute('data-radar-category') || 'Category';
    var score = hit.getAttribute('data-radar-score') || '0';
    tooltip.textContent = category + ' - ' + score + '%';

    var rect = wrap.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.classList.add('show');
  }

  function bindRadarHover() {
    var wrap = document.querySelector('.radar-wrap');
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    wrap.addEventListener('mousemove', handleRadarMove);
    wrap.addEventListener('mouseleave', function () {
      var tooltip = wrap.querySelector('.radar-tooltip');
      if (tooltip instanceof HTMLElement) {
        tooltip.classList.remove('show');
      }
    });
  }

  function renderModal() {
    return (
      '<div id="card-modal" class="modal-backdrop" aria-hidden="true">' +
      '<div class="modal">' +
      '<div class="modal-header">' +
      '<div id="modal-badge" class="card-badge"></div>' +
      '<button class="close-btn" data-close-modal="1">X</button>' +
      '</div>' +
      '<div id="modal-title" class="modal-title"></div>' +
      '<div id="modal-description" class="modal-reason" style="margin-top:6px;color:#bfaea4;font-size:18px"></div>' +
      '<div class="modal-grid" style="margin-top:14px">' +
      '<div class="modal-card"><div class="modal-label">Score</div><div id="modal-score" class="modal-value"></div></div>' +
      '<div class="modal-card"><div class="modal-label">Status</div><div id="modal-status" class="modal-value"></div></div>' +
      '</div>' +
      '<div class="modal-reason" id="modal-reason"></div>' +
      '<div class="modal-improve" id="modal-improve"></div>' +
      '<div class="modal-evidence" id="modal-evidence"></div>' +
      '</div>' +
      '</div>'
    );
  }

  function setModal(card) {
    var modal = document.getElementById('card-modal');
    if (!modal || !card) return;

    var badge = document.getElementById('modal-badge');
    var title = document.getElementById('modal-title');
    var desc = document.getElementById('modal-description');
    var score = document.getElementById('modal-score');
    var status = document.getElementById('modal-status');
    var reason = document.getElementById('modal-reason');
    var improve = document.getElementById('modal-improve');
    var evidence = document.getElementById('modal-evidence');

    if (!badge || !title || !desc || !score || !status || !reason || !improve || !evidence) return;

    badge.innerHTML = '<span class="badge-dot badge-' + escapeHtml(card.badge) + '"></span><span>' + escapeHtml(card.badge) + '</span>';
    title.textContent = card.name;
    desc.textContent = card.description;
    score.textContent = card.scoreLabel;
    status.textContent = String(card.status || '').toUpperCase();
    reason.textContent = card.reason;

    var tips = card.improvementTips || [];
    if (!Array.isArray(tips) || tips.length === 0) {
      improve.innerHTML = '<div class="modal-label">How to improve</div><div>No specific tips available.</div>';
    } else {
      improve.innerHTML =
        '<div class="modal-label">How to improve</div><ul>' +
        tips.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') +
        '</ul>';
    }

    var evid = card.evidence || [];
    if (!Array.isArray(evid) || evid.length === 0) {
      evidence.innerHTML = '<div class="modal-label">Evidence</div><div>No additional evidence provided.</div>';
    } else {
      evidence.innerHTML =
        '<div class="modal-label">Evidence</div><ul>' +
        evid.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') +
        '</ul>';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var modal = document.getElementById('card-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderApp(payload) {
    var root = document.getElementById('app');
    if (!root) return;

    state.cardIndex = collectCards(payload);

    root.innerHTML =
      '<h1 class="page-title">Agentable</h1>' +
      '<section class="panel hero">' +
      '<div class="hero-top">' +
      '<div class="repo-chip">' +
      '<div class="level-badge">' + payload.header.level + '</div>' +
      '<div>' +
      '<div class="repo-name">' + escapeHtml(payload.header.repoName) + '</div>' +
      '<div class="repo-path">' + escapeHtml(payload.header.repoPath) + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="hero-actions">' +
      '<span class="last-updated">Last update: ' + escapeHtml(fmtRelative(payload.header.lastUpdated)) + '</span>' +
      '<button class="icon-btn" title="Download HTML report" data-download-html="1">\u2B07</button>' +
      '<button class="icon-btn" title="Download JSON report" data-download-json="1">{}</button>' +
      (state.staticExport ? '' : '<button class="icon-btn" title="Refresh analysis" data-refresh="1">\u21BB</button>') +
      '</div>' +
      '</div>' +
      '<div class="summary-line">' +
      '<span><span class="summary-strong">' + Math.round(payload.header.score) + '</span> score / <span class="summary-strong">' +
      Math.round(payload.header.coverage) + '%</span> coverage</span>' +
      '</div>' +
      '<div class="segment-wrapper">' +
      '<div class="segments">' + renderSegments(payload.header.score) + '</div>' +
      '<div class="level-scale"><span>Level 1</span><span>Level 2</span><span>Level 3</span><span>Level 4</span><span>Level 5</span></div>' +
      '</div>' +
      '</section>' +

      '<section class="analytics-grid">' +
      '<div class="panel analytics-card"><h2 class="analytics-title">Pass Rate by Category</h2><div class="chart-wrap radar-wrap">' +
      renderRadar(payload.categories) +
      '<div class="radar-tooltip" aria-hidden="true"></div></div></div>' +
      '<div class="panel analytics-card"><h2 class="analytics-title">Level Over Time</h2><div class="chart-wrap">' +
      renderTimeline(payload.history) +
      '</div></div>' +
      '</section>' +

      renderCategorySections(payload) +
      renderModal();

    bindRadarHover();
  }

  async function fetchReport() {
    if (window.__AGENTABLE_PAYLOAD) {
      return window.__AGENTABLE_PAYLOAD;
    }

    var response = await fetch('/api/report', { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      throw new Error('Failed to load report: ' + response.status);
    }
    return await response.json();
  }

  async function refreshReport() {
    if (state.loading) return;
    state.loading = true;
    try {
      var response = await fetch('/api/refresh', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Refresh failed: ' + response.status);
      }
      var payload = await fetchReport();
      state.payload = payload;
      renderApp(payload);
    } catch (error) {
      alert(String(error && error.message ? error.message : error));
    } finally {
      state.loading = false;
    }
  }

  function handleClick(event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('[data-close-modal]') || target.id === 'card-modal') {
      closeModal();
      return;
    }

    var cardEl = target.closest('[data-card-id]');
    if (cardEl) {
      var cardId = cardEl.getAttribute('data-card-id');
      if (cardId && state.cardIndex[cardId]) {
        setModal(state.cardIndex[cardId]);
      }
      return;
    }

    if (target.closest('[data-refresh]')) {
      refreshReport();
      return;
    }

    if (target.closest('[data-download-html]')) {
      window.location.href = '/api/export.html';
      return;
    }

    if (target.closest('[data-download-json]')) {
      window.location.href = '/api/export.json';
    }
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });

  fetchReport()
    .then(function (payload) {
      state.payload = payload;
      renderApp(payload);
    })
    .catch(function (error) {
      var root = document.getElementById('app');
      if (!root) return;
      root.innerHTML = '<div class="warning-panel"><h3>Failed to load report</h3><div>' + escapeHtml(String(error)) + '</div></div>';
    });
})();
`;

function serializePayload(payload: WebReportPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export function renderIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agentable</title>
    <link rel="stylesheet" href="/assets/app.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="/assets/app.js"></script>
  </body>
</html>`;
}

export function renderStandaloneHtml(payload: WebReportPayload): string {
  const serialized = serializePayload(payload);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agentable Export</title>
    <style>${APP_CSS}</style>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.__AGENTABLE_STATIC_EXPORT = true;
      window.__AGENTABLE_PAYLOAD = ${serialized};
    </script>
    <script>${APP_JS}</script>
  </body>
</html>`;
}
