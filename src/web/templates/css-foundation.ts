export const APP_CSS_FOUNDATION = `
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
  gap: 10px;
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
`;
