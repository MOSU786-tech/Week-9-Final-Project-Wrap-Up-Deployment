import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CreatePost.css';
import { MEDIA_BUCKET, POSTS_TABLE, supabase } from '../client';
import { POST_FLAGS, isPositiveIntegerString } from '../utils/postHelpers';
import { getOrCreateSessionUser } from '../utils/sessionUser';
import { formatSupabaseError } from '../utils/supabaseErrors';

const getDefaultPost = () => ({
    title: '',
    description: '',
    flag: 'Question',
    characteristic: 'Beginner-friendly',
    videoUrl: '',
    repostPostId: '',
    secretKey: '',
});

const CreatePost = () => {
    const navigate = useNavigate();
    const sessionUser = useMemo(() => getOrCreateSessionUser(), []);
    const [post, setPost] = useState(getDefaultPost());
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusTone, setStatusTone] = useState('info');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setPost((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const uploadImage = async () => {
        if (!imageFile) {
            return '';
        }

        const cleanName = imageFile.name.replace(/\s+/g, '-').toLowerCase();
        const path = `${sessionUser.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, imageFile, { upsert: true });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        return data.publicUrl;
    };

    const createPost = async (event) => {
        event.preventDefault();

        if (!post.title.trim() || !post.description.trim()) {
            setStatusTone('error');
            setStatusMessage('Title and description are required.');
            return;
        }

        if (!post.secretKey.trim() || post.secretKey.trim().length < 4) {
            setStatusTone('error');
            setStatusMessage('Add a secret key (minimum 4 characters) to secure edit and delete.');
            return;
        }

        if (post.repostPostId && !isPositiveIntegerString(post.repostPostId)) {
            setStatusTone('error');
            setStatusMessage('Repost post ID must be a positive number.');
            return;
        }

        setSubmitting(true);

        try {
            let repostId = null;
            if (post.repostPostId) {
                repostId = Number(post.repostPostId);
                const { data: referencedPost, error: refError } = await supabase
                    .from(POSTS_TABLE)
                    .select('id')
                    .eq('id', repostId)
                    .single();

                if (refError || !referencedPost) {
                    setStatusTone('error');
                    setStatusMessage('Repost reference was not found.');
                    setSubmitting(false);
                    return;
                }
            }

            const imageUrl = await uploadImage();

            const payload = {
                title: post.title.trim(),
                description: post.description.trim(),
                author_label: sessionUser.label,
                author_id: sessionUser.id,
                flag: post.flag,
                characteristic: post.characteristic.trim() || 'General',
                video_url: post.videoUrl.trim(),
                image_url: imageUrl,
                repost_of: repostId,
                secret_key: post.secretKey.trim(),
            };

            const { data, error } = await supabase.from(POSTS_TABLE).insert(payload).select().single();

            if (error) {
                setStatusTone('error');
                setStatusMessage(formatSupabaseError(error));
                setSubmitting(false);
                return;
            }

            navigate(`/posts/${data.id}`);
        } catch (error) {
            setStatusTone('error');
            setStatusMessage(formatSupabaseError(error));
            setSubmitting(false);
        }
    };

    return (
        <section className="page-section">
            <div className="panel post-form-shell">
                <div className="board-header">
                    <div>
                        <p className="eyebrow">Create Thread</p>
                        <h2 className="section-title">Start a new challenge post</h2>
                        <p className="muted">
                            Posting as <strong>{sessionUser.label}</strong>. Save your secret key so you can edit or
                            delete later.
                        </p>
                    </div>
                    <Link className="secondary-button" to="/posts">
                        Back to feed
                    </Link>
                </div>

                <form className="post-form" onSubmit={createPost}>
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" name="title" value={post.title} onChange={handleChange} />

                    <label htmlFor="description">Description</label>
                    <textarea
                        rows="6"
                        id="description"
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
                                type="text"
                                id="characteristic"
                                name="characteristic"
                                value={post.characteristic}
                                onChange={handleChange}
                                placeholder="Example: Fast-track prep"
                            />
                        </label>

                        <label htmlFor="repostPostId">
                            Repost a previous post by ID
                            <input
                                type="text"
                                id="repostPostId"
                                name="repostPostId"
                                value={post.repostPostId}
                                onChange={handleChange}
                                placeholder="Example: 12"
                            />
                        </label>

                        <label htmlFor="videoUrl">
                            Video URL
                            <input
                                type="url"
                                id="videoUrl"
                                name="videoUrl"
                                value={post.videoUrl}
                                onChange={handleChange}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </label>
                    </div>

                    <label htmlFor="imageFile">Upload an image from your computer</label>
                    <input
                        type="file"
                        id="imageFile"
                        accept="image/*"
                        onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    />

                    <label htmlFor="secretKey">Secret key for edit/delete authorization</label>
                    <input
                        type="password"
                        id="secretKey"
                        name="secretKey"
                        value={post.secretKey}
                        onChange={handleChange}
                    />

                    {statusMessage ? (
                        <div className={`status-banner status-banner--${statusTone}`}>{statusMessage}</div>
                    ) : null}

                    <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? 'Publishing...' : 'Publish Post'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default CreatePost;