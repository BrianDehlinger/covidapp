/* eslint-disable */
import { LitElement, html } from 'lit-element';
import * as mapboxgl from "mapbox-gl"
import DataEntryService from '../services/data-entry-service.js';
import counties from '../../assets/countrydata/illinois-counties-geo.json';
import DBUtil from '../util/db-util.js';
import Translator from '../util/translator.js';

const colors = [
    '#FFFFFF',
    '#F7F787',
    '#EED322',
    '#E6B71E',
    '#DA9C20',
    '#CA8623',
    '#B86B25',
    '#A25626',
    '#8B4225',
    '#850001'
];

let mapColors = [];

// Index based weight values for feeling
// mood         -- index    -- weight
// sad          --  0       -- 3
// not so good  --  1       -- 2
// happy        --  2       -- 1
const feelingWeight = [3, 2, 1];

export default class IllinoisMap extends LitElement {
    static get properties() {
        return {
            loading: { type: Boolean },
            geojson: { type: Object },
            map: { type: Object },

            stats: { type: Object },
            dataMappedByCountry: { type: Object },
            dataMappedByCoordinates: { type: Object },
        };
    }



    constructor() {
        super();
        this.loading = true;
        this.geoJson = null;
        this.map = null;
        this.stats = null;
        this.totalSubmitters = 0;
        this.totalSubmissions = 0;
        this.countyGeoJson = null;
        this.viewPort = {
            width: 800,
            height: 600,
            latitude: 41.88425,
            longitude: -87.63245,
            zoom: 5
        };
    }

    firstUpdated() {
        this.getStats();
        this.getCounts();

        // Make sure page has loaded before initiating the map.
        // Openstreetmap rendering goes haywire if it's not on screen when it's loaded
        setTimeout(() => {
            this.loading = false;
            this.initMap();
        }, 1500);
    }

    async getStats() {
        this.stats = await DataEntryService.getLocationBasedStats('US');
        const weightRanges = [100, 200, 500, 1000, 2000, 5000, 10000];

        let maxWeight = 0;
        mapColors = [];

        counties.features.forEach((feature) => {
            const codes = feature.properties.ZIPCODES;
            // let feeling = 0;
            let count = 0;
            let weight = 0;

            if (codes && codes.length > 0) {
                codes.forEach((code) => {
                    const sub = this.stats.data.submissions[code];
                    if (sub && DBUtil.length > 0) {
                        sub.forEach(entry => {
                            count += entry.count;
                            // feeling += entry.feeling;
                            weight += entry.count * feelingWeight[entry.feeling - 1]; // feeling start from 0 but weights array is zero based index
                        });
                    }
                });
            }

            feature.properties.SUBMISSIONS = count;
            feature.properties.WEIGHT = weight; // Math.floor(Math.random() * 90 + 1);
            maxWeight = weight > maxWeight ? weight : maxWeight;
        });

        // maxWeight = 20;
        // break maximum weight into 10 equal parts starting from zero so that colors are equally distributes irrespective of range of values
        const finalWeightScale = weightRanges.find(w=>w > maxWeight) || (Math.ceil((maxWeight+1)/10)*10);
        const step = parseInt(finalWeightScale / 10);
        const range = this.getRange(step, finalWeightScale, step);
        for (let i = 0; i < 10; i++) {
            mapColors.push([range[i], colors[i]]);
        }
    }

    async getCounts() {
        const countsRespose = await DataEntryService.getStats('US');
        if (countsRespose && countsRespose.success) {
            this.totalSubmitters = countsRespose.data.submitters.total;
            this.totalSubmissions = countsRespose.data.submissions.total;
        }
    }

    getRange(start, stop, step) {
        const a = [start]; let b = start;
        while (b + step <= stop) {
            a.push(b += step || 1);
        }
        return a;
    }

    async initMap() {
        mapboxgl.accessToken = 'pk.eyJ1Ijoib2NjLWRhdGEiLCJhIjoiY2thMnl3eTA1MDVraTNybzI4Nmlua2hnNCJ9.CTMUeIzLc64xpyjcatnFKQ';

        // create mapbox object
        const map = new mapboxgl.Map({
            container: 'visualization-map-illinois',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-89.004627, 40.487927],
            zoom: 6
        })

        const tooltip = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('load', () => {
            map.addSource('counties', {
                type: 'geojson',
                data: counties
            });

            map.addLayer({
                id: 'counties',
                type: 'line',
                source: 'counties',
                paint: {
                    'line-color': '#000',
                    'line-opacity': 0.7
                }
            })

            map.addLayer({
                id: 'counties-heat',
                type: 'fill',
                source: 'counties',
                paint: {
                    'fill-color': {
                        'property': 'WEIGHT',
                        'stops': mapColors
                    },
                    'fill-opacity': 0.5
                }
            })
        });

        map.on('mousemove', 'counties-heat', (e) => {
            tooltip
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style='font-size:12px;'>
                        <div><b>${e.features[0].properties.COUNTYNAME}</b></div>
                        <div># of Submissions: ${e.features[0].properties.SUBMISSIONS}</div>
                    </div>
                `)
                .addTo(map);
        });

        map.on('mouseleave','counties-heat',(e) => {
            tooltip.remove();
        });
    }

    getSubmissionsInCountry(countryCode) {
        return this.dataMappedByCountry.find(cData => cData.countryCode === countryCode);
    }

    render() {
        return html`
        <div class="map-stats">
            <h1>${Translator.get('stats.stats')}</h1>
            <div class="map-stats-counts">
                ${Translator.get('stats.number_reporting')}: ${this.totalSubmitters}<br />
                ${Translator.get('stats.number_reports')}: ${this.totalSubmissions}
            </div>
        </div>
        <div class="visualization-map-container">
                ${this.loading ? '' : this.getColorRangeElement()}
                
                    <div class="map ${this.loading ? ' map--loading' : ''}" id="visualization-map-illinois">
                    </div>
                
        </div>
    `;
    }

    createRenderRoot() {
        return this;
    }


    getColorRangeElement() {
        return html`
      <div class="color-range-element">
        <h4>${Translator.get('stats.description')}</h4>
      </div>
    `;
    }
}

if (!customElements.get('visualization-map-illinois')) {
    customElements.define('visualization-map-illinois', IllinoisMap);
}
