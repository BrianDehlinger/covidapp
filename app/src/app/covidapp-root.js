import { LitElement, html } from 'lit-element';
import './views/landing-view.js';
import './views/state-view.js';
import './views/data-entry.js';
import './views/data-view.js';
import './components/covidapp-navigation.js';
import './components/material-icon.js';
import './components/language-controller.js';
import './components/dialog.js';
import './components/button.js';
import './components/development-mode-banner.js';
import AccessibilityUtil from './util/accessibility-util.js';
import './components/language-choose-dialog.js';

class CovidappRoot extends LitElement {
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
        ? html` <data-view></data-view> `
        : html` <landing-view></landing-view> `}
      <covidapp-navigation
        currentView="${this.hasSubmittedAtLeastOnce ? 'data-view' : 'landing-view'}"
      ></covidapp-navigation>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('covidapp-root')) {
  customElements.define('covidapp-root', CovidappRoot);
}
