// components/sales/steps/StepValidation.tsx
import React from 'react';
import type { Profile } from '../../../types';

interface StepValidationProps {
  user: Profile;
  onNext: () => void;
}

export default function StepValidation({ user, onNext }: StepValidationProps) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Passo 1: Validação
      </h2>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-900 font-medium mb-2">✓ Operador Autenticado</p>
          <p className="text-blue-800 text-sm">
            Você está logado como: <strong>{user.nome}</strong> (CPF: {user.cpf})
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-700 font-medium mb-2">Status da Sessão</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Identidade confirmada</li>
            <li>✓ Permissões validadas</li>
            <li>✓ Pronto para criar nova venda</li>
          </ul>
        </div>

        <p className="text-gray-600 text-sm">
          Clique em "Próximo" para prosseguir com os dados do cliente.
        </p>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
