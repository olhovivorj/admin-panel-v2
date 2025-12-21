export const PERMISSIONS = {
  // Usuarios
  USUARIOS_VIEW: 'usuarios.view',
  USUARIOS_CREATE: 'usuarios.create',
  USUARIOS_UPDATE: 'usuarios.update',
  USUARIOS_DELETE: 'usuarios.delete',

  // Bases
  BASES_VIEW: 'bases.view',
  BASES_CREATE: 'bases.create',
  BASES_UPDATE: 'bases.update',
  BASES_DELETE: 'bases.delete',
  BASES_FIREBIRD: 'bases.firebird',

  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Permissions
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // ERP
  ERP_VIEW: 'erp.view',
  ERP_PESSOAS: 'erp.pessoas',
  ERP_EMPRESAS: 'erp.empresas',
  ERP_PRODUTOS: 'erp.produtos',
  ERP_ESTOQUE: 'erp.estoque',
  ERP_VENDAS: 'erp.vendas',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];
