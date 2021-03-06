# Covidapp back-end (API)

The back-end server is a simple Python Flask app with MariaDB database for
storage. The back-end exposes an API at `https://covidapp.occ-pla.net/api/`
which the front-end communicates with JSON calls.

## Development with Docker

To participate in the back-end development, you need Python skills and basic
understanding of HTTP and JSON.

To spin up a local development environment, simply run `docker-compose up
--build`. The window will keep displaying the logs from the environments.

To abort, press Ctrl+C. If you want to clear away the whole database volume
before a fresh start, run `docker-compose down --remove-orphans --volumes`.

When the development server is running, you can browse it at
http://localhost:9000 or more importantly, run `curl` or other requests against
the API.

To access the MariaDB shell, simply run
`docker exec -it covidapp_database_1 stoplight -prootpass temppass`.

If you during testing want to empty either of the database tables, then run
`TRUNCATE submissions;`. To completely wipe out existing database, run the above
cycle to remove Docker volumes and restart everything.

## Production

1. Install and start a MariaDB server, with a custom user for the app and a
   database called 'covidapp'.

2. Install and configure a Nginx instance that handles HTTPS encryption,
   connection pooling, caching etc for backend on named UNIX socket.

3. Start this API server by building a Docker container out of the sources and running it with:

## API endpoints and sample requests

Example request as JSON object (**TO BE UPDATED**):

```
curl -iLsS \
  -X POST \
  -H "Content-Type: application/json" -d '
  {
    "device_id":"1584694478571",
    "symptom_fever":true,
    "fever_temp":"38.0",
    "birth_year":"1996",
    "gender":"M",
    "location_country_code":"FI",
    "location_postal_code":"20100",
    "location_lng":"22.28",
    "location_lat":"60.45"
  } ' \
  http://localhost:9000/api/v0/submit
```

Example request as plain form data:
```
$ curl -iLsS \
    -X POST \
    --data device_id=1584605243123 \
    --data symptom_fever=true \
    --data fever_temp=37.1 \
    --data birth_year=1983 \
    --data gender=M \
    --data location_country_code=FI \
    --data location_postal_code=33100 \
    --data location_lng=61.49 \
    --data location_lat=23.76 \
    http://localhost:9000/api/v0/submit
```

Example responses:
```
{
    "success": true,
    "message": "Submission received.",
    "data": {
        "device_id": 1584605243333,
        "symptom_fever": true,
        "fever_temp": 37.0,
        "birth_year": 1983,
        "location_country_code": "FI",
        "location_postal_code": "33100",
        "location_lng": 61.49,
        "location_lat": 23.76,
        "history": [
            [
                "2020-03-19T23:36:03",
                true,
                37.0
            ]
        ]
    }
}
```

```
{
    "success": false,
    "message": "Do not submit new temp before 2020-03-20T11:36:03",
    "data": {
        "history": [
            [
                "2020-03-19T23:36:03",
                true,
                37.0
            ]
        ]
    }
}
```

```
{
    "success": false,
    "message": "Invalid payload rejected.",
    "data": [
        "gender",
        "Value not M or F"
    ]
}
```

## Data model (**TO BE UPDATED**)

