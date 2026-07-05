import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../api'

export default function VeiculoModalForm({ onClose, onSuccess, clienteSelecionado }) {
    const [form, setForm] = useState({ placa:'', modelo:'', ano:'' })

    const create = useMutation({
        mutationFn: (data) => apiPost('/api/veiculos', data),
        onSuccess: () => {
            if (onSuccess) onSuccess()
            onClose()
        }
    })

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Novo Veículo</h3>
                <div className="grid grid-1">
                    <input placeholder="Placa" value={form.placa} onChange={e=>setForm({...form, placa:e.target.value})}/>
                    <input placeholder="Modelo" value={form.modelo} onChange={e=>setForm({...form, modelo:e.target.value})}/>
                    <input placeholder="Ano" type="number" value={form.ano} onChange={e=>setForm({...form, ano:e.target.value})}/>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
                        <button onClick={() => {
                            create.mutate({
                                placa: form.placa,
                                modelo: form.modelo,
                                ano: form.ano ? Number(form.ano) : null,
                                clienteId: clienteSelecionado
                            })
                        }}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    )
}