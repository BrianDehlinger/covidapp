/* eslint-disable */
import { LitElement, html } from 'lit-element';
import Chart from 'chart.js';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import Translator from '../util/translator.js';
import FeverDataUtil from '../util/fever-data-util.js';
import feelings from '../util/feelings.js';
import getSymptomsForSubmission from "../util/symptoms.js";

class FeelingChart extends LitElement {
  static get properties() {
    return {
      chart: { type: Object },
      data: { type: Object },
      chartId: { type: String },
      howManyDaysToShow: { type: Number },
      dataToShow: { type: Object },
      colorGradient: { type: Object },
      initialized: { type: Boolean },
      chartInitializerInterval: { type: Object },
      geoCodingInfo: { type: Object },
    };
  }

  constructor() {
    super();
    this.data = null;
    this.chart = null;
    this.chartId = 'feeling-chart';
    this.howManyDaysToShow = 28;
    this.dataToShow = null;
    this.colorGradient = '';
    this.initialized = false;
    this.geoCodingInfo = null;
    this.tooltips = [];
  }

  firstUpdated() {
    // Hacky solution to make sure the chart actually gets initialized
    this.chartInitializerInterval = setInterval(() => this.initChart(), 500);
  }

  initChart() {
    const ctx = this.querySelector(`#${this.chartId}`).getContext('2d');
    this.generateColorGradient(ctx);
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.parseData(),
      // data: {
      //   datasets: [{
      //     //barPercentage: 0.5,
      //     //barThickness: 6,
      //     //maxBarThickness: 8,
      //     minBarLength: 2,
      //     data: [10, 20, 30, 40, 50, 60, 70]
      //   }]
      // },
      options: this.getOptions(),
    });
    if (this.chart != null) {
      clearInterval(this.chartInitializerInterval);
    }
  }

  updated(_changedProperties) {
    if (_changedProperties.has('data')) {
      if (this.chart && this.data) {
        this.chart.data = this.parseData();
        this.chart.options = this.getOptions();
        this.chart.update();
      }
    }
  }

  generateColorGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 175);
    gradient.addColorStop(0, 'rgba(244, 67, 41, 1)');
    gradient.addColorStop(1, 'rgba(217, 241, 254, 1)');
    this.colorGradient = gradient;
  }

  parseData() {
    const parsedData = this.data;
    dayjs.extend(dayOfYear);
    const dateLabels = [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const colors = ['red', 'orange', 'green'];

    const dataValues = [];
    const backgroudColors = [];

    const today = dayjs(new Date());
    this.tooltips = [];

    let prevDay = null;
    let dayCount = 0;
    parsedData.forEach((item) => {
      //let d = dayjs.utc(item.timestamp).local().dayOfYear();
      let d = dayjs(item.timestamp).dayOfYear();
      if(prevDay != d) dayCount++;
      prevDay = d;
    });

    let numberOfDaysToShow = dayCount >= 28 ? 28 : (dayCount <= 7 ? 7 : dayCount);
    for (let j = numberOfDaysToShow - 1; j >= 0; j -= 1) {
      const date = today.subtract(j, 'day').dayOfYear();
      // const dayName = days[today.subtract(j, 'day').day()];
      const dayName = today.subtract(j, 'day').format("MM/DD");
      // const dayName = days[parsedData.filter(entry => dayjs(entry.timestamp).dayOfYear() >= date));
      
      // const entriesOnDate = parsedData ? parsedData.filter(entry => dayjs.utc(entry.timestamp).local().dayOfYear() === date) : [];
      const entriesOnDate = parsedData ? parsedData.filter(entry => dayjs(entry.timestamp).dayOfYear() === date) : [];

      if (entriesOnDate.length > 0) {
        const dailyArray = [...entriesOnDate.map(entry => entry.feeling)];
        const filtered = dailyArray.filter(n => n != undefined);
        const dailyLow = Math.min(...filtered);
        // const dailyHigh = Math.max(...entriesOnDate.map(entry => entry.feeling));
        dataValues.push(dailyLow);

        let symptoms = {};

        let items = entriesOnDate.filter(e => e.feeling <= 2); //feeling for anything other than good
        items.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key.startsWith("symptom_") && item[key] === true) {
              symptoms[key] = true;
            }
          })
        });

        this.tooltips.push({
          "feeling": feelings.find(f => f.value == dailyLow),
          "symptoms": getSymptomsForSubmission(symptoms)
        });

        backgroudColors.push(colors[dailyLow - 1]);
      }
      else {
        // dataValues.push(dataValues[j + 1]);
        dataValues.push(0);
        this.tooltips.push({});
        backgroudColors.push('');
      }
      dateLabels.push(dayName);
    }


    this.dataToShow = dataValues;

    return {
      labels: dateLabels,
      datasets: [
        {
          backgroundColor: backgroudColors,// this.colorGradient,
          fill: 'start',
          data: dataValues,
        },
      ],
    };
  }

  getLabel(label) {
    const f = feelings.find(f => f.value == label);
    return f ? f.text : '';
  }

  getToolTip(label) {
    let f = feelings.find(f => f.value == label.value).text;
    
    return f;
  }

  getAfterLabel(al){
    const t = this.tooltips[al.index] || null;

    let s = [];
    if (t && t.symptoms && t.symptoms.length > 0) {
      t.symptoms.forEach(symptom => {
        s.push(symptom.translation);
      });
    }

    return s.join(", ");
  }

  getOptions() {
    const minVal = 0;// this.getMinVal();
    const maxVal = 3;// this.getMaxVal();
    return {
      legend: {
        display: false,
      },
      responsive: true,
      maintainAspectRatio: false,
      spanGaps: false,
      tooltips: {
        callbacks: {
          // title: title => this.getTitle(title),
          // afterTitle : at => this.getAfterTitle(at),
          label: label => this.getToolTip(label),
          afterLabel: al => this.getAfterLabel(al)
        }
      },
      scales: {
        yAxes: [
          {
            gridLines: {
              display: false,
            },
            ticks: {
              min: minVal,
              max: maxVal,
              maxTicksLimit: 15,
              stepSize: 1,
              suggestedMin: minVal,
              suggestedMax: maxVal,
              fontFamily: 'Nunito',
              fontSize: window.innerWidth < 720 ? 12 : 14,
              callback: label => this.getLabel(label),
            },
          },
        ],
      },
    };
  }

  render() {
    return html`
      <div class="feeling-chart">
        <canvas id="${this.chartId}"></canvas>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('feeling-chart')) {
  customElements.define('feeling-chart', FeelingChart);
}
