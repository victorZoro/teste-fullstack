import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api'
import ConfirmModal from './ConfirmModal'

export default function ClienteModalForm({ onClose, onSuccess, clienteEmEdicao }) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [form, setForm] = useState(clienteEmEdicao || {
        nome:'',
        telefone:'',
        endereco:'',
        mensalista:false,
        valorMensalidade:'' 
    })

    const create = useMutation({
        mutationFn: (data) => apiPost('/api/clientes', data),
        onSuccess: () => {
            if (onSuccess) onSuccess("Cliente cadastrado com sucesso!")
            onClose()
        }
    })

    const update = useMutation({
        mutationFn: (data) => apiPut(`/api/clientes/${clienteEmEdicao.id}`, data),
        onSuccess: () => {
            if (onSuccess) onSuccess("Cliente atualizado com sucesso!")
            onClose()
        }
    })

    const isEdit = !!clienteEmEdicao;
    const isPending = create.isPending || update.isPending;
    const errorMsg = create.error?.message || update.error?.message;

    const handleSubmit = () => {
        setIsConfirmOpen(true);
    };

    const executeSave = () => {
        const payload = {
            nome: form.nome,
            telefone: form.telefone,
            endereco: form.endereco,
            mensalista: form.mensalista,
            valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null
        };
        
        if (isEdit) {
            update.mutate(payload);
            return;
        }
        
        create.mutate(payload);
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>{isEdit ? 'Editar cliente' : 'Novo cliente'}</h3>
                    {errorMsg && <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontSize: '14px', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{errorMsg}</p>}
                    <div className="grid grid-1">
                        <input placeholder="Nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})}/>
                        <input placeholder="Telefone" value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})}/>
                        <input placeholder="Endereço" value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})}/>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                            <input 
                              type="checkbox" 
                              checked={form.mensalista} 
                              onChange={e=>setForm({...form, mensalista:e.target.checked})}
                            /> 
                            Mensalista
                          </label>
                          <input 
                            placeholder="Valor mensalidade" 
                            value={form.valorMensalidade} 
                            style={{ flex: 1 }} 
                            onChange={e=>setForm({...form, valorMensalidade:e.target.value})}
                          />
                        </div>
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
                message={isEdit ? "Deseja mesmo salvar as alterações deste cliente?" : "Deseja adicionar este novo cliente?"}
                onConfirm={executeSave}
                onCancel={() => setIsConfirmOpen(false)}
                isPending={isPending}
                confirmText="Sim, confirmar"
            />
        </>
    )
}