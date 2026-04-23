import re

def main():
    path = "src/lib/visitor/visitorMockData.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract emendas
    emendas_block_match = re.search(r"export const VISITOR_EMENDAS: Amendment\[\] = \[(.*?)\];", content, re.DOTALL)
    if not emendas_block_match:
        print("Could not find VISITOR_EMENDAS")
        return
    
    emendas_block = emendas_block_match.group(1)
    
    emendas = []
    # Find all blocks looking like { id: 'emenda-...', ... }
    # Because there are nested properties, let's use a simpler match:
    for match in re.finditer(r"id:\s*'([^']+)'", emendas_block):
        emenda_id = match.group(1)
        
        # Now find total_repassado and total_gasto around this ID
        # Since it's a list of objects, we can split by `id: 'emenda-`
        pass
        
    # Better approach: parse line by line to keep track of the current emenda block
    emendas_data = []
    current_emenda = {}
    for line in emendas_block.split('\n'):
        id_match = re.search(r"id:\s*'([^']+)'", line)
        if id_match:
            if current_emenda:
                emendas_data.append(current_emenda)
            current_emenda = {"id": id_match.group(1), "repassado": 0, "gasto": 0}
            
        rep_match = re.search(r"total_repassado:\s*([\d.]+)", line)
        if rep_match and current_emenda:
            current_emenda["repassado"] = float(rep_match.group(1))
            
        gasto_match = re.search(r"total_gasto:\s*([\d.]+)", line)
        if gasto_match and current_emenda:
            current_emenda["gasto"] = float(gasto_match.group(1))

    if current_emenda:
        emendas_data.append(current_emenda)

    # Generate Repasses
    repasses_str = "export const VISITOR_REPASSES: Record<string, Repasse[]> = {\n"
    for e in emendas_data:
        val = e["repassado"]
        if val > 0:
            repasses_str += f"  '{e['id']}': [{{ id: 'rep-{e['id'].split('-')[1]}-a', data: '2025-06-10', valor: {val}, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB{e['id'].split('-')[1]}00', observacoes: 'Repasse integral simulado' }}],\n"
    repasses_str += "}"

    # Generate Despesas
    despesas_str = "export const VISITOR_DESPESAS: Record<string, Despesa[]> = {\n"
    for e in emendas_data:
        val = e["gasto"]
        if val > 0:
            despesas_str += f"  '{e['id']}': [{{ id: 'desp-{e['id'].split('-')[1]}-a', destinacao_id: 'dest-{e['id'].split('-')[1]}-a', data: '2025-08-15', valor: {val}, categoria: 'SERVIÇOS TERCEIROS (PJ)', descricao: 'Execução de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }}],\n"
    despesas_str += "}"

    # Replace in file
    content = re.sub(r"export const VISITOR_REPASSES: Record<string, Repasse\[\]> = \{.*?\n\}", repasses_str, content, flags=re.DOTALL)
    content = re.sub(r"export const VISITOR_DESPESAS: Record<string, Despesa\[\]> = \{.*?\n\}", despesas_str, content, flags=re.DOTALL)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Success. Rewrote Mocks.")

if __name__ == "__main__":
    main()
