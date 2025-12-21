export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  usersCount?: number;
  permissionsCount?: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  createdAt: string;
}

export interface CreatePermissionDto {
  name: string;
  module: string;
  action: string;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}
