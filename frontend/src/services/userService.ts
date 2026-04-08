// services/userService.ts
import { BACKEND_URL, getUserJWT } from '../lib/supabaseClient';

export interface CreateUserRequest {
  cpf: string;
  nome: string;
  password: string;
  role: 'admin' | 'operator';
  adminUserId: string;
}

export interface CreateUserResponse {
  userId: string;
  profile: {
    id: string;
    cpf: string;
    nome: string;
    role: string;
  };
}

export interface CreateOperatorRequest {
  cpf: string;
  nome: string;
  password: string;
  adminUserId: string;
}

export const userService = {
  /**
   * Criar novo usuário (admin ou operator)
   * Equivalente a: POST /api/users/create no backend Go
   */
  async createUser(
    cpf: string,
    nome: string,
    password: string,
    role: 'admin' | 'operator',
    adminUserId: string
  ): Promise<CreateUserResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Get the user's JWT token instead of using the API key
      const jwt = await getUserJWT();
      if (!jwt) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const payload: CreateUserRequest = {
        cpf,
        nome,
        password,
        role,
        adminUserId,
      };

      const response = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro ao criar usuário (${response.status})`);
      }

      return data as CreateUserResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: A criação do usuário demorou muito. Tente novamente.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Criar novo operador
   * Equivalente a: POST /api/operators/create no backend Go
   */
  async createOperator(
    cpf: string,
    nome: string,
    password: string,
    adminUserId: string
  ): Promise<CreateUserResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Get the user's JWT token instead of using the API key
      const jwt = await getUserJWT();
      if (!jwt) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const payload: CreateOperatorRequest = {
        cpf,
        nome,
        password,
        adminUserId,
      };

      const response = await fetch(`${BACKEND_URL}/api/operators/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro ao criar operador (${response.status})`);
      }

      return data as CreateUserResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: A criação do operador demorou muito. Tente novamente.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
