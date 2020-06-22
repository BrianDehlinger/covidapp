# -*- coding: utf-8 -*-

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import SmallInteger

from covidapp.db.base import Base

from dataclasses import dataclass


@dataclass
class Submission(Base):
    """Single datapoint submitted."""

    __tablename__ = 'submissions'

    feeling = Column(SmallInteger)  # adding new field for feeling

    fever_temp = Column(Float(precision=1))
    symptom_cough = Column(Boolean)
    symptom_difficulty_breathing = Column(Boolean)
    symptom_fever = Column(Boolean)
    symptom_headache = Column(Boolean)
    symptom_chills = Column(Boolean)
    symptom_sore_throat = Column(Boolean)
    symptom_shaking = Column(Boolean)
    symptom_loss_of_taste = Column(Boolean)
    symptom_muscle_pain = Column(Boolean)
    diagnosed_covid19 = Column(Boolean)

    location_country_code = Column(String(2))
    location_postal_code = Column(String(10))

    # Convert to Column(Point) when a custom field type that matches the
    # MariaDB geospatial data type is written
    # See https://docs.sqlalchemy.org/en/13/core/types.html
    location_lng = Column(Integer)
    location_lat = Column(Integer)

    submitter_id = Column(Integer, ForeignKey('submitters.id'))

    def __repr__(self):
        return '<Submission(id={})>'.format(self.id)
