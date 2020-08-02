/* eslint-disable */
import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
// import GoogleAnalyticsService from '../services/google-analytics-service.js';
import ChicagoMap from '../components/chicago-map.js';

class StateView extends LitElement {
  static get properties() {
    return {};
  }

//  firstUpdated() {
//    GoogleAnalyticsService.reportNavigationAction('Stats View'); 
//  }

  render() {
    return html`
      <div class="container view-wrapper">
        <div class="state-view-content">
           <visualization-map-chicago></visualization-map-chicago>  
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('state-view')) {
  customElements.define('state-view', StateView);
}
