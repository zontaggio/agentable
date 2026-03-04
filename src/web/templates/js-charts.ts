export const APP_JS_CHARTS = `
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
`;
