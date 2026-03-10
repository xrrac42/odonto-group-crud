// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import type { Profile } from '../types';

export function useAuth() {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}

// Verificar se o usuário é admin
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'admin';
}

// Verificar se o usuário é operador
export function useIsOperator(): boolean {
  const { user } = useAuth();
  return user?.role === 'operator';
}
