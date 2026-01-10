import { Role } from './role.types';
import { Base } from './base.types';

export interface User {
  id: number;
  email: string;
  nome: string;
  telefone?: string;
  obs?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  roles: Role[];
  bases: Base[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  nome: string;
  telefone?: string;
  obs?: string;
  ativo?: boolean;
  roleIds?: number[];
  baseIds?: number[];
}

export interface UpdateUserDto {
  email?: string;
  nome?: string;
  telefone?: string;
  obs?: string;
  ativo?: boolean;
  roleIds?: number[];
  baseIds?: number[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    nome: string;
    telefone?: string;
    roles: string[];
    permissions: string[];
    bases: Array<{ id: number; nome: string }>;
  };
}
