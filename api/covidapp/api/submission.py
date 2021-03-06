# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
from datetime import timezone
import re

from flask import request

from flask_restful import Resource

from covidapp.db import db_session
from covidapp.db.models.submission import Submission
from covidapp.db.models.submitter import Submitter

from flask import Flask
app = Flask('covidapp')

# For debugging:
# from pprint import pprint


class SubmissionResource(Resource):

    def _symptom_fever_history(self, submitter=None):
        history = []
        for s in submitter.submissions:
            history += [{
                'feeling': s.feeling,  # adding feeling for retrieval
                # Time format example: "2020-03-19T22:59:31"
                'timestamp': s.timestamp_modified.isoformat(timespec='seconds'),
                # E.g. 37.5
                'fever_temp': s.fever_temp,
                'symptom_cough': s.symptom_cough,
                'symptom_difficulty_breathing': s.symptom_difficulty_breathing,
                'symptom_fever': s.symptom_fever,
                'symptom_headache': s.symptom_headache,
                'symptom_chills': s.symptom_chills,
                'symptom_sore_throat': s.symptom_sore_throat,
                'symptom_shaking': s.symptom_shaking,
                'symptom_loss_of_taste': s.symptom_loss_of_taste,
                'symptom_muscle_pain': s.symptom_muscle_pain,
                'diagnosed_covid19': s.diagnosed_covid19,
            }]
        return history

    def options(self, **kwargs):
        """Serve basic options response."""
        return {
            'success': True,
            'message': 'This endpoint is input only',
        }

    def post(self, **kwargs):
        """Save new submission.

        Run all validation and checks, and save submission in database.
        """
        # @TODO: Add general POST protection early in the processing to compare
        # IP addresses of submitters and block too frequent use of same IP.

        # Expect JSON payload
        data = request.json

        # Fall back to form data if JSON was None
        if not data:
            data = request.form.to_dict()

        if not data:
            return {
                'success': False,
                'message': 'Empty payload in POST request.'
            }, 400

        # Include external IP in log if exists
        # No need to care about header name case as Flask always normalizes
        # them to the same camel-case forma
        if 'X-Real-Ip' in request.headers:
            data['X-Real-Ip'] = request.headers['X-Real-Ip']
        if 'X-Forwarded-For' in request.headers:
            data['X-Forwarded-For'] = request.headers['X-Forwarded-For']

        app.logger.info('Processing: {}'.format(data))

        # Validate submission
        errors = []

        if not isinstance(data['device_id'], int) and \
           not re.fullmatch(r'[0-9]{1,19}', data['device_id']):
            errors += ('device_id', 'Incorrect form for device identifier')

        # Check boolean values from multiple fields
        boolean_fields = [
            'new_device_id',
            'symptom_cough',
            'symptom_difficulty_breathing',
            'symptom_fever',
            'symptom_headache',
            'symptom_chills',
            'symptom_sore_throat',
            'symptom_shaking',
            'symptom_loss_of_taste',
            'symptom_muscle_pain',
            'diagnosed_covid19',
        ]
        for f in boolean_fields:
            if f not in data:
                # If not set, make it False
                data[f] = False
            elif data[f] is None:
                # If set but None, make False
                data[f] = False
            elif isinstance(data[f], bool):
                # Already True/False, all good
                pass
            elif re.fullmatch(r'true|True|1', data[f]):
                # Convert string to bool
                data[f] = True
            elif re.fullmatch(r'false|False|0', data[f]):
                # Convert string to bool
                data[f] = False
            else:
                # Field was none of the above
                errors += (f, 'Value not true/false')

        if not re.fullmatch(r'[1-3]', data['feeling']):
            errors += ('feeling', 'Incorrect value for feeling')

        if data['birth_year'] is not None:
            if not re.fullmatch(r'[12][90][0-9][0-9]', data['birth_year']):
                errors += ('birth_year', 'Value not a year between 1900 and 2020')

        if data['gender'] is not None:
            if not re.fullmatch(r'[MF]{1}', data['gender']):
                errors += ('gender', 'Value not M or F')

        if not re.fullmatch(r'[A-Z]{2}', data['location_country_code']):
            errors += ('location_country_code', 'Value not two capitals')

        if not re.fullmatch(r'[0-9a-z-A-Z-\. ]{4,10}', data['location_postal_code']):
            errors += ('location_postal_code', 'Incorrect characters or length')

        # Commeting this temporarily as we are not storing lat long anymore
        # Allowed values from -180 to 180 with 2 decimals
        # if not re.fullmatch(r'(-)?[0-9]{1,3}\.[0-9]{2,}', data['location_lng']):
        #     errors += ('location_lng', 'Incorrect form or length')

        # # Allowed values from -90 to 90 with 2 decimals
        # if not re.fullmatch(r'(-)?[0-9]{1,2}\.[0-9]{2,}', data['location_lat']):
        #     errors += ('location_lat', 'Incorrect form or length')

        # Abort if validation failed
        if errors:
            app.logger.warning('Syntax errors: {}'.format(errors))
            return {
                'success': False,
                'message': 'Invalid payload rejected.',
                'data': errors
            }, 400

        # Convert strings into correct Python data types for processing
        device_id = int(data['device_id'])
        # Cut precision to neares decade
        if data['birth_year'] is not None:
            print("data birth year is not none")
            print(data['birth_year'])
            birth_year = round(int(data['birth_year']), -1)
        else:
            birth_year = None

        if data['gender'] is not None:
            gender = str(data['gender'])
        else:
            gender = None

        location_country_code = str(data['location_country_code'])
        location_postal_code = str(data['location_postal_code'])

        # Cut precision to have 3 decimals, not more
        # location_lng = round(float(data['location_lng']), 3)
        # location_lat = round(float(data['location_lat']), 3)
        location_lng = None
        location_lat = None

        # Time 1584649859812 when this was written
        if not 1584000000000 < device_id:
            errors += ('device_id', 'Value not in range')

        if birth_year is not None:
            print('Birth year is not none')
            print(birth_year)
            if not 1900 <= birth_year <= 2020:
                errors += ('birth_year', 'Value not in range')

        feeling = int(data['feeling'])  # setting feeling

        # Convert namespace and ensure boolean
        symptom_cough = bool(data['symptom_cough'])
        symptom_difficulty_breathing = bool(data['symptom_difficulty_breathing'])
        symptom_fever = bool(data['symptom_fever'])
        symptom_headache = bool(data['symptom_headache'])
        symptom_chills = bool(data['symptom_chills'])
        symptom_sore_throat = bool(data['symptom_sore_throat'])
        symptom_shaking = bool(data['symptom_shaking'])
        symptom_loss_of_taste = bool(data['symptom_loss_of_taste'])
        symptom_muscle_pain = bool(data['symptom_muscle_pain'])
        diagnosed_covid19 = bool(data['diagnosed_covid19'])

        if 'fever_temp' in data and data['fever_temp']:
            # Always convert to float if value exists
            try:
                fever_temp = float(data['fever_temp'])
            except ValueError:
                errors += ('fever_temp', 'Form of number incorrect')
            else:
                if not 35.0 <= fever_temp <= 42.0:
                    errors += ('fever_temp', 'Value not in range')
        else:
            fever_temp = None

        # Abort if validation failed
        if errors:
            app.logger.warning('Semantic errors: {}'.format(errors))
            return {
                'success': False,
                'message': 'Invalid values rejected.',
                'data': errors
            }, 400

        # Get submitter if device_id already exists
        submitter = db_session.query(Submitter).filter(
            Submitter.device_id == device_id).one_or_none()

        new_device_id = bool(data['new_device_id'])
        # Get UTC
        created_date = datetime.fromtimestamp(data['timestamp'], tz=timezone.utc)
        app.logger.info('Time: {}'.format(created_date))

        # Create a new submitter if device_id is new
        if submitter is None:
            submitter = Submitter(
                device_id=device_id,
                birth_year=birth_year,
                gender=gender)
        elif new_device_id is True:
            # Submitter exists, but claims to be new. Reject and ask to retry
            return {
                'success': False,
                'message': 'Device ID exists, regenerate and retry.'
            }, 409

        elif len(submitter.submissions) > 0:
            # For existing submitter, check when was the last data received
            last_submission = submitter.submissions[-1]

            earliest_next_submission_time = \
                last_submission.timestamp_modified + timedelta(hours=1)

            if earliest_next_submission_time > datetime.now():
                app.logger.warning(
                    'Rejected too new submission: {}'.format(data))
                return {
                    'success': False,
                    'message': 'Do not submit new temp before {}'.format(
                        earliest_next_submission_time.isoformat(
                            timespec='seconds')),
                    'data': {'history': self._symptom_fever_history(submitter)}
                }

            # Update birth year and gender
            if submitter.birth_year != birth_year:
                submitter.birth_year = birth_year
                app.logger.warning(
                    f'Submitter {device_id} changed birth year from '
                    f'{submitter.birth_year} to {birth_year}')

            if submitter.gender != gender:
                submitter.gender = gender
                app.logger.warning(
                    f'Submitter {device_id} changed gender from '
                    f'{submitter.gender} to {gender}')

        else:
            app.logger.warning(
                f'Submitter {device_id} existed but had no previous '
                f'submissions.')

        # Create new submission
        submission = Submission(
            feeling=feeling,
            fever_temp=fever_temp,
            symptom_cough=symptom_cough,
            symptom_difficulty_breathing=symptom_difficulty_breathing,
            symptom_fever=symptom_fever,
            symptom_headache=symptom_headache,
            symptom_chills=symptom_chills,
            symptom_sore_throat=symptom_sore_throat,
            symptom_shaking=symptom_shaking,
            symptom_loss_of_taste=symptom_loss_of_taste,
            symptom_muscle_pain=symptom_muscle_pain,
            diagnosed_covid19=diagnosed_covid19,
            location_country_code=location_country_code,
            location_postal_code=location_postal_code,
            location_lng=location_lng,
            location_lat=location_lat,
            timestamp_created=created_date,
            timestamp_modified=created_date
        )

        # Add new submission for submitter
        submitter.submissions += [submission]

        # Mark submitter to be added or updated. Since the submission belongs
        # to it, there it no need to add the submission separately.
        db_session.add(submitter)

        # Commit automatically reloads the objects from the database, so after
        # this step the submitter object will include an id and the submission
        # will include timestamps.
        db_session.commit()

        history = self._symptom_fever_history(submitter)

        saved_data = {
            'device_id': device_id,
            'feeling': 'feeling',  # adding to response data
            'fever_temp': fever_temp,
            'symptom_cough': symptom_cough,
            'symptom_difficulty_breathing': symptom_difficulty_breathing,
            'symptom_fever': symptom_fever,
            'symptom_chills': symptom_chills,
            'symptom_sore_throat': symptom_sore_throat,
            'symptom_shaking': symptom_shaking,
            'symptom_loss_of_taste': symptom_loss_of_taste,
            'symptom_muscle_pain': symptom_muscle_pain,
            'diagnosed_covid19': diagnosed_covid19,
            'birth_year': birth_year,
            'location_country_code': location_country_code,
            'location_postal_code': location_postal_code,
            'location_lng': location_lng,
            'location_lat': location_lat,
            'history': history
        }
        return {
            'success': True,
            'message': 'Submission received.',
            'data': saved_data
        }
