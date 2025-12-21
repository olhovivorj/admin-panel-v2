export interface Base {
  id: number;
  nome: string;
  cnpj?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  hasFirebirdConfig: boolean;
  usuariosCount?: number;
}

export interface CreateBaseDto {
  nome: string;
  cnpj?: string;
  ativo?: boolean;
  fbHost?: string;
  fbPort?: number;
  fbDatabase?: string;
  fbUser?: string;
  fbPassword?: string;
}

export interface UpdateBaseDto {
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
}

export interface FirebirdConfig {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
}

export interface FirebirdTestResult {
  success: boolean;
  message: string;
  serverTime?: string;
}
