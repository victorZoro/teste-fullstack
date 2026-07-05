
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function handleResponseError(r) {
  const text = await r.text();
  try {
    const json = JSON.parse(text);
    if (json.errors) {
      const firstKey = Object.keys(json.errors)[0];
      return json.errors[firstKey][0]; 
    }
    if (json.title) return json.title;
    if (json.message) return json.message;
  } catch {
    // Falhou ao parsear JSON, processa como texto
  }
  
  if (!text) return "Erro desconhecido do servidor.";
  if (text.trim().startsWith('<')) return "Erro interno do servidor. Tente novamente mais tarde.";
  return text; 
}

export async function apiGet(path){
  const r = await fetch(API + path)
  if(!r.ok) throw new Error(await handleResponseError(r))
  return r.json()
}
export async function apiPost(path, body){
  const r = await fetch(API + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
  if(!r.ok) throw new Error(await handleResponseError(r))
  return r.json()
}
export async function apiPut(path, body){
  const r = await fetch(API + path, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
  if(!r.ok) throw new Error(await handleResponseError(r))
  return r.json()
}
export async function apiDelete(path){
  const r = await fetch(API + path, { method:'DELETE' })
  if(!r.ok) throw new Error(await handleResponseError(r))
  return r.text()
}
