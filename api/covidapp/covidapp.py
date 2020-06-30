# -*- coding: utf-8 -*-

from flask import Flask

from covidapp.api import v0_blueprint
from covidapp.db.base import Base  # noqa F401
from covidapp.db import db_session
from covidapp.db import init_engine
from covidapp.views.ping import ping_blueprint
from covidapp import __appname__
from covidapp import __version__

import sqlalchemy.exc
import time
import os


def create_app():
    app = Flask('covidapp', instance_relative_config=True)

    # Accept both '/abc' and '/abc/'
    app.url_map.strict_slashes = False

    app.logger.info("Running app '{}' in mode '{}'".format(
        __appname__, app.env))

    # Get database credentials from env or use default values
    engine = init_engine(
        os.environ.get(
            'STOPLIGHT_DATABASE_URI',
            "mysql://stoplight:temppass@database/covidapp?charset=utf8mb4"))

    while True:
        try:
            # Create all tables (automatically skips already existing)
            Base.metadata.create_all(engine)
            break
        except sqlalchemy.exc.OperationalError as error:
            app.logger.warning(
                "Database connection failed due to: {}".format(error))
            app.logger.warning("Trying again...")
            time.sleep(3)

    app.register_blueprint(v0_blueprint, url_prefix='/api/v0')
    app.register_blueprint(ping_blueprint)

    # Temporairly allow all access also in production
    if True or app.env == 'development':
        @app.after_request
        def allow_cors_in_dev(resp):
            """Allow full CORS access in development environment.

            Without this, the browser would deny the front-end JavaScript code
            running on localhost:6006 from doing API requests to localhost:9000.
            """
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Headers'] = '*'
            return resp

    @app.context_processor
    def inject_app_details():
        details = {
            'appname': __appname__,
            'version': __version__,
        }
        return details

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app
