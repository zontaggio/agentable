(function () {
  var state = {
    payload: null,
    cardIndex: {},
    actionPlanExpanded: {},
    loading: false,
    staticExport: Boolean(window.__AGENTABLE_STATIC_EXPORT),
    remediationFeedbackTimeoutId: null,
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

  function polarToCartesian(cx, cy, radius, angle) {
    var rad = ((angle - 90) * Math.PI) / 180;
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
      rings +=
        '<polygon points="' +
        ringPts.join(' ') +
        '" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />';
    }

    for (var i2 = 0; i2 < sides; i2 += 1) {
      var aa = (360 / sides) * i2;
      var p2 = polarToCartesian(cx, cy, radius, aa);
      axes +=
        '<line x1="' +
        cx +
        '" y1="' +
        cy +
        '" x2="' +
        p2.x.toFixed(2) +
        '" y2="' +
        p2.y.toFixed(2) +
        '" stroke="rgba(255,255,255,0.11)" stroke-width="1" />';
    }

    for (var i3 = 0; i3 < sides; i3 += 1) {
      var angle = (360 / sides) * i3;
      var category = categories[i3] || {};
      var rawScore = typeof category.score === 'number' ? category.score : 0;
      var evaluatedCount = Number(category.pass || 0) + Number(category.fail || 0);
      var ratio = Math.max(0, Math.min(1, rawScore / 100));
      var minRatio = evaluatedCount > 0 ? 0.04 : 0.12;
      var valueRadius = radius * Math.max(ratio, minRatio);
      var pp = polarToCartesian(cx, cy, valueRadius, angle);
      points.push(pp.x.toFixed(2) + ',' + pp.y.toFixed(2));

      var hp = polarToCartesian(cx, cy, radius * 1.03, angle);
      var categoryLabel = category && category.label ? category.label : 'Category';
      var categoryScore = typeof rawScore === 'number' ? Math.round(rawScore) : 0;
      var categoryScoreText = evaluatedCount > 0 ? categoryScore + '%' : 'N/A';
      hoverTargets +=
        '<circle class="radar-hover-target" data-radar-category="' +
        escapeHtml(categoryLabel) +
        '" data-radar-score="' +
        categoryScoreText +
        '" cx="' +
        hp.x.toFixed(2) +
        '" cy="' +
        hp.y.toFixed(2) +
        '" r="24" fill="rgba(255,255,255,0.002)" stroke="transparent" pointer-events="all">' +
        '<title>' +
        escapeHtml(categoryLabel) +
        ' (' +
        categoryScoreText +
        ')</title>' +
        '</circle>';

      var lp = polarToCartesian(cx, cy, radius * 1.2, angle);
      var anchor = 'middle';
      if (lp.x < cx - 12) {
        anchor = 'end';
      } else if (lp.x > cx + 12) {
        anchor = 'start';
      }
      labels +=
        '<text class="radar-axis-label" data-radar-category="' +
        escapeHtml(categoryLabel) +
        '" data-radar-score="' +
        categoryScoreText +
        '" x="' +
        lp.x.toFixed(2) +
        '" y="' +
        lp.y.toFixed(2) +
        '" text-anchor="' +
        anchor +
        '" dominant-baseline="middle">' +
        escapeHtml(categoryLabel) +
        '</text>';
    }

    return {
      rings: rings,
      axes: axes,
      hoverTargets: hoverTargets,
      labels: labels,
      shape:
        '<polygon points="' +
        points.join(' ') +
        '" fill="rgba(98,183,255,0.24)" stroke="#63c0d4" stroke-width="2" />',
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
      '<svg viewBox="0 0 ' +
      width +
      ' ' +
      height +
      '" width="100%" height="100%" role="img" aria-label="Pass rate by category">' +
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
      labels +=
        '<line x1="42" y1="' +
        yLine.toFixed(2) +
        '" x2="' +
        (width - 22) +
        '" y2="' +
        yLine.toFixed(2) +
        '" stroke="rgba(255,255,255,0.1)" />';
      labels +=
        '<text x="12" y="' +
        (yLine + 4).toFixed(2) +
        '" fill="#9f9288" font-size="14">' +
        l +
        '</text>';
    }

    var pointsSvg = points
      .map(function (p) {
        return (
          '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="4" fill="#66d6a5" />'
        );
      })
      .join('');

    var first = new Date(history[0].timestamp).toLocaleDateString();
    var last = new Date(history[history.length - 1].timestamp).toLocaleDateString();

    return (
      '<svg viewBox="0 0 ' +
      width +
      ' ' +
      height +
      '" width="100%" height="100%" role="img" aria-label="Level over time">' +
      labels +
      '<path d="' +
      path +
      '" fill="none" stroke="#63c0d4" stroke-width="3" />' +
      pointsSvg +
      '<text x="48" y="' +
      (height - 10) +
      '" fill="#9f9288" font-size="13">' +
      escapeHtml(first) +
      '</text>' +
      '<text x="' +
      (width - 120) +
      '" y="' +
      (height - 10) +
      '" fill="#9f9288" font-size="13">' +
      escapeHtml(last) +
      '</text>' +
      '</svg>'
    );
  }

  function renderCards(cards) {
    return cards
      .map(function (card) {
        return (
          '<button class="criterion-card ' +
          statusClass(card.status) +
          '" data-card-id="' +
          escapeHtml(card.id) +
          '">' +
          '<div class="card-badge">' +
          '<span class="badge-dot badge-' +
          escapeHtml(card.badge) +
          '"></span>' +
          '<span>' +
          escapeHtml(card.badge) +
          '</span>' +
          '</div>' +
          '<div class="card-name">' +
          escapeHtml(card.name) +
          '</div>' +
          '<div class="card-score">' +
          escapeHtml(card.scoreLabel) +
          '</div>' +
          '</button>'
        );
      })
      .join('');
  }

  function renderActionBucket(title, bucketKey, items) {
    var list = Array.isArray(items) ? items : [];
    if (!items || items.length === 0) {
      return (
        '<section class="action-bucket">' +
        '<h3>' +
        escapeHtml(title) +
        '</h3>' +
        '<div class="action-item-meta">No items in this bucket.</div>' +
        '</section>'
      );
    }

    var expanded = Boolean(state.actionPlanExpanded[bucketKey]);
    var visible = expanded ? list : list.slice(0, 4);
    var listClass = expanded ? 'action-list expanded' : 'action-list';

    return (
      '<section class="action-bucket">' +
      '<h3>' +
      escapeHtml(title) +
      '</h3>' +
      '<ul class="' +
      listClass +
      '">' +
      visible
        .map(function (item) {
          return (
            '<li><button class="action-item" data-card-id="' +
            escapeHtml(item.criterionId) +
            '">' +
            '<div class="action-item-title">#' +
            item.rank +
            ' ' +
            escapeHtml(item.criterionName) +
            '</div>' +
            '<div class="action-item-meta">' +
            escapeHtml(item.status.toUpperCase()) +
            ' · ' +
            escapeHtml(String(Math.round(item.priorityScore))) +
            ' priority · ' +
            escapeHtml(String(Math.round(item.actionabilityScore || 0))) +
            ' actionability</div>' +
            '</button></li>'
          );
        })
        .join('') +
      '</ul>' +
      (list.length > 4
        ? '<button class="action-toggle" data-action-toggle="' +
          escapeHtml(bucketKey) +
          '">' +
          (expanded ? 'Show less' : 'Show all (' + list.length + ')') +
          '</button>'
        : '') +
      '</section>'
    );
  }

  function renderActionPlan(payload) {
    var actionPlan = payload.actionPlan || {
      critical: [],
      highLeverage: [],
      quickWins: [],
      all: [],
    };
    var aiTag = actionPlan.generatedWithAi ? 'AI refined' : 'Deterministic';
    return (
      '<section class="panel action-plan">' +
      '<h2 class="action-title">Action Plan</h2>' +
      '<div class="action-subtitle">Prioritized next actions for this repository · ' +
      escapeHtml(aiTag) +
      '</div>' +
      '<div class="action-grid">' +
      renderActionBucket('Critical', 'critical', actionPlan.critical || []) +
      renderActionBucket('High Leverage', 'highLeverage', actionPlan.highLeverage || []) +
      renderActionBucket('Quick Wins', 'quickWins', actionPlan.quickWins || []) +
      '</div>' +
      '</section>'
    );
  }

  function renderCategorySections(payload) {
    // A category where nothing applicable could be evaluated has no pass rate, not 0%.
    function renderCategoryScore(category) {
      var evaluated = Number(category.pass || 0) + Number(category.fail || 0);
      if (evaluated === 0) {
        return '<div class="category-score category-score-na" title="No applicable criteria could be evaluated">N/A</div>';
      }
      return '<div class="category-score">' + Math.round(category.score) + '%</div>';
    }

    return payload.categories
      .map(function (category) {
        var cards = payload.criteriaByCategory[category.id] || [];
        return (
          '<details class="panel hero category-section">' +
          '<summary class="category-head category-summary">' +
          '<div class="category-name">' +
          escapeHtml(category.label) +
          '</div>' +
          '<div class="category-line"></div>' +
          renderCategoryScore(category) +
          '<span class="accordion-indicator" aria-hidden="true"></span>' +
          '</summary>' +
          '<div class="category-content"><div class="cards-grid">' +
          renderCards(cards) +
          '</div></div>' +
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
    var score = hit.getAttribute('data-radar-score') || 'N/A';
    tooltip.textContent = category + ' - ' + score;

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

  function setRemediationFeedback(message, isError) {
    var feedback = document.getElementById('modal-remediation-feedback');
    if (!(feedback instanceof HTMLElement)) {
      return;
    }

    feedback.textContent = message || '';
    feedback.classList.toggle('error', Boolean(isError));

    if (state.remediationFeedbackTimeoutId) {
      clearTimeout(state.remediationFeedbackTimeoutId);
      state.remediationFeedbackTimeoutId = null;
    }

    if (!message) {
      return;
    }

    state.remediationFeedbackTimeoutId = setTimeout(function () {
      feedback.textContent = '';
      feedback.classList.remove('error');
      state.remediationFeedbackTimeoutId = null;
    }, 2200);
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return;
    }

    var scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.top = '-1000px';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.focus();
    scratch.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      document.body.removeChild(scratch);
    }

    if (!copied) {
      throw new Error('Clipboard copy failed');
    }
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
      '<div class="modal-sections">' +
      '<section class="modal-section"><div class="modal-section-title">Why this matters</div><div id="modal-why"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Current evidence</div><div id="modal-evidence"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Implementation next steps</div><div id="modal-next-steps"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Success signal</div><div id="modal-success"></div></section>' +
      '<details id="modal-remediation-section" class="modal-section remediation-section is-hidden">' +
      '<summary class="modal-section-title remediation-summary">' +
      '<span>Remediation prompt for LLM</span>' +
      '<span class="remediation-accordion-indicator" aria-hidden="true"></span>' +
      '</summary>' +
      '<div class="remediation-content">' +
      '<div class="remediation-hint">Review before copying. You can edit this text before sending it to your coding LLM.</div>' +
      '<textarea id="modal-remediation-text" class="remediation-text" spellcheck="false"></textarea>' +
      '<div class="remediation-actions">' +
      '<button class="remediation-copy-btn" data-copy-remediation="1">Copy remediation prompt</button>' +
      '<span id="modal-remediation-feedback" class="remediation-feedback" aria-live="polite"></span>' +
      '</div>' +
      '</div>' +
      '</details>' +
      '</div>' +
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
    var why = document.getElementById('modal-why');
    var evidence = document.getElementById('modal-evidence');
    var nextSteps = document.getElementById('modal-next-steps');
    var success = document.getElementById('modal-success');
    var remediationSection = document.getElementById('modal-remediation-section');
    var remediationText = document.getElementById('modal-remediation-text');
    var remediationFeedback = document.getElementById('modal-remediation-feedback');

    if (
      !badge ||
      !title ||
      !desc ||
      !score ||
      !status ||
      !why ||
      !evidence ||
      !nextSteps ||
      !success ||
      !remediationSection ||
      !remediationText ||
      !remediationFeedback
    )
      return;

    badge.innerHTML =
      '<span class="badge-dot badge-' +
      escapeHtml(card.badge) +
      '"></span><span>' +
      escapeHtml(card.badge) +
      '</span>';
    title.textContent = card.name;
    desc.textContent = card.description;
    score.textContent = card.scoreLabel;
    status.textContent = String(card.status || '').toUpperCase();

    var guidance = card.guidance || null;
    why.textContent =
      typeof card.whyItMatters === 'string' && card.whyItMatters.trim().length > 0
        ? card.whyItMatters
        : guidance && guidance.whyItMatters
          ? guidance.whyItMatters
          : card.reason;

    var evid = card.evidence || [];
    if (
      (!Array.isArray(evid) || evid.length === 0) &&
      (!Array.isArray(card.evidenceDetails) || card.evidenceDetails.length === 0)
    ) {
      evidence.innerHTML = '<div>No additional evidence provided.</div>';
    } else {
      var details = Array.isArray(card.evidenceDetails)
        ? card.evidenceDetails.map(function (item) {
            return (
              '<li>' +
              escapeHtml(String(item.kind || 'signal')) +
              ' · ' +
              escapeHtml(String(item.strength || 'low')) +
              ' · ' +
              escapeHtml(String(item.detail || '')) +
              '</li>'
            );
          })
        : [];
      var plain = Array.isArray(evid)
        ? evid.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
          })
        : [];
      evidence.innerHTML = '<ul>' + details.concat(plain).join('') + '</ul>';
    }

    var steps =
      guidance && Array.isArray(guidance.nextSteps) && guidance.nextSteps.length > 0
        ? guidance.nextSteps
        : card.improvementTips || [];
    if (!Array.isArray(steps) || steps.length === 0) {
      nextSteps.innerHTML = '<div>No guided steps available.</div>';
    } else {
      nextSteps.innerHTML =
        '<ul>' +
        steps
          .map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
          })
          .join('') +
        '</ul>';
    }

    success.textContent =
      guidance && guidance.expectedOutcome
        ? guidance.expectedOutcome
        : 'This criterion becomes explicit, automatable, and stable over time.';

    if (typeof card.remediationPrompt === 'string' && card.remediationPrompt.trim().length > 0) {
      remediationSection.classList.remove('is-hidden');
      remediationText.value = card.remediationPrompt;
      remediationSection.open = false;
    } else {
      remediationSection.classList.add('is-hidden');
      remediationText.value = '';
      remediationSection.open = false;
    }
    setRemediationFeedback('', false);

    modal.setAttribute('data-criterion-id', String(card.id || ''));
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var modal = document.getElementById('card-modal');
    if (!modal) return;
    setRemediationFeedback('', false);
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderApp(payload) {
    var root = document.getElementById('app');
    if (!root) return;

    state.cardIndex = collectCards(payload);

    root.innerHTML =
      '<section class="panel hero">' +
      '<div class="hero-top">' +
      '<div class="repo-chip">' +
      '<div class="level-badge">' +
      payload.header.level +
      '</div>' +
      '<div>' +
      '<div class="repo-name">' +
      escapeHtml(payload.header.repoName) +
      '</div>' +
      '<div class="repo-path">' +
      escapeHtml(payload.header.repoPath) +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="hero-actions">' +
      '<span class="last-updated">Last update: ' +
      escapeHtml(fmtRelative(payload.header.lastUpdated)) +
      '</span>' +
      '<button class="icon-btn" title="Download HTML report" data-download-html="1">\u2B07</button>' +
      '<button class="icon-btn" title="Download JSON report" data-download-json="1">{  }</button>' +
      (state.staticExport
        ? ''
        : '<button class="icon-btn" title="Refresh analysis" data-refresh="1">\u21BB</button>') +
      '</div>' +
      '</div>' +
      '<div class="summary-line">' +
      '<span><span class="summary-strong">' +
      Math.round(payload.header.score) +
      '</span> score / <span class="summary-strong">' +
      Math.round(payload.header.coverage) +
      '%</span> coverage</span>' +
      '</div>' +
      '<div class="segment-wrapper">' +
      '<div class="segments">' +
      renderSegments(payload.header.score) +
      '</div>' +
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
      renderActionPlan(payload) +
      renderCategorySections(payload) +
      renderModal();

    bindRadarHover();
  }

  async function fetchReport() {
    if (window.__AGENTABLE_PAYLOAD) {
      return window.__AGENTABLE_PAYLOAD;
    }

    var response = await fetch('/api/report', { headers: { Accept: 'application/json' } });
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

  function animateAccordion(details, open) {
    var content = details.querySelector('.category-content');
    if (!content) {
      details.open = open;
      return;
    }

    var OPEN_MS = 320;
    var CLOSE_MS = 260;
    var EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var TRANSITION_OPEN =
      'max-height ' +
      OPEN_MS +
      'ms ' +
      EASING +
      ', opacity 200ms ease, transform 220ms ease, padding-top 200ms ease';
    var TRANSITION_CLOSE =
      'max-height ' +
      CLOSE_MS +
      'ms ' +
      EASING +
      ', opacity 180ms ease, transform 180ms ease, padding-top 180ms ease';

    if (open) {
      details.open = true;
      var targetH = content.scrollHeight;
      content.style.transition = 'none';
      content.style.overflow = 'hidden';
      content.style.maxHeight = '0';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-8px)';
      content.style.paddingTop = '0';
      content.getBoundingClientRect();
      content.style.transition = TRANSITION_OPEN;
      content.style.maxHeight = targetH + 'px';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
      content.style.paddingTop = '12px';
      setTimeout(function () {
        content.removeAttribute('style');
        delete details.dataset.animating;
      }, OPEN_MS + 20);
    } else {
      var currentH = content.scrollHeight;
      content.style.transition = 'none';
      content.style.overflow = 'hidden';
      content.style.maxHeight = currentH + 'px';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
      content.style.paddingTop = getComputedStyle(content).paddingTop;
      content.getBoundingClientRect();
      content.style.transition = TRANSITION_CLOSE;
      content.style.maxHeight = '0';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-8px)';
      content.style.paddingTop = '0';
      setTimeout(function () {
        details.open = false;
        content.removeAttribute('style');
        delete details.dataset.animating;
      }, CLOSE_MS + 20);
    }
  }

  function handleClick(event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    var accordionSummary = target.closest('summary.category-summary');
    if (accordionSummary) {
      event.preventDefault();
      var details = accordionSummary.closest('details');
      if (!details || details.dataset.animating) return;
      details.dataset.animating = '1';
      animateAccordion(details, !details.open);
      return;
    }

    if (target.closest('[data-close-modal]') || target.id === 'card-modal') {
      closeModal();
      return;
    }

    if (target.closest('[data-copy-remediation]')) {
      var remediationText = document.getElementById('modal-remediation-text');
      if (!(remediationText instanceof HTMLTextAreaElement)) {
        setRemediationFeedback('Remediation prompt not available.', true);
        return;
      }

      var copyValue = remediationText.value || '';
      if (copyValue.trim().length === 0) {
        setRemediationFeedback('Nothing to copy.', true);
        return;
      }

      copyTextToClipboard(copyValue)
        .then(function () {
          setRemediationFeedback('Copied to clipboard.', false);
        })
        .catch(function () {
          setRemediationFeedback('Copy failed. Copy manually from the text box.', true);
        });
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

    var actionToggle = target.closest('[data-action-toggle]');
    if (actionToggle) {
      var bucketKey = actionToggle.getAttribute('data-action-toggle');
      if (bucketKey && state.payload) {
        state.actionPlanExpanded[bucketKey] = !state.actionPlanExpanded[bucketKey];
        renderApp(state.payload);
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
      root.innerHTML =
        '<div class="warning-panel"><h3>Failed to load report</h3><div>' +
        escapeHtml(String(error)) +
        '</div></div>';
    });
})();
