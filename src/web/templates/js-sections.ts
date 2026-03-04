export const APP_JS_SECTIONS = `
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
          (card.priorityRank ? '<div class="card-rank">#' + escapeHtml(String(card.priorityRank)) + '</div>' : '') +
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
        '<h3>' + escapeHtml(title) + '</h3>' +
        '<div class="action-item-meta">No items in this bucket.</div>' +
        '</section>'
      );
    }

    var expanded = Boolean(state.actionPlanExpanded[bucketKey]);
    var visible = expanded ? list : list.slice(0, 4);
    var listClass = expanded ? 'action-list expanded' : 'action-list';

    return (
      '<section class="action-bucket">' +
      '<h3>' + escapeHtml(title) + '</h3>' +
      '<ul class="' + listClass + '">' +
      visible
        .map(function (item) {
          return (
            '<li><button class="action-item" data-card-id="' + escapeHtml(item.criterionId) + '">' +
            '<div class="action-item-title">#' + item.rank + ' ' + escapeHtml(item.criterionName) + '</div>' +
            '<div class="action-item-meta">' + escapeHtml(item.status.toUpperCase()) + ' · ' +
            escapeHtml(String(Math.round(item.priorityScore))) + ' priority · ' +
            escapeHtml(String(Math.round(item.actionabilityScore || 0))) + ' actionability</div>' +
            '</button></li>'
          );
        })
        .join('') +
      '</ul>' +
      (list.length > 4
        ? '<button class="action-toggle" data-action-toggle="' + escapeHtml(bucketKey) + '">' +
          (expanded ? 'Show less' : 'Show all (' + list.length + ')') +
          '</button>'
        : '') +
      '</section>'
    );
  }

  function renderActionPlan(payload) {
    var actionPlan = payload.actionPlan || { critical: [], highLeverage: [], quickWins: [], all: [] };
    var aiTag = actionPlan.generatedWithAi ? 'AI refined' : 'Deterministic';
    return (
      '<section class="panel action-plan">' +
      '<h2 class="action-title">Action Plan</h2>' +
      '<div class="action-subtitle">Prioritized next actions for this repository · ' + escapeHtml(aiTag) + '</div>' +
      '<div class="action-grid">' +
      renderActionBucket('Critical', 'critical', actionPlan.critical || []) +
      renderActionBucket('High Leverage', 'highLeverage', actionPlan.highLeverage || []) +
      renderActionBucket('Quick Wins', 'quickWins', actionPlan.quickWins || []) +
      '</div>' +
      '</section>'
    );
  }

  function renderLimitations(payload) {
    var limits = Array.isArray(payload.knownLimitations) ? payload.knownLimitations : [];
    if (limits.length === 0) {
      return '';
    }

    return (
      '<section class="panel action-plan">' +
      '<h2 class="action-title">Known Limitations</h2>' +
      '<div class="action-subtitle">Quality gate version: ' + escapeHtml(payload.qualityGateVersion || 'n/a') + '</div>' +
      '<ul class="action-list expanded">' +
      limits.map(function (item) { return '<li><div class="action-item-meta">' + escapeHtml(item) + '</div></li>'; }).join('') +
      '</ul>' +
      '</section>'
    );
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
`;
