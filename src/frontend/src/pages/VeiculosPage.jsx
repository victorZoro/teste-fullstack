import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'
import toast from 'react-hot-toast'
import VeiculoModalForm from '../components/VeiculoModalForm'
import ConfirmModal from '../components/ConfirmModal'

export default function VeiculosPage(){
  const qc = useQueryClient()
  const [clienteId, setClienteId] = useState('')
  const clientes = useQuery({ queryKey:['clientes-mini'], queryFn:() => apiGet('/api/clientes?pagina=1&tamanho=100') })
  const veiculos = useQuery({ queryKey:['veiculos', clienteId], queryFn:() => apiGet(`/api/veiculos${clienteId?`?clienteId=${clienteId}`:''}`) })
  const [form, setForm] = useState({ placa:'', modelo:'', ano:'', clienteId:'' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [veiculoEmEdicao, setVeiculoEmEdicao] = useState(null)
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState(null)

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
    onSuccess: () => {
      handleSuccess("Veículo excluído com sucesso!")
      setVeiculoParaExcluir(null)
    }
  })
  
  const handleSuccess = (msg) => {
    qc.invalidateQueries({ queryKey:['veiculos'] })
    if (msg) toast.success(msg)
  }
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

      {(isModalOpen || veiculoEmEdicao) && (
        <VeiculoModalForm 
          clienteSelecionado={clienteId}
          veiculoEmEdicao={veiculoEmEdicao}
          clientes={clientes.data?.itens || []}
          onClose={() => {
            setIsModalOpen(false);
            setVeiculoEmEdicao(null);
          }} 
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
                    <button className="btn-ghost" onClick={() => setVeiculoEmEdicao(v)}>Editar</button>
                    <button className="btn-ghost" onClick={() => setVeiculoParaExcluir(v)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
          isOpen={!!veiculoParaExcluir}
          title="Excluir Veículo"
          message={`Tem certeza que deseja excluir o veículo placa ${veiculoParaExcluir?.placa}? Esta ação não pode ser desfeita.`}
          onConfirm={() => remover.mutate(veiculoParaExcluir.id)}
          onCancel={() => {
              setVeiculoParaExcluir(null)
              remover.reset()
          }}
          isPending={remover.isPending}
          confirmText="Excluir"
          isDestructive={true}
          errorMsg={remover.error?.message}
      />
    </div>
  )
}
