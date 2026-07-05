import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api'
import ConfirmModal from './ConfirmModal'

export default function VeiculoModalForm({ onClose, onSuccess, clienteSelecionado, veiculoEmEdicao, clientes }) {
    const isEdit = !!veiculoEmEdicao;
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [form, setForm] = useState(veiculoEmEdicao || { 
        placa: '', 
        modelo: '', 
        ano: '', 
        clienteId: clienteSelecionado 
    })

    const create = useMutation({
        mutationFn: (data) => apiPost('/api/veiculos', data),
        onSuccess: () => {
            if (onSuccess) onSuccess("Veículo cadastrado com sucesso!")
            onClose()
        }
    })

    const update = useMutation({
        mutationFn: (data) => apiPut(`/api/veiculos/${veiculoEmEdicao.id}`, data),
        onSuccess: () => {
            if (onSuccess) onSuccess("Veículo atualizado com sucesso!")
            onClose()
        }
    })

    const isPending = create.isPending || update.isPending;
    const errorMsg = create.error?.message || update.error?.message;

    const handleSubmit = () => {
        setIsConfirmOpen(true);
    };

    const executeSave = () => {
        const payload = {
            placa: form.placa,
            modelo: form.modelo,
            ano: form.ano ? Number(form.ano) : null,
            clienteId: form.clienteId
        };
        if (isEdit) update.mutate(payload);
        else create.mutate(payload);
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>{isEdit ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                    {errorMsg && <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontSize: '14px', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{errorMsg}</p>}
                    
                    <div className="grid grid-1">
                        <input placeholder="Placa" value={form.placa} disabled={isEdit} onChange={e=>setForm({...form, placa:e.target.value})}/>
                        <input placeholder="Modelo" value={form.modelo || ''} onChange={e=>setForm({...form, modelo:e.target.value})}/>
                        <input placeholder="Ano" type="number" value={form.ano || ''} onChange={e=>setForm({...form, ano:e.target.value})}/>
                        
                        <select value={form.clienteId} onChange={e=>setForm({...form, clienteId:e.target.value})}>
                            <option value="">Selecione um cliente</option>
                            {clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={onClose} disabled={isPending}>Cancelar</button>
                            <button disabled={isPending} onClick={handleSubmit}>{isPending ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Confirmar Ação"
                message={isEdit ? "Deseja mesmo salvar as alterações deste veículo?" : "Deseja adicionar este novo veículo?"}
                onConfirm={executeSave}
                onCancel={() => setIsConfirmOpen(false)}
                isPending={isPending}
                confirmText="Sim, confirmar"
            />
        </>
    )
}