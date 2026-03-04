export const APP_JS_MODAL = `
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
      '<div class="modal-sections">' +
      '<section class="modal-section"><div class="modal-section-title">Why this matters</div><div id="modal-why"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Current evidence</div><div id="modal-evidence"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Implementation next steps</div><div id="modal-next-steps"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Success signal</div><div id="modal-success"></div></section>' +
      '<section class="modal-section"><div class="modal-section-title">Was this recommendation useful?</div>' +
      '<div class="hero-actions">' +
      '<button class="icon-btn" data-feedback-useful="true" title="Helpful">Yes</button>' +
      '<button class="icon-btn" data-feedback-useful="false" title="Not helpful">No</button>' +
      '</div>' +
      '</section>' +
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

    if (!badge || !title || !desc || !score || !status || !why || !evidence || !nextSteps || !success) return;

    badge.innerHTML = '<span class="badge-dot badge-' + escapeHtml(card.badge) + '"></span><span>' + escapeHtml(card.badge) + '</span>';
    title.textContent = card.name;
    desc.textContent = card.description;
    score.textContent = card.scoreLabel;
    status.textContent = String(card.status || '').toUpperCase();

    var guidance = card.guidance || null;
    why.textContent = guidance && guidance.whyItMatters ? guidance.whyItMatters : card.reason;

    var evid = card.evidence || [];
    if ((!Array.isArray(evid) || evid.length === 0) && (!Array.isArray(card.evidenceDetails) || card.evidenceDetails.length === 0)) {
      evidence.innerHTML = '<div>No additional evidence provided.</div>';
    } else {
      var details = Array.isArray(card.evidenceDetails)
        ? card.evidenceDetails.map(function (item) {
            return '<li>' + escapeHtml(String(item.kind || 'signal')) + ' · ' + escapeHtml(String(item.strength || 'low')) + ' · ' + escapeHtml(String(item.detail || '')) + '</li>';
          })
        : [];
      var plain = Array.isArray(evid)
        ? evid.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
          })
        : [];
      evidence.innerHTML = '<ul>' + details.concat(plain).join('') + '</ul>';
    }

    var steps = guidance && Array.isArray(guidance.nextSteps) && guidance.nextSteps.length > 0 ? guidance.nextSteps : card.improvementTips || [];
    if (!Array.isArray(steps) || steps.length === 0) {
      nextSteps.innerHTML = '<div>No guided steps available.</div>';
    } else {
      nextSteps.innerHTML =
        '<ul>' +
        steps.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') +
        '</ul>';
    }

    success.textContent =
      guidance && guidance.expectedOutcome
        ? guidance.expectedOutcome
        : 'This criterion becomes explicit, automatable, and stable over time.';

    modal.setAttribute('data-criterion-id', String(card.id || ''));
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
      '<button class="icon-btn" title="Download JSON report" data-download-json="1">{  }</button>' +
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

      renderActionPlan(payload) +
      renderLimitations(payload) +

      renderCategorySections(payload) +
      renderModal();

    bindRadarHover();
  }
`;
