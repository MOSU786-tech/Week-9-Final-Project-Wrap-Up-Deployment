import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  COMMENTS_TABLE,
  POSTS_TABLE,
  supabase,
} from '../client';
import {
  formatPostTime,
  isYouTubeLink,
  toYouTubeEmbed,
} from '../utils/postHelpers';
import { getOrCreateSessionUser } from '../utils/sessionUser';
import { formatSupabaseError } from '../utils/supabaseErrors';
import './ReadPosts.css';
import './CreatePost.css';

const PostDetailPage = () => {
  const { id } = useParams();
  const sessionUser = useMemo(() => getOrCreateSessionUser(), []);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [repost, setRepost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [enteredKey, setEnteredKey] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('info');

  const loadPostBundle = useCallback(async () => {
    // Mentor tip:
    // Fetch post + optional repost + comments as one bundle to keep page state synchronized.
    setLoading(true);

    const { data: postData, error: postError } = await supabase
      .from(POSTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (postError) {
      setStatusTone('error');
      setStatusMessage(formatSupabaseError(postError));
      setPost(null);
      setComments([]);
      setLoading(false);
      return;
    }

    setPost(postData);

    if (postData.repost_of) {
      // Threading: resolve referenced post to display context and link chain.
      const { data: repostData } = await supabase
        .from(POSTS_TABLE)
        .select('id,title,author_label,description,flag')
        .eq('id', postData.repost_of)
        .single();
      setRepost(repostData ?? null);
    } else {
      setRepost(null);
    }

    const { data: commentRows, error: commentsError } = await supabase
      .from(COMMENTS_TABLE)
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      setStatusTone('error');
      setStatusMessage(formatSupabaseError(commentsError));
      setComments([]);
      setLoading(false);
      return;
    }

    setComments(commentRows ?? []);
    setStatusMessage('');
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadPostBundle();
  }, [loadPostBundle]);

  const isOwner = post?.author_id === sessionUser.id;
  const embedUrl = isYouTubeLink(post?.video_url) ? toYouTubeEmbed(post.video_url) : '';

  const addComment = async (event) => {
    event.preventDefault();

    if (!commentDraft.trim()) {
      return;
    }

    // Comment authorship inherits pseudo-user identity for traceability.
    const payload = {
      post_id: Number(id),
      content: commentDraft.trim(),
      author_id: sessionUser.id,
      author_label: sessionUser.label,
    };

    const { error } = await supabase.from(COMMENTS_TABLE).insert(payload);

    if (error) {
      setStatusTone('error');
      setStatusMessage(formatSupabaseError(error));
      return;
    }

    setCommentDraft('');
    loadPostBundle();
  };

  const deleteComment = async (commentId) => {
    // By rubric: only post author can moderate comments, plus secret key check.
    if (!post || !isOwner) {
      setStatusTone('error');
      setStatusMessage('Only the post author can delete comments in this thread.');
      return;
    }

    if (enteredKey.trim() !== post.secret_key) {
      setStatusTone('error');
      setStatusMessage('Secret key is incorrect.');
      return;
    }

    const { error } = await supabase.from(COMMENTS_TABLE).delete().eq('id', commentId);

    if (error) {
      setStatusTone('error');
      setStatusMessage(formatSupabaseError(error));
      return;
    }

    loadPostBundle();
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="status-banner status-banner--info loading-pill">
          <span className="loading-spinner" aria-hidden="true" />
          Loading thread...
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="page-section">
        <div className="status-banner status-banner--error">{statusMessage || 'Post not found.'}</div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="hero-panel">
        <div className="board-header">
          <div>
            <p className="eyebrow">Thread #{post.id}</p>
            <h2 className="section-title">{post.title}</h2>
            <p className="muted">
              Posted by {post.author_label} • {formatPostTime(post.created_at)} • {post.flag}
            </p>
          </div>

          <div className="action-row">
            <Link className="secondary-button" to="/posts">
              Back to feed
            </Link>
            {isOwner ? (
              <Link className="primary-button" to={`/posts/${post.id}/edit`}>
                Edit post
              </Link>
            ) : null}
          </div>
        </div>

        <div className="detail-list">
          <div className="detail-item">
            <span>Author session ID</span>
            <strong>{post.author_id}</strong>
          </div>
          <div className="detail-item">
            <span>Characteristic</span>
            <strong>{post.characteristic}</strong>
          </div>
          <div className="detail-item">
            <span>Bet Count</span>
            <strong>{post.betCount}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="post-card__content">{post.description}</p>

        {post.image_url ? (
          <img className="post-card__image" src={post.image_url} alt={`Attached by ${post.author_label}`} />
        ) : null}

        {embedUrl ? (
          <div className="video-frame-wrap">
            <iframe
              title={`Video for ${post.title}`}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : null}

        {!embedUrl && post.video_url ? (
          <a className="direct-link" href={post.video_url} target="_blank" rel="noreferrer">
            Open shared video
          </a>
        ) : null}
      </div>

      {repost ? (
        <div className="panel">
          <p className="eyebrow">Referenced thread</p>
          <h3>{repost.title}</h3>
          <p className="muted">by {repost.author_label}</p>
          <p>{repost.description}</p>
          <Link className="inline-button" to={`/posts/${repost.id}`}>
            Open original thread #{repost.id}
          </Link>
        </div>
      ) : null}

      <div className="panel">
        <div className="section-header">
          <h3>Comments ({comments.length})</h3>
          <p className="muted">Current viewer: {sessionUser.label}</p>
        </div>

        <form className="post-form" onSubmit={addComment}>
          <label htmlFor="commentDraft">Write a comment</label>
          <textarea
            id="commentDraft"
            rows="4"
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
          />
          <button className="primary-button" type="submit">
            Add Comment
          </button>
        </form>

        {isOwner ? (
          <div className="comment-key-row">
            <label htmlFor="enteredKey">Post secret key (required to delete comments)</label>
            <input
              id="enteredKey"
              type="password"
              value={enteredKey}
              onChange={(event) => setEnteredKey(event.target.value)}
            />
          </div>
        ) : null}

        {statusMessage ? (
          <div className={`status-banner status-banner--${statusTone}`}>{statusMessage}</div>
        ) : null}

        <div className="comment-list">
          {comments.map((comment) => (
            <article key={comment.id} className="comment-card">
              <p>{comment.content}</p>
              <div className="comment-card__meta">
                <span>
                  {comment.author_label} ({comment.author_id})
                </span>
                <span>{formatPostTime(comment.created_at)}</span>
              </div>
              {isOwner ? (
                <button className="danger-button" type="button" onClick={() => deleteComment(comment.id)}>
                  Delete Comment
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PostDetailPage;
