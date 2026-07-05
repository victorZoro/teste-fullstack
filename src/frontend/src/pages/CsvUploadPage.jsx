import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function CsvUploadPage(){
  const [log, setLog] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpload(e){
    e.preventDefault()
    setErrorMsg(null)
    setLog(null)
    
    const file = e.target.file.files[0]
    if (!file) {
      setErrorMsg('Selecione um arquivo CSV primeiro.')
      return
    }

    setIsLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/import/csv', {
        method: 'POST',
        body: fd
      })
      
      if (!r.ok) {
        const text = await r.text()
        throw new Error(text || 'Erro ao processar arquivo no servidor')
      }

      const j = await r.json()
      setLog(j)
      
      if (j.erros && j.erros.length > 0) {
        toast.error(`Importação finalizada com ${j.erros.length} erros.`)
      } else {
        toast.success('Importação concluída com sucesso.')
      }
    } catch(err) {
      setErrorMsg(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2>Importar CSV</h2>
      <div className="section">
        <form onSubmit={handleUpload} style={{display:'flex', gap:10, alignItems:'center'}}>
          <input type="file" name="file" accept=".csv" disabled={isLoading} />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
        {errorMsg && <div style={{color:'#f87171', marginTop:10}}>{errorMsg}</div>}
      </div>

      <h3 style={{marginTop:16}}>Relatório</h3>
      <div className="section">
        {!log && !isLoading && <p>Aguardando upload...</p>}
        {isLoading && <p>Processando arquivo, por favor aguarde...</p>}
        
        {log && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#1f2937', borderRadius: 6, color: '#e5e7eb' }}>
              <strong>Resumo:</strong> {log.processados} processados | {log.inseridos} inseridos | <span style={{color: log.erros?.length > 0 ? '#f87171' : '#4ade80'}}>{log.erros?.length || 0} erros</span>
            </div>
            
            {log.erros && log.erros.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444', background: '#111827' }}>
                      <th style={{ padding: '10px 12px' }}>Linha</th>
                      <th style={{ padding: '10px 12px' }}>Motivo</th>
                      <th style={{ padding: '10px 12px' }}>Dados Originais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.erros.map((err, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{err.linha}</td>
                        <td style={{ padding: '10px 12px', color: '#f87171' }}>{err.motivo}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.85em', color: '#9ca3af', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={err.dadosRaw}>
                          {err.dadosRaw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
