// components/sales/steps/StepClientData.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { PRODUCTS, getMonthlyPrice, VALID_PLAN_TYPES } from '../../../constants/products';
import type { SaleFormData } from '../../../types';

interface DependentItem {
  nome: string;
  cpf: string;
}

const energiaCompanhias = [
  'Neoenergia Cosern',
  'Neoenergia Elektro',
  'CPFL CIA Piratininga Força Luz',
  'CPFL Grupo RGE',
  'CPFL CIA Santa Cruz',
  'Enel Distribuição Ceará',
  'Enel Distribuição Rio de Janeiro',
  'Enel Distribuição São Paulo',
  'EDP São Paulo',
  'EDP Espírito Santo',
] as const;

const clientDataSchema = z.object({
  client_nome: z.string().min(1, 'Nome é obrigatório'),
  client_cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  client_data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  client_nome_mae: z.string().min(1, 'Nome da mãe é obrigatório'),
  client_endereco_completo: z.string().optional(),
  client_email: z.string().email('Email inválido'),
  client_telefone: z.string().min(1, 'Telefone é obrigatório'),
  client_matricula_origem: z.string().optional(),
  client_orgao_origem: z.string().optional(),
  client_rg: z.string().optional(),
  client_orgao_expedidor: z.string().optional(),
  client_sexo: z.string().min(1, 'Sexo é obrigatório'),
  client_estado_civil: z.string().min(1, 'Estado civil é obrigatório'),
  client_nome_social: z.string().optional(),
  client_endereco_logradouro: z.string().min(1, 'Logradouro é obrigatório (via CEP)'),
  client_endereco_numero: z.string().optional(),
  client_endereco_complemento: z.string().optional(),
  client_endereco_bairro: z.string().min(1, 'Bairro é obrigatório (via CEP)'),
  client_endereco_cidade: z.string().min(1, 'Cidade é obrigatória (via CEP)'),
  client_endereco_uf: z.string().min(2, 'UF é obrigatória (via CEP)').max(2, 'UF deve ter 2 caracteres'),
  client_endereco_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido (formato 00000-000)'),
  forma_pagamento: z.enum(['conta_energia', 'boleto', 'pix_automatico', 'debito_conta', 'desconto_folha']),
  client_unidade_consumo: z.string().optional(),
  energia_companhia: z.string().optional(),
  pagamento_banco: z.string().optional(),
  pagamento_agencia: z.string().optional(),
  pagamento_conta: z.string().optional(),
  pagamento_orgao: z.string().optional(),
  pagamento_matricula: z.string().optional(),
  has_dependents: z.boolean().optional(),
  dependents: z.string().optional(),
  // ✅ valor_mensal agora é calculado automaticamente, nunca vem do usuário
  valor_mensal: z.coerce.number().positive('Valor mensal calculado automaticamente'),
  // ✅ plan_type agora é obrigatório e validado contra os produtos
  plan_type: z.enum(VALID_PLAN_TYPES as unknown as [string, ...string[]]),
}).superRefine((data, ctx) => {
  if (data.forma_pagamento === 'conta_energia') {
    if (!data.client_unidade_consumo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unidade de consumo é obrigatória para Conta de Energia',
        path: ['client_unidade_consumo'],
      });
    }
    if (!data.energia_companhia?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Companhia de energia é obrigatória',
        path: ['energia_companhia'],
      });
    }
  }

  if (data.forma_pagamento === 'pix_automatico') {
    if (!data.pagamento_banco?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Banco é obrigatório para PIX Automático',
        path: ['pagamento_banco'],
      });
    }
    if (!data.pagamento_agencia?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Agência é obrigatória para PIX Automático',
        path: ['pagamento_agencia'],
      });
    }
    if (!data.pagamento_conta?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta é obrigatória para PIX Automático',
        path: ['pagamento_conta'],
      });
    }
  }

  if (data.forma_pagamento === 'debito_conta') {
    if (!data.pagamento_agencia?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Agência é obrigatória para Débito em Conta',
        path: ['pagamento_agencia'],
      });
    }
    if (!data.pagamento_conta?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta é obrigatória para Débito em Conta',
        path: ['pagamento_conta'],
      });
    }
  }

  if (data.forma_pagamento === 'desconto_folha') {
    if (!data.pagamento_orgao?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Órgão é obrigatório para Desconto em Folha',
        path: ['pagamento_orgao'],
      });
    }
    if (!data.pagamento_matricula?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Matrícula é obrigatória para Desconto em Folha',
        path: ['pagamento_matricula'],
      });
    }
  }

  if (data.has_dependents && !data.dependents?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe os dependentes (nome e CPF)',
      path: ['dependents'],
    });
  }
});

