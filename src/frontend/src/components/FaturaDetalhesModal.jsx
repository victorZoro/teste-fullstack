import React, { useState, useEffect } from 'react';
import { apiGet } from '../api';

export default function FaturaDetalhesModal({ isOpen, onClose, fatura }) {
    const [placas, setPlacas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && fatura) {
            setIsLoading(true);
            apiGet(`/api/faturas/${fatura.id}/placas`)
                .then(r => setPlacas(r))
                .catch(e => console.error(e))
                .finally(() => setIsLoading(false));
        } else {
            setPlacas([]);
        }
    }, [isOpen, fatura]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1001, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Detalhes da Fatura</h3>
                </div>
                
                <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
                    Competência: <strong>{fatura.competencia}</strong><br/>
                    Valor Total: <strong>R$ {Number(fatura.valor).toFixed(2)}</strong>
                </p>

                <h4 style={{ margin: '0 0 8px 0' }}>Veículos Faturados ({fatura.qtdVeiculos})</h4>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '12px' }}>
                    {isLoading ? (
                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Carregando veículos...</p>
                    ) : placas.length === 0 ? (
                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Nenhum veículo encontrado.</p>
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                            {placas.map((p, idx) => (
                                <li key={idx} style={{ marginBottom: '8px' }}>Placa: <strong>{p}</strong></li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
}
