export type Resumo = { tipo: "pode" | "nao_pode"; texto: string };
export type Artigo = { id: string; texto: string; resumo?: Resumo };
export type Capitulo = { numero: number; titulo: string; artigos: Artigo[] };

export const CAPITULOS: Capitulo[] = [
  {
    numero: 1,
    titulo: "DISPOSIÇÕES GERAIS E APLICABILIDADE",
    artigos: [
      { id: "a1", texto: "O presente Regimento Interno é instituído com fundamento no poder diretivo do empregador, previsto no artigo 2º da Consolidação das Leis do Trabalho (CLT), que confere ao empregador o direito de dirigir, regulamentar e fiscalizar a prestação de serviços." },
      { id: "a2", texto: "As disposições contidas neste regimento se aplicam a todos os colaboradores, independentemente do cargo, função, setor ou tempo de serviço, sendo extensivo a estagiários e prestadores de serviço que atuem nas dependências da empresa." },
      { id: "a3", texto: "A adesão ao Regimento Interno não está condicionada à concordância expressa dos funcionários, uma vez que o poder diretivo do empregador, conforme estabelecido pelo artigo 2º da CLT, confere à empresa a prerrogativa de definir as regras a serem seguidas no âmbito das relações de trabalho." },
      { id: "a4", texto: "Ao ingressar na empresa, o colaborador reconhece que tomou ciência deste Regimento Interno, e que o descumprimento de qualquer de suas disposições poderá resultar em sanções disciplinares, de acordo com as penalidades previstas neste documento e na legislação vigente." },
    ],
  },
  {
    numero: 2,
    titulo: "JORNADA DE TRABALHO E CONTROLE DE PONTO",
    artigos: [
      { id: "a5", texto: "Horário de trabalho é o tempo efetivamente à disposição da empresa, não sendo considerado tempo à disposição, dentre outras, as seguintes atividades: tempo despendido para orações e atividades espirituais; tempo para higiene pessoal e troca de roupa; tempo para se alimentar ou descansar; tempo para fumar ou realização de outros hábitos.", resumo: { tipo: "nao_pode", texto: "Não conta como jornada: orações, higiene pessoal, refeição, descanso ou fumo." } },
      { id: "a6", texto: "Todos os colaboradores estão obrigados a registrar o horário de entrada, saída e intervalos para refeição por meio do sistema de controle de ponto adotado pela empresa. O não registro da jornada de trabalho ou o registro incorreto será considerado infração disciplinar, podendo acarretar em penalidades.", resumo: { tipo: "nao_pode", texto: "Não pode deixar de registrar (ou registrar errado) entrada, saída e intervalos no ponto." } },
      { id: "a7", texto: "Será admitida tolerância de até {{tolerancia_min}} diários, somados na entrada e saída, conforme art. 58, §1º da CLT. Atrasos superiores a esse limite poderão gerar desconto proporcional ou compensação no mesmo mês, a critério da empresa.", resumo: { tipo: "pode", texto: "Pode se atrasar até {{tolerancia_min}} diários (entrada + saída) sem desconto." } },
      { id: "a8", texto: "As horas trabalhadas além da jornada diária ou semanal previamente estabelecida serão consideradas horas extras e dada a destinação conforme a lei e contratos individualmente firmados. A realização de horas extras somente será permitida mediante autorização expressa da chefia imediata.", resumo: { tipo: "nao_pode", texto: "Não pode fazer hora extra sem autorização expressa da chefia imediata." } },
      { id: "a9", texto: "O intervalo intrajornada é o período destinado ao descanso e à refeição durante a jornada diária de trabalho e deve ser cumprido de acordo com a carga horária estabelecida. Entre duas jornadas de trabalho, o colaborador terá direito a um intervalo interjornada mínimo de {{interjornada_h}} consecutivas para descanso.", resumo: { tipo: "pode", texto: "Tem direito a um intervalo mínimo de {{interjornada_h}} entre duas jornadas de trabalho." } },
      { id: "a10", texto: "O funcionário possui {{prazo_h}} após o retorno ao trabalho para trazer a justificativa da sua falta, devendo, quando possível, avisar acerca da sua ausência pelos meios ordinariamente conhecidos de forma imediata (Telefone, mensagens, e-mail, etc).", resumo: { tipo: "pode", texto: "Tem até {{prazo_h}} após o retorno para justificar uma falta." } },
    ],
  },
  {
    numero: 3,
    titulo: "CONDUTA PROFISSIONAL E COMPORTAMENTO",
    artigos: [
      { id: "a11", texto: "A empresa estabelece padrões de vestimenta adequados ao ambiente profissional. As determinações devem ser cumpridas observando os padrões mínimos estabelecidos pela empresa, mantendo sempre a apresentação pessoal condizente com a função exercida.", resumo: { tipo: "nao_pode", texto: "Não pode deixar de seguir os padrões mínimos de vestimenta definidos pela empresa." } },
      { id: "a12", texto: "A empresa adota política de tolerância zero quanto a qualquer forma de assédio, incluindo insinuações, toques não autorizados, perseguições, piadas ofensivas ou discriminação por gênero, cor, orientação sexual ou aparência. Situações suspeitas devem ser imediatamente comunicadas ao canal de ética da empresa ou à liderança direta.", resumo: { tipo: "nao_pode", texto: "Não pode praticar assédio, insinuações, toques não autorizados, piadas ofensivas ou discriminação." } },
      { id: "a13", texto: "É vedado ao(à) colaborador(a) utilizar redes sociais, inclusive em perfil pessoal, para expor informações internas da empresa que sejam protegidas por sigilo, fazer críticas infundadas ou proferir opiniões que possam comprometer a imagem da empresa, de colegas ou de clientes.", resumo: { tipo: "nao_pode", texto: "Não pode expor informações internas nem criticar a empresa, colegas ou clientes nas redes sociais." } },
      { id: "a14", texto: "Ao utilizar o uniforme ou qualquer item com identificação da empresa fora do ambiente de trabalho, o(a) colaborador(a) compromete-se a manter conduta exemplar, compatível com os valores institucionais, sob pena de sanções em caso de comportamento inadequado.", resumo: { tipo: "nao_pode", texto: "Não pode ter conduta inadequada usando uniforme ou identificação da empresa fora do trabalho." } },
    ],
  },
  {
    numero: 4,
    titulo: "PROIBIÇÕES E RESTRIÇÕES",
    artigos: [
      { id: "a15", texto: "É expressamente proibido realizar mútuo entre particulares envolvendo funcionários ou clientes, bem como tratar assuntos de foro pessoal ou receber encomendas que não sejam referentes ao trabalho.", resumo: { tipo: "nao_pode", texto: "Não pode fazer empréstimos entre particulares, tratar assuntos pessoais ou receber encomendas no trabalho." } },
      { id: "a16", texto: "É proibido compartilhar logins e senhas com outros colegas de trabalho, bem como o acesso não autorizado a sistemas, softwares, contas de e-mail corporativo, e outros equipamentos da empresa que não sejam diretamente relacionados às atividades do colaborador.", resumo: { tipo: "nao_pode", texto: "Não pode compartilhar login/senha nem acessar sistemas ou e-mail corporativo sem autorização." } },
      { id: "a17", texto: "Não é permitida a utilização pelo colaborador de equipamentos portáteis particulares (Celulares, Tablets, Notebooks, Rádios, MP3 Players, etc) em seu posto de trabalho ou enquanto estiver desempenhando sua função, exceto para finalidades de trabalho mediante autorização expressa.", resumo: { tipo: "nao_pode", texto: "Não pode usar celular, tablet ou notebook particular no posto de trabalho sem autorização." } },
      { id: "a18", texto: "É proibido o uso da internet corporativa para fins pessoais, como acesso a redes sociais, sites de entretenimento, jogos online, compras, e outros que não estejam relacionados ao desempenho das atividades profissionais.", resumo: { tipo: "nao_pode", texto: "Não pode usar a internet corporativa para fins pessoais (redes sociais, jogos, compras etc.)." } },
      { id: "a19", texto: "É expressamente proibido o consumo de bebidas alcoólicas e substâncias ilícitas nas dependências da empresa, assim como a entrada no local de trabalho sob efeito de tais substâncias. O descumprimento será considerado falta gravíssima.", resumo: { tipo: "nao_pode", texto: "Não pode consumir álcool ou substâncias ilícitas na empresa, nem trabalhar sob efeito delas." } },
      { id: "a20", texto: "É proibida a entrada de visitantes, familiares, ou qualquer pessoa não autorizada nas dependências da empresa, exceto quando previamente autorizado. É também proibido fumar nas dependências internas da empresa, exceto nas áreas expressamente designadas.", resumo: { tipo: "nao_pode", texto: "Não pode receber visitantes não autorizados; só pode fumar nas áreas designadas." } },
      { id: "a21", texto: "É proibido divulgar, compartilhar ou repassar informações confidenciais da empresa, de clientes ou de parceiros, sem autorização expressa da direção. O descumprimento será considerado falta gravíssima.", resumo: { tipo: "nao_pode", texto: "Não pode divulgar informações confidenciais da empresa, de clientes ou de parceiros." } },
      { id: "a22", texto: "É proibida a apropriação, para uso pessoal, de qualquer material, equipamento ou insumo pertencente à empresa sem autorização. O colaborador flagrado poderá ser punido com advertências, suspensão e, em casos graves, demissão por justa causa.", resumo: { tipo: "nao_pode", texto: "Não pode se apropriar de material ou equipamento da empresa para uso pessoal." } },
    ],
  },
  {
    numero: 5,
    titulo: "SAÚDE E SEGURANÇA NO TRABALHO",
    artigos: [
      { id: "a23", texto: "A empresa fornecerá gratuitamente todos os Equipamentos de Proteção Individual (EPIs) necessários para o desempenho seguro das funções, conforme exigências legais. É obrigatório o uso correto dos EPIs fornecidos, sendo responsabilidade do(a) colaborador(a) zelar pela sua conservação.", resumo: { tipo: "pode", texto: "Recebe gratuitamente os EPIs necessários e deve usá-los e conservá-los corretamente." } },
      { id: "a24", texto: "Antes do início das atividades que exigem o uso de EPIs, o(a) colaborador(a) receberá treinamento técnico e prático sobre a correta utilização e conservação dos equipamentos. O recebimento será formalizado por meio de termo de entrega.", resumo: { tipo: "pode", texto: "Recebe treinamento sobre o uso dos EPIs antes de iniciar as atividades que exigem seu uso." } },
      { id: "a25", texto: "A empresa poderá realizar fiscalizações periódicas quanto ao uso dos EPIs, tanto nos postos de trabalho quanto em áreas de circulação. O descumprimento das normas de segurança poderá gerar medidas disciplinares.", resumo: { tipo: "nao_pode", texto: "Não pode ignorar as normas de segurança fiscalizadas periodicamente pela empresa." } },
      { id: "a26", texto: "Todo acidente, incidente ou situação de risco (incluindo 'quase acidentes') deverá ser comunicado imediatamente à liderança. A empresa fará o registro e adotará as providências legais e preventivas. A omissão poderá ser considerada infração grave.", resumo: { tipo: "nao_pode", texto: "Não pode deixar de comunicar imediatamente acidentes, incidentes ou quase-acidentes." } },
    ],
  },
  {
    numero: 6,
    titulo: "MEDIDAS DISCIPLINARES E PUNIÇÕES",
    artigos: [
      { id: "a27", texto: "O funcionário está ciente que, desde que havendo previsão em contrato de trabalho ou aditivo, lhe serão descontados os danos causados de forma dolosa e culposa, aplicando-se às máquinas ou equipamentos que por ventura o funcionário venha perder ou danificar por uso indevido.", resumo: { tipo: "nao_pode", texto: "Não pode danificar ou perder, por dolo ou culpa, máquinas e equipamentos sem sofrer desconto (se previsto em contrato)." } },
      { id: "a28", texto: "As infrações a este regimento interno serão punidas com as seguintes medidas: a) Advertência verbal; b) Advertência escrita; c) Suspensão disciplinar de {{suspensao}}; d) Demissão por justa causa. A aplicação das penalidades não obedece necessariamente a uma ordem sequencial, podendo a empresa aplicar diretamente a penalidade mais adequada à gravidade da infração." },
      { id: "a29", texto: "Será ofertado ao funcionário a possibilidade de se defender antes de aplicação da medida disciplinar, sendo que a punição somente surtirá efeito após relatório de não procedência da defesa ou decurso do prazo para apresentação da mesma.", resumo: { tipo: "pode", texto: "Tem direito de se defender antes de qualquer penalidade disciplinar ser aplicada." } },
    ],
  },
  {
    numero: 7,
    titulo: "PROTEÇÃO DE DADOS E SIGILO",
    artigos: [
      { id: "a30", texto: "O empregado está ciente que poderá lidar com tratamento de dados pessoais no exercício da função, oportunidade em que seguirá os manuais de boas práticas e orientações proferidas pela empresa." },
      { id: "a31", texto: "O vazamento de dados ou utilização inapropriada dos mesmos poderá levar a justa causa, sem prejuízo de outras sanções cabíveis nas esferas cível, criminal e administrativa.", resumo: { tipo: "nao_pode", texto: "Não pode vazar ou usar indevidamente dados pessoais tratados no trabalho (pode levar a justa causa)." } },
      { id: "a32", texto: "O(A) EMPREGADO(A) deverá manter em sigilo, durante a vigência do presente termo e mesmo após sua extinção, sobre qualquer informação relativa aos negócios, políticas, segredos comerciais, organizacionais, criações, lista de funcionários, bem como outras informações relativas aos negócios da EMPREGADORA.", resumo: { tipo: "nao_pode", texto: "Não pode revelar segredos comerciais ou organizacionais da empresa, mesmo após o fim do contrato." } },
    ],
  },
  {
    numero: 8,
    titulo: "RELAÇÕES INTERPESSOAIS",
    artigos: [
      { id: "a33", texto: "As questões íntimas e particulares não devem interferir na rotina de trabalho, sejam elas discussões ou demonstrações públicas de afeto.", resumo: { tipo: "nao_pode", texto: "Não pode deixar questões íntimas ou discussões pessoais interferirem na rotina de trabalho." } },
      { id: "a34", texto: "A empresa não é contrária a relacionamentos afetivos e nem a relação de parentesco entre colaboradores, desde que não se verifique conflito de interesses nos termos deste código e das políticas pertinentes.", resumo: { tipo: "pode", texto: "Pode manter relacionamento afetivo ou parentesco com colegas, desde que sem conflito de interesse." } },
    ],
  },
  {
    numero: 9,
    titulo: "DENÚNCIAS E CANAL DE ÉTICA",
    artigos: [
      { id: "a35", texto: "A empresa disponibiliza canal de ética para comunicação de irregularidades, violações deste regimento ou situações que possam comprometer o ambiente de trabalho. As denúncias serão tratadas com confidencialidade.", resumo: { tipo: "pode", texto: "Pode denunciar irregularidades pelo canal de ética, com tratamento confidencial." } },
      { id: "a36", texto: "A empresa garante proteção contra retaliações aos colaboradores que, de boa-fé, reportem violações ou irregularidades através dos canais apropriados.", resumo: { tipo: "pode", texto: "Tem garantia de proteção contra retaliação ao denunciar irregularidades de boa-fé." } },
    ],
  },
];
