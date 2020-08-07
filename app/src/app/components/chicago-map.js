/* eslint-disable */
import { LitElement, html } from 'lit-element';
import * as mapboxgl from "mapbox-gl"
import dayjs from 'dayjs';
import ChicagoDataService from '../services/chicago-data-service.js';
import zipcodes from '../../assets/countrydata/chicago-zipcodes-geo.json';
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

export default class ChicagoMap extends LitElement {
    static get properties() {
        return {
            loading: { type: Boolean },
            geojson: { type: Object },
            map: { type: Object },

            stats: { type: Object },
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
        //this.getCounts();

        // Make sure page has loaded before initiating the map.
        // Openstreetmap rendering goes haywire if it's not on screen when it's loaded
        setTimeout(() => {
            this.loading = false;
            this.initMap();
        }, 1500);
    }

    async getStats() {
        this.stats = await ChicagoDataService.getChicagoData();
        this.totalSubmitters = dayjs(this.stats['asOf']).format('MMMM D');
        const weightRanges = [1, 10, 20, 50, 100, 200, 300, 400, 500];

        let maxWeight = 0;
        mapColors = [];

        zipcodes.features.forEach((feature) => {
            const code = feature.properties.zip;
            let cases     = -1;
            let tests     = 0;
            let positives = 0;
            let deaths    = 0;
            
            if (code && this.stats[code]) {
              cases = parseFloat(this.stats[code]["cases"]);
              tests = parseFloat(this.stats[code]["tests"]);
              positives = parseFloat(this.stats[code]["positives"]) * 100;
              deaths = parseFloat(this.stats[code]["deaths"]);
            }

            feature.properties.CASES     = cases;
            feature.properties.TESTS     = tests; 
            feature.properties.POSITIVES = positives.toPrecision(2) + "%"; 
            feature.properties.DEATHS    = deaths; 
            maxWeight = cases > maxWeight ? cases : maxWeight;
        });

        // break maximum weight into 10 equal parts starting from 
        // zero so that colors are equally distributed

        const finalWeightScale = weightRanges.find(w=>w > maxWeight) || (Math.ceil((maxWeight+1)/10)*10);
        const step = parseInt(finalWeightScale / 10);
        const range = this.getRange(step, finalWeightScale, step);

        for (let i = 0; i < 10; i++) {
            mapColors.push([range[i], colors[i]]);
        }
    }

    async getCounts() {
        this.totalSubmitters = this.stats.asOf
        this.totalSubmissions = 0
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
            container: 'visualization-map-chicago',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-87.6298, 41.87891],
            zoom: 9
        })

        const tooltip = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('load', () => {
            map.addSource('zipcodes', {
                type: 'geojson',
                data: zipcodes
            });

            map.addLayer({
                id: 'zipcodes',
                type: 'line',
                source: 'zipcodes',
                paint: {
                    'line-color': '#000',
                    'line-opacity': 0.7
                }
            })

            map.addLayer({
                id: 'zipcodes-heat',
                type: 'fill',
                source: 'zipcodes',
                paint: {
                    'fill-color': {
                        'property': 'CASES',
                        'stops': mapColors
                    },
                    'fill-opacity': 0.5
                }
            })
        });

        map.on('mousemove', 'zipcodes-heat', (e) => {
            tooltip
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style='font-size:12px;'>
                        <div>
                            <b>Zip Code: ${e.features[0].properties.zip}</b>
                        </div>  
                            ${e.features[0].properties.CASES >= 0 
                             ? `
                             <div>case rate: ${e.features[0].properties.CASES}</div>
                             <div>testing rate: ${e.features[0].properties.TESTS}</div>
                             <div>positive rate: ${e.features[0].properties.POSITIVES}</div>
                             <div>death rate: ${e.features[0].properties.DEATHS}</div>
                             ` : '<div>no data</div>'
                             }
                    </div>
                `)
                .addTo(map);
        });

        map.on('mouseleave','zipcodes-heat',(e) => {
            tooltip.remove();
        });
    }


    render() {
        return html`
        <div class="map-stats">
            <h1>${Translator.get('stats.stats')}</h1>
            <div class="map-stats-counts">
                Week ending: ${this.totalSubmitters}<br />
            </div>
        </div>
        <div class="visualization-map-container">
                ${this.loading ? '' : this.getColorRangeElement()}
                
                    <div class="map ${this.loading ? ' map--loading' : ''}" id="visualization-map-chicago">
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

if (!customElements.get('visualization-map-chicago')) {
    customElements.define('visualization-map-chicago', ChicagoMap);
}
