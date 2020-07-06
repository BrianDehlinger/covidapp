/* eslint-disable class-methods-use-this,no-param-reassign */
import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import DataEntryService from '../services/data-entry-service.js';

class WorklightNavigation extends LitElement {
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
    this.rootElem = document.querySelector('worklight-root');
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
    //this.getCurrentStats();
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
    const oldViewWrapper = oldViewObject.querySelector('.worklight-view-wrapper');
    const oldViewNavigationOrder = this.currentViewNavigationOrder;

    this.currentViewNavigationOrder = navigationOrder;

    const newView = document.createElement(targetView);
    this.currentViewObject = newView;
    const newTransitionClass =
      oldViewNavigationOrder > this.currentViewNavigationOrder
        ? 'worklight-view-wrapper--transitioning-from-left'
        : 'worklight-view-wrapper--transitioning-from-right';
    const oldTransitionClass =
      oldViewNavigationOrder < this.currentViewNavigationOrder
        ? 'worklight-view-wrapper--transitioning-to-left'
        : 'worklight-view-wrapper--transitioning-to-right';
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
      const newViewWrapper = newView.querySelector('.worklight-view-wrapper');
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
      <div class="worklight-navigation-wrapper mdc-elevation--z5">
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="worklight-navigation-block${this.currentView === 'worklight-landing-view'
            ? ' worklight-navigation-block--selected'
            : ''}"
          id="about"
          data-navigation-view="worklight-landing-view"
          data-navigation-order="1"
        >
          <material-icon icon="info"></material-icon>
          <p>${Translator.get('landing.about')}</p>
        </div>
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="worklight-navigation-block${this.currentView === 'worklight-data-view'
            ? ' worklight-navigation-block--selected'
            : ''}"
          id="worklight-data-entry"
          data-navigation-view="worklight-data-view"
          data-navigation-order="2"
        >
          <material-icon icon="person"></material-icon>
          <p>Hall Pass</p>
      </div>
      ${!this.cookieAcceptance ? html`<div class="worklight-navigation-wrapper cookie-message mdc-elevation--z6">
            <p>
             By clicking the button you agree to our 
            <a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Terms-of-Use.pdf" target="_blank">Terms of Use</a> 
            and acknowledge receipt of our <a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Privacy-Policy.pdf" target="_blank">Privacy Policy</a>.
            </p>
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

if (!customElements.get('worklight-navigation')) {
  customElements.define('worklight-navigation', WorklightNavigation);
}
