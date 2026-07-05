import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '../api'
import toast from 'react-hot-toast'
import ClienteModalForm from '../components/ClienteModalForm.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function ClientesPage(){
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState('')
  const [mensalista, setMensalista] = useState('all')
  const [form, setForm] = useState({ nome:'', telefone:'', endereco:'', mensalista:false, valorMensalidade:'' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null)
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null)
  
  const q = useQuery({
    queryKey:['clientes', filtro, mensalista],
    queryFn:() => apiGet(`/api/clientes?pagina=1&tamanho=20&filtro=${encodeURIComponent(filtro)}&mensalista=${mensalista}`)
  })

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/clientes', data),
    onSuccess: () => qc.invalidateQueries({ queryKey:['clientes'] })
  })

  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/clientes/${id}`),
    onSuccess: () => {
      handleSuccess("Cliente excluído com sucesso!")
      setClienteParaExcluir(null)
    }
  })

  const handleSuccess = (msg) => {
    qc.invalidateQueries({ queryKey:['clientes'] })
    if (msg) toast.success(msg)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Clientes</h2>
        <button onClick={() => { setClienteEmEdicao(null); setIsModalOpen(true); }}>Novo Cliente</button>
      </div>

      <div className="section">
        <div className="grid grid-3">
          <input placeholder="Buscar por nome" value={filtro} onChange={e=>setFiltro(e.target.value)} />
          <select value={mensalista} onChange={e=>setMensalista(e.target.value)}>
            <option value="all">Todos</option>
            <option value="true">Mensalistas</option>
            <option value="false">Não mensalistas</option>
          </select>
          <div/>
        </div>
      </div>

      {isModalOpen && (
          <ClienteModalForm
              clienteEmEdicao={clienteEmEdicao}
              onClose={() => setIsModalOpen(false)}
              onSuccess={handleSuccess}
          />
      )}

      <h3 style={{marginTop:16}}>Lista</h3>
      <div className="section">
        {q.isLoading? <p>Carregando...</p> : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Mensalista</th><th></th></tr></thead>
            <tbody>
              {q.data.itens.map(c=>(
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.telefone}</td>
                  <td>{c.mensalista? 'Sim':'Não'}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-ghost" onClick={() => { setClienteEmEdicao(c); setIsModalOpen(true); }}>Editar</button>
                    <button className="btn-ghost" onClick={() => setClienteParaExcluir(c)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
          isOpen={!!clienteParaExcluir}
          title="Excluir Cliente"
          message={`Tem certeza que deseja excluir o cliente ${clienteParaExcluir?.nome}? Esta ação não pode ser desfeita.`}
          onConfirm={() => remover.mutate(clienteParaExcluir.id)}
          onCancel={() => {
              setClienteParaExcluir(null)
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
