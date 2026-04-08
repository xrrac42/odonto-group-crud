/**
 * Produtos e Planos Definitivos
 * Valores calculados automaticamente - NUNCA permita que o usuário passe um valor
 * 
 * Estrutura:
 * - Produto (categoria principal)
 *   - Planos (opções dentro da categoria)
 *     - Valor mensal (fixo, definido aqui)
 */

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  planType: string;
  docusealTemplateId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  plans: Plan[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'product_001',
    name: 'Telemedicina + Assistências',
    description: 'Serviços de telemedicina e assistências gerais',
    plans: [
      {
        id: 'plan_001_001',
        name: 'Ligue Bem-estar',
        monthlyPrice: 49.50,
        planType: 'ligue_bem_estar',
        docusealTemplateId: 'TEMPLATE_LIGUE_BEM_ESTAR',
      },
      {
        id: 'plan_001_002',
        name: 'Ligue Família Protegida',
        monthlyPrice: 59.90,
        planType: 'ligue_familia_protegida',
        docusealTemplateId: 'TEMPLATE_LIGUE_FAMILIA_PROTEGIDA',
      },
      {
        id: 'plan_001_003',
        name: 'Ligue Proteção 360',
        monthlyPrice: 69.19,
        planType: 'ligue_protecao_360',
        docusealTemplateId: 'TEMPLATE_LIGUE_PROTECAO_360',
      },
    ],
  },
  {
    id: 'product_002',
    name: 'Planos Odontológicos',
    description: 'Planos de cobertura odontológica',
    plans: [
      {
        id: 'plan_002_001',
        name: 'Odonto Caixa Alfa',
        monthlyPrice: 48.40,
        planType: 'odonto_caixa_alfa',
        docusealTemplateId: 'TEMPLATE_ODONTO_CAIXA_ALFA',
      },
      {
        id: 'plan_002_002',
        name: 'Odonto Caixa Beta',
        monthlyPrice: 42.00,
        planType: 'odonto_caixa_beta',
        docusealTemplateId: 'TEMPLATE_ODONTO_CAIXA_BETA',
      },
      {
        id: 'plan_002_003',
        name: 'Odonto Caixa Delta',
        monthlyPrice: 157.43,
        planType: 'odonto_caixa_delta',
        docusealTemplateId: 'TEMPLATE_ODONTO_CAIXA_DELTA',
      },
    ],
  },
  {
    id: 'product_003',
    name: 'Telemedicina',
    description: 'Serviços exclusivos de telemedicina',
    plans: [
      {
        id: 'plan_003_001',
        name: 'Ligue Saúde em Dia',
        monthlyPrice: 39.90,
        planType: 'ligue_saude_em_dia',
        docusealTemplateId: 'TEMPLATE_LIGUE_SAUDE_EM_DIA',
      },
      {
        id: 'plan_003_002',
        name: 'Ligue Viver Bem',
        monthlyPrice: 69.90,
        planType: 'ligue_viver_bem',
        docusealTemplateId: 'TEMPLATE_LIGUE_VIVER_BEM',
      },
      {
        id: 'plan_003_003',
        name: 'Liga Vida Plena',
        monthlyPrice: 47.66,
        planType: 'liga_vida_plena',
        docusealTemplateId: 'TEMPLATE_LIGA_VIDA_PLENA',
      },
      {
        id: 'plan_003_004',
        name: 'Ligue Mais Cuidado',
        monthlyPrice: 55.27,
        planType: 'ligue_mais_cuidado',
        docusealTemplateId: 'TEMPLATE_LIGUE_MAIS_CUIDADO',
      },
      {
        id: 'plan_003_005',
        name: 'Ligue Cuidado Total',
        monthlyPrice: 60.00,
        planType: 'ligue_cuidado_total',
        docusealTemplateId: 'TEMPLATE_LIGUE_CUIDADO_TOTAL',
      },
    ],
  },
];

/**
 * Função utilitária para buscar plano por ID
 */
export function getPlanById(planId: string): Plan | undefined {
  for (const product of PRODUCTS) {
    const plan = product.plans.find(p => p.id === planId);
    if (plan) return plan;
  }
  return undefined;
}

/**
 * Função utilitária para buscar preço mensal baseado no planType
 * NUNCA deixe valor vir do usuário - sempre use essa função
 */
export function getMonthlyPrice(planType: string): number {
  for (const product of PRODUCTS) {
    for (const plan of product.plans) {
      if (plan.planType === planType) {
        return plan.monthlyPrice;
      }
    }
  }
  console.warn(`Warning: Plan ${planType} not found! Returning 0`);
  return 0;
}

/**
 * Mapeia o planType interno para o planType suportado pelo backend
 * Retorna o planType direto pois agora estão alinhados com os IDs do backend
 */
export function getPlanTypeForBackend(planType: string): string {
  for (const product of PRODUCTS) {
    for (const plan of product.plans) {
      if (plan.planType === planType) {
        return plan.planType; // Retorna o planType do plano (já é o ID do backend)
      }
    }
  }
  console.warn(`Warning: Plan ${planType} not found in backend!`);
  return planType; // Fallback: retorna o planType original
}

/**
 * Função para obter o template ID do DocuSeal baseado no planType
 */
export function getDocusealTemplateId(planType: string): string {
  for (const product of PRODUCTS) {
    for (const plan of product.plans) {
      if (plan.planType === planType) {
        return plan.docusealTemplateId;
      }
    }
  }
  console.warn(`Warning: Plan ${planType} not found! Using dev template`);
  return '2847449';
}

/**
 * Função para calcular valor com dependentes
 * Cada dependente adiciona 50% do valor base
 */
export function calculatePriceWithDependents(
  planType: string,
  numberOfDependents: number = 0
): number {
  const basePrice = getMonthlyPrice(planType);
  if (numberOfDependents <= 0) return basePrice;
  
  const dependentCost = basePrice * 0.5 * numberOfDependents;
  return basePrice + dependentCost;
}

/**
 * Todos os tipos de planos válidos suportados pelo backend
 */
export const VALID_PLAN_TYPES = [
  'ligue_bem_estar',
  'ligue_familia_protegida',
  'ligue_protecao_360',
  'odonto_caixa_alfa',
  'odonto_caixa_beta',
  'odonto_caixa_delta',
  'ligue_saude_em_dia',
  'ligue_viver_bem',
  'liga_vida_plena',
  'ligue_mais_cuidado',
  'ligue_cuidado_total',
] as const;
