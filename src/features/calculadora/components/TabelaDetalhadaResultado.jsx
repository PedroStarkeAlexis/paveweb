// src/features/calculadora/components/TabelaDetalhadaResultado.jsx
import React, { useCallback } from 'react'; // Removido useState
// Importa constantes do diretório pai (features/calculadora)
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO, ETAPA_VIEW_1, ETAPA_VIEW_2, ETAPA_VIEW_3 } from '../constants';

// Importa o CSS renomeado
import './TabelaDetalhadaResultado.css';

// Função auxiliar interna para calcular porcentagens (pode ser substituída pela prop se preferir)
// Mas mantê-la aqui simplifica as props necessárias
import { calcularPorcentagemEtapa as calcularPorcentagemLocal } from '../utils/calculos';


function TabelaDetalhadaResultado({
    notasEtapas,
    notaRedacao, // Recebe a nota da redação usada no cálculo final
    incluirRedacao,
    notaFinal,
    // calcularPorcentagemEtapa // Prop opcional, podemos usar a local
}) {

  // Lógica de cálculo para exibição na tabela (mantida do original)
  const notaEtapa3Objetiva = notasEtapas?.[ETAPA_VIEW_3] || 0; // Acessa com segurança
  // Usa a notaRedacao recebida (que já deve estar validada pelo componente pai)
  const redacaoParaExibicao = incluirRedacao ? notaRedacao : 0;
  const notaEtapa3Combinada = notaEtapa3Objetiva + redacaoParaExibicao;

  // Usa a função de cálculo local ou a passada por prop
  const calcPorcentagem = useCallback((nota, etapa) => {
      // return calcularPorcentagemEtapa ? calcularPorcentagemEtapa(nota, etapa) : calcularPorcentagemLocal(nota, etapa);
      return calcularPorcentagemLocal(nota, etapa); // Simplificado para usar sempre a local
  }, []); // Sem dependências

  const porcentagemEtapa1 = calcPorcentagem(notasEtapas?.[ETAPA_VIEW_1] || 0, ETAPA_VIEW_1);
  const porcentagemEtapa2 = calcPorcentagem(notasEtapas?.[ETAPA_VIEW_2] || 0, ETAPA_VIEW_2);
  // A porcentagem da etapa 3 é calculada sobre a nota combinada (Obj + Red)
  const porcentagemEtapa3Combinada = calcPorcentagem(notaEtapa3Combinada, ETAPA_VIEW_3);

  // Retorna apenas a tabela
  return (
    <table className="calc-tabela-detalhada"> {/* Classe específica para a tabela */}
      <thead>
           <tr>
               <th>Componente</th>
               <th>Nota</th>
               <th>Contribuição (%)</th>
           </tr>
      </thead>
      <tbody>
        <tr>
          <td>Etapa {ETAPA_VIEW_1}</td>
          <td>{(notasEtapas?.[ETAPA_VIEW_1] || 0).toFixed(2)}</td>
          <td>{porcentagemEtapa1.toFixed(2)}%</td>
        </tr>
        <tr>
          <td>Etapa {ETAPA_VIEW_2}</td>
          <td>{(notasEtapas?.[ETAPA_VIEW_2] || 0).toFixed(2)}</td>
          <td>{porcentagemEtapa2.toFixed(2)}%</td>
        </tr>
        <tr>
          {/* Descrição mais clara da linha */}
          <td>Etapa {ETAPA_VIEW_3} (Objetiva {incluirRedacao ? '+ Redação' : ''})</td>
          <td>{notaEtapa3Combinada.toFixed(2)}</td>
          <td>{porcentagemEtapa3Combinada.toFixed(2)}%</td>
        </tr>
        {/* Linha opcional mostrando a nota da redação separadamente (se incluída) */}
        {incluirRedacao && (
          <tr className="calc-linha-detalhe-redacao">
            <td style={{ paddingLeft: '25px' }}>↳ Redação</td> {/* Recuo para indicar subitem */}
            <td>{redacaoParaExibicao.toFixed(2)}</td>
            <td>-</td>{/* Porcentagem já inclusa na linha acima */}
          </tr>
        )}
        {/* Linha Final com classe prefixada */}
        <tr className="calc-linha-final">
          <td><b>Nota Final Ponderada</b></td>
          {/* Usa toFixed(2) para garantir formatação caso notaFinal seja número */}
          <td colSpan="2"><b>{(parseFloat(notaFinal) || 0).toFixed(2)}</b></td>
        </tr>
      </tbody>
    </table>
  );
}

export default TabelaDetalhadaResultado;