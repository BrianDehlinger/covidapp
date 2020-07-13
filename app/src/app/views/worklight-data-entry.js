/* eslint-disable */
import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCCheckbox } from '@material/checkbox/component';
import { MDCSelect } from '@material/select/component';
import tabtrap from 'tabtrap';
//import GeolocatorService from '../services/worklight-geolocator-service.js';
import '../components/input-field.js';
import '../components/select-field.js';
import SnackBar from '../components/snackbar.js';
import ScrollService from '../services/scroll-service.js';
import DBUtil, { DATA_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import DataEntryService from '../services/worklight-data-entry-service.js';
import Translator from '../util/translator.js';
import { initAutocomplete, autocomplete } from '../services/autocomplete-service.js';
//import initAutocomplete from '../services/autocomplete-service.js';
import Dialog from '../components/dialog.js';
import PWAService from '../services/pwa-service.js';
import { syncClientInformation } from '../services/service-worker-service.js';
//import BirthYearRangeSelector from '../components/birth-year-range-selector.js';
import feelings from '../util/feelings.js';
import dayjs from 'dayjs';

const apiKey = 'AIzaSyDuQel_c1dGUx83gQ5p2dCdLgO6BePDKMY';

class WorklightDataEntry extends LitElement {
  static get properties() {
    return {
      latestEntry: { type: Object },
      queuedEntries: { type: Array },
      firstTimeSubmitting: { type: Boolean },

      feeling: { type: Number }, // Adding variable for feeling

      location_address: { type: String },
      location_floor:   {type: Number },

      errorMessage: { type: String },

      carouselWrapper: { type: Object },
      currentQuestion: { type: Number },
      questionCount: { type: Number },

      symptoms: { type: Array },
      activities: { type: Array },
      covidDiagnosed: { type: Boolean },
      transitioning: { type: Boolean },

      showLocationScreen: { type: Boolean }
    };
  }

  constructor() {
    super();
    const latestEntry = JSON.parse(localStorage.getItem('LATEST_ENTRY'));
    const lastLocation = localStorage.getItem('LAST_LOCATION');
    const covidDiagnosed = localStorage.getItem('COVID_DIAGNOSIS');
    const locationPermission = localStorage.getItem('LOCATION_PERMISSION');

    this.errorMessage = null;
    this.feeling = null; // setting initial value
    //this.location_address = latestLocation.location_address ? latestLocation.location_address : null;
    //this.location_floor = latestLocation.location_floor ? latestLocation.location_floor : null;
    this.location_address = null;
    this.location_floor = null;
    this.locationPermission = locationPermission || null;
    this.latestEntry = latestEntry || null;
    this.covidDiagnosed = covidDiagnosed === 'true';

    this.firstTimeSubmitting = (this.latestEntry == null);

    this.queuedEntries = [];

    this.currentQuestion = 1;
    this.questionCount = 4;
    this.symptoms = [];
    this.activities = [];
    this.transitioning = false;
  }

  firstUpdated() {
    Array.from(this.querySelectorAll('.mdc-checkbox')).forEach(elem => {
      // eslint-disable-next-line no-new
      new MDCCheckbox(elem);
    });

    this.carouselWrapper = this.querySelector('.worklight-data-entry-content');
    // if (this.firstTimeSubmitting) {
    //   setTimeout(() => {
    //     this.handleDialogFocus('#question-1');
    //   });
    // } else {
    //   setTimeout(() => {
    //     this.nextQuestion(() => this.handleDialogFocus('#question-2'));
    //   });
    // }
  }

//  async createLocationDialog() {
//    if (!this.locationPermission) {
//      Dialog.open({
//        title: Translator.get('dialog.location.title'),
//        content: Translator.get('dialog.location.content'),
//        approveText: Translator.get('dialog.location.approve_text'),
//        declineText: Translator.get('dialog.location.decline_text'),
//        approveEvent: 'location-dialog-approve',
//        declineEvent: 'location-dialog-decline',
//      });
//
//      document.addEventListener('location-dialog-approve', () => {
//        localStorage.setItem("LOCATION_PERMISSION", "approved");
//        this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
//      });
//
//      document.addEventListener('location-dialog-decline', () => {
//        localStorage.setItem("LOCATION_PERMISSION", "denied");
//      });
//
//    } else if (this.locationPermission != 'denied') {
//      //this.getGeoLocationInfo();
//    }
//      //this.getGeoLocationInfo();
//  }

  async getGeoLocationInfo(forceUpdate) {
    //this.geoCodingInfo = await GeolocatorService.geolocate();
    geolocate();
  }
//    if (!this.geoCodingInfo || forceUpdate) {
//      this.geoCodingInfo = null;
//      navigator.geolocation.getCurrentPosition(async success => {
//        this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
//          success.coords.latitude,
//          success.coords.longitude,
//        );
//
//        delete this.geoCodingInfo.success;
//
//        const countryInSelect = this.countrySelectionOptions.find(
//          opt => opt.id === this.geoCodingInfo.countryShort,
//        );
//        if (countryInSelect) {
//          this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
//        }
//
//        this.performUpdate();
//        if (forceUpdate) {
//          SnackBar.success(Translator.get('system_messages.success.location_update'));
//        }
//      }, async error => {
//        this.selectedCountryIndex = 1;
//      });
//    } else {
//      const countryInSelect = this.countrySelectionOptions.find(
//        opt => opt.id === this.geoCodingInfo.countryShort,
//      );
//      if (countryInSelect) {
//        this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
//      }
//    }
//  }

  async buildDataEntry() {
    const dataEntry = {};
    const geoCodingInfo = await this.getGeoCodingInputInfo();

    // device ID is handled during submission
    let subDate = new Date();
    subDate.setHours(subDate.getHours() + Math.round(subDate.getMinutes() / 60));
    subDate.setMinutes(0, 0, 0);

    dataEntry.timestamp = Math.floor(subDate.getTime() / 1000); //This is EpochTime in seconds in UTC
    dataEntry.feeling = this.feeling.toString(); // submitting feeling input

    dataEntry.location_address = geoCodingInfo.address;
    dataEntry.location_floor = geoCodingInfo.floor;

    const possibleSymptoms = [
      'symptom_cough',
      'symptom_difficulty_breathing',
      'symptom_fever',
      'symptom_headache',
      'symptom_chills',
      'symptom_sore_throat',
      'symptom_nausea',
      'symptom_loss_of_taste',
      'symptom_muscle_pain',
    ];
    possibleSymptoms.forEach(symp => {
      dataEntry[symp] = this.symptoms.includes(symp);
    });

    dataEntry.diagnosed_covid19 = this.covidDiagnosed;

    const possibleActivities = [
      'visited_bar',
      'visited_restaurant',
      'visited_concert',
      'visited_nightclub',
      'visited_church',
      'visited_gathering',
    ];
    possibleActivities.forEach(activity => {
      dataEntry[activity] = this.activities.includes(activity);
    });

    return dataEntry;
  }

  validateDataEntry(dataEntry) {
    //Commenting this as demographics are optional now
    // const ageIsValid = this.validateAge(dataEntry.birth_year);
    // if (!ageIsValid) {
    //   return false;
    // }
    // const genderIsValid = this.validateGender(dataEntry.gender);
    // if (!genderIsValid) {
    //   return false;
    // }

    const feelingIsValid = this.validateFeeling(dataEntry.feeling);
    if (!feelingIsValid) {
      return false;
    }

    return true;
  }

  validateFeeling(feeling) {
    if (!feeling || isNaN(feeling) || feeling < 1 || feeling > 3) {
      this.errorMessage = Translator.get('system_messages.error.feeling_value_not_valid');
      console.log("cat");
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateLocation(dataEntry) {
 //   if (this.locationDataIsInvalid(dataEntry)) {
 //     this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
 //     SnackBar.error(this.errorMessage);
 //     return false;
 //   }
    return true;
  }

  locationDataIsInvalid(dataEntry) {
    return (
      !dataEntry.location_country_code ||
      !dataEntry.location_postal_code ||
      !dataEntry.location_lng ||
      !dataEntry.location_lat
    );
  }

  async handleSubmit() {
    console.log("Handling submit");
    const dataEntry = await this.buildDataEntry();
    const valid = this.validateDataEntry(dataEntry);
    console.log(valid);
    if (!valid) {
      return;
    }
    this.errorMessage = null;
    console.log("valid");
    console.log(dataEntry);

    const submissionResponse = await DataEntryService.handleDataEntrySubmission(dataEntry);
    dataEntry["timestamp"] = dayjs.unix(dataEntry["timestamp"]).local().format();

          console.log("goat");
          console.log(submissionResponse);
    if (submissionResponse.success) {
      this.handlePostSubmissionActions(dataEntry, Date.now(), false, submissionResponse);
      this.currentQuestion = 1;
    } else {
      switch (submissionResponse.reason) {
        case 'INVALID_DATA':
          console.log("ant");
          SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
          break;
        case 'REGEN_DEVICE_ID':
          this.handlePostSubmissionActions(dataEntry, Date.now(), true);
          break;
        case 'NETWORK_STATUS_OFFLINE':
          this.handlePostSubmissionActions(dataEntry, Date.now(), true);
          break;
        default:
          SnackBar.error(submissionResponse.message);
          console.log("bear");
          console.log(submissionResponse);
      }
    }
  }

  async handlePostSubmissionActions(dataEntry, submissionTime, entryGotQueued, submissionResponse) {
    localStorage.setItem('LATEST_ENTRY', JSON.stringify(dataEntry));

    localStorage.setItem('COVID_DIAGNOSIS', dataEntry.diagnosed_covid19);

    localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);

    if (!entryGotQueued) {
      DataEntryService.setEntriesToIndexedDb(submissionResponse);
      console.log("dog");
      SnackBar.success(Translator.get('system_messages.success.data_entry'));

      // GoogleAnalyticsService.reportSubmission();
      PWAService.launchInstallDialog();
      this.closeView();
      syncClientInformation();

      // if (NotificationService.isMessagingSupported()) {
      //   NotificationService.createNotificationRequestDialog();
      // }
    } else {
      document.dispatchEvent(new CustomEvent('update-queued-count'));
      console.log("eel");
      SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      this.closeView();
    }
    ScrollService.scrollToTop();
  }

  closeView() {
    const wrapper = this.querySelector('.worklight-view-wrapper');
    wrapper.classList.add('entry-dialog--hidden');
    wrapper.addEventListener('transitionend', () => {
      this.remove();
    });
  }

  /**
   * Enable this if we start allowing offline sync.
   *
   * Needs changes to the IDB code
   * @return {Promise<void>}
   */
  async submitQueuedEntries() {
    const db = await DBUtil.getInstance();
    let successfulSyncCount = 0;
    await this.queuedEntries.map(async (entry, i) => {
      const { id } = entry;
      // delete entry.id;
      const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
      if (submissionResponse.success) {
        db.delete(QUEUED_ENTRIES, id);
        await db.add(DATA_ENTRIES, entry);
        successfulSyncCount += 1;
      }
      if (i === this.queuedEntries.length - 1) {
        if (successfulSyncCount > 0) {
          console.log("fox");
          SnackBar.success(Translator.get('system_messages.success.sync_finished'));
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    });
  }

  async getGeoCodingInputInfo() {
    const place = autocomplete.getPlace();
    console.log(place.address_components);
    const floor = this.querySelector('#location-floor').getValue();
    console.log("Here: " + floor);
    const address = this.querySelector('#address').getValue();
    console.log("Here: " + address);

    return {
      address: address,
      floor: floor,
    };
  }

  // function to handle feeling selection
  // Also changes reated to question position change in next few functions
  handleFeelingSubmit(feeling) {
    this.feeling = feeling;
    if (feeling == 3) {
      this.symptoms = [];

      if (this.latestEntry) //this means there this is not the first time
        //this.handleSubmit();
      this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
      else
        this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
      //this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
    }
    else {
      this.nextQuestion(() => this.handleDialogFocus('#question-2'), 2);
    }
  }

  handleSymptomSubmit() {
    this.covidDiagnosed = this.querySelector('#covid-diagnosed').checked;
    // if (this.symptoms.indexOf("symptom_fever") === -1)
    //   this.nextQuestion(() => this.handleDialogFocus('#question-5'), 5);
    // else
    // if (this.firstTimeSubmitting)
    if (this.latestEntry)
      this.handleSubmit();
     //this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
    //else
     // this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
    // this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
  this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
  }

  handleVisitSubmit() {
  }

  // function to handle back button as some steps are now optional
  handleGeoBack() {
    this.previousQuestion(() => this.handleDialogFocus('#question-1'), 1);
  }

  handleDemographicsBack() {
    if (this.feeling == 3)
      this.previousQuestion(() => this.handleDialogFocus('#question-3'), 1);
    else
      this.previousQuestion(() => this.handleDialogFocus('#question-1'), 2);
  }

  previousQuestion(callback, toGo) {
    if (this.currentQuestion === 1) {
      return;
    }

    if (toGo)
      this.currentQuestion = toGo;
    else
      this.currentQuestion -= 1;

    // this.currentQuestion = this.prevQuestionNumber;
    this.scrollToCurrentQuestion(false, callback);
  }

  nextQuestion(callback, nextQuestionNumber) {
    if (this.currentQuestion === this.questionCount || this.transitioning) {
      return;
    }
    this.transitioning = true;
    if (nextQuestionNumber)
      this.currentQuestion = nextQuestionNumber;
    else
      this.currentQuestion += 1;

    this.scrollToCurrentQuestion(true, callback);
  }

  scrollToCurrentQuestion(forwards = true, callback) {
    const targetElem = this.querySelector(`#question-${this.currentQuestion}`);
    if (!targetElem) {
      return;
    }
    const target = targetElem.offsetLeft - (window.innerWidth - targetElem.clientWidth) / 2;
    this.smoothScroll(this.carouselWrapper, target, forwards, callback);
    this.transitioning = false;
  }

  smoothScroll(div, target, forwards = true, callback) {
    // Tickrate will determine the amount of iterations + 1 that the scrolling will do
    // To speed things up, change the division value. Smaller is faster.
    const tickRate = Math.abs(target - div.scrollLeft) / 30;
    if (forwards) {
      (function smoothScroll(_this) {
        if (div.scrollLeft >= target) {
          callback.call();
          return;
        }
        div.scroll(div.scrollLeft + tickRate, 0);
        setTimeout(() => smoothScroll(_this), 10);
      })(this);
    } else {
      if (target < 0) {
        // eslint-disable-next-line no-param-reassign
        target = 0;
      }
      (function smoothScrollBackwards(_this) {
        if (div.scrollLeft <= target) {
          if (callback) {
            callback.call();
          }
          return;
        }
        div.scroll(div.scrollLeft - tickRate, 0);
        setTimeout(() => smoothScrollBackwards(_this), 10);
      })(this);
    }
  }

  handleDialogFocus(dialogId) {
    if (dialogId == "#question-4") 
      //this.getGeoLocationInfo();
      //this.initAutocomplete();
      //this.createLocationDialog();
    //this.getGeoLocationInfo();
    this.querySelector(dialogId).focus();
    tabtrap.trapAll(dialogId);
  }
  

  handleSymptomKeyDown(e) {
    if (e.code === 'Space') {
      this.handleSymptomAdd(e);
    }
  }

  handleSymptomAdd(e) {
    let { target } = e;
    if (target.nodeName === 'P') {
      target = target.parentNode;
    }
    if (this.symptoms.includes(target.id)) {
console.log('includes')
console.log(target.id);
      this.symptoms.splice(this.symptoms.indexOf(target.id), 1);
      target.classList.remove('symptom--selected');
    } else {
      this.symptoms.push(target.id);
console.log('push')
console.log(target.id);
      target.classList.add('symptom--selected');
    }
  }

  handleActivityKeyDown(e) {
    if (e.code === 'Space') {
      this.handleActivityAdd(e);
    }
  }

  handleActivityAdd(e) {
    let { target } = e;
    if (target.nodeName === 'P') {
      target = target.parentNode;
    }
    if (this.activities.includes(target.id)) {
console.log('includes')
console.log(target.id);
      this.activities.splice(this.activities.indexOf(target.id), 1);
      target.classList.remove('activity--selected');
    } else {
console.log('push')
console.log(target.id);
      this.activities.push(target.id);
      target.classList.add('activity--selected');
    }
  }

  render() {
    return html`
      <div class="container worklight-view-wrapper entry-dialog entry-dialog--hidden">
        <div class="worklight-data-entry-content">
          <div
            class="entry-carousel entry-carousel--full-width"
          >
            ${this.renderQuestions()}
          </div>
        </div>
      </div>
    `;
  }

  renderQuestions() {
    return html`
      <div class="entry-dialog-close-button">
        <material-icon @click="${this.closeView}" icon="close"></material-icon>
      </div>
      <div
        class="entry-window mdc-elevation--z9 feeling-questions vertical-button-normal-justify"
        id="question-1"
        tabindex="0"

      >
        ${this.getFeelingSelector()}
         <div class="policy-link"><a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Privacy-Policy.pdf" target="_blank">Privacy Policy</a></div>
      </div>
      <div
        class="entry-window mdc-elevation--z9 other-symptoms-questions"
        id="question-2"
        tabindex="0"
      >
        ${this.getSymptomsFields()}
         <div class="policy-link"><a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Privacy-Policy.pdf" target="_blank">Privacy Policy</a></div>
      </div>
      <div
        class="entry-window mdc-elevation--z9"
        id="question-3"
        tabindex="0"
      >
        ${this.getActivitiesFields()}
         <div class="policy-link"><a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Privacy-Policy.pdf" target="_blank">Privacy Policy</a></div>
      </div>
      
      
      <div
        class="entry-window mdc-elevation--z9 location-questions"
        id="question-4"
        tabindex="0"
      >
        ${this.getGeoLocationInput()}
         <div class="policy-link"><a href="https://pandemicresponsecommons.org/wp-content/uploads/2020/07/CCSR-Privacy-Policy.pdf" target="_blank">Privacy Policy</a></div>
      </div>
    `;
  }

  getPersonalQuestions() {
    return;
    return html`
    <div
        class="back-button"
        @click="${this.handleDemographicsBack}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="subtitle">${Translator.get('entry.first_time_disclaimer')}</p>
      </div>
      <div style="display:flex">
        <div class="proceed-button">
          <button class="mdc-button mdc-button--raised" @click="${() => this.handlePersonalInfoSubmit(false)}">
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">save</i>
            <span class="mdc-button__label">${Translator.get('entry.save')}</span>
          </button>
        </div>
        <div class="skip-button">
          <button class="mdc-button mdc-button--raised" @click="${this.handlePersonalInfoSkip}">
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">skip_next</i>
            <span class="mdc-button__label">${Translator.get('entry.skip')}</span>
          </button>
        </div>
      </div>
    `;
  }

  // Adding new method for feeling selection
  getFeelingSelector() {

    let descBullets = Translator.get('entry.questions.how_are_feeling_bullets').split("::") || [];

    return html`
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="temperature-title">
        ${Translator.get('entry.questions.how_are_feeling')}
        </p>
        <ol class="title-description">
          ${descBullets.map(b =>
      html`
              <li>${b}</li>
            `
    )} 
        </ol>
      </div>
      <div class="vertical-button-holder">
        ${feelings.map(f =>
      html`<div
            class="vertical-button"
            id="${f.name}"
            @click="${() => this.handleFeelingSubmit(f.value)}"
            tabindex="0"
          >
            <span class="material-icons">
            ${f.icon}
            </span><p>${f.text}</p>
        </div>`
    )}
      </div>
    `;
  }

  getSymptomsFields() {
    return html`
      <div
        class="back-button"
        @click="${() => this.previousQuestion(() => this.handleDialogFocus('#question-1'), 1)}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="symptoms-title">${Translator.get('entry.questions.other_symptoms')}</p>
      </div>
      <!--
      <p class="subtitle">${Translator.get('entry.questions.choose_all_that_apply')}</p>
      -->
      <div class="symptom-holder">
        <div
          class="symptom"
          id="symptom_cough"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.cough')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_difficulty_breathing"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.difficulty_breathing')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_fever"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.fever')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_headache"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.headache')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_chills"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.chills')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_sore_throat"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.sore_throat')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_nausea"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.shaking')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_loss_of_taste"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.loss_of_taste')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_muscle_pain"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.muscular_pain')}</p>
        </div>
      </div>

      <div class="mdc-form-field">
        <div class="mdc-checkbox">
          <input
            type="checkbox"
            class="mdc-checkbox__native-control"
            id="covid-diagnosed"
            ?checked="${this.covidDiagnosed}"
          />
          <div class="mdc-checkbox__background">
            <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
              <path
                class="mdc-checkbox__checkmark-path"
                fill="none"
                d="M1.73,12.91 8.1,19.28 22.79,4.59"
              />
            </svg>
            <div class="mdc-checkbox__mixedmark"></div>
          </div>
          <div class="mdc-checkbox__ripple"></div>
        </div>
        <label for="covid-diagnosed"
          >${Translator.get('entry.questions.positive_covid_diagnosis')}</label
        >
      </div>
      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSymptomSubmit}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label">${Translator.get('entry.questions.set_symptoms')}</span>
        </button>
      </div>
    `;
  }

  getActivitiesFields() {
    return html`
      <div
        class="back-button"
        @click="${() => this.previousQuestion(() => this.handleDialogFocus('#question-1'), 1)}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="activities-title">Activity summary</p>
      </div>
      <!--
      <p class="subtitle">${Translator.get('entry.questions.choose_all_that_apply')}</p>
      -->
      <div class="activity-holder">
        <div
          class="activity"
          id="visited_bar"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Bar/tavern</p>
        </div>
        <div
          class="activity"
          id="visted_restaurant"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Restaurant (dine-in)</p>
        </div>
        <div
          class="activity"
          id="visited_concert"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Concert</p>
        </div>
        <div
          class="activity"
          id="visited_nightclub"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Trump rally</p>
        </div>
        <div
          class="activity"
          id="visited_church"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Church</p>
        </div>
        <div
          class="activity"
          id="visited_gathering"
          @keypress="${this.handleActivityKeyDown}"
          @click="${this.handleActivityAdd}"
          tabindex="0"
        >
          <p>Large gathering</p>
        </div>
      </div>

      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSymptomSubmit}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label">${Translator.get('entry.questions.set_symptoms')}</span>
        </button>
      </div>
    `;
  }

  getGeoLocationInput() {
    if (document.querySelectorAll('[aria-labelledby=autocomplete]').item(0)) {
      initAutocomplete();

    }
    return html`
      <div
        class="back-button"
        @click="${() => this.handleGeoBack()}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="title-holder">
        <h2>Hall Pass</h2>
        <p>
           What's your primary work location?
        </p>
      </div>
      <div class="entry-field">
          <input-field 
            fieldId="autocomplete"
            placeholder="address"
            onFocus="geolocate()"
            id="address"
            type="text"
          ></input-field>
          <input-field
            placeHolder="floor"
            fieldId="location-floor"
            id="location-floor"
            value=""
          ></input-field>
        </div>
        <p class="subtitle">
          
        </p>
      </div>

      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSubmit}">
          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label"
            >${Translator.get('entry.questions.set_location_and_submit')}</span
          >
        </button>
      </div>
    `;
  }


  getSubmitButton() {
    return html`
      <div class="entry-field">
        ${this.errorMessage ? html` <p class="mdc-theme--error">${this.errorMessage}</p> ` : ''}
        <div class="submit-button">
          <button class="mdc-button mdc-button--outlined" @click="${this.handleSubmit}">
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">send</i>
            <span class="mdc-button__label">${Translator.get('entry.submit')}</span>
          </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('worklight-data-entry')) {
  customElements.define('worklight-data-entry', WorklightDataEntry);
}
