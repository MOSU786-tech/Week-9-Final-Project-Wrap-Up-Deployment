// Mentor map: Reusable feed card for each post row.
// Why it exists: Keeps feed rendering simple and consistent across all posts.
import { Link } from 'react-router-dom';
import './Card.css';
import { formatPostTime, isYouTubeLink, toYouTubeEmbed } from '../utils/postHelpers';

const Card = ({ post, settings, onUpvote }) => {
  // Mentor tip: Convert YouTube links to embed URLs once, then use conditional UI blocks.
  const embedUrl = isYouTubeLink(post.video_url) ? toYouTubeEmbed(post.video_url) : '';

  return (
    <article className="post-card">
      <div className="post-card__header">
        <div>
          <p className="post-card__flag">{post.flag}</p>
          <h3>{post.title}</h3>
        </div>
        <Link className="inline-button" to={`/posts/${post.id}`}>
          Open Thread
        </Link>
      </div>

      <p className="post-card__meta">
        by {post.author_label} • {post.characteristic} • {formatPostTime(post.created_at)}
      </p>

      {settings.showContent ? <p className="post-card__content">{post.description}</p> : null}

      {settings.showImage && post.image_url ? (
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

      {post.repost ? (
        <div className="post-card__repost">
          <p>Repost thread reference: #{post.repost.id}</p>
          <Link className="card-link" to={`/posts/${post.repost.id}`}>
            {post.repost.title}
          </Link>
        </div>
      ) : null}

      <div className="post-card__footer">
        <button className="inline-button" onClick={() => onUpvote(post.id, post.betCount + 1)}>
          👍 Bet Count: {post.betCount}
        </button>
        <span>{post.commentCount} comments</span>
      </div>
    </article>
  );
};

export default Card;
