
const url = 'https://data.cityofchicago.org/resource/yhhz-zm2v.json';

export default class ChicagoDataService {

  static async getChicagoData() {
    return fetch(`${url}`)
      .then(res => res.json())
      .then(res => ChicagoDataService.parseResult(res))
      .catch(() => ChicagoDataService.returnErrorMessage());
  }

  static parseResult(res) {
    if(res.length < 1) {
      return ChicagoDataService.returnErrorMessage();
    }

    let latest = 0;
    let parsed = {};
    let asOf = 0;

    res.forEach((row) => {
      if (row.week_number >= latest && row.case_rate_weekly > 0) {
        if (row.week_number > latest) {
          latest = row.week_number;
          parsed = {};
        }
        parsed[row.zip_code] = {};
        parsed[row.zip_code]["cases"]     = parseFloat(row.case_rate_weekly);
        parsed[row.zip_code]["tests"]     = parseFloat(row.test_rate_weekly);
        parsed[row.zip_code]["positives"] = parseFloat(row.percent_tested_positive_weekly);
        parsed[row.zip_code]["deaths"]    = parseFloat(row.death_rate_weekly);

        asOf = row.week_end;
      }
    });
   parsed.asOf = asOf;
   return(parsed);
  }

  static returnErrorMessage() {
    return { success: false, message: 'COULD_NOT_LOAD_DATA' };
  }
}
