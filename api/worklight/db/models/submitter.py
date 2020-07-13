# -*- coding: utf-8 -*-

from sqlalchemy import BigInteger
from sqlalchemy import Column
from sqlalchemy import SmallInteger
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship

from worklight.db.base import Base


class Submitter(Base):
    """Individul submitting data."""

    __tablename__ = 'submitters'

    # Unique identifier created with JavaScript Date().getTime()
    # Assumed to stay the same across all submissions
    device_id = Column(BigInteger, unique=True)

    submissions = relationship('Submission')

    def __repr__(self):
        return '<Submitter(id={})>'.format(self.id)
