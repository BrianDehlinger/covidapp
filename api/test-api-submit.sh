#!/bin/bash
set -e
#
# This runs dummy API queries (using curl) against the API server.
#
# The script is hard-coded to only run against a local development environment.
API_URL="http://localhost:9000"

function api_test(){
  echo "-----------------------------------------------------------------------"
  echo "==> Request:"
  echo "$1"
  echo "<== Response:"
  curl -iLsS -X POST -H "Content-Type: application/json" -d "$1" "$API_URL/api/v0/submit" > /tmp/response
  cat /tmp/response
  if ! grep --quiet "200 OK" /tmp/response
  then
    echo "^ Error, fix it!"
    exit 1
  fi
}

# No fever and fever_temp null
# No symptoms or diagnosis submitted
api_test '{
  "device_id":"1584694478111",
  "symptom_fever":false,
  "feeling":"2",
  "symptom_cough":true,
  "symptom_headache":true,
  "birth_year":"1990",
  "gender":"F",
  "location_country_code":"US",
  "location_postal_code":"60605",
  "location_lng":null,
  "location_lat":null
}'

# No fever and fever_temp missing
# Symptoms and diagnosis all null
api_test '{
  "device_id":"1584694478222",
  "feeling":"0",
  "symptom_cough":null,
  "symptom_difficulty_breathing":null,
  "symptom_fever":null,
  "symptom_headache":null,
  "symptom_chills":null,
  "symptom_sore_throat":null,
  "symptom_shaking":null,
  "symptom_loss_of_taste":null,
  "symptom_muscle_pain":null,
  "diagnosed_covid19":null,
  "birth_year":"2001",
  "gender":"F",
  "location_country_code":"SE",
  "location_postal_code":"7017710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'

# Fever
# Symptoms and diagnosis all true
api_test '{
  "device_id":"1584694478333",
  "fever_temp":"38.0",
  "feeling":"2",
  "symptom_cough":true,
  "symptom_difficulty_breathing":true,
  "symptom_fever":true,
  "symptom_headache":true,
  "symptom_chills":true,
  "symptom_sore_throat":true,
  "symptom_shaking":true,
  "symptom_loss_of_taste":true,
  "symptom_muscle_pain":true,
  "diagnosed_covid19":true,
  "birth_year":"1996",
  "gender":"M",
  "location_country_code":"FI",
  "location_postal_code":"20100",
  "location_lng":"22.123",
  "location_lat":"60.123"
}'

# Location is float with extra decimals
# Symptoms and diagnosis all false
api_test '{
  "device_id":"1584694478444",
  "feeling":"0",
  "symptom_cough":false,
  "symptom_difficulty_breathing":false,
  "symptom_fever":false,
  "symptom_headache":false,
  "symptom_chills":false,
  "symptom_sore_throat":false,
  "symptom_shaking":false,
  "symptom_loss_of_taste":false,
  "symptom_muscle_pain":false,
  "diagnosed_covid19":false,
  "birth_year":"2001",
  "gender":"M",
  "location_country_code":"US",
  "location_postal_code":"70-17710",
  "location_lng":"22.11",
  "location_lat":"60.00"
}'

# Location Ireland, different coordinates and postal code
api_test '{
  "device_id":"1584694478555",
  "fever_temp":"37.0",
  "birth_year":"1982",
  "gender":"M",
  "feeling":"1",
  "symptom_cough":true,
  "symptom_difficulty_breathing":false,
  "symptom_fever":false,
  "symptom_headache":false,
  "symptom_chills":false,
  "symptom_sore_throat":false,
  "symptom_shaking":false,
  "symptom_loss_of_taste":false,
  "symptom_muscle_pain":true,
  "diagnosed_covid19":true,
  "location_country_code":"IE",
  "location_postal_code":"H91 E2K3",
  "location_lng":"-9.23",
  "location_lat":"53.38"
}'

# Yet another variation of the JSON payload general format
api_test '{
  "device_id": "1584694478666",
  "fever_temp": "37.3",
  "birth_year": "1983",
  "gender": "M",
  "location_country_code": "FI",
  "location_postal_code": "33100",
  "location_lng": "23.7800000",
  "location_lat": "61.4900000",
  "feeling":"0",
  "symptom_cough": false,
  "symptom_difficulty_breathing": false,
  "symptom_fever": null,
  "symptom_headache": null,
  "symptom_chills": null,
  "symptom_sore_throat": false,
  "symptom_shaking": false,
  "symptom_loss_of_taste": false,
  "symptom_muscle_pain": false,
  "diagnosed_covid19": false
}'

# Different headers et al
curl "$API_URL/api/v0/submit" \
  -H 'x-real-IP: 123.123.123.123' -H 'X-Forwarded-For: 123.123.123.123' \
  -H 'Connection: keep-alive' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' \
  -H 'Sec-Fetch-Dest: empty' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36' \
  -H 'DNT: 1' -H 'Content-Type: application/json' -H 'Accept: */*' \
  -H "Origin: $API_URL" -H 'Sec-Fetch-Site: same-origin' -H 'Sec-Fetch-Mode: cors' \
  -H "Referer: $API_URL" -H 'Accept-Language: en-GB,en;q=0.9,sv;q=0.8,fi;q=0.7,en-US;q=0.6' \
  --data-binary '{
    "device_id":1584694478666,
    "fever_temp":"39.3",
    "birth_year":"1983",
    "gender":"M",
    "location_country_code":"FI",
    "location_postal_code":"02700",
    "location_lng":"24.71",
    "location_lat":"60.21",
    "feeling":"1",
    "symptom_cough":true,
    "symptom_difficulty_breathing":true,
    "symptom_fever":null,
    "symptom_headache":null,
    "symptom_chills":null,
    "symptom_sore_throat":false,
    "symptom_shaking":false,
    "symptom_loss_of_taste":false,
    "symptom_muscle_pain":false,
    "diagnosed_covid19":false
  }' --compressed

# Ensure one submission is always a new device
NEW_DEVICE_ID="$(date +%s)$(shuf -i 100-999 -n 1)"
api_test '{
  "device_id":"'"$NEW_DEVICE_ID"'",
  "feeling":"0",
  "symptom_cough":false,
  "symptom_difficulty_breathing":false,
  "symptom_fever":false,
  "symptom_headache":false,
  "symptom_chills":false,
  "symptom_sore_throat":false,
  "symptom_shaking":false,
  "symptom_loss_of_taste":false,
  "symptom_muscle_pain":false,
  "diagnosed_covid19":false,
  "birth_year":"2001",
  "gender":"M",
  "location_country_code":"US",
  "location_postal_code":"70-17710",
  "location_lng":"22.28",
  "location_lat":"60.45"
}'
