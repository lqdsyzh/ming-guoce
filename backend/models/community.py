from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base


class ForumTopic(enum.Enum):
    GENERAL = "general"
    STUDY_GROUP = "study_group"
    QUESTION = "question"
    RESOURCE = "resource"
    SHOWCASE = "showcase"
    DAILY_CHECK_IN = "daily_check_in"


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    topic = Column(Enum(ForumTopic), nullable=False, default=ForumTopic.GENERAL)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=True)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    comments = relationship("PostComment", back_populates="post", order_by="PostComment.created_at")


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("post_comments.id"), nullable=True)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="comments")


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())