import React from 'react';
import { IoClose, IoDocumentText } from 'react-icons/io5';
import { HiOutlineTrash, HiOutlineDocumentText } from 'react-icons/hi2';
import { formatFileSize } from '../utils/documentParser.js';

/**
 * Document Panel — shows uploaded documents for the active conversation
 */
export default function DocumentPanel({ documents, onRemove, onClose }) {
    if (!documents || documents.length === 0) {
        return (
            <div className="doc-panel">
                <div className="doc-panel-header">
                    <div className="doc-panel-title">
                        <IoDocumentText />
                        Documents
                    </div>
                    <button className="doc-panel-close" onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                <div className="doc-panel-empty">
                    <HiOutlineDocumentText style={{ fontSize: '32px', opacity: 0.3 }} />
                    <p>No documents uploaded yet</p>
                    <span>Upload PDF, TXT, DOCX, or other text files to chat with them</span>
                </div>
            </div>
        );
    }

    return (
        <div className="doc-panel">
            <div className="doc-panel-header">
                <div className="doc-panel-title">
                    <IoDocumentText />
                    Documents ({documents.length})
                </div>
                <button className="doc-panel-close" onClick={onClose}>
                    <IoClose />
                </button>
            </div>
            <div className="doc-panel-body">
                {documents.map(doc => (
                    <div key={doc.id} className="doc-item">
                        <div className="doc-item-icon">
                            {getDocIcon(doc.type)}
                        </div>
                        <div className="doc-item-info">
                            <div className="doc-item-name">{doc.name}</div>
                            <div className="doc-item-meta">
                                {doc.type} · {formatFileSize(doc.size)} · {doc.charCount.toLocaleString()} chars
                            </div>
                        </div>
                        <button
                            className="doc-item-remove"
                            onClick={() => onRemove(doc.id)}
                            title="Remove document"
                        >
                            <HiOutlineTrash />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getDocIcon(type) {
    switch (type) {
        case 'PDF': return '📕';
        case 'DOCX': return '📘';
        case 'CSV': return '📊';
        case 'JSON': return '📋';
        case 'MD': return '📝';
        default: return '📄';
    }
}

/**
 * Document chips shown in the input area
 */
export function DocumentChips({ documents, onRemove }) {
    if (!documents || documents.length === 0) return null;

    return (
        <div className="doc-chips">
            {documents.map(doc => (
                <div key={doc.id} className="doc-chip">
                    <span className="doc-chip-icon">{getDocIcon(doc.type)}</span>
                    <span className="doc-chip-name">{doc.name}</span>
                    <button
                        className="doc-chip-remove"
                        onClick={() => onRemove(doc.id)}
                        title="Remove"
                    >
                        <IoClose />
                    </button>
                </div>
            ))}
        </div>
    );
}
