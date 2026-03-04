export const APP_CSS_LAYOUT = `
.analytics-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.9fr;
  gap: 16px;
  margin-bottom: 18px;
  align-items: start;
}

.action-plan {
  margin-bottom: 18px;
  padding: 18px;
}

.action-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
}

.action-subtitle {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.action-bucket {
  border: 1px solid #34505a;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
}

.action-bucket h3 {
  margin: 0 0 10px;
  font-size: 15px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #cde2e9;
}

.action-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
  padding-right: 3px;
}

.action-list.expanded {
  max-height: 340px;
}

.action-item {
  border: 1px solid #3b5964;
  background: rgba(13, 25, 30, 0.6);
  padding: 8px 9px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  color: var(--text);
  font: inherit;
}

.action-item:hover {
  border-color: #69b2c5;
}

.action-toggle {
  margin-top: 10px;
  width: 100%;
  border: 1px solid #436572;
  background: rgba(17, 31, 37, 0.86);
  color: #cde2e8;
  padding: 7px 8px;
  font-size: 12px;
  cursor: pointer;
}

.action-toggle:hover {
  border-color: #6bbad0;
}

.action-item-title {
  font-size: 13px;
  color: #f4fbfc;
}

.action-item-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #a8c0c7;
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
  grid-template-columns: auto 1fr auto auto auto;
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
  overflow: hidden;
}

details[open] > .category-content {
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
`;
