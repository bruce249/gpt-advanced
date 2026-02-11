import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllNews } from '../api/news.js';
import WeatherWidget from './WeatherWidget.jsx';
import { HiOutlineChatBubbleLeftRight, HiOutlineArrowPath, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineArrowLeft } from 'react-icons/hi2';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NewsPanel({ onClose, onAskAbout }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [iframeError, setIframeError] = useState(false);

    const loadNews = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const results = await fetchAllNews();
            setArticles(results);
            if (results.length === 0) {
                setError('No articles found. Reddit feeds are loading — try refreshing.');
            }
        } catch (e) {
            setError(e.message || 'Failed to load news');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    const handleAskAbout = (article) => {
        if (onAskAbout) {
            const prompt = `Tell me more about this news: "${article.title}"${article.description ? `. Context: ${article.description}` : ''}`;
            onAskAbout(prompt);
        }
    };

    const toggleExpand = (idx) => {
        setExpandedId(expandedId === idx ? null : idx);
    };

    const openArticleInline = (article) => {
        setSelectedArticle(article);
        setIframeError(false);
    };

    const closeInlineView = () => {
        setSelectedArticle(null);
        setIframeError(false);
    };

    // ── Inline Article Viewer ──
    if (selectedArticle) {
        return (
            <div className="news-panel">
                <div className="news-panel-header">
                    <button className="news-back-btn" onClick={closeInlineView}>
                        <HiOutlineArrowLeft /> Back
                    </button>
                    <button className="news-close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="news-inline-article">
                    {iframeError ? (
                        <div className="news-inline-fallback">
                            <div className="news-inline-fallback-icon">🔒</div>
                            <h3>{selectedArticle.title}</h3>
                            {selectedArticle.description && (
                                <p className="news-inline-fallback-desc">{selectedArticle.description}</p>
                            )}
                            {selectedArticle.selftext && (
                                <div className="news-inline-fallback-body">
                                    {selectedArticle.selftext}
                                </div>
                            )}
                            <p className="news-inline-fallback-note">
                                This site doesn't allow embedding. Here's the content we have.
                            </p>
                            <div className="news-inline-fallback-actions">
                                <a
                                    href={selectedArticle.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="news-action-btn open"
                                >
                                    Open in new tab ↗
                                </a>
                                <button
                                    className="news-action-btn ask"
                                    onClick={() => handleAskAbout(selectedArticle)}
                                >
                                    <HiOutlineChatBubbleLeftRight /> Ask AI
                                </button>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={selectedArticle.url}
                            title={selectedArticle.title}
                            className="news-inline-iframe"
                            sandbox="allow-same-origin allow-scripts allow-popups"
                            onError={() => setIframeError(true)}
                            onLoad={(e) => {
                                // Some sites block iframes - detect by trying to read
                                try {
                                    const doc = e.target.contentDocument;
                                    if (!doc || doc.body?.innerHTML === '') {
                                        setIframeError(true);
                                    }
                                } catch {
                                    // cross-origin, iframe loaded fine
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ── Main News Feed ──
    return (
        <div className="news-panel">
            {/* Header */}
            <div className="news-panel-header">
                <div className="news-panel-title">
                    <span>📰</span>
                    <span>News & Weather</span>
                </div>
                <button className="news-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Toolbar */}
            <div className="news-toolbar">
                <span className="news-toolbar-label">📰 Latest News</span>
                <button
                    className="news-refresh-btn"
                    onClick={loadNews}
                    disabled={loading}
                    title="Refresh"
                >
                    <HiOutlineArrowPath className={loading ? 'spinning' : ''} />
                </button>
            </div>

            {/* Articles */}
            <div className="news-articles">
                {loading && (
                    <div className="news-loading">
                        <div className="news-loading-spinner" />
                        <span>Fetching latest news...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="news-error">{error}</div>
                )}

                {!loading && articles.map((article, i) => (
                    <div key={`${article.url}-${i}`} className={`news-card ${expandedId === i ? 'expanded' : ''}`}>
                        <div className="news-card-inner">
                            {article.thumbnail && (
                                <div className="news-card-thumb">
                                    <img
                                        src={article.thumbnail}
                                        alt=""
                                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                                    />
                                    <div className="news-card-source-badge">
                                        {article.sourceIcon} {article.source}
                                    </div>
                                </div>
                            )}
                            <div className="news-card-body">
                                <div className="news-card-meta">
                                    {!article.thumbnail && (
                                        <span className="news-source-pill">
                                            {article.sourceIcon} {article.source}
                                        </span>
                                    )}
                                    {article.subreddit && (
                                        <span className="news-subreddit">{article.subreddit}</span>
                                    )}
                                    <span className="news-time">{timeAgo(article.created)}</span>
                                    {article.score != null && (
                                        <span className="news-score">⇧ {article.score.toLocaleString()}</span>
                                    )}
                                </div>
                                {/* Title is clickable — opens inline */}
                                <a
                                    href="#"
                                    className="news-card-title"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openArticleInline(article);
                                    }}
                                >
                                    {article.title}
                                </a>
                                {article.description && (
                                    <p className="news-card-desc">{article.description}</p>
                                )}

                                {/* Expand selftext if available */}
                                {expandedId === i && article.selftext && (
                                    <div className="news-card-expanded-text">
                                        {article.selftext}
                                    </div>
                                )}

                                <div className="news-card-actions">
                                    <button
                                        className="news-action-btn open"
                                        onClick={() => openArticleInline(article)}
                                    >
                                        📄 Read
                                    </button>
                                    {article.selftext && (
                                        <button
                                            className="news-action-btn comments"
                                            onClick={() => toggleExpand(i)}
                                        >
                                            {expandedId === i ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                            <span>{expandedId === i ? 'Less' : 'More'}</span>
                                        </button>
                                    )}
                                    {article.permalink && (
                                        <button
                                            className="news-action-btn comments"
                                            onClick={() => openArticleInline({ ...article, url: article.permalink })}
                                        >
                                            💬 {article.comments}
                                        </button>
                                    )}
                                    <button
                                        className="news-action-btn ask"
                                        onClick={() => handleAskAbout(article)}
                                        title="Ask AI about this"
                                    >
                                        <HiOutlineChatBubbleLeftRight />
                                        <span>Ask AI</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
