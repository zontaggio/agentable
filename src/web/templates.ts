import { WebReportPayload } from '../types';
import { APP_CSS_COMPONENTS } from './templates/css-components';
import { APP_CSS_FOUNDATION } from './templates/css-foundation';
import { APP_CSS_LAYOUT } from './templates/css-layout';
import { APP_CSS_RESPONSIVE } from './templates/css-responsive';
import { renderIndexHtml as renderIndexHtmlTemplate, renderStandaloneHtml as renderStandaloneHtmlTemplate } from './templates/html';
import { APP_JS_CHARTS } from './templates/js-charts';
import { APP_JS_EVENTS_BOOTSTRAP } from './templates/js-events-bootstrap';
import { APP_JS_MODAL } from './templates/js-modal';
import { APP_JS_RUNTIME } from './templates/js-runtime';
import { APP_JS_SECTIONS } from './templates/js-sections';

export const APP_CSS = [
  APP_CSS_FOUNDATION,
  APP_CSS_LAYOUT,
  APP_CSS_COMPONENTS,
  APP_CSS_RESPONSIVE,
].join('');

export const APP_JS = [
  APP_JS_RUNTIME,
  APP_JS_CHARTS,
  APP_JS_SECTIONS,
  APP_JS_MODAL,
  APP_JS_EVENTS_BOOTSTRAP,
].join('');

export const renderIndexHtml = renderIndexHtmlTemplate;

export function renderStandaloneHtml(payload: WebReportPayload): string {
  return renderStandaloneHtmlTemplate(payload, APP_CSS, APP_JS);
}
