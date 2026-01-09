// Mapeamento de Segmentos para códigos (BI e automações)
export const SEGMENT_MAPPING = {
  'Metalúrgica': 'SEG-01',
  'Metalmecânica': 'SEG-02',
  'Caldeiraria': 'SEG-03',
  'Estruturas Metálicas': 'SEG-04',
  'Engenharia': 'SEG-05',
  'Construtoras': 'SEG-06',
  'Implemento Agrícola': 'SEG-07',
  'Implemento Rodoviário': 'SEG-08',
  'Agroindústria': 'SEG-09',
  'Óleo & Gás': 'SEG-10',
  'Química / Petroquímica': 'SEG-11',
  'Alimentos & Bebidas': 'SEG-12',
  'Papel e Celulose': 'SEG-13',
  'Manutenção Industrial': 'SEG-14',
  'Montagem Industrial': 'SEG-15',
  'Distribuidor de Aço': 'SEG-16',
  'Serralheria': 'SEG-17'
};

// Inverso: código -> segmento
export const CODE_TO_SEGMENT = Object.fromEntries(
  Object.entries(SEGMENT_MAPPING).map(([seg, code]) => [code, seg])
);

// Opções para formulário
export const SEGMENTS = Object.keys(SEGMENT_MAPPING);

export const COMPLEXITY_OPTIONS = ['Leve', 'Média', 'Pesada'];

export const APPLICATIONS = [
  'Tubos estruturais',
  'Tubos para condução',
  'Chapas',
  'Perfis',
  'Flanges e conexões',
  'Estruturas',
  'Projetos sob medida'
];

// Função auxiliar: obter código do segmento
export const getSegmentCode = (segment) => SEGMENT_MAPPING[segment] || null;

// Função auxiliar: obter segmento do código
export const getSegmentFromCode = (code) => CODE_TO_SEGMENT[code] || null;