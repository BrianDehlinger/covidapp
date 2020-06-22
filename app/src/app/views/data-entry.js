/* eslint-disable */
import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCCheckbox } from '@material/checkbox/component';
import tabtrap from 'tabtrap';
import GeolocatorService from '../services/geolocator-service.js';
import '../components/input-field.js';
import '../components/select-field.js';
import SnackBar from '../components/snackbar.js';
import ScrollService from '../services/scroll-service.js';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import DataEntryService from '../services/data-entry-service.js';
import Translator from '../util/translator.js';
import FeverDataUtil from '../util/fever-data-util.js';
import '../components/gender-input.js';
// import GoogleAnalyticsService from '../services/google-analytics-service.js';
import Dialog from '../components/dialog.js';
import PWAService from '../services/pwa-service.js';
// import NotificationService from '../services/notification-service.js';
import { syncClientInformation } from '../services/service-worker-service.js';
import BirthYearRangeSelector from '../components/birth-year-range-selector.js';
import feelings from '../util/feelings.js';
import dayjs from 'dayjs';

class DataEntry extends LitElement {
  static get properties() {
    return {
      latestEntry: { type: Object },
      queuedEntries: { type: Array },
      firstTimeSubmitting: { type: Boolean },

      feeling: { type: Number }, // Adding variable for feeling

      hasFever: { type: Boolean },
      feverAmount: { type: Number },
      feverAmountNowKnown: { type: Boolean },
      gender: { type: String },
      birthYear: { type: String },

      geoCodingInfo: { type: Object },
      countrySelectionOptions: { type: Array },
      selectedCountryIndex: { type: Number },

      errorMessage: { type: String },

      carouselWrapper: { type: Object },
      currentQuestion: { type: Number },
      questionCount: { type: Number },

      symptoms: { type: Array },
      covidDiagnosed: { type: Boolean },
      transitioning: { type: Boolean },

      showDemographicsScreen: { type: Boolean },
      showLocationScreen: { type: Boolean }
    };
  }

  constructor() {
    super();
    const latestEntry = JSON.parse(localStorage.getItem('LATEST_ENTRY'));
    const lastLocation = localStorage.getItem('LAST_LOCATION');
    const gender = localStorage.getItem('GENDER');
    const birthYear = localStorage.getItem('BIRTH_YEAR');
    const covidDiagnosed = localStorage.getItem('COVID_DIAGNOSIS');
    const demographicsSkipped = localStorage.getItem('DEMOGRAPHICS_SKIPPED');
    const locationPermission = localStorage.getItem('LOCATION_PERMISSION');

    this.errorMessage = null;
    this.feeling = null; // setting initial value
    this.hasFever = null;
    this.feverAmount = 35;
    this.feverAmountNotKnown = false;
    this.birthYear = birthYear || null;
    this.gender = gender || null;
    this.location = latestEntry ? latestEntry.location : null;
    this.locationPermission = locationPermission || null;
    this.latestEntry = latestEntry || null;
    this.geoCodingInfo = latestEntry ? JSON.parse(lastLocation) : null;
    this.covidDiagnosed = covidDiagnosed === 'true';

    this.firstTimeSubmitting = (demographicsSkipped == null) && (this.gender == null || this.birthYear == null);


    this.createCountrySelectOptions();
    this.queuedEntries = [];

    this.currentQuestion = 1;
    this.questionCount = 4;
    this.symptoms = [];
    this.transitioning = false;
  }

  firstUpdated() {
    this.initSlider();
    //this.getGeoLocationInfo();
    Array.from(this.querySelectorAll('.mdc-checkbox')).forEach(elem => {
      // eslint-disable-next-line no-new
      new MDCCheckbox(elem);
    });

    this.carouselWrapper = this.querySelector('.data-entry-content');
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

  // Setting country to united states.
  // Hard coding the object here to keep code change to minimum
  createCountrySelectOptions() {
    // this.countrySelectionOptions = GeolocatorService.getCountryList().map(entry => ({
    //   id: entry.country.country_id,
    //   name: `${entry.country.country_name.substring(0, 1)}${entry.country.country_name
    //     .substring(1)
    //     .toLowerCase()} (${entry.country.country_id})`,
    // }));
    this.countrySelectionOptions = [{
      id: "US",
      name: "UNITED STATES"
    }];
    this.selectedCountryIndex = 0;
  }

  async createLocationDialog() {
    if (!this.locationPermission) {
      Dialog.open({
        title: Translator.get('dialog.location.title'),
        content: Translator.get('dialog.location.content'),
        approveText: Translator.get('dialog.location.approve_text'),
        declineText: Translator.get('dialog.location.decline_text'),
        approveEvent: 'location-dialog-approve',
        declineEvent: 'location-dialog-decline',
      });

      document.addEventListener('location-dialog-approve', () => {
        localStorage.setItem("LOCATION_PERMISSION", "approved");
        this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
        this.getGeoLocationInfo();
      });

      document.addEventListener('location-dialog-decline', () => {
        localStorage.setItem("LOCATION_PERMISSION", "denied");
      });

    } else if (this.locationPermission != 'denied') {
      this.getGeoLocationInfo();
    }
  }

  async getGeoLocationInfo(forceUpdate) {
    if (!this.geoCodingInfo || forceUpdate) {
      this.geoCodingInfo = null;
      navigator.geolocation.getCurrentPosition(async success => {
        this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
          success.coords.latitude,
          success.coords.longitude,
        );

        delete this.geoCodingInfo.success;

        const countryInSelect = this.countrySelectionOptions.find(
          opt => opt.id === this.geoCodingInfo.countryShort,
        );
        if (countryInSelect) {
          this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
        }

        this.performUpdate();
        if (forceUpdate) {
          SnackBar.success(Translator.get('system_messages.success.location_update'));
        }
      }, async error => {
        this.selectedCountryIndex = 1;
      });
    } else {
      const countryInSelect = this.countrySelectionOptions.find(
        opt => opt.id === this.geoCodingInfo.countryShort,
      );
      if (countryInSelect) {
        this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
      }
    }
  }

  handleFeverButton(hasFever) {
    this.hasFever = hasFever;
    if (this.hasFever) {
      setTimeout(() => {
        const slider = this.initSlider();

        const checkboxElem = this.querySelector('.mdc-checkbox');
        const checkbox = new MDCCheckbox(checkboxElem);
        checkboxElem.addEventListener('change', () => {
          this.feverAmountNotKnown = checkbox.checked;
          this.feverAmount = checkbox.checked ? 0 : slider.value.toFixed(1);
          slider.getDefaultFoundation().setDisabled(checkbox.checked);
        });
      });
    }
  }

  initSlider() {
    const tempMeter = this.querySelector('#temperature-meter');
    if (!tempMeter) {
      return;
    }
    const celcius = this.querySelector('.celcius');
    const fahrenheit = this.querySelector('.fahrenheit');
    // This is extremely hacky but it works rn so
    tempMeter.addEventListener('input', e => {
      this.feverAmount = e.target.value;
      celcius.value = this.feverAmount;
      fahrenheit.value = FeverDataUtil.celsiusToFahrenheit(this.feverAmount);
    });
    celcius.addEventListener('keyup', e => {
      if (e.key === 'Tab') {
        return;
      }
      this.handleCommaInput(e);
      this.feverAmount = e.target.value;
      fahrenheit.value = FeverDataUtil.celsiusToFahrenheit(e.target.value);
      tempMeter.value = this.feverAmount;
    });
    fahrenheit.addEventListener('keyup', e => {
      if (e.key === 'Tab') {
        return;
      }
      this.handleCommaInput(e);
      this.feverAmount = FeverDataUtil.fahrenheitToCelsius(e.target.value);
      celcius.value = this.feverAmount;
      tempMeter.value = this.feverAmount;
    });

    celcius.addEventListener('focus', e => {
      e.target.value = '';
    });

    celcius.addEventListener('blur', e => {
      const val = e.target.value;
      if (val.length < 1) {
        e.target.value = this.feverAmount;
      }
    });

    fahrenheit.addEventListener('blur', e => {
      const val = e.target.value;
      if (val.length < 1) {
        e.target.value = FeverDataUtil.celsiusToFahrenheit(this.feverAmount);
      }
    });

    fahrenheit.addEventListener('focus', e => {
      e.target.value = '';
    });
    // Programmatically set height of the temp meter
    setTimeout(() => {
      tempMeter.style.width = `${tempMeter.parentNode.clientHeight}px`;
    }, 0);
  }

