import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { Amendment, SituacaoOficial, TipoEmenda } from '@/lib/mock-data';
import { format } from 'date-fns';

export const exportToDocx = async (amendments: Amendment[]) => {
  try {
    // Busca o arquivo template da pasta public
    const response = await fetch('/template.docx');
    
    if (!response.ok) {
      throw new Error(`Não foi possível carregar o template. Status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Carrega o arquivo zip (docx)
    const zip = new PizZip(arrayBuffer);
    
    // Cria a instância do docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => {
        return ""; // Se o dado não existir, coloca vazio
      }
    });

    // Formata os dados para o template
    const emendasData = amendments.map((a, index) => {
      // Pega dados extras que podem estar no metadata ou string vazia
      const meta = (a as any).meta_operacional || "";
      const obj = (a as any).objeto || "";
      const cie = a.deliberacao_cie || "";
      const natureza = (a as any).natureza || "";
      const portaria = a.portaria || "-";
      const dataFormatada = a.created_at ? format(new Date(a.created_at), 'dd/MM/yyyy') : "";
      
      // O sistema ainda não possui campos separados para a data da Portaria e da Deliberação.
      // Vamos usar "-" temporariamente ou buscar de um campo futuro.
      const dataCie = "-"; 
      const dataPortaria = "-";
      const dataRepasse = a.data_repasse || "-";

      return {
        numero: String(index + 1).padStart(2, '0'),
        autor: a.autor || "",
        proposta: a.numero_proposta || "-",
        emenda: a.numero_emenda || "-",
        tipoRecurso: TipoEmenda[a.tipo] || a.tipo,
        valorTotal: a.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        status: SituacaoOficial[a.situacao] || a.situacao,
        portaria: portaria,
        data: dataFormatada,
        deliberacaoCie: cie,
        dataCie: dataCie,
        dataPortaria: dataPortaria,
        dataRepasse: dataRepasse,
        natureza: natureza,
        objeto: obj,
        metaOperacional: meta,
      };
    });

    // Calcula o total geral
    const somaTotal = amendments.reduce((acc, curr) => acc + curr.valor_total, 0);
    const totalGeral = somaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Seta os dados na engine
    doc.render({
      emendas: emendasData,
      totalGeral: totalGeral
    });

    // Gera o buffer final
    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Baixa o arquivo gerado
    saveAs(out, `Monitoramento_Emendas_${format(new Date(), 'yyyyMMdd_HHmm')}.docx`);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar DOCX:', error);
    return { success: false, error: error };
  }
};
