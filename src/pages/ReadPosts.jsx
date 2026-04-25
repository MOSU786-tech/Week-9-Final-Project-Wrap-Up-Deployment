import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import './ReadPosts.css';
import { COMMENTS_TABLE, POSTS_TABLE, supabase } from '../client';
import {
    POST_FLAGS,
    loadFeedSettings,
    saveFeedSettings,
} from '../utils/postHelpers';
import { getOrCreateSessionUser, resetSessionUser } from '../utils/sessionUser';
import { formatSupabaseError } from '../utils/supabaseErrors';

const ReadPosts = () => {
    const [sessionUser, setSessionUser] = useState(() => getOrCreateSessionUser());
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedFlag, setSelectedFlag] = useState('All');
    const [feedSettings, setFeedSettings] = useState(() => loadFeedSettings());

    const fetchPosts = async () => {
        setLoading(true);

        const { data: postRows, error: postsError } = await supabase
            .from(POSTS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (postsError) {
            setErrorMessage(formatSupabaseError(postsError));
            setPosts([]);
            setLoading(false);
            return;
        }

        const rows = postRows ?? [];
        const repostIds = [...new Set(rows.map((post) => post.repost_of).filter(Boolean))];

        let repostMap = {};
        if (repostIds.length) {
            const { data: repostRows } = await supabase
                .from(POSTS_TABLE)
                .select('id,title,author_label')
                .in('id', repostIds);

            repostMap = (repostRows ?? []).reduce((accumulator, current) => {
                accumulator[current.id] = current;
                return accumulator;
            }, {});
        }

        const { data: comments } = await supabase.from(COMMENTS_TABLE).select('post_id');
        const commentCounts = (comments ?? []).reduce((accumulator, current) => {
            const next = accumulator;
            next[current.post_id] = (next[current.post_id] ?? 0) + 1;
            return next;
        }, {});

        setErrorMessage('');
        setPosts(
            rows.map((row) => ({
                ...row,
                repost: row.repost_of ? repostMap[row.repost_of] ?? null : null,
                commentCount: commentCounts[row.id] ?? 0,
            })),
        );
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const filteredPosts = useMemo(() => {
        if (selectedFlag === 'All') {
            return posts;
        }

        return posts.filter((post) => post.flag === selectedFlag);
    }, [posts, selectedFlag]);

    const handleUpvote = async (id, count) => {
        const { error } = await supabase.from(POSTS_TABLE).update({ betCount: count }).eq('id', id);
        if (!error) {
            setPosts((current) =>
                current.map((post) => (post.id === id ? { ...post, betCount: count } : post)),
            );
        }
    };

    const updateSettings = (next) => {
        setFeedSettings(next);
        saveFeedSettings(next);
    };

    return (
        <section className={`page-section post-feed post-feed--${feedSettings.accentTheme}`}>
            <div className="hero-panel">
                <div className="board-header">
                    <div>
                        <p className="eyebrow">Week 9 Final Feed</p>
                        <h2 className="section-title">Crew Challenge Threads</h2>
                        <p className="muted">
                            Session user: <strong>{sessionUser.label}</strong> ({sessionUser.id})
                        </p>
                    </div>

                    <div className="action-row">
                        <button
                            className="secondary-button"
                            onClick={() => {
                                const nextUser = resetSessionUser();
                                setSessionUser(nextUser);
                            }}
                        >
                            Regenerate User ID
                        </button>
                        <Link className="primary-button" to="/posts/new">
                            Create Post
                        </Link>
                    </div>
                </div>

                <div className="post-controls">
                    <label>
                        Filter by flag
                        <select value={selectedFlag} onChange={(event) => setSelectedFlag(event.target.value)}>
                            <option value="All">All</option>
                            {POST_FLAGS.map((flag) => (
                                <option key={flag} value={flag}>
                                    {flag}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Theme
                        <select
                            value={feedSettings.accentTheme}
                            onChange={(event) =>
                                updateSettings({ ...feedSettings, accentTheme: event.target.value })
                            }
                        >
                            <option value="sunrise">Sunrise</option>
                            <option value="teal">Neon Teal</option>
                            <option value="ember">Solar Ember</option>
                        </select>
                    </label>

                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={feedSettings.showContent}
                            onChange={(event) =>
                                updateSettings({ ...feedSettings, showContent: event.target.checked })
                            }
                        />
                        Show post content
                    </label>

                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={feedSettings.showImage}
                            onChange={(event) => updateSettings({ ...feedSettings, showImage: event.target.checked })}
                        />
                        Show feed images
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="status-banner status-banner--info loading-pill">
                    <span className="loading-spinner" aria-hidden="true" />
                    Loading posts...
                </div>
            ) : null}

            {errorMessage ? <div className="status-banner status-banner--error">{errorMessage}</div> : null}

            {!loading && !errorMessage && !filteredPosts.length ? (
                <div className="panel empty-state">
                    <h3>No posts yet for this filter.</h3>
                    <Link className="primary-button" to="/posts/new">
                        Be the first to post
                    </Link>
                </div>
            ) : null}

            {!loading && filteredPosts.length ? (
                <div className="ReadPosts">
                    {filteredPosts.map((post) => (
                        <Card key={post.id} post={post} settings={feedSettings} onUpvote={handleUpvote} />
                    ))}
                </div>
            ) : null}
        </section>
    );
};

export default ReadPosts;
