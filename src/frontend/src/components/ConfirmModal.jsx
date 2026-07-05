import React from 'react';

export default function ConfirmModal({ 
    isOpen, 
    title = "Confirmar Ação", 
    message, 
    onConfirm, 
    onCancel, 
    isPending, 
    confirmText = "Confirmar", 
    cancelText = "Voltar",
    isDestructive = false,
    errorMsg
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1001, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                {errorMsg && <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontSize: '14px', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{errorMsg}</p>}
                <p style={{ margin: '16px 0 24px 0', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" onClick={onCancel} disabled={isPending}>{cancelText}</button>
                    <button onClick={onConfirm} disabled={isPending}>
                        {isPending ? 'Aguarde...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
