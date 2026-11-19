import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const API='https://sismobcidadao.saude.gov.br/api/public/obras'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  let historyId:string|undefined
  try{
    const token=(req.headers.get('Authorization')||'').replace('Bearer ','')
    const auth=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!)
    const {data:{user}}=await auth.auth.getUser(token)
    if(!user)return json({error:'Sessão inválida.'},401)
    const {data:profile}=await admin.from('profiles').select('role,status').eq('id',user.id).maybeSingle()
    if(!profile||profile.role!=='ADMIN'||profile.status!=='ATIVO')return json({error:'Somente administradores podem sincronizar.'},403)

    const {data:history,error:hError}=await admin.from('sismob_public_sync_history').insert({requested_by:user.id}).select('id').single()
    if(hError)throw hError
    historyId=history.id

    const {data:snapshots,error:sError}=await admin.from('sismob_sync_snapshots').select('numero_proposta,source_url,collected_at').order('collected_at',{ascending:false})
    if(sError)throw sError
    const tracked=new Map<string,{numero_proposta:string;proposal_id:number}>()
    for(const row of snapshots||[]){
      if(tracked.has(row.numero_proposta))continue
      const match=String(row.source_url||'').match(/proposta-id=(\d+)/)
      if(match)tracked.set(row.numero_proposta,{numero_proposta:row.numero_proposta,proposal_id:Number(match[1])})
    }

    let success=0; const errors:Array<{numero_proposta:string;error:string}>=[]
    for(const item of tracked.values()){
      try{
        const response=await fetch(`${API}/${item.proposal_id}`,{headers:{Accept:'application/json','User-Agent':'GestaoEmendas/1.0 (public-SISMOB-sync)'}})
        if(!response.ok)throw new Error(`SISMOB Cidadão respondeu HTTP ${response.status}`)
        const d=await response.json()
        const row={proposal_id:item.proposal_id,numero_proposta:d.nuProposta||item.numero_proposta,municipio:d.noMunicipioAcentuado||d.noMunicipio,uf:d.sgUf,tipo_obra:d.dsTipoObra,tipo_recurso:d.dsTipoRecurso,programa:d.dsPrograma,valor_proposta:d.vlProposta,situacao_obra:d.dsSituacaoObra,etapa_proposta:d.dsEtapaProposta,percentual_executado:d.vlPercentualExecutado,numero_portaria:d.nuPortaria,data_portaria:d.dtPortaria||null,endereco:{cep:d.nuCep,logradouro:d.dsLogradouro,numero:d.nuEndereco,complemento:d.dsComplemento,bairro:d.noBairro||d.dsBairro,latitude:d.nuLatitude,longitude:d.nuLongitude},parcelas:[1,2,3,4].map((n)=>({numero:n,data:d[['','dtPrimeiraParcela','dtSegundaParcela','dtTerceiraParcela','dtQuartaParcela'][n]],valor:d[['','vlPrimeraParcela','vlSegundaParcela','vlTerceiraParcela','vlQuartaParcela'][n]]})).filter((p)=>p.data||p.valor),fotografias:d.gruposFotografias||[],empresas:d.empresas||[],dados_publicos:d,fonte_url:`${API}/${item.proposal_id}`,source_updated_at:d.dtAtualizacao||null,synced_at:new Date().toISOString()}
        const {error}=await admin.from('sismob_public_works').upsert(row,{onConflict:'proposal_id'})
        if(error)throw error
        success++
      }catch(error){errors.push({numero_proposta:item.numero_proposta,error:error instanceof Error?error.message:String(error)})}
    }
    const status=errors.length===0?'COMPLETED':success>0?'PARTIAL':'FAILED'
    await admin.from('sismob_public_sync_history').update({finished_at:new Date().toISOString(),status,total:tracked.size,success,failed:errors.length,errors}).eq('id',historyId)
    return json({status,total:tracked.size,success,failed:errors.length,errors})
  }catch(error){
    if(historyId)await admin.from('sismob_public_sync_history').update({finished_at:new Date().toISOString(),status:'FAILED',errors:[{error:error instanceof Error?error.message:String(error)}]}).eq('id',historyId)
    return json({error:error instanceof Error?error.message:String(error)},500)
  }
})