Defined via Python SQLAlchemy that translate into MariaDB tables;
```
MariaDB [fevermap]> describe submitters;
+--------------------+---------------+------+-----+---------+----------------+
| Field              | Type          | Null | Key | Default | Extra          |
+--------------------+---------------+------+-----+---------+----------------+
| id                 | int(11)       | NO   | PRI | NULL    | auto_increment |
| timestamp_created  | datetime      | NO   |     | NULL    |                |
| timestamp_modified | datetime      | NO   |     | NULL    |                |
| device_id          | bigint(20)    | YES  | UNI | NULL    |                |
| birth_year         | smallint(6)   | YES  |     | NULL    |                |
| gender             | enum('M','F') | YES  |     | NULL    |                |
+--------------------+---------------+------+-----+---------+----------------+

MariaDB [fevermap]> select * from submitters;
+----+---------------------+---------------------+---------------+------------+--------+
| id | timestamp_created   | timestamp_modified  | device_id     | birth_year | gender |
+----+---------------------+---------------------+---------------+------------+--------+
|  1 | 2020-03-19 23:36:03 | 2020-03-19 23:36:03 | 1584605243333 |       1983 | M      |
+----+---------------------+---------------------+---------------+------------+--------+

MariaDB [fevermap]> describe submissions;
+-----------------------------+-------------+------+-----+---------+----------------+
| Field                       | Type        | Null | Key | Default | Extra          |
+-----------------------------+-------------+------+-----+---------+----------------+
| id                          | int(11)     | NO   | PRI | NULL    | auto_increment |
| timestamp_created           | datetime    | NO   |     | NULL    |                |
| timestamp_modified          | datetime    | NO   |     | NULL    |                |
| symptom_fever                | tinyint(1)  | YES  |     | NULL    |                |
| fever_temp                  | float       | YES  |     | NULL    |                |
<<<<<<< Updated upstream
| symptom_fever               | tinyint(1)  | YES  |     | NULL    |                |
| symptom_difficulty_breathing | tinyint(1)  | YES  |     | NULL    |                |
=======
| symptom_difficulty_breathing | tinyint(1)  | YES  |     | NULL    |                |
>>>>>>> Stashed changes
| symptom_cough               | tinyint(1)  | YES  |     | NULL    |                |
| symptom_sore_throat         | tinyint(1)  | YES  |     | NULL    |                |
| symptom_muscle_pain         | tinyint(1)  | YES  |     | NULL    |                |
| diagnosed_covid19           | tinyint(1)  | YES  |     | NULL    |                |
| location_country_code       | varchar(2)  | YES  |     | NULL    |                |
| location_postal_code        | varchar(10) | YES  |     | NULL    |                |
| location_lng                | int(11)     | YES  |     | NULL    |                |
| location_lat                | int(11)     | YES  |     | NULL    |                |
| submitter_id                | int(11)     | YES  | MUL | NULL    |                |
+-----------------------------+-------------+------+-----+---------+----------------+

MariaDB [fevermap]> select * from submissions;
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+
<<<<<<< Updated upstream
| id      | timestamp_created   | timestamp_modified  | fever_status | fever_temp | symptom_fever | symptom_difficulty_breathing | symptom_cough | symptom_sore_throat | symptom_muscle_pain | diagnosed_covid19 | location_country_code | location_postal_code | location_lng | location_lat | submitter_id |
=======
| id      | timestamp_created   | timestamp_modified  | symptom_fever | fever_temp | symptom_difficulty_breathing | symptom_cough | symptom_sore_throat | symptom_muscle_pain | diagnosed_covid19 | location_country_code | location_postal_code | location_lng | location_lat | submitter_id |
>>>>>>> Stashed changes
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+
| 3937597 | 2020-04-13 07:18:45 | 2020-04-13 07:18:45 |            0 |       NULL | NULL |                        NULL |          NULL |                NULL |                NULL |                 0 | US                    | 70-17710             |           22 |           60 |       187580 |
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+

MariaDB [fevermap]> SELECT submissions.timestamp_created,symptom_fever,fever_temp,diagnosed_covid19,location_country_code,location_postal_code,location_lng,location_lat,submitter_id,device_id,birth_year,gender FROM submissions LEFT JOIN submitters ON submissions.submitter_id=submitters.id;
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
| timestamp_created   | symptom_fever | fever_temp | diagnosed_covid19 | location_country_code | location_postal_code | location_lng | location_lat | submitter_id | device_id     | birth_year | gender |
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
| 2020-04-16 16:12:14 |            0 |       NULL |                 0 | FI                    | 20100                |           22 |           60 |            1 | 1584694478111 |       2000 | F      |
| 2020-04-16 16:12:14 |            0 |       NULL |                 0 | SE                    | 7017710              |           22 |           60 |            2 | 1584694478222 |       2000 | F      |
| 2020-04-16 16:12:15 |            1 |         38 |                 1 | FI                    | 20100                |           22 |           60 |            3 | 1584694478333 |       2000 | M      |
| 2020-04-16 16:12:15 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            4 | 1584694478444 |       2000 | M      |
| 2020-04-16 16:12:15 |            0 |         37 |                 1 | IE                    | H91 E2K3             |           -9 |           53 |            5 | 1584694478555 |       1980 | M      |
| 2020-04-16 16:12:15 |            0 |       37.3 |                 0 | FI                    | 33100                |           24 |           61 |            6 | 1584694478666 |       1980 | M      |
| 2020-04-16 16:12:15 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            7 | 1587053535437 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | FI                    | 20100                |           22 |           60 |            1 | 1584694478111 |       2000 | F      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | SE                    | 7017710              |           22 |           60 |            2 | 1584694478222 |       2000 | F      |
| 2020-04-19 11:08:33 |            1 |         38 |                 1 | FI                    | 20100                |           22 |           60 |            3 | 1584694478333 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            4 | 1584694478444 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |         37 |                 1 | IE                    | H91 E2K3             |           -9 |           53 |            5 | 1584694478555 |       1980 | M      |
| 2020-04-19 11:08:33 |            0 |       37.3 |                 0 | FI                    | 33100                |           24 |           61 |            6 | 1584694478666 |       1980 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            8 | 1587294513836 |       2000 | M      |
| 2020-04-19 11:08:40 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            9 | 1587294520558 |       2000 | M      |
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
