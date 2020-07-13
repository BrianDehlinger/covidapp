import { LitElement, html } from 'lit-element';
import './views/worklight-landing-view.js';
import './views/worklight-data-entry.js';
import './views/worklight-data-view.js';
import './components/worklight-navigation.js';
//import './services/autocomplete-service.js';
//import './views/state-view.js';
import './components/material-icon.js';
import './components/language-controller.js';
import './components/dialog.js';
import './components/button.js';
import './components/development-mode-banner.js';
import AccessibilityUtil from './util/accessibility-util.js';
import './components/language-choose-dialog.js';

class WorklightRoot extends LitElement {
  static get properties() {
    return {
      hasSubmittedAtLeastOnce: { type: Boolean },
    };
  }

  constructor() {
    super();
    // const hasSubmitted = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
    const hasSubmitted = localStorage.getItem('LATEST_ENTRY');
    this.hasSubmittedAtLeastOnce = hasSubmitted != null;
  }

  firstUpdated() {
    AccessibilityUtil.init();
    const preferredLangHasBeenSet = localStorage.getItem('PREFERRED_LANGUAGE');
    if (!preferredLangHasBeenSet) {
      const languageChooseDialog = document.createElement('language-choose-dialog');
      document.body.appendChild(languageChooseDialog);
    }
  }

  render() {
    return html`
      ${window.location.origin.includes('dev') || window.location.origin.includes('localhost')
        ? html` <development-mode-banner></development-mode-banner> `
        : ''}
      <language-controller></language-controller>
      ${this.hasSubmittedAtLeastOnce
        ? html` <worklight-data-view></worklight-data-view> `
        : html` <worklight-landing-view></worklight-landing-view> `}
      <worklight-navigation
        currentView="${this.hasSubmittedAtLeastOnce ? 'worklight-data-view' : 'worklight-landing-view'}"
      ></worklight-navigation>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('worklight-root')) {
  customElements.define('worklight-root', WorklightRoot);
}
