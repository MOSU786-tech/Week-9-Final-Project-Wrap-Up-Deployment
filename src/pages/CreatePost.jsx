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
            return { imageUrl: '', warningMessage: '' };
        }

        // Mentor tip:
        // Prefixing with session user ID keeps uploads organized per pseudo-user.
        const cleanName = imageFile.name.replace(/\s+/g, '-').toLowerCase();
        const path = `${sessionUser.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, imageFile, { upsert: true });

        if (uploadError) {
            if (uploadError.message?.toLowerCase().includes('bucket') || uploadError.statusCode === '404') {
                return {
                    imageUrl: '',
                    warningMessage:
                        'Image upload was skipped because the Supabase storage bucket is missing. The post can still be created.',
                };
            }

            throw uploadError;
        }

        const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        return { imageUrl: data.publicUrl, warningMessage: '' };
    };

    const createPost = async (event) => {
        event.preventDefault();

        // Step 1: Validate required fields early for fast user feedback.
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

        const normalizedRepostValue = post.repostPostId.trim();
        const hasRepost = normalizedRepostValue !== '' && normalizedRepostValue !== '0';

        if (hasRepost && !isPositiveIntegerString(normalizedRepostValue)) {
            setStatusTone('error');
            setStatusMessage('Repost post ID must be a positive number.');
            return;
        }

        setSubmitting(true);

        try {
            let repostId = null;
            if (hasRepost) {
                // Step 2: If user entered a repost id, verify the source post exists.
                repostId = Number(normalizedRepostValue);
                const { data: referencedPost, error: refError } = await supabase
                    .from(POSTS_TABLE)
                    .select('id')
                    .eq('id', repostId)
                    .single();

                if (refError || !referencedPost) {
                    // Mentor tip:
                    // Optional features should not block the core happy path.
                    // If the reference is missing, create the post anyway and leave it unthreaded.
                    repostId = null;
                    setStatusTone('info');
                    setStatusMessage('Repost reference was not found, so this post was created as a standalone thread.');
                }
            }

            const { imageUrl, warningMessage } = await uploadImage();

            if (warningMessage) {
                setStatusTone('info');
                setStatusMessage(warningMessage);
            }

            // Step 3: Build one clean payload object so DB shape is explicit.
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

            const { error } = await supabase.from(POSTS_TABLE).insert(payload);

            if (error) {
                setStatusTone('error');
                setStatusMessage(formatSupabaseError(error));
                setSubmitting(false);
                return;
            }

            // Some policy setups allow insert but not immediate row return.
            // Fetch the newest post for this session user as a reliable redirect target.
            const { data: newestPost } = await supabase
                .from(POSTS_TABLE)
                .select('id')
                .eq('author_id', sessionUser.id)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Mentor tip:
            // The returned ID is the easiest way to confirm the record really exists.
            setStatusTone('info');
            if (newestPost?.id) {
                setStatusMessage(`Post created successfully. New post ID: ${newestPost.id}`);
                navigate(`/posts/${newestPost.id}`);
            } else {
                setStatusMessage('Post created successfully. Redirecting to the feed.');
                navigate('/posts');
            }
        } catch (error) {
            // Any upload or insert failures are normalized to one readable status message.
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
                                type="number"
                                id="repostPostId"
                                name="repostPostId"
                                min="1"
                                step="1"
                                value={post.repostPostId}
                                onChange={handleChange}
                                placeholder="Leave blank if none"
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
                    <p className="field-helper">
                        If the storage bucket is not configured yet, the post will still save and the image will be
                        skipped.
                    </p>

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