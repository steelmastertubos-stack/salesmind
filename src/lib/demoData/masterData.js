// ============================================================
// SALESMIND DEMO - MASTER DATA DEFINITIONS
// Dados mestres para geração do ambiente de demonstração
// ============================================================

export const PRINCIPALS = [
  { name: 'MetalPrime Tubos e Perfis', cnpj: '12.345.678/0001-01', commission_policy: 'POR_MARGEM', commission_percentage: 0, use_vtk_commission_table: true },
  { name: 'SteelFlow Industrial', cnpj: '23.456.789/0001-02', commission_policy: 'FIXA', commission_percentage: 3.5, use_vtk_commission_table: false },
  { name: 'CarbonTech Solutions', cnpj: '34.567.890/0001-03', commission_policy: 'FIXA', commission_percentage: 4.0, use_vtk_commission_table: false },
  { name: 'Alpha Tubes Brasil', cnpj: '45.678.901/0001-04', commission_policy: 'FIXA', commission_percentage: 3.0, use_vtk_commission_table: false },
  { name: 'Master Steel Components', cnpj: '56.789.012/0001-05', commission_policy: 'FIXA', commission_percentage: 4.5, use_vtk_commission_table: false },
  { name: 'IronMax Industrial', cnpj: '67.890.123/0001-06', commission_policy: 'FIXA', commission_percentage: 3.8, use_vtk_commission_table: false },
];

export const SEGMENTS = [
  'Metalúrgica', 'Metalmecânica', 'Caldeiraria', 'Estruturas Metálicas',
  'Implemento Rodoviário', 'Engenharia', 'Construtoras', 'Agroindústria',
  'Óleo & Gás', 'Mineração', 'Papel e Celulose', 'Energia', 'Serralheria'
];

