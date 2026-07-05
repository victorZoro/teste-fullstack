import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '../api'
import FaturaDetalhesModal from '../components/FaturaDetalhesModal.jsx'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ReceiptIcon from '@mui/icons-material/Receipt'

export default function FaturamentoPage(){
  const [comp, setComp] = useState('2025-08')
  const [faturaSelecionada, setFaturaSelecionada] = useState(null)
  
  const faturas = useQuery({ queryKey:['faturas', comp], queryFn:() => apiGet(`/api/faturas?competencia=${comp}`) })

  const handleCompChange = (e) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 4) {
      v = v.substring(0, 4) + '-' + v.substring(4, 6)
    }
    setComp(v)
  }

  return (
    <div>
      <h2>Faturamento</h2>

      <div className="section">
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <input 
            value={comp} 
            onChange={handleCompChange} 
            placeholder="yyyy-MM" 
            maxLength={7}
          />
          <button 
            disabled={comp.length !== 7}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={async ()=>{
              await apiPost('/api/faturas/gerar', { competencia: comp })
              faturas.refetch()
            }}
          >
            <ReceiptIcon fontSize="small" /> Gerar faturas
          </button>
        </div>
      </div>

      <h3 style={{marginTop:16}}>Faturas</h3>
      <div className="section">
        {faturas.isLoading? <p>Carregando...</p> : (
          <table>
            <thead><tr><th>Cliente</th><th>Competência</th><th>Valor</th><th>Qtd Veículos</th><th style={{ textAlign: 'center' }}>Ações</th></tr></thead>
            <tbody>
              {!faturas.data || faturas.data.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              ) : (
                faturas.data.map(f=>(
                  <tr key={f.id}>
                    <td>{f.clienteId}</td>
                    <td>{f.competencia}</td>
                    <td>{Number(f.valor).toFixed(2)}</td>
                    <td>{f.qtdVeiculos}</td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-ghost" onClick={() => setFaturaSelecionada(f)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <VisibilityIcon fontSize="small" /> Detalhar
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
