export const APP_CSS_COMPONENTS = `
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

.card-rank {
  position: absolute;
  left: 10px;
  bottom: 10px;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 6px;
  border: 1px solid #4a6470;
  color: #cde2e8;
  background: rgba(8, 18, 22, 0.85);
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.modal-sections {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.modal-section {
  border: 1px solid #3a535d;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
}

.modal-section-title {
  color: #c6e0e8;
  font-size: 13px;
  margin-bottom: 7px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.modal-section ul {
  margin: 0;
  padding-left: 18px;
}
`;
