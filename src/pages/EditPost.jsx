import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './EditPost.css';
import { MEDIA_BUCKET, POSTS_TABLE, supabase } from '../client';
import { POST_FLAGS } from '../utils/postHelpers';
import { getOrCreateSessionUser } from '../utils/sessionUser';
import { formatSupabaseError } from '../utils/supabaseErrors';

const EditPost = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const sessionUser = useMemo(() => getOrCreateSessionUser(), []);

    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState(null);
    const [enteredKey, setEnteredKey] = useState('');
    const [newSecretKey, setNewSecretKey] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusTone, setStatusTone] = useState('info');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            // Load current source-of-truth record before allowing edits.
            const { data, error } = await supabase.from(POSTS_TABLE).select('*').eq('id', id).single();

            if (error) {
                setStatusTone('error');
                setStatusMessage(formatSupabaseError(error));
                setPost(null);
            } else {
                setStatusMessage('');
                setPost({
                    ...data,
                    repostPostId: data.repost_of ? String(data.repost_of) : '',
                });
            }

            setLoading(false);
        };

        fetchPost();
    }, [id]);

    const isOwner = post?.author_id === sessionUser.id;
    // Ownership gate: only original pseudo-user can edit/delete this post.

    const handleChange = (event) => {
        const { name, value } = event.target;
        setPost((previous) => ({ ...previous, [name]: value }));
    };

    const uploadImage = async () => {
        if (!imageFile) {
            return post.image_url || '';
        }

        const cleanName = imageFile.name.replace(/\s+/g, '-').toLowerCase();
        const path = `${sessionUser.id}/${Date.now()}-${cleanName}`;

        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, imageFile, { upsert: true });
        if (error) {
            throw error;
        }

        const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        return data.publicUrl;
    };

    const validateSecret = () => {
        // Secret key is a second gate layered on top of author ownership.
        if (!enteredKey.trim()) {
            setStatusTone('error');
            setStatusMessage('Enter the current secret key to continue.');
            return false;
        }

        if (enteredKey.trim() !== post.secret_key) {
            setStatusTone('error');
            setStatusMessage('Secret key is incorrect.');
            return false;
        }

        return true;
    };

    const updatePost = async (event) => {
        event.preventDefault();

        if (!post || !isOwner) {
            return;
        }

        if (!validateSecret()) {
            return;
        }

        setSaving(true);

        try {
            const imageUrl = await uploadImage();
            // Keep update payload explicit so accidental columns are never sent.
            const payload = {
                title: post.title.trim(),
                description: post.description.trim(),
                flag: post.flag,
                characteristic: post.characteristic.trim(),
                video_url: post.video_url?.trim() ?? '',
                image_url: imageUrl,
                updated_at: new Date().toISOString(),
            };

            if (newSecretKey.trim()) {
                // Optional key rotation for improved control after sharing thread links.
                payload.secret_key = newSecretKey.trim();
            }

            const { error } = await supabase.from(POSTS_TABLE).update(payload).eq('id', id);

            if (error) {
                setStatusTone('error');
                setStatusMessage(formatSupabaseError(error));
                setSaving(false);
                return;
            }

            navigate(`/posts/${id}`);
        } catch (error) {
            setStatusTone('error');
            setStatusMessage(formatSupabaseError(error));
            setSaving(false);
        }
    };

    const deletePost = async () => {
        if (!post || !isOwner) {
            return;
        }

        if (!validateSecret()) {
            return;
        }

        if (!window.confirm('Delete this post and all comments in its thread?')) {
            return;
        }

        // Mentor tip: keep destructive actions behind both confirm + permission checks.

        setSaving(true);

        const { error } = await supabase.from(POSTS_TABLE).delete().eq('id', id);
        if (error) {
            setStatusTone('error');
            setStatusMessage(formatSupabaseError(error));
            setSaving(false);
            return;
        }

        navigate('/posts');
    };

    if (loading) {
        return (
            <section className="page-section">
                <div className="status-banner status-banner--info loading-pill">
                    <span className="loading-spinner" aria-hidden="true" />
                    Loading editor...
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

    if (!isOwner) {
        return (
            <section className="page-section">
                <div className="panel empty-state">
                    <h3>This post belongs to another session user.</h3>
                    <p className="muted">Only the original author can edit or delete this post.</p>
                    <Link className="secondary-button" to={`/posts/${post.id}`}>
                        Back to thread
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section">
            <div className="panel post-form-shell">
                <div className="board-header">
                    <div>
                        <p className="eyebrow">Edit Post</p>
                        <h2 className="section-title">Update your thread</h2>
                    </div>
                    <Link className="secondary-button" to={`/posts/${post.id}`}>
                        Back to thread
                    </Link>
                </div>

                <form className="post-form" onSubmit={updatePost}>
                    <label htmlFor="title">Title</label>
                    <input id="title" name="title" type="text" value={post.title} onChange={handleChange} />

                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        rows="6"
                        name="description"
                        value={post.description}
                        onChange={handleChange}
                    />

                    <div className="post-form-grid">
                        <label htmlFor="flag">
                            Flag
                            <select id="flag" name="flag" value={post.flag} onChange={handleChange}>
                                {POST_FLAGS.map((flag) => (
                                    <option key={flag} value={flag}>
                                        {flag}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label htmlFor="characteristic">
                            Additional characteristic
                            <input
                                id="characteristic"
                                name="characteristic"
                                type="text"
                                value={post.characteristic}
                                onChange={handleChange}
                            />
                        </label>

                        <label htmlFor="video_url">
                            Video URL
                            <input
                                id="video_url"
                                name="video_url"
                                type="url"
                                value={post.video_url || ''}
                                onChange={handleChange}
                            />
                        </label>

                        <label htmlFor="imageFile">
                            Upload replacement image
                            <input
                                id="imageFile"
                                type="file"
                                accept="image/*"
                                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>

                    <label htmlFor="enteredKey">Current secret key</label>
                    <input
                        id="enteredKey"
                        type="password"
                        value={enteredKey}
                        onChange={(event) => setEnteredKey(event.target.value)}
                    />

                    <label htmlFor="newSecretKey">Optional new secret key</label>
                    <input
                        id="newSecretKey"
                        type="password"
                        value={newSecretKey}
                        onChange={(event) => setNewSecretKey(event.target.value)}
                    />

                    {statusMessage ? (
                        <div className={`status-banner status-banner--${statusTone}`}>{statusMessage}</div>
                    ) : null}

                    <button className="primary-button" type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="danger-button" type="button" disabled={saving} onClick={deletePost}>
                        Delete Post
                    </button>
                </form>
            </div>
        </section>
    );
};

export default EditPost;