  // Quite hacky but should work
  // eslint-disable-next-line class-methods-use-this
  handleCommaInput(e) {
    if (e.key === ',') {
      e.target.setAttribute('comma-was-input', true);
      e.target.value += '.0';
    } else if (e.target.getAttribute('comma-was-input')) {
      e.target.removeAttribute('comma-was-input');
      if (!Number.isNaN(e.key)) {
        // is number
        const oldVal = e.target.value;
        e.target.value = `${oldVal.split('.')[0]}.${e.key}`;
      }
    }
  }

  async buildFeverData() {
    const feverData = {};
    const geoCodingInfo = await this.getGeoCodingInputInfo();

    // device ID is handled during submission
    let subDate = new Date();
    subDate.setHours(subDate.getHours() + Math.round(subDate.getMinutes() / 60));
    subDate.setMinutes(0, 0, 0);

    feverData.timestamp = Math.floor(subDate.getTime() / 1000); //This is EpochTime in seconds in UTC
    feverData.feeling = this.feeling.toString(); // submitting feeling input
    feverData.fever_status = this.hasFever;
    feverData.fever_temp = this.feverAmount;
    if (this.hasFever) {
      feverData.fever_temp = !this.feverAmountNotKnown && this.hasFever ? this.feverAmount : null;
    }
    feverData.birth_year = this.birthYear;
    feverData.gender = this.gender;

    feverData.location_country_code = geoCodingInfo.country_code;
    feverData.location_postal_code = geoCodingInfo.postal_code;

    feverData.location_lng = null; //geoCodingInfo.location_lng.toFixed(7);
    feverData.location_lat = null; //geoCodingInfo.location_lat.toFixed(7);

    const possibleSymptoms = [
      'symptom_cough',
      'symptom_difficulty_breathing',
      'symptom_fever',
      'symptom_headache',
      'symptom_chills',
      'symptom_sore_throat',
      'symptom_shaking',
      'symptom_loss_of_taste',
      'symptom_muscle_pain',
    ];
    possibleSymptoms.forEach(symp => {
      feverData[symp] = this.symptoms.includes(symp);
    });

    feverData.diagnosed_covid19 = this.covidDiagnosed;

    return feverData;
  }

  validateFeverData(feverData) {
    //Commenting this as demographics are optional now
    // const ageIsValid = this.validateAge(feverData.birth_year);
    // if (!ageIsValid) {
    //   return false;
    // }
    // const genderIsValid = this.validateGender(feverData.gender);
    // if (!genderIsValid) {
    //   return false;
    // }

    const feelingIsValid = this.validateFeeling(feverData.feeling);
    if (!feelingIsValid) {
      return false;
    }

    const feverTempIsValid = this.validateFeverTemp(feverData.fever_temp);
    if (!feverTempIsValid) {
      return false;
    }

    //Lat Long Validation
    // const locationIsValid = this.validateLocation(feverData);
    // if (!locationIsValid) {
    //   return false;
    // }

    return true;
  }

