import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'
import VeiculoModalForm from '../components/VeiculoModalForm'

export default function VeiculosPage(){
  const qc = useQueryClient()
  const [clienteId, setClienteId] = useState('')
  const clientes = useQuery({ queryKey:['clientes-mini'], queryFn:() => apiGet('/api/clientes?pagina=1&tamanho=100') })
  const veiculos = useQuery({ queryKey:['veiculos', clienteId], queryFn:() => apiGet(`/api/veiculos${clienteId?`?clienteId=${clienteId}`:''}`) })
  const [form, setForm] = useState({ placa:'', modelo:'', ano:'', clienteId:'' })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/veiculos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey:['veiculos'] })
  })
  const update = useMutation({
    mutationFn: ({id, data}) => apiPut(`/api/veiculos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey:['veiculos'] })
  })
  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/veiculos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey:['veiculos'] })
  })
  const handleSuccess = () => qc.invalidateQueries({
    queryKey:['veiculos'] 
  })
  useEffect(()=>{
    if(clientes.data?.itens?.length && !clienteId){
      setClienteId(clientes.data.itens[0].id)
      setForm(f => ({...f, clienteId: clientes.data.itens[0].id}))
    }
  }, [clientes.data])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Veículos</h2>
        <button onClick={() => setIsModalOpen(true)}>+ Novo Veículo</button>
      </div>

      <div className="section">
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <label>Cliente: </label>
          <select value={clienteId} onChange={e=>{ setClienteId(e.target.value); setForm(f=>({...f, clienteId:e.target.value}))}}>
            {clientes.data?.itens?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      {isModalOpen && (
        <VeiculoModalForm 
          clienteSelecionado={clienteId}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}

      <h3 style={{marginTop:16}}>Lista</h3>
      <div className="section">
        {veiculos.isLoading? <p>Carregando...</p> : (
          <table>
            <thead><tr><th>Placa</th><th>Modelo</th><th>Ano</th><th>ClienteId</th><th>Ações</th></tr></thead>
            <tbody>
              {veiculos.data?.map(v=>(
                <tr key={v.id}>
                  <td>{v.placa}</td>
                  <td>{v.modelo}</td>
                  <td>{v.ano ?? '-'}</td>
                  <td>{v.clienteId}</td>
                  <td style={{display:'flex', gap:8}}>
                    <button className="btn-ghost" onClick={()=>{
                      const novoModelo = prompt('Novo modelo', v.modelo || '')
                      if(novoModelo===null) return
                      // TODO: trocar cliente via select modal (deixo simples aqui)
                      update.mutate({ id: v.id, data:{ placa: v.placa, modelo: novoModelo, ano: v.ano, clienteId } })
                    }}>Editar</button>
                    <button className="btn-ghost" onClick={()=>remover.mutate(v.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="note">TODO: permitir troca de cliente na edição e garantir atualização sem recarregar a página (React Query já invalida a lista).</p>
      </div>
    </div>
  )
}
