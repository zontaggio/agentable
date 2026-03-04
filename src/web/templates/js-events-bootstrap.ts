export const APP_JS_EVENTS_BOOTSTRAP = `
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

  async function submitFeedback(useful) {
    if (!state.payload) return;
    var modal = document.getElementById('card-modal');
    if (!modal) return;
    var criterionId = modal.getAttribute('data-criterion-id');
    if (!criterionId) return;

    var reason = window.prompt('Optional feedback reason:', '') || '';
    var response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        criterionId: criterionId,
        useful: Boolean(useful),
        reason: String(reason || ''),
      }),
    });

    if (!response.ok) {
      throw new Error('Feedback failed: ' + response.status);
    }
  }

  function animateAccordion(details, open) {
    var content = details.querySelector('.category-content');
    if (!content) { details.open = open; return; }

    var OPEN_MS = 320;
    var CLOSE_MS = 260;
    var EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var TRANSITION_OPEN = 'max-height ' + OPEN_MS + 'ms ' + EASING + ', opacity 200ms ease, transform 220ms ease, padding-top 200ms ease';
    var TRANSITION_CLOSE = 'max-height ' + CLOSE_MS + 'ms ' + EASING + ', opacity 180ms ease, transform 180ms ease, padding-top 180ms ease';

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
      setTimeout(function () { content.removeAttribute('style'); delete details.dataset.animating; }, OPEN_MS + 20);
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
      setTimeout(function () { details.open = false; content.removeAttribute('style'); delete details.dataset.animating; }, CLOSE_MS + 20);
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

    var feedbackButton = target.closest('[data-feedback-useful]');
    if (feedbackButton) {
      var usefulRaw = feedbackButton.getAttribute('data-feedback-useful');
      submitFeedback(usefulRaw === 'true').catch(function (error) {
        alert(String(error && error.message ? error.message : error));
      });
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
