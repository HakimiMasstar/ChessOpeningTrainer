from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)

    learned_openings = relationship("LearnedOpening", back_populates="user")
    sessions = relationship("Session", back_populates="user")


class Opening(Base):
    __tablename__ = "openings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="white") # 'white' or 'black'
    pgn_path = Column(String)

    learned_by = relationship("LearnedOpening", back_populates="opening")


class LearnedOpening(Base):
    __tablename__ = "learned_openings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    opening_id = Column(Integer, ForeignKey("openings.id"), primary_key=True)
    learned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="learned_openings")
    opening = relationship("Opening", back_populates="learned_by")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
