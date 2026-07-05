import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../api'

export default function ClienteModalForm({ onClose, onSuccess }) {
    const [form, setForm] = useState({
        nome:'',
        telefone:'',
        endereco:'',
        mensalista:false,
        valorMensalidade:'' 
    })

    const create = useMutation({
        mutationFn: (data) => apiPost('/api/clientes', data),
        onSuccess: () => {
            if (onSuccess) onSuccess()
            onClose()
        }
    })

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Novo cliente</h3>
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
                        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
                        <button onClick={() => {
                            create.mutate({
                                nome: form.nome,
                                telefone: form.telefone,
                                endereco: form.endereco,
                                mensalista: form.mensalista,
                                valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null
                            })
                        }}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    )
}