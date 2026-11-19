import type { Capitulo } from './regimento';
export const CAPITULOS_CODIGO: Capitulo[] = [
  { numero: 1, titulo: 'NOSSOS VALORES', artigos: [
    { id: 'c1', texto: 'Integridade: todos devem agir com honestidade, ética e coerência entre o que se diz e o que se faz, em qualquer situação.' },
    { id: 'c2', texto: 'Respeito à diversidade: a empresa valoriza as diferenças e garante tratamento igualitário a todas as pessoas, sem distinção de qualquer natureza.' },
    { id: 'c3', texto: 'Transparência: as comunicações internas e externas devem ser claras, verdadeiras e oportunas.' },
    { id: 'c4', texto: 'Responsabilidade: cada colaborador assume seus compromissos e responde pelas próprias decisões e atitudes.' },
  ] },
  { numero: 2, titulo: 'RELAÇÕES ENTRE COLABORADORES', artigos: [
    { id: 'c5', texto: 'É proibido o assédio moral, entendido como condutas abusivas e repetitivas que humilhem, constranjam ou desqualifiquem qualquer pessoa no ambiente de trabalho.', resumo: { tipo: 'nao_pode', texto: 'Não pode humilhar, constranger ou desqualificar colegas (assédio moral).' } },
    { id: 'c6', texto: 'É proibido o assédio sexual, compreendido como qualquer conduta de conotação sexual não desejada, seja verbal, física ou por meios digitais.', resumo: { tipo: 'nao_pode', texto: 'Não pode praticar qualquer conduta de conotação sexual não desejada.' } },
    { id: 'c7', texto: 'É proibida qualquer forma de discriminação por raça, cor, gênero, orientação sexual, religião, idade, deficiência, origem ou qualquer outra condição.', resumo: { tipo: 'nao_pode', texto: 'Não pode discriminar ninguém por raça, gênero, religião, idade ou qualquer condição.' } },
    { id: 'c8', texto: 'É vedado o nepotismo, caracterizado pelo favorecimento de parentes em contratações, promoções ou relações de subordinação direta.', resumo: { tipo: 'nao_pode', texto: 'Não pode favorecer parentes em contratações, promoções ou subordinação direta.' } },
  ] },
  { numero: 3, titulo: 'CLIENTES E FORNECEDORES', artigos: [
    { id: 'c9', texto: 'Os clientes devem ser atendidos com cortesia, qualidade, agilidade e honestidade, respeitando-se seus direitos e as normas de defesa do consumidor.' },
    { id: 'c10', texto: 'Os fornecedores serão selecionados por critérios técnicos e comerciais objetivos, sendo vedado qualquer favorecimento pessoal.', resumo: { tipo: 'nao_pode', texto: 'Não pode favorecer fornecedores por motivos pessoais.' } },
  ] },
  { numero: 4, titulo: 'CONFLITO DE INTERESSES', artigos: [
    { id: 'c11', texto: 'Há conflito de interesses quando interesses pessoais do colaborador possam influenciar, ou parecer influenciar, suas decisões profissionais.' },
    { id: 'c12', texto: 'São exemplos de conflito de interesses: participar de negociação com empresa da qual o colaborador ou parente seja sócio; exercer atividade paralela concorrente com os negócios da empresa; utilizar informações internas para obter vantagem pessoal.', resumo: { tipo: 'nao_pode', texto: 'Não pode negociar com empresa de parente, concorrer com a empresa ou usar informação interna em benefício próprio.' } },
    { id: 'c13', texto: 'Situações de possível conflito de interesses devem ser comunicadas imediatamente à liderança, que orientará a conduta adequada.', resumo: { tipo: 'pode', texto: 'Pode (e deve) consultar a liderança diante de possível conflito de interesses.' } },
  ] },
  { numero: 5, titulo: 'PRESENTES E BRINDES', artigos: [
    { id: 'c14', texto: 'É permitido aceitar brindes institucionais de valor até {{valor_brindes}}. Presentes acima desse valor, dinheiro ou vantagens de qualquer natureza devem ser recusados ou comunicados à liderança.', resumo: { tipo: 'pode', texto: 'Pode aceitar brindes institucionais de até {{valor_brindes}}.' } },
  ] },
  { numero: 6, titulo: 'INFORMAÇÕES CONFIDENCIAIS', artigos: [
    { id: 'c15', texto: 'Informações estratégicas, financeiras e dados pessoais de colaboradores, clientes e fornecedores devem ser protegidos, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei 13.709/2018).', resumo: { tipo: 'nao_pode', texto: 'Não pode divulgar dados pessoais ou informações estratégicas da empresa.' } },
    { id: 'c16', texto: 'O dever de sigilo permanece mesmo após o desligamento do colaborador.' },
  ] },
  { numero: 7, titulo: 'COMBATE À CORRUPÇÃO', artigos: [
    { id: 'c17', texto: 'É proibido oferecer, prometer ou receber qualquer vantagem indevida de agentes públicos ou privados, nos termos da Lei Anticorrupção (Lei 12.846/2013).', resumo: { tipo: 'nao_pode', texto: 'Não pode oferecer nem receber vantagem indevida (Lei Anticorrupção).' } },
  ] },
  { numero: 8, titulo: 'CANAL DE ÉTICA E DENÚNCIAS', artigos: [
    { id: 'c18', texto: 'Violações a este Código devem ser relatadas pelo canal de ética: {{canal}}.', resumo: { tipo: 'pode', texto: 'Pode relatar violações pelo canal de ética: {{canal}}.' } },
    { id: 'c19', texto: 'As denúncias são tratadas com sigilo, sendo garantida a não retaliação a quem relatar de boa-fé.', resumo: { tipo: 'pode', texto: 'Tem garantia de sigilo e de não retaliação ao denunciar de boa-fé.' } },
    { id: 'c20', texto: 'A apuração das denúncias será conduzida por {{responsavel}} em até {{prazo_apuracao}}.' },
  ] },
  { numero: 9, titulo: 'CONSEQUÊNCIAS DO DESCUMPRIMENTO', artigos: [
    { id: 'c21', texto: 'O descumprimento deste Código sujeita o colaborador às medidas disciplinares previstas no Regimento Interno, sem prejuízo das sanções legais cabíveis.' },
  ] },
  { numero: 10, titulo: 'COMPROMISSO', artigos: [
    { id: 'c22', texto: 'Cada colaborador se compromete a conhecer, cumprir e promover os princípios deste Código, formalizando sua ciência por meio do Termo de Ciência.' },
  ] },
];