  validateAge(birthYear) {
    if (birthYear > 2020 || birthYear < 1900) {
      this.errorMessage = Translator.get('system_messages.error.age_not_in_range');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateGender(gender) {
    if (gender === null) {
      this.errorMessage = Translator.get('system_messages.error.gender_not_set');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateFeeling(feeling) {
    if (!feeling || isNaN(feeling) || feeling < 1 || feeling > 3) {
      this.errorMessage = Translator.get('system_messages.error.feeling_value_not_valid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateFeverTemp(feverTemp) {
    if (feverTemp != null && (feverTemp < 35 || feverTemp > 44)) {
      this.errorMessage = Translator.get('system_messages.error.fever_temp_value_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateLocation(feverData) {
    if (this.locationDataIsInvalid(feverData)) {
      this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  locationDataIsInvalid(feverData) {
    return (
      !feverData.location_country_code ||
      !feverData.location_postal_code ||
      !feverData.location_lng ||
      !feverData.location_lat
    );
  }

  async handleSubmit() {
    const feverData = await this.buildFeverData();
    const valid = this.validateFeverData(feverData);
    if (!valid) {
      return;
    }
    this.errorMessage = null;

    const submissionResponse = await DataEntryService.handleDataEntrySubmission(feverData);
    feverData["timestamp"] = dayjs.unix(feverData["timestamp"]).local().format();

    if (submissionResponse.success) {
      this.handlePostSubmissionActions(feverData, Date.now(), false, submissionResponse);
      this.currentQuestion = 1;
    } else {
      switch (submissionResponse.reason) {
        case 'INVALID_DATA':
          SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
          break;
        case 'REGEN_DEVICE_ID':
          this.handlePostSubmissionActions(feverData, Date.now(), true);
          break;
        case 'NETWORK_STATUS_OFFLINE':
          this.handlePostSubmissionActions(feverData, Date.now(), true);
          break;
        default:
          SnackBar.error(submissionResponse.message);
      }
    }
  }

  async handlePostSubmissionActions(feverData, submissionTime, entryGotQueued, submissionResponse) {
    localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));

    if (feverData.gender) localStorage.setItem('GENDER', feverData.gender);
    if (feverData.birth_year) localStorage.setItem('BIRTH_YEAR', feverData.birth_year);
    localStorage.setItem('COVID_DIAGNOSIS', feverData.diagnosed_covid19);

    localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);

    if (!entryGotQueued) {
      DataEntryService.setEntriesToIndexedDb(submissionResponse);
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
      SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      this.closeView();
    }
    ScrollService.scrollToTop();
  }

  closeView() {
    const wrapper = this.querySelector('.view-wrapper');
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
        await db.add(FEVER_ENTRIES, entry);
        successfulSyncCount += 1;
      }
      if (i === this.queuedEntries.length - 1) {
        if (successfulSyncCount > 0) {
          SnackBar.success(Translator.get('system_messages.success.sync_finished'));
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    });
  }

  async getGeoCodingInputInfo() {
    const postalCode = this.querySelector('#location-postal-code').getValue();
    const country = 1;//this.querySelector('#location-country').getValue();

    const geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
      postalCode,
      "US"
      //country.value.id,
    );
    localStorage.setItem('LAST_LOCATION', JSON.stringify(geoCodingInfo));

    if (!geoCodingInfo.countryShort || !geoCodingInfo.coords || !geoCodingInfo.postal_code) {
      SnackBar.error(Translator.get('system_messages.error.location_data_invalid'));
      return null;
    }

    return {
      country_code: geoCodingInfo.countryShort,
      location_lat: geoCodingInfo.coords.lat,
      location_lng: geoCodingInfo.coords.lng,
      postal_code: geoCodingInfo.postal_code,
    };
  }

  handlePersonalInfoSubmit(skip = false) {

    if (!skip && (!this.validateAge(this.birthYear) || !this.validateGender(this.gender))) {
      return;
    }

    if (skip) {
      this.birthYear = null;
      this.gender = null;
    }
    this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
  }

  handlePersonalInfoSkip() {
    localStorage.setItem("DEMOGRAPHICS_SKIPPED", "yes");
    this.handlePersonalInfoSubmit(true);
  }

  // function to hadle feeling selection
  // Also changes reated to question position change in next few functions
  handleFeelingSubmit(feeling) {
    this.feeling = feeling;
    if (feeling == 3) {
      this.symptoms = [];

      if (this.latestEntry) //this means there this is not the first time
        this.handleSubmit();
      //this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
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
    // this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
    else
      this.nextQuestion(() => this.handleDialogFocus('#question-3'), 3);
    // this.nextQuestion(() => this.handleDialogFocus('#question-4'), 4);
  }

  // function to handle back button as some steps are now optional
  handleGeoBack() {
    this.previousQuestion(() => this.handleDialogFocus('#question-3'), 1);
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
      this.createLocationDialog();
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
      this.symptoms.splice(this.symptoms.indexOf(target.id), 1);
      target.classList.remove('symptom--selected');
    } else {
      this.symptoms.push(target.id);
      target.classList.add('symptom--selected');
    }
  }

  getBirthYearRanges() {
    return [
      { name: '1900-1909', value: '1900' },
      { name: '1910-1919', value: '1910' },
      { name: '1920-1929', value: '1920' },
      { name: '1930-1939', value: '1930' },
      { name: '1940-1949', value: '1940' },
      { name: '1950-1959', value: '1950' },
      { name: '1960-1969', value: '1960' },
      { name: '1970-1979', value: '1970' },
      { name: '1980-1989', value: '1980' },
      { name: '1990-1999', value: '1990' },
      { name: '2000-2009', value: '2000' },
      { name: '2010-2019', value: '2010' },
    ];
  }

  render() {
    return html`
      <div class="container view-wrapper entry-dialog entry-dialog--hidden">
        <div class="data-entry-content">
          <div
            class="entry-carousel${this.questionCount === 4
        ? ' entry-carousel--full-width'
        : ' entry-carousel--smaller-width'}"
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
      </div>
      <div
        class="entry-window mdc-elevation--z9 other-symptoms-questions"
        id="question-2"
        tabindex="0"
      >
        ${this.getSymptomsFields()}
      </div>
      <div class="entry-window mdc-elevation--z9" id="question-3" tabindex="0">
        ${this.getPersonalQuestions()}
      </div>
      
      
      <div
        class="entry-window mdc-elevation--z9 location-questions"
        id="question-4"
        tabindex="0"
      >
        ${this.getGeoLocationInput()}
      </div>
    `;
  }

  getPersonalQuestions() {
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
        <p class="subtitle">${Translator.get('entry.these_questions_wont_be_repeated')}</p>
      </div>
      ${this.getYearOfBirthInput()} ${this.getGenderInput()}
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
          id="symptom_shaking"
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

  getGeoLocationInput() {
    return html`
      <div
        class="back-button"
        @click="${() => this.handleGeoBack()}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p>${Translator.get('entry.questions.whats_your_location')}</p>
      </div>
      <div class="entry-field">
        <div class="location-select-fields">
          <input-field
            placeHolder="${Translator.get('entry.questions.postal_code')}"
            fieldId="location-postal-code"
            id="location-postal-code"
            value="${(this.geoCodingInfo && this.geoCodingInfo.postal_code)
        ? this.geoCodingInfo.postal_code
        : ''}"
          ></input-field>
        </div>
        <p class="subtitle">
          ${Translator.get('entry.questions.location_change_subtitle')}
        </p>
        <div class="geolocation-button">
          <button
            class="mdc-button mdc-button--outlined"
            @click="${() => this.getGeoLocationInfo(true)}"
          >
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">my_location</i>
            <span class="mdc-button__label">${Translator.get('entry.questions.use_gps')}</span>
          </button>
        </div>
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

  getYearOfBirthInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.birth_year')}</p>
        <div class="birth-year-range-selectors">
          ${BirthYearRangeSelector.getBirthYearRanges().map(
      range =>
        html`
                <birth-year-range-selector
                  @birth-year-selected="${e => {
            this.birthYear = e.detail.birthYear;
          }}"
                  label=${range.name}
                  value=${range.value}
                  ?selected="${this.birthYear === range.value}"
                ></birth-year-range-selector>
              `,
    )}
        </div>
      </div>
    `;
  }

  getGenderInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.gender_in_passport')}</p>
        <gender-input
          gender="${this.gender}"
          @gender-changed="${e => {
        this.gender = e.detail.gender;
      }})}"
        ></gender-input>
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

if (!customElements.get('data-entry')) {
  customElements.define('data-entry', DataEntry);
}
