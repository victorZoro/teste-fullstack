import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '../api'
import FaturaDetalhesModal from '../components/FaturaDetalhesModal.jsx'

export default function FaturamentoPage(){
  const [comp, setComp] = useState('2025-08')
  const [faturaSelecionada, setFaturaSelecionada] = useState(null)
  
  const faturas = useQuery({ queryKey:['faturas', comp], queryFn:() => apiGet(`/api/faturas?competencia=${comp}`) })

  return (
    <div>
      <h2>Faturamento</h2>

      <div className="section">
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <input value={comp} onChange={e=>setComp(e.target.value)} placeholder="yyyy-MM" />
          <button onClick={async ()=>{
            await apiPost('/api/faturas/gerar', { competencia: comp })
            faturas.refetch()
          }}>Gerar faturas</button>
        </div>
      </div>

      <h3 style={{marginTop:16}}>Faturas</h3>
      <div className="section">
        {faturas.isLoading? <p>Carregando...</p> : (
          <table>
            <thead><tr><th>Cliente</th><th>Competência</th><th>Valor</th><th>Qtd Veículos</th><th>Ações</th></tr></thead>
            <tbody>
              {faturas.data?.map(f=>(
                <tr key={f.id}>
                  <td>{f.clienteId}</td>
                  <td>{f.competencia}</td>
                  <td>{Number(f.valor).toFixed(2)}</td>
                  <td>{f.qtdVeiculos}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => setFaturaSelecionada(f)}>
                      Detalhar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FaturaDetalhesModal 
        isOpen={!!faturaSelecionada} 
        onClose={() => setFaturaSelecionada(null)} 
        fatura={faturaSelecionada} 
      />
    </div>
  )
}
