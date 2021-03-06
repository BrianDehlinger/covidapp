/* eslint-disable */
import countryList from '../../assets/countrydata/country-data.json';

export default class GeolocatorService {
  static async getGeoCodingInfo(lat, lng) {
    return fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?result_type=postal_code|locality&language=EN&latlng=${lat},${lng}&key=${apiKey}`,
    )
      .then(res => res.json())
      .then(res => GeolocatorService.parseResult(res))
      .catch(() => GeolocatorService.returnErrorMessage());
  }

  static async getGeoCodingInfoByPostalCodeAndCountry(postalCode, country) {
    return fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?result_type=postal_code|locality&components=postal_code:${postalCode}|country:${country}&language=EN&key=${apiKey}`,
    )
      .then(res => res.json())
      .then(res => GeolocatorService.parseResult(res))
      .catch(() => GeolocatorService.returnErrorMessage());
  }

  static parseResult(res) {
    if (res.status !== 'OK' || res.results.length < 1) {
      return GeolocatorService.returnErrorMessage();
    }

    const firstResult = res.results[0];
    const addressComponents = [];
    res.results.forEach((result) => {
      if (result["address_components"])
        addressComponents.push(...result["address_components"]);
    });

    //const addressComponents = firstResult.address_components;
    // const postal = addressComponents.find(a => a.types.indexOf('postal_code') !== -1) || {};
    // const city = GeolocatorService.findCityFromAddressComponents(addressComponents);
    // const country = addressComponents.find(a => a.types.indexOf('country') !== -1) || {};

    const parsedAddress = GeolocatorService.parseAddressComponents(addressComponents);
    return {
      success: true,
      postal_code: parsedAddress["postal_code"] ? parsedAddress["postal_code"].long_name : "",
      city: parsedAddress["city"] ? parsedAddress["city"].long_name : "",
      country: parsedAddress["country"] ? parsedAddress["country"].long_name : "United States",
      countryShort: parsedAddress["country"] ? parsedAddress["country"].short_name : "US",
      coords: firstResult.geometry.location,
    };
  }

  static parseAddressComponents(addressComponents) {
    function findComponent(type) {
      return addressComponents.find(a => a.types.indexOf(type) !== -1);
    }


    return {
      "postal_code": findComponent("postal_code"),
      "city": findComponent("locality"),
      "country": findComponent("country")
    };
    // const componentSearchOrder = [
    //   'locality',
    //   'postal_town',
    //   'administrative_area_level_1',
    //   'administrative_area_level_2',
    //   'administrative_area_level_3',
    // ];

    // const found = componentSearchOrder.map(findComponent).find(i => !!i);
    // return found || {};
  }

  /**
   * Country data from http://vocab.nic.in/rest.php/country/json
   */
  static getCountryList() {
    return countryList.countries.sort((a, b) => {
      const aCountryName = a.country.country_name;
      const bCountryName = b.country.country_name;
      if (aCountryName > bCountryName) {
        return 1;
      }
      if (bCountryName > aCountryName) {
        return -1;
      }
      return 0;
    });
  }

  
  static returnErrorMessage() {
    return { success: false, message: 'COULD_NOT_LOCATE' };
  }

  static getCoords() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        success => {
          resolve(success.coords);
        },
        error => {
          reject(error);
        },
      );
    });
  }
}
