import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiPost, apiPut } from '../api'
import ConfirmModal from './ConfirmModal'

const phoneMask = (value) => {
    if (!value) return '';
    let v = String(value).replace(/\D/g, '').substring(0, 11);
    if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length > 10) v = `${v.substring(0, 10)}-${v.substring(10)}`;
    return v;
};

const currencyMask = (value) => {
    if (value === null || value === undefined || String(value) === '') return '';
    let v = String(value).replace(/\D/g, '');
    if (v === '') return '';
    v = (Number(v) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
};

export default function ClienteModalForm({ onClose, onSuccess, clienteEmEdicao }) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [validationError, setValidationError] = useState('')
    const [form, setForm] = useState(() => {
        if (clienteEmEdicao) {
            return {
                ...clienteEmEdicao,
                telefone: phoneMask(clienteEmEdicao.telefone),
                valorMensalidade: clienteEmEdicao.valorMensalidade != null ? currencyMask(clienteEmEdicao.valorMensalidade.toFixed(2).replace('.', '')) : ''
            };
        }
        return {
            nome:'',
            telefone:'',
            endereco:'',
            mensalista:false,
            valorMensalidade:'' 
        };
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

    const isNomeValid = !!form.nome?.trim();
    const isTelefoneValid = !!form.telefone?.replace(/\D/g, '').trim();
    const isValorValid = form.mensalista ? !!form.valorMensalidade : true;
    const isValid = isNomeValid && isTelefoneValid && isValorValid;

    const handleSubmit = () => {
        if (!isValid) {
            setValidationError('Por favor, preencha todos os campos obrigatórios (*).');
            return;
        }
        setValidationError('');
        setIsConfirmOpen(true);
    };

    const executeSave = () => {
        setIsConfirmOpen(false);
        const payload = {
            nome: form.nome,
            telefone: form.telefone ? form.telefone.replace(/\D/g, '') : null,
            endereco: form.endereco,
            mensalista: form.mensalista,
            valorMensalidade: form.valorMensalidade ? Number(String(form.valorMensalidade).replace(/\D/g, '')) / 100 : null
        };
        
        if (isEdit) {
            update.mutate(payload);
            return;
        }
        
        create.mutate(payload);
    };

    const displayError = errorMsg || validationError;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>{isEdit ? 'Editar cliente' : 'Novo cliente'}</h3>
                    {displayError && <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontSize: '14px', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{displayError}</p>}
                    <div className="grid grid-1">
                        <input placeholder="Nome *" value={form.nome} maxLength={100} onChange={e=>setForm({...form, nome:e.target.value})}/>
                        <input placeholder="Telefone *" value={form.telefone} maxLength={15} onChange={e=>setForm({...form, telefone:phoneMask(e.target.value)})}/>
                        <input placeholder="Endereço" value={form.endereco} maxLength={400} onChange={e=>setForm({...form, endereco:e.target.value})}/>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                            <input 
                              type="checkbox" 
                              checked={form.mensalista} 
                              onChange={e=>setForm({...form, mensalista:e.target.checked, valorMensalidade: e.target.checked ? form.valorMensalidade : ''})}
                            /> 
                            Mensalista
                          </label>
                          <input 
                            placeholder={form.mensalista ? "Valor mensalidade *" : "Valor mensalidade"}
                            value={form.valorMensalidade} 
                            style={{ flex: 1 }} 
                            disabled={!form.mensalista}
                            onChange={e=>setForm({...form, valorMensalidade:currencyMask(e.target.value)})}
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