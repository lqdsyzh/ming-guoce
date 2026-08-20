from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional

from database import get_db
from models.community import Post, PostComment, PostLike, ForumTopic
from models.user import User
from routers.auth import get_current_user
from schemas.schemas import (
    PostCreate, PostResponse, CommentCreate, CommentResponse,
)

router = APIRouter(prefix="/api/community", tags=["community"])


@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    topic: Optional[str] = None,
    language_id: Optional[int] = None,
    sort: str = "latest",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=50),
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Post)

    if topic:
        try:
            query = query.filter(Post.topic == ForumTopic[topic.upper()])
        except KeyError:
            pass
    if language_id:
        query = query.filter(Post.language_id == language_id)

    if sort == "hot":
        query = query.order_by(desc(Post.like_count), desc(Post.created_at))
    else:
        query = query.order_by(desc(Post.is_pinned), desc(Post.created_at))

    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    # Get user likes
    liked_post_ids = set()
    if user:
        likes = db.query(PostLike).filter(
            PostLike.user_id == user.id,
            PostLike.post_id.in_([p.id for p in posts]),
        ).all()
        liked_post_ids = {l.post_id for l in likes}

    result = []
    for p in posts:
        author = db.query(User).filter(User.id == p.user_id).first()
        result.append(PostResponse(
            id=p.id, user_id=p.user_id, title=p.title, content=p.content,
            topic=p.topic, language_id=p.language_id,
            view_count=p.view_count, like_count=p.like_count,
            comment_count=p.comment_count, is_pinned=p.is_pinned,
            author_name=author.nickname or author.username if author else "",
            author_avatar=author.avatar_url if author else "",
            created_at=p.created_at,
            is_liked=p.id in liked_post_ids,
        ))
    return result


@router.post("/posts", response_model=PostResponse)
def create_post(
    data: PostCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = Post(
        user_id=user.id, title=data.title, content=data.content,
        topic=data.topic, language_id=data.language_id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return PostResponse(
        id=post.id, user_id=post.user_id, title=post.title,
        content=post.content, topic=post.topic, language_id=post.language_id,
        view_count=0, like_count=0, comment_count=0, is_pinned=False,
        author_name=user.nickname or user.username,
        author_avatar=user.avatar_url,
        created_at=post.created_at,
    )


@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    # Increment view count
    post.view_count += 1
    db.commit()

    author = db.query(User).filter(User.id == post.user_id).first()

    is_liked = False
    if user:
        like = db.query(PostLike).filter(
            PostLike.post_id == post_id, PostLike.user_id == user.id
        ).first()
        is_liked = like is not None

    return PostResponse(
        id=post.id, user_id=post.user_id, title=post.title,
        content=post.content, topic=post.topic, language_id=post.language_id,
        view_count=post.view_count, like_count=post.like_count,
        comment_count=post.comment_count, is_pinned=post.is_pinned,
        author_name=author.nickname or author.username if author else "",
        author_avatar=author.avatar_url if author else "",
        created_at=post.created_at, is_liked=is_liked,
    )


@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id, PostLike.user_id == user.id
    ).first()

    if existing:
        db.delete(existing)
        post.like_count = max(0, post.like_count - 1)
        db.commit()
        return {"liked": False, "like_count": post.like_count}

    like = PostLike(post_id=post_id, user_id=user.id)
    db.add(like)
    post.like_count += 1
    db.commit()
    return {"liked": True, "like_count": post.like_count}


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    comments = db.query(PostComment).filter(
        PostComment.post_id == post_id,
    ).order_by(PostComment.created_at).all()

    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.user_id).first()
        result.append(CommentResponse(
            id=c.id, post_id=c.post_id, user_id=c.user_id,
            content=c.content, parent_id=c.parent_id,
            like_count=c.like_count,
            author_name=author.nickname or author.username if author else "",
            author_avatar=author.avatar_url if author else "",
            created_at=c.created_at,
        ))
    return result


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    comment = PostComment(
        post_id=post_id, user_id=user.id,
        content=data.content, parent_id=data.parent_id,
    )
    db.add(comment)
    post.comment_count += 1
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id, post_id=comment.post_id, user_id=comment.user_id,
        content=comment.content, parent_id=comment.parent_id,
        like_count=0,
        author_name=user.nickname or user.username,
        author_avatar=user.avatar_url,
        created_at=comment.created_at,
    )