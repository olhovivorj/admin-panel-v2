import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';

/**
 * PermissionsService - Gerencia páginas/permissões do sistema
 *
 * Tabelas MySQL:
 * - ari_pages: id, name, path, category, app_id, is_active
 * - ari_apps: id, name, display_name, icon
 *
 * Permissões são baseadas em páginas, não em ações separadas
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll() {
    const pages = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.path,
        p.category,
        p.app_id as appId,
        a.name as appName,
        a.display_name as appDisplayName,
        a.icon as appIcon,
        p.is_active as isActive
      FROM ari_pages p
      LEFT JOIN ari_apps a ON p.app_id = a.id
      WHERE p.is_active = 1
      ORDER BY a.name, p.category, p.name`
    );

    return pages.map(page => ({
      id: page.id,
      name: page.name,
      path: page.path,
      category: page.category,
      app: page.appId ? {
        id: page.appId,
        name: page.appName,
        displayName: page.appDisplayName,
        icon: page.appIcon,
      } : null,
      isActive: page.isActive === 1,
    }));
  }

  async findGrouped() {
    const pages = await this.findAll();

    // Group by app
    const grouped = pages.reduce((acc, page) => {
      const appName = page.app?.name || 'Sem App';
      if (!acc[appName]) {
        acc[appName] = {
          app: page.app,
          pages: [],
        };
      }
      acc[appName].pages.push(page);
      return acc;
    }, {} as Record<string, { app: any; pages: typeof pages }>);

    return Object.entries(grouped).map(([appName, data]) => ({
      appName,
      app: data.app,
      pages: data.pages,
    }));
  }

  async findByApp(appId: number) {
    const pages = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.path,
        p.category,
        p.is_active as isActive
      FROM ari_pages p
      WHERE p.app_id = ? AND p.is_active = 1
      ORDER BY p.category, p.name`,
      [appId]
    );

    return pages.map(page => ({
      id: page.id,
      name: page.name,
      path: page.path,
      category: page.category,
      isActive: page.isActive === 1,
    }));
  }

  async getApps() {
    const apps = await this.db.query(
      `SELECT
        id,
        name,
        display_name as displayName,
        icon,
        (SELECT COUNT(*) FROM ari_pages WHERE app_id = ari_apps.id AND is_active = 1) as pagesCount
      FROM ari_apps
      ORDER BY name`
    );

    return apps.map(app => ({
      id: app.id,
      name: app.name,
      displayName: app.displayName,
      icon: app.icon,
      pagesCount: app.pagesCount || 0,
    }));
  }
}
