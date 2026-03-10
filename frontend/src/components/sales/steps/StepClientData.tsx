// components/sales/steps/StepClientData.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SaleFormData } from '../../../types';

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
  client_rg: z.string().min(1, 'RG é obrigatório'),
  client_orgao_expedidor: z.string().min(1, 'Órgão expedidor é obrigatório'),
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
  forma_pagamento: z.enum(['conta_luz', 'pix', 'cartao_credito']),
  client_unidade_consumo: z.string().optional(),
  valor_mensal: z.coerce.number().positive('Valor mensal deve ser maior que zero'),
  plan_type: z.enum([
    'plano_basico',
    'plano_standard',
    'plano_premium',
    'plano_alfa',
    'plano_beta',
    'plano_delta',
  ]),
}).superRefine((data, ctx) => {
  if (data.forma_pagamento === 'conta_luz' && !data.client_unidade_consumo?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unidade de consumo é obrigatória para Conta de Luz',
      path: ['client_unidade_consumo'],
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

  const fillDemoData = () => {
    setValue('client_nome', 'Maria Silva Santos');
    setValue('client_cpf', '12345678901');
    setValue('client_data_nascimento', '1990-05-15');
    setValue('client_nome_mae', 'Ana Silva Santos');
    setValue('client_endereco_logradouro', 'Rua das Flores');
    setValue('client_endereco_numero', '123');
    setValue('client_endereco_complemento', 'Apto 12');
    setValue('client_endereco_bairro', 'Centro');
    setValue('client_endereco_cidade', 'São Paulo');
    setValue('client_endereco_uf', 'SP');
    setValue('client_endereco_cep', '01000-000');
    setValue('client_endereco_completo', 'Rua das Flores, 123, Apto 12 - Centro - São Paulo/SP - CEP 01000-000');
    setValue('client_email', 'maria.silva@email.com');
    setValue('client_telefone', '(11) 98765-4321');
    setValue('client_rg', '123456789');
    setValue('client_orgao_expedidor', 'SSP-SP');
    setValue('client_sexo', 'Feminino');
    setValue('client_estado_civil', 'Solteira');
    setValue('client_nome_social', '');
    setValue('client_matricula_origem', '123456');
    setValue('client_orgao_origem', 'Prefeitura Municipal');
    setValue('forma_pagamento', 'pix');
    setValue('valor_mensal', 89.9);
    setValue('plan_type', 'plano_beta');
  };

  const formaPagamento = watch('forma_pagamento');

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
              RG *
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
              Órgão Expedidor *
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

        {/* Linha 6: Matrícula e Órgão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matrícula de Origem
            </label>
            <input
              {...register('client_matricula_origem')}
              type="text"
              placeholder="MAT123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Órgão de Origem
            </label>
            <input
              {...register('client_orgao_origem')}
              type="text"
              placeholder="Prefeitura de São Paulo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tipo de Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Plano *
          </label>
          <select
            {...register('plan_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um plano</option>
            <option value="plano_basico">Plano Básico</option>
            <option value="plano_standard">Plano Standard</option>
            <option value="plano_premium">Plano Premium</option>
            <option value="plano_alfa">Plano Alfa</option>
            <option value="plano_beta">Plano Beta</option>
            <option value="plano_delta">Plano Delta</option>
          </select>
          {errors.plan_type && (
            <p className="mt-1 text-sm text-red-600">{errors.plan_type.message}</p>
          )}
        </div>

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
            <option value="conta_luz">Conta de Luz</option>
            <option value="pix">Pix</option>
            <option value="cartao_credito">Cartão de Crédito</option>
          </select>
          {errors.forma_pagamento && (
            <p className="mt-1 text-sm text-red-600">{errors.forma_pagamento.message}</p>
          )}
        </div>

        {formaPagamento === 'conta_luz' && (
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
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal *
          </label>
          <input
            {...register('valor_mensal')}
            type="number"
            step="0.01"
            min="0"
            placeholder="89.90"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.valor_mensal && (
            <p className="mt-1 text-sm text-red-600">{errors.valor_mensal.message}</p>
          )}
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
              🎬 Demo
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