export const STATES_CITIES = {
  SP: ['São Paulo', 'Campinas', 'Sorocaba', 'São Bernardo do Campo', 'Santo André', 'Ribeirão Preto', 'Bauru', 'Piracicaba'],
  MG: ['Belo Horizonte', 'Contagem', 'Betim', 'Uberlândia', 'Juiz de Fora', 'Montes Claros'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'Foz do Iguaçu'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'Chapecó', 'Itajaí', 'Criciúma'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'Campos dos Goytacazes'],
  ES: ['Vitória', 'Serra', 'Vila Velha', 'Cariacica', 'Cachoeiro de Itapemirim'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Catalão'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
  BA: ['Salvador', 'Feira de Santana', 'Camaçari', 'Vitória da Conquista'],
  PE: ['Recife', 'Caruaru', 'Olinda', 'Petrolina', 'Paulista'],
};

export const CLIENT_NAMES_BY_SEGMENT = {
  'Metalúrgica': [
    'Metalúrgica Horizonte', 'Metalúrgica Paraíso', 'Metalúrgica Central', 'Metais Nordeste',
    'Metalúrgica Sudeste', 'Metalúrgica Progresso', 'Metais & Cia', 'Fundição Sul',
    'Metalúrgica Exata', 'Metalúrgica Forte', 'Metalúrgica Unida', 'Metais Premium',
    'Metalúrgica Vitória', 'Metalúrgica Nacional', 'Metalúrgica Alfa'
  ],
  'Metalmecânica': [
    'Mecânica Industrial Ltda', 'TechMec Solutions', 'Usinagem Precisa', 'MecaFlex Industrial',
    'Tornearia Moderna', 'Mecânica Avançada', 'Usinagem Exata', 'PrecisionMec',
    'MetalMec Brasil', 'Tornearia Industrial', 'Usinagem Sul', 'MecaTech'
  ],
  'Caldeiraria': [
    'Caldeiraria Central', 'Vasos & Equipamentos', 'Caldeiraria Industrial',
    'Tanques & Estruturas', 'Caldeiraria Moderna', 'ThermoVasos', 'Caldeiraria Técnica',
    'Vasos Industriais Brasil', 'Caldeiraria do Sul', 'EquipMet'
  ],
  'Estruturas Metálicas': [
    'Estruturas & Galpões', 'Metalest Industrial', 'Construmetal Brasil', 'EstruturAço',
    'Galpões & Coberturas', 'Metalcon Engenharia', 'AçoEstrutura', 'Montagem Industrial',
    'EstruturaMet', 'PortaisMetálicos', 'Cobertura Industrial'
  ],
  'Implemento Rodoviário': [
    'Implementos Rodovida', 'Rodoviário Premium', 'Carrocerias Brasil', 'Trailers Sul',
    'Implementos Rápidos', 'Carroceria Industrial', 'Rodocar Implementos', 'TrailerTech',
    'Implementos Pesados', 'Carrocerias Modernas'
  ],
  'Engenharia': [
    'Engenharia & Projetos', 'Construção Civil Industrial', 'Projeto & Obra',
    'Construtora Moderna', 'Engenharia Aplicada', 'ProjetoMet', 'Construções Técnicas',
    'Obras & Projetos', 'Engecivil', 'ProjetosIndustriais'
  ],
  'Construtoras': [
    'Construtora Atlântica', 'Construtora Horizonte', 'Construtora Brasil',
    'Obras & Reformas', 'Construtora Nacional', 'Empreendimentos Sul', 'Construtora Forte',
    'Obras Técnicas', 'Construtora Unida', 'CivilTech'
  ],
  'Agroindústria': [
    'Agroindústria Central', 'Equipamentos Agrícolas Sul', 'AgriMet',
    'Máquinas Rurais Brasil', 'AgroEquip', 'Equipamentos do Campo', 'AgriSteel',
    'Máquinas Agrícolas Premium', 'AgroTech Industrial', 'FieldMet'
  ],
  'Óleo & Gás': [
    'Petróleo & Derivados', 'OilMet Industrial', 'GasMet Equipamentos',
    'PetroStructures', 'EnergiaOff-Shore', 'OilField Solutions', 'GasSystem'
  ],
  'Mineração': [
    'Mineração Central', 'Extração Industrial', 'MineMet Equipamentos',
    'Mineração Sul', 'Extração Pesada', 'MinerTech', 'MineMetal'
  ],
  'Papel e Celulose': [
    'Celulose Industrial', 'Papel & Derivados', 'PapelMet', 'Celulose Sul',
    'Indústria do Papel', 'CelulMet', 'Papel Industrial'
  ],
  'Energia': [
    'Energia Renovável Sul', 'EnerMet Solutions', 'Power Industrial',
    'Energia & Estruturas', 'PowerSteel', 'Eletrometal'
  ],
  'Serralheria': [
    'Serralheria Industrial', 'Ferro & Arte', 'Serralheria Técnica',
    'FerroMet', 'Serralheria Moderna', 'Grades & Portões', 'SerraFlex'
  ],
};

// Faturamento mensal target (em R$)
export const MONTHLY_TARGETS = {
  1: 450000, 2: 520000, 3: 610000, 4: 700000,
  5: 850000, 6: 920000, 7: 1050000, 8: 1200000,
  9: 1350000, 10: 1500000, 11: 1250000, 12: 900000
};

export const PRODUCT_CATEGORIES = [
  { category: 'tubos_quadrados_retangulares', label: 'Tubos Quadrados/Retangulares', ipi: 5 },
  { category: 'tubos_redondos', label: 'Tubos Redondos', ipi: 5 },
  { category: 'chapas', label: 'Chapas', ipi: 0 },
  { category: 'perfis', label: 'Perfis', ipi: 5 },
  { category: 'cantoneiras', label: 'Cantoneiras', ipi: 5 },
  { category: 'vigas', label: 'Vigas', ipi: 5 },
];

export const PRODUCT_SPECS = [
  // Tubos Quadrados
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 20x20x1,50', code: 'TQ-20201', price: 8.50, factor: 4.2 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 25x25x1,50', code: 'TQ-25251', price: 9.20, factor: 5.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 30x30x1,50', code: 'TQ-30301', price: 9.80, factor: 7.0 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 30x30x2,00', code: 'TQ-30302', price: 10.50, factor: 9.2 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 40x40x1,50', code: 'TQ-40401', price: 10.20, factor: 9.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 40x40x2,00', code: 'TQ-40402', price: 11.00, factor: 12.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 50x50x2,00', code: 'TQ-50502', price: 11.50, factor: 15.8 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 50x50x3,00', code: 'TQ-50503', price: 12.50, factor: 23.4 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 60x60x2,00', code: 'TQ-60602', price: 12.00, factor: 19.2 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 60x60x3,00', code: 'TQ-60603', price: 13.20, factor: 28.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 80x80x3,00', code: 'TQ-80803', price: 13.80, factor: 38.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 80x80x4,00', code: 'TQ-80804', price: 14.50, factor: 50.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 100x100x3,00', code: 'TQ-100003', price: 14.20, factor: 48.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Quadrado 100x100x4,00', code: 'TQ-100004', price: 15.50, factor: 64.2 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 30x20x1,50', code: 'TR-30201', price: 9.50, factor: 5.8 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 40x20x1,50', code: 'TR-40201', price: 10.00, factor: 7.2 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 50x30x2,00', code: 'TR-50302', price: 11.20, factor: 13.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 60x40x2,00', code: 'TR-60402', price: 11.80, factor: 17.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 80x40x2,00', code: 'TR-80402', price: 12.20, factor: 21.5 },
  { cat: 'tubos_quadrados_retangulares', name: 'Tubo Retangular 100x50x3,00', code: 'TR-100503', price: 13.50, factor: 35.5 },
  // Tubos Redondos
  { cat: 'tubos_redondos', name: 'Tubo Redondo 1/2" SCH40', code: 'TRD-0012', price: 12.50, factor: 6.2 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 3/4" SCH40', code: 'TRD-0034', price: 13.20, factor: 9.1 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 1" SCH40', code: 'TRD-0100', price: 14.50, factor: 13.4 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 1.1/4" SCH40', code: 'TRD-0114', price: 15.20, factor: 17.8 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 1.1/2" SCH40', code: 'TRD-0112', price: 16.00, factor: 21.5 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 2" SCH40', code: 'TRD-0200', price: 18.50, factor: 29.8 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 2.1/2" SCH40', code: 'TRD-0212', price: 21.00, factor: 42.5 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 3" SCH40', code: 'TRD-0300', price: 24.50, factor: 56.8 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 4" SCH40', code: 'TRD-0400', price: 28.00, factor: 78.5 },
  { cat: 'tubos_redondos', name: 'Tubo Redondo 6" SCH40', code: 'TRD-0600', price: 38.00, factor: 125.0 },
  { cat: 'tubos_redondos', name: 'Tubo Mecânico 25,4x2,0', code: 'TM-25402', price: 13.50, factor: 11.5 },
  { cat: 'tubos_redondos', name: 'Tubo Mecânico 31,75x2,0', code: 'TM-31752', price: 14.20, factor: 14.8 },
  { cat: 'tubos_redondos', name: 'Tubo Mecânico 38,1x2,0', code: 'TM-38102', price: 15.00, factor: 18.2 },
  { cat: 'tubos_redondos', name: 'Tubo Mecânico 50,8x2,0', code: 'TM-50802', price: 16.50, factor: 24.5 },
  { cat: 'tubos_redondos', name: 'Tubo Mecânico 63,5x3,0', code: 'TM-63503', price: 18.00, factor: 43.5 },
  // Chapas
  { cat: 'chapas', name: 'Chapa Grossa 3/16" (4,76mm)', code: 'CG-476', price: 7.80, factor: 22.6 },
  { cat: 'chapas', name: 'Chapa Grossa 1/4" (6,35mm)', code: 'CG-635', price: 8.20, factor: 30.2 },
  { cat: 'chapas', name: 'Chapa Grossa 5/16" (7,93mm)', code: 'CG-793', price: 8.50, factor: 37.8 },
  { cat: 'chapas', name: 'Chapa Grossa 3/8" (9,52mm)', code: 'CG-952', price: 8.80, factor: 45.3 },
  { cat: 'chapas', name: 'Chapa Grossa 1/2" (12,7mm)', code: 'CG-1270', price: 9.20, factor: 60.5 },
  { cat: 'chapas', name: 'Chapa Fina 1,25mm', code: 'CF-125', price: 9.50, factor: 5.9 },
  { cat: 'chapas', name: 'Chapa Fina 1,50mm', code: 'CF-150', price: 9.20, factor: 7.1 },
  { cat: 'chapas', name: 'Chapa Fina 2,00mm', code: 'CF-200', price: 8.80, factor: 9.5 },
  { cat: 'chapas', name: 'Chapa Fina 2,65mm', code: 'CF-265', price: 8.50, factor: 12.6 },
  { cat: 'chapas', name: 'Chapa Fina 3,00mm', code: 'CF-300', price: 8.20, factor: 14.2 },
  // Perfis
  { cat: 'perfis', name: 'Perfil U 25x15x3,0', code: 'PU-25153', price: 10.50, factor: 18.5 },
  { cat: 'perfis', name: 'Perfil U 38x19x3,5', code: 'PU-38193', price: 11.20, factor: 27.8 },
  { cat: 'perfis', name: 'Perfil U 50x25x4,0', code: 'PU-50254', price: 12.00, factor: 38.5 },
  { cat: 'perfis', name: 'Perfil U 75x40x5,0', code: 'PU-75405', price: 12.80, factor: 65.2 },
  { cat: 'perfis', name: 'Perfil U 100x50x5,0', code: 'PU-100505', price: 13.50, factor: 85.5 },
  { cat: 'perfis', name: 'Perfil I 80x40x4,0', code: 'PI-80404', price: 12.50, factor: 52.5 },
  { cat: 'perfis', name: 'Perfil I 100x50x5,0', code: 'PI-100505', price: 13.20, factor: 72.5 },
  { cat: 'perfis', name: 'Perfil H 100x100x6,0', code: 'PH-100006', price: 14.50, factor: 92.5 },
  { cat: 'perfis', name: 'Perfil H 150x150x7,0', code: 'PH-150007', price: 15.20, factor: 145.0 },
  { cat: 'perfis', name: 'Perfil H 200x200x8,0', code: 'PH-200008', price: 16.00, factor: 198.0 },
  // Cantoneiras
  { cat: 'cantoneiras', name: 'Cantoneira 3/4" x 1/8"', code: 'CA-0112', price: 9.80, factor: 12.5 },
  { cat: 'cantoneiras', name: 'Cantoneira 1" x 1/8"', code: 'CA-0118', price: 10.20, factor: 17.2 },
  { cat: 'cantoneiras', name: 'Cantoneira 1.1/4" x 3/16"', code: 'CA-114316', price: 10.80, factor: 26.5 },
  { cat: 'cantoneiras', name: 'Cantoneira 1.1/2" x 3/16"', code: 'CA-112316', price: 11.20, factor: 32.5 },
  { cat: 'cantoneiras', name: 'Cantoneira 2" x 1/4"', code: 'CA-0214', price: 11.80, factor: 45.5 },
  { cat: 'cantoneiras', name: 'Cantoneira 2.1/2" x 1/4"', code: 'CA-21214', price: 12.50, factor: 57.5 },
  { cat: 'cantoneiras', name: 'Cantoneira 3" x 5/16"', code: 'CA-0350', price: 13.50, factor: 86.5 },
  // Vigas
  { cat: 'vigas', name: 'Viga I 100x50', code: 'VI-10050', price: 8.50, factor: 76.5 },
  { cat: 'vigas', name: 'Viga I 150x75', code: 'VI-15075', price: 8.80, factor: 127.0 },
  { cat: 'vigas', name: 'Viga I 200x100', code: 'VI-200100', price: 9.20, factor: 186.5 },
  { cat: 'vigas', name: 'Viga I 250x125', code: 'VI-250125', price: 9.50, factor: 258.0 },
  { cat: 'vigas', name: 'Viga H 100x100', code: 'VH-100100', price: 9.20, factor: 98.5 },
  { cat: 'vigas', name: 'Viga H 150x150', code: 'VH-150150', price: 9.80, factor: 168.5 },
  { cat: 'vigas', name: 'Viga H 200x200', code: 'VH-200200', price: 10.50, factor: 278.5 },
];

export const LOSS_REASONS = [
  'preco', 'prazo_entrega', 'concorrencia', 'estoque_indisponivel',
  'condicao_pagamento', 'qualidade_tecnica', 'cliente_desistiu'
];