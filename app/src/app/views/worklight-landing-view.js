import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import logoImg from '../../assets/images/worklight.png';
import PRCImg from '../../assets/images/prc-logo.png';
import DataEntryService from '../services/worklight-data-entry-service.js';
import PWAService from '../services/pwa-service.js';
import '../components/ios-pwa-install-prompt.js';

class WorklightLandingView extends LitElement {
  static get properties() {
    return {
      currentParticipantCount: { type: Number },
    };
  }

  static get styles() {
    return [];
  }

  constructor() {
    super();
    this.currentParticipantCount = 0;
  }

  firstUpdated() {
    this.getCurrentStats();
  }

  async getCurrentStats() {
    const stats = await DataEntryService.getStats();
    this.currentParticipantCount = stats ? stats.data.submitters.total : 0;
  }

  render() {
    return html`
      <div class="container worklight-view-wrapper">
        <div class="worklight-landing-content">
          <a href="https://pandemicresponsecommons.org"><img src="${logoImg}" class="responsive"/></a>
          ${PWAService.installable()
            ? html`
                <material-button
                  class="install-button"
                  label="Download app"
                  icon="play_for_work"
                  @click="${() => {
                    PWAService.launchInstallDialog();
                  }}"
                ></material-button>
              `
            : ''}
          <div class="about mb-4">
            <h2>Welcome to COVIDworklight</h2>
            <p>
               You can make a difference by answering one or two questions once 
               a day while you are at work. By sharing any mild symptoms you 
               may be experiencing you can help to catch and prevent 
               outbreaks.
            </p>
          </div>
          <div class="participation mb-4">
            <h2>How do I participate?</h2>
            <p>
              Simple: just click the button below labeled "Hall Pass."
            </p>
            <p>
              This is entirely anonymous. We do not ask any questions that
              could lead to you being identified.
            </p>
          </div>
          <div class="data-use">
            <h2>${Translator.get('landing.how_will_my_data_be_used')}</h2>
            <p>
               The data from everyone using COVIDworklight in your
               building will be combined and the aggregated results
               used to inform models of disease outbreak. The aggregated
               results will be made available to the members of the 
               Pandemic Reponse Commons.
            </p>
          </div>
          <a href="https://pandemicresponsecommons.org">
            <img src="${PRCImg}" alt="PRC logo" class="responsive" align="center"/></a>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('worklight-landing-view')) {
  customElements.define('worklight-landing-view', WorklightLandingView);
}
