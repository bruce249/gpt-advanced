import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChatBubbleLeftRight, HiOutlineCog6Tooth, HiOutlineNewspaper } from 'react-icons/hi2';
import { RiSideBarLine } from 'react-icons/ri';

export default function Sidebar({ isOpen, onToggle, onOpenSettings, onOpenNews }) {
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        createConversation,
        deleteConversation,
        renameConversation,
    } = useChat();

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const handleNewChat = () => {
        createConversation();
    };

    const handleSelect = (id) => {
        setActiveConversationId(id);
    };

    const handleStartRename = (e, conv) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const handleRename = (e) => {
        e.preventDefault();
        if (editTitle.trim()) {
            renameConversation(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        deleteConversation(id);
    };

    const groupConversations = () => {
        const now = Date.now();
        const today = [];
        const yesterday = [];
        const previous7Days = [];
        const older = [];
        const dayMs = 86400000;

        for (const conv of conversations) {
            const age = now - conv.updatedAt;
            if (age < dayMs) today.push(conv);
            else if (age < 2 * dayMs) yesterday.push(conv);
            else if (age < 7 * dayMs) previous7Days.push(conv);
            else older.push(conv);
        }

        return { today, yesterday, previous7Days, older };
    };

    const groups = groupConversations();

    const renderGroup = (label, items) => {
        if (items.length === 0) return null;
        return (
            <div key={label}>
                <div className="conversation-group-label">{label}</div>
                {items.map(conv => (
                    <div
                        key={conv.id}
                        className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                        onClick={() => handleSelect(conv.id)}
                    >
                        {editingId === conv.id ? (
                            <form onSubmit={handleRename} style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleRename}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-active)',
                                        border: '1px solid var(--border-secondary)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        padding: '2px 6px',
                                        fontSize: '14px',
                                        fontFamily: 'var(--font-sans)',
                                        outline: 'none',
                                    }}
                                />
                            </form>
                        ) : (
                            <>
                                <span className="conversation-item-title">{conv.title}</span>
                                <div className="conversation-item-actions">
                                    <button
                                        className="conversation-action-btn"
                                        onClick={(e) => handleStartRename(e, conv)}
                                        title="Rename"
                                    >
                                        <HiOutlinePencil />
                                    </button>
                                    <button
                                        className="conversation-action-btn delete"
                                        onClick={(e) => handleDelete(e, conv.id)}
                                        title="Delete"
                                    >
                                        <HiOutlineTrash />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={handleNewChat}>
                        <HiOutlinePlus />
                        New chat
                    </button>
                    <button className="sidebar-toggle-btn" onClick={onToggle} title="Close sidebar">
                        <RiSideBarLine />
                    </button>
                </div>
                <div className="conversation-list">
                    {conversations.length === 0 ? (
                        <div style={{
                            padding: '20px 12px',
                            textAlign: 'center',
                            color: 'var(--text-tertiary)',
                            fontSize: '13px',
                        }}>
                            <HiOutlineChatBubbleLeftRight style={{ fontSize: '24px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                            No conversations yet.
                            <br />
                            Start a new chat!
                        </div>
                    ) : (
                        <>
                            {renderGroup('Today', groups.today)}
                            {renderGroup('Yesterday', groups.yesterday)}
                            {renderGroup('Previous 7 days', groups.previous7Days)}
                            {renderGroup('Older', groups.older)}
                        </>
                    )}
                </div>
                {/* Settings button at bottom */}
                <div className="sidebar-footer">
                    <button className="sidebar-settings-btn news-btn" onClick={onOpenNews}>
                        <HiOutlineNewspaper />
                        <span>News & Weather</span>
                    </button>
                    <button className="sidebar-settings-btn" onClick={onOpenSettings}>
                        <HiOutlineCog6Tooth />
                        <span>Settings & API Keys</span>
                    </button>
                </div>
            </aside>
            {isOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay" onClick={onToggle} />
            )}
        </>
    );
}