interface StepClientDataProps {
  onSubmit: (data: SaleFormData) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  initialData?: Partial<SaleFormData>;
}

export default function StepClientData({
  onSubmit,
  onBack,
  loading,
  initialData,
}: StepClientDataProps) {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
  } = useForm<SaleFormData>({
    resolver: zodResolver(clientDataSchema),
    defaultValues: initialData,
  });

  const formaPagamento = watch('forma_pagamento');
  const hasDependents = watch('has_dependents');
  const planType = watch('plan_type');

  const [dependentsList, setDependentsList] = useState<DependentItem[]>([]);
  const [dependentDraft, setDependentDraft] = useState<DependentItem>({ nome: '', cpf: '' });
  const [dependentError, setDependentError] = useState<string | null>(null);

  // Debug: Log quando planType muda
  useEffect(() => {
    console.log('Watch updated - planType:', planType, 'typeof:', typeof planType);
  }, [planType]);

  // Recalcular valor mensal quando plan_type ou dependentes mudam
  useEffect(() => {
    console.log('useEffect triggered - planType:', planType, 'dependents:', dependentsList.length);
    if (planType && planType.trim()) {
      const basePrice = getMonthlyPrice(planType as string);
      const totalPrice = basePrice + (basePrice * dependentsList.length);
      setValue('valor_mensal', totalPrice, { shouldValidate: true });
      console.log(`Plan updated: ${planType}, Base: R$${basePrice.toFixed(2)}, Total: R$${totalPrice.toFixed(2)}`);
    } else {
      console.log('No plan selected - planType is empty or undefined');
    }
  }, [planType, dependentsList, setValue]);

  const serializeDependents = (list: DependentItem[]) =>
    list.map((item) => `${item.nome} - CPF ${item.cpf}`).join('\n');

  const normalizeCPF = (value: string) => value.replace(/\D/g, '');

  useEffect(() => {
    const raw = initialData?.dependents;
    if (!raw || dependentsList.length > 0) return;

    const parsed = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const cpfMatch = line.match(/(\d{11})/);
        const nome = line.replace(/\s*-?\s*CPF\s*\d{11}/i, '').trim();
        return {
          nome,
          cpf: cpfMatch?.[1] || '',
        };
      })
      .filter((item) => item.nome && item.cpf);

    if (parsed.length > 0) {
      setDependentsList(parsed);
      setValue('has_dependents', true);
      setValue('dependents', serializeDependents(parsed));
    }
  }, [initialData?.dependents, dependentsList.length, setValue]);

  useEffect(() => {
    if (!hasDependents) {
      setDependentsList([]);
      setDependentDraft({ nome: '', cpf: '' });
      setDependentError(null);
      setValue('dependents', '');
    }
  }, [hasDependents, setValue]);

  const handleSaveDependent = () => {
    const nome = dependentDraft.nome.trim();
    const cpf = normalizeCPF(dependentDraft.cpf);

    if (!nome) {
      setDependentError('Nome do dependente é obrigatório');
      return;
    }

    if (!/^\d{11}$/.test(cpf)) {
      setDependentError('CPF do dependente deve ter 11 dígitos');
      return;
    }

    const updated = [...dependentsList, { nome, cpf }];
    setDependentsList(updated);
    setValue('has_dependents', true);
    setValue('dependents', serializeDependents(updated), { shouldValidate: true });
    clearErrors('dependents');
    setDependentDraft({ nome: '', cpf: '' });
    setDependentError(null);
  };

  const handleRemoveDependent = (index: number) => {
    const updated = dependentsList.filter((_, i) => i !== index);
    setDependentsList(updated);
    setValue('dependents', serializeDependents(updated), { shouldValidate: true });
  };

  const fillDemoData = () => {
    setValue('client_nome', 'Carlos Eduardo Silva');
    setValue('client_cpf', '98765432101');
    setValue('client_data_nascimento', '1985-03-20');
    setValue('client_nome_mae', 'Fernanda Silva Santos');
    setValue('client_endereco_logradouro', 'Avenida Paulista');
    setValue('client_endereco_numero', '1000');
    setValue('client_endereco_complemento', 'Apto 501');
    setValue('client_endereco_bairro', 'Bela Vista');
    setValue('client_endereco_cidade', 'São Paulo');
    setValue('client_endereco_uf', 'SP');
    setValue('client_endereco_cep', '01311-100');
    setValue('client_endereco_completo', 'Avenida Paulista, 1000, Apto 501 - Bela Vista - São Paulo/SP - CEP 01311-100');
    setValue('client_email', 'carlos.silva@email.com');
    setValue('client_telefone', '(11) 99876-5432');
    setValue('client_rg', '987654321');
    setValue('client_orgao_expedidor', 'SSP-SP');
    setValue('client_sexo', 'Masculino');
    setValue('client_estado_civil', 'Casado');
    setValue('client_nome_social', '');
    setValue('client_matricula_origem', '654321');
    setValue('client_orgao_origem', 'Governo Federal');
    setValue('forma_pagamento', 'boleto');
    setValue('has_dependents', true);
    const demoDependents = [
      { nome: 'Julia Silva Santos', cpf: '12344556677' },
      { nome: 'Pedro Silva Santos', cpf: '98877665544' },
    ];
    setDependentsList(demoDependents);
    setValue('dependents', serializeDependents(demoDependents));
    // Seleciona um plano novo - Odonto Caixa Beta (R$ 42,00)
    setValue('plan_type', 'plano_odonto_beta');
    // Valor total com 2 dependentes: 42 * (1 + 2) = 126
    setValue('valor_mensal', 126);
    console.log('Demo data filled with new plan: plano_odonto_beta');
  };

  const handleCepBlur = async () => {
    const rawCep = (getValues('client_endereco_cep') || '').replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setError('client_endereco_cep', {
        type: 'manual',
        message: 'CEP inválido (formato 00000-000)',
      });
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (!response.ok || data?.erro) {
        setError('client_endereco_cep', {
          type: 'manual',
          message: 'CEP não encontrado no ViaCEP',
        });
        return;
      }

      clearErrors('client_endereco_cep');
      setValue('client_endereco_logradouro', data.logradouro || 'Não informado');
      setValue('client_endereco_bairro', data.bairro || 'Não informado');
      setValue('client_endereco_cidade', data.localidade || 'Não informado');
      setValue('client_endereco_uf', data.uf || 'NI');
      setValue('client_endereco_numero', 'S/N');
    } catch {
      setError('client_endereco_cep', {
        type: 'manual',
        message: 'Falha ao validar CEP no ViaCEP',
      });
    }
  };

  const onSubmitForm = async (data: SaleFormData) => {
    try {
      const enderecoCompleto =
        data.client_endereco_completo ||
        `${data.client_endereco_logradouro}, ${data.client_endereco_numero}${
          data.client_endereco_complemento ? `, ${data.client_endereco_complemento}` : ''
        } - ${data.client_endereco_bairro} - ${data.client_endereco_cidade}/${data.client_endereco_uf} - CEP ${data.client_endereco_cep}`;

      await onSubmit({
        ...data,
        has_dependents: dependentsList.length > 0,
        dependents: serializeDependents(dependentsList),
        client_endereco_completo: enderecoCompleto,
        periodicidade_cobranca: 'mensal',
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Passo 2: Dados do Cliente
      </h2>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        {/* Linha 1: Nome e CPF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              {...register('client_nome')}
              type="text"
              placeholder="João da Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_nome && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_nome.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF *
            </label>
            <input
              {...register('client_cpf')}
              type="text"
              placeholder="12345678901"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_cpf && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_cpf.message}
              </p>
            )}
          </div>
        </div>

        {/* Linha 2: Data de Nascimento e Nome da Mãe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento *
            </label>
            <input
              {...register('client_data_nascimento')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_data_nascimento && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_data_nascimento.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Mãe *
            </label>
            <input
              {...register('client_nome_mae')}
              type="text"
              placeholder="Maria Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_nome_mae && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_nome_mae.message}
              </p>
            )}
          </div>
        </div>

        {/* Linha 3: RG e Órgão Expedidor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RG
            </label>
            <input
              {...register('client_rg')}
              type="text"
              placeholder="123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_rg && (
              <p className="mt-1 text-sm text-red-600">{errors.client_rg.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Órgão Expedidor
            </label>
            <input
              {...register('client_orgao_expedidor')}
              type="text"
              placeholder="SSP-SP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_orgao_expedidor && (
              <p className="mt-1 text-sm text-red-600">{errors.client_orgao_expedidor.message}</p>
            )}
          </div>
        </div>

        {/* Linha 4: Sexo e Estado Civil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sexo *
            </label>
            <select
              {...register('client_sexo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.client_sexo && (
              <p className="mt-1 text-sm text-red-600">{errors.client_sexo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Civil *
            </label>
            <select
              {...register('client_estado_civil')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
            </select>
            {errors.client_estado_civil && (
              <p className="mt-1 text-sm text-red-600">{errors.client_estado_civil.message}</p>
            )}
          </div>
        </div>

        {/* Nome Social */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Social (se houver)
          </label>
          <input
            {...register('client_nome_social')}
            type="text"
            placeholder="Opcional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Linha 5: Email e Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register('client_email')}
              type="email"
              placeholder="joao@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              {...register('client_telefone')}
              type="text"
              placeholder="11999999999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_telefone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_telefone.message}
              </p>
            )}
          </div>
        </div>

        {/* CEP + Endereço (auto via ViaCEP) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
            <input
              {...register('client_endereco_cep')}
              type="text"
              placeholder="01000-000"
              onBlur={handleCepBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.client_endereco_cep && (
              <p className="mt-1 text-sm text-red-600">{errors.client_endereco_cep.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (auto pelo CEP) *</label>
            <input
              {...register('client_endereco_logradouro')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg"
            />
            {errors.client_endereco_logradouro && (
              <p className="mt-1 text-sm text-red-600">{errors.client_endereco_logradouro.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Complemento (único campo editável do endereço)</label>
          <input
            {...register('client_endereco_complemento')}
            type="text"
            placeholder="Casa, apto, bloco..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
            <input
              {...register('client_endereco_bairro')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg"
            />
            {errors.client_endereco_bairro && (
              <p className="mt-1 text-sm text-red-600">{errors.client_endereco_bairro.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
            <input
              {...register('client_endereco_cidade')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg"
            />
            {errors.client_endereco_cidade && (
              <p className="mt-1 text-sm text-red-600">{errors.client_endereco_cidade.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">UF *</label>
            <input
              {...register('client_endereco_uf')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg uppercase"
            />
            {errors.client_endereco_uf && (
              <p className="mt-1 text-sm text-red-600">{errors.client_endereco_uf.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número (fixo)</label>
            <input
              {...register('client_endereco_numero')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg"
            />
          </div>
        </div>

        {/* Linha 6: Órgão de Origem */}
       

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma de Pagamento *
          </label>
          <select
            {...register('forma_pagamento')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione a forma de pagamento</option>
            <option value="conta_energia">Conta de Energia</option>
            <option value="boleto">Boleto</option>
            <option value="pix_automatico">PIX Automático</option>
            <option value="debito_conta">Débito em Conta</option>
            <option value="desconto_folha">Desconto em Folha</option>
          </select>
          {errors.forma_pagamento && (
            <p className="mt-1 text-sm text-red-600">{errors.forma_pagamento.message}</p>
          )}
        </div>

        {formaPagamento === 'conta_energia' && (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Companhia de Energia *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {energiaCompanhias.map((companhia) => (
                  <label key={companhia} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value={companhia}
                      {...register('energia_companhia')}
                    />
                    {companhia}
                  </label>
                ))}
              </div>
              {errors.energia_companhia && (
                <p className="mt-1 text-sm text-red-600">{errors.energia_companhia.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade de Consumo *
              </label>
              <input
                {...register('client_unidade_consumo')}
                type="text"
                placeholder="Ex: 123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.client_unidade_consumo && (
                <p className="mt-1 text-sm text-red-600">{errors.client_unidade_consumo.message}</p>
              )}
            </div>
          </div>
        )}

        {formaPagamento === 'pix_automatico' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banco *</label>
              <input
                {...register('pagamento_banco')}
                type="text"
                placeholder="Ex: Caixa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_banco && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_banco.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agência *</label>
              <input
                {...register('pagamento_agencia')}
                type="text"
                placeholder="Ex: 1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_agencia && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_agencia.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conta *</label>
              <input
                {...register('pagamento_conta')}
                type="text"
                placeholder="Ex: 998877-6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_conta && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_conta.message}</p>
              )}
            </div>
          </div>
        )}

        {formaPagamento === 'debito_conta' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agência *</label>
              <input
                {...register('pagamento_agencia')}
                type="text"
                placeholder="Ex: 1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_agencia && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_agencia.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conta *</label>
              <input
                {...register('pagamento_conta')}
                type="text"
                placeholder="Ex: 998877-6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_conta && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_conta.message}</p>
              )}
            </div>
          </div>
        )}

        {formaPagamento === 'desconto_folha' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Órgão *</label>
              <input
                {...register('pagamento_orgao')}
                type="text"
                placeholder="Ex: Prefeitura Municipal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_orgao && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_orgao.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula *</label>
              <input
                {...register('pagamento_matricula')}
                type="text"
                placeholder="Ex: MAT123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pagamento_matricula && (
                <p className="mt-1 text-sm text-red-600">{errors.pagamento_matricula.message}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-white">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" {...register('has_dependents')} />
            Possui dependentes?
          </label>

          <input type="hidden" {...register('dependents')} />

          {hasDependents && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Dependentes - Cada dependente adiciona o valor base do plano</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={dependentDraft.nome}
                  onChange={(e) => setDependentDraft((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do dependente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={dependentDraft.cpf}
                  onChange={(e) => setDependentDraft((prev) => ({ ...prev, cpf: e.target.value }))}
                  placeholder="CPF (11 dígitos)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveDependent}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Salvar dependente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDependentDraft({ nome: '', cpf: '' });
                    setDependentError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                  Novo
                </button>
              </div>

              {dependentError && (
                <p className="text-sm text-red-600">{dependentError}</p>
              )}

              {dependentsList.length > 0 && (
                <div className="space-y-2">
                  {dependentsList.map((item, index) => (
                    <div
                      key={`${item.cpf}-${index}`}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">
                        {item.nome} - {item.cpf}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependent(index)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.dependents && (
                <p className="mt-1 text-sm text-red-600">{errors.dependents.message}</p>
              )}

              {dependentsList.length > 0 && planType && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Valor base: R$ {getMonthlyPrice(planType).toFixed(2)} + {dependentsList.length} dependente(s) x R$ {getMonthlyPrice(planType).toFixed(2)} = 
                    <span className="font-bold"> R$ {(getMonthlyPrice(planType) * (1 + dependentsList.length)).toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal Total
          </label>
          <input
            type="text"
            readOnly
            value={planType ? (getMonthlyPrice(planType) * (1 + dependentsList.length)).toFixed(2) : ''}
            placeholder="Selecione um plano"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-bold text-lg cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Valor total = valor do plano + (valor do plano x numero de dependentes)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o Plano *
          </label>
          <div className="space-y-4">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{product.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        planType === plan.planType
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-blue-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={plan.planType}
                        {...register('plan_type')}
                        onChange={(e) => {
                          console.log('Radio onChange - value:', e.target.value);
                          // Se clicar no plano já selecionado, desbloqueia (limpa)
                          if (planType === plan.planType) {
                            setValue('plan_type', undefined, { shouldValidate: true });
                            console.log('Selection cleared - plan was deselected');
                          } else {
                            setValue('plan_type', e.target.value as any, { shouldValidate: true });
                            console.log('After setValue, current planType from form:', getValues('plan_type'));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        <p className="text-sm text-green-600 font-semibold">
                          R$ {plan.monthlyPrice.toFixed(2)}/mês
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {errors.plan_type && (
            <p className="mt-2 text-sm text-red-600">{errors.plan_type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal (Calculado Automaticamente)
          </label>
          <input
            type="text"
            readOnly
            value={planType ? getMonthlyPrice(planType).toFixed(2) : ''}
            placeholder="Selecione um plano acima"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Valor base do plano selecionado. Será adicionado o valor dos dependentes abaixo.
          </p>
        </div>

        {/* Botões */}
        <div className="flex justify-between gap-4 pt-6 border-t">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={fillDemoData}
              disabled={loading}
              className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Demo
              </span>
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Próximo'}
          </button>
        </div>
      </form>
    </div>
  );
}
