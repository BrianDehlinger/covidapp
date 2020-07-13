# -*- coding: utf-8 -*-

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import SmallInteger

from worklight.db.base import Base

from dataclasses import dataclass


@dataclass
class Submission(Base):
    """Single datapoint submitted."""

    __tablename__ = 'submissions'

    feeling = Column(SmallInteger) 

    symptom_cough = Column(Boolean)
    symptom_difficulty_breathing = Column(Boolean)
    symptom_fever = Column(Boolean)
    symptom_headache = Column(Boolean)
    symptom_chills = Column(Boolean)
    symptom_sore_throat = Column(Boolean)
    symptom_nausea = Column(Boolean)
    symptom_loss_of_taste = Column(Boolean)
    symptom_muscle_pain = Column(Boolean)
    diagnosed_covid19 = Column(Boolean)

    visited_bar = Column(Boolean)
    visited_restaurant = Column(Boolean)
    visited_concert = Column(Boolean)
    visited_nightclub = Column(Boolean)
    visited_church = Column(Boolean)
    visited_gathering = Column(Boolean)

    location_address = Column(String(80))
    location_floor = Column(SmallInteger)

    submitter_id = Column(Integer, ForeignKey('submitters.id'))

    def __repr__(self):
        return '<Submission(id={})>'.format(self.id)
