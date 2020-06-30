/* eslint-disable class-methods-use-this,no-param-reassign */
import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import DataEntryService from '../services/data-entry-service.js';

class CovidappNavigation extends LitElement {
  static get properties() {
    return {
      currentView: { type: String },
      currentViewObject: { type: Object },
      currentViewNavigationOrder: { type: Number },
      rootElem: { type: Object },
      cookieAcceptance: { type: Boolean}
    };
  }

  constructor() {
    super();
    this.currentView = '';
    this.currentViewObject = null;
    this.currentViewNavigationOrder = 1;
    this.rootElem = null;
    this.cookieAcceptance = false;
    this.currentParticipantCount = 0;
  }

  firstUpdated() {
    this.rootElem = document.querySelector('covidapp-root');
    if (!this.currentViewObject) {
      this.currentViewObject = document.querySelector(this.currentView);
      this.currentViewNavigationOrder = this.querySelector(
        `[data-navigation-view='${this.currentView}']`,
      ).dataset.navigationOrder;
    }

    if(localStorage.getItem("COOKIE_ACCEPTANCE") === "1"){
      this.cookieAcceptance = true;
    }
    else{
      this.cookieAcceptance = false;
    }
    this.getCurrentStats();
  }

  async getCurrentStats() {
    const stats = await DataEntryService.getStats();
    this.currentParticipantCount = stats ? stats.data.submitters.total : 0;
  }

  handleNavigationClick(e) {
    let navigationDiv = e.target;
    while (navigationDiv.nodeName !== 'DIV') {
      navigationDiv = navigationDiv.parentNode;
    }
    const targetView = navigationDiv.dataset.navigationView;
    if (targetView === this.currentView) {
      return;
    }
    const { navigationOrder } = navigationDiv.dataset;
    this.transitionToNewView(targetView, navigationOrder);
    this.currentView = targetView;
  }

  transitionToNewView(targetView, navigationOrder) {
    const oldViewObject = this.currentViewObject;
    const oldViewWrapper = oldViewObject.querySelector('.view-wrapper');
    const oldViewNavigationOrder = this.currentViewNavigationOrder;

    this.currentViewNavigationOrder = navigationOrder;

    const newView = document.createElement(targetView);
    this.currentViewObject = newView;
    const newTransitionClass =
      oldViewNavigationOrder > this.currentViewNavigationOrder
        ? 'view-wrapper--transitioning-from-left'
        : 'view-wrapper--transitioning-from-right';
    const oldTransitionClass =
      oldViewNavigationOrder < this.currentViewNavigationOrder
        ? 'view-wrapper--transitioning-to-left'
        : 'view-wrapper--transitioning-to-right';
    this.handleSlideIn(newView, newTransitionClass);

    this.addObjectRemoveListener(oldViewWrapper, oldViewObject);
    oldViewWrapper.classList.add(oldTransitionClass);
  }

  addObjectRemoveListener(viewWrapper, viewObject) {
    viewWrapper.addEventListener('animationend', () => {
      viewObject.remove();
    });
  }

  addSlideInClassRemoveListener(viewWrapper, transitionClass) {
    viewWrapper.addEventListener('animationend', () => {
      viewWrapper.classList.remove(transitionClass);
    });
  }

  handleSlideIn(newView, transitionClass) {
    this.rootElem.prepend(newView);
    newView.style.display = 'none';
    // Give it time to hit the DOM
    setTimeout(() => {
      const newViewWrapper = newView.querySelector('.view-wrapper');
      newViewWrapper.classList.add(transitionClass);
      newView.style.display = 'block';
      this.addSlideInClassRemoveListener(newViewWrapper, transitionClass);
    }, 100);
  }

  setCookieAcceptance(){
    localStorage.setItem("COOKIE_ACCEPTANCE","1");
    this.cookieAcceptance = true;
  }

  render() {
    return html`
      <div class="covidapp-navigation-wrapper mdc-elevation--z5">
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="covidapp-navigation-block${this.currentView === 'landing-view'
            ? ' covidapp-navigation-block--selected'
            : ''}"
          id="about"
          data-navigation-view="landing-view"
          data-navigation-order="1"
        >
          <material-icon icon="info"></material-icon>
          <p>${Translator.get('landing.about')}</p>
        </div>
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="covidapp-navigation-block${this.currentView === 'data-view'
            ? ' covidapp-navigation-block--selected'
            : ''}"
          id="data-entry"
          data-navigation-view="data-view"
          data-navigation-order="2"
        >
          <material-icon icon="person"></material-icon>
          <p>${Translator.get('entry.data_entry')}</p>
        </div>
        ${this.currentParticipantCount > 2000 ?
        html`
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="covidapp-navigation-block${this.currentView === 'state-view'
            ? ' covidapp-navigation-block--selected'
            : ''}"
          id="stats"
          data-navigation-view="state-view"
          data-navigation-order="3"
        >
          <material-icon icon="assessment"></material-icon>
          <p>${Translator.get('stats.stats')}</p>
        </div>
           `
        : ''}
      </div>
      ${!this.cookieAcceptance ? html`<div class="covidapp-navigation-wrapper cookie-message mdc-elevation--z6">
            <p>
            By continuing to use this service you agree that you understand 
            and accept our  
            <a href="http://pandemicresponsecommons.org/wp-content/uploads/2020/06/CCSR-Privacy-Policy-2020-06-28.pdf" target="_blank"> Privacy Policy.</a>
            <p>
            <button class="mdc-button mdc-button--raised" @click="${this.setCookieAcceptance}">
            <div class="mdc-button__ripple"></div>
  
            <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
            <span class="mdc-button__label">${Translator.get('cookie.button_text')}</span>
          </button>
          </p>
          </div>`:''}
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('covidapp-navigation')) {
  customElements.define('covidapp-navigation', CovidappNavigation);
}
