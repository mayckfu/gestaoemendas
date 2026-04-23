const fs = require('fs');

const path = 'src/lib/visitor/visitorMockData.ts';
let content = fs.readFileSync(path, 'utf8');

// Find VISITOR_EMENDAS block more reliably
const startToken = 'export const VISITOR_EMENDAS: Amendment[] = [';
const startIndex = content.indexOf(startToken);

if (startIndex === -1) {
  console.log('Could not find VISITOR_EMENDAS');
  process.exit(1);
}

// Find the matching ]; for the array
let endIndex = -1;
let openBrackets = 1;
for (let i = startIndex + startToken.length; i < content.length; i++) {
  if (content[i] === '[') openBrackets++;
  if (content[i] === ']') {
    openBrackets--;
    if (openBrackets === 0) {
      if (content[i+1] === ';') {
        endIndex = i + 2;
        break;
      }
    }
  }
}

if (endIndex === -1) {
  console.log('Could not find closing ]; for VISITOR_EMENDAS');
  process.exit(1);
}

const emendasBlock = content.substring(startIndex, endIndex);
const emendasData = [];

// Parse emendas to get id, total_repassado, total_gasto
const emendaRegex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?\}/g;
let match;
while ((match = emendaRegex.exec(emendasBlock)) !== null) {
  const block = match[0];
  const id = match[1];
  const repMatch = block.match(/total_repassado:\s*([\d.]+)/);
  const gastoMatch = block.match(/total_gasto:\s*([\d.]+)/);
  
  emendasData.push({
    id: id,
    repassado: repMatch ? parseFloat(repMatch[1]) : 0,
    gasto: gastoMatch ? parseFloat(gastoMatch[1]) : 0
  });
}

console.log(`Parsed ${emendasData.length} emendas.`);

// Generate Repasses
let repassesStr = "export const VISITOR_REPASSES: Record<string, Repasse[]> = {\n";
for (const e of emendasData) {
  if (e.repassado > 0) {
    const num = e.id.split('-')[1];
    repassesStr += `  '${e.id}': [{ id: 'rep-${num}-a', data: '2025-06-10', valor: ${e.repassado}, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB${num}00', observacoes: 'Repasse integral simulado' }],\n`;
  }
}
repassesStr += "}";

// Generate Despesas
let despesasStr = "export const VISITOR_DESPESAS: Record<string, Despesa[]> = {\n";
for (const e of emendasData) {
  if (e.gasto > 0) {
    const num = e.id.split('-')[1];
    despesasStr += `  '${e.id}': [{ id: 'desp-${num}-a', destinacao_id: 'dest-${num}-a', data: '2025-08-15', valor: ${e.gasto}, categoria: 'SERVIÇOS TERCEIROS (PJ)', descricao: 'Execução de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],\n`;
  }
}
despesasStr += "}";

// Replace the existing VISITOR_REPASSES and VISITOR_DESPESAS
content = content.replace(/export const VISITOR_REPASSES: Record<string, Repasse\[\]> = \{[\s\S]*?\};/m, repassesStr + ';');
content = content.replace(/export const VISITOR_DESPESAS: Record<string, Despesa\[\]> = \{[\s\S]*?\};/m, despesasStr + ';');

fs.writeFileSync(path, content, 'utf8');
console.log('Success. Rewrote Mocks.');
