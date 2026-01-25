#!/usr/bin/env python3
"""
DIAGRAMA DO ECOSSISTEMA INVISTTO
================================
Visualização interativa de todos os projetos ativos e seus relacionamentos.

Execução:
    python3 DIAGRAMA-ECOSSISTEMA.py

Dependências:
    pip install matplotlib networkx

Saída:
    - DIAGRAMA-ECOSSISTEMA.png (imagem estática)
    - DIAGRAMA-ECOSSISTEMA-INTERATIVO.html (versão web interativa)
"""

import json
from datetime import datetime

# ==============================================================================
# DADOS DOS PROJETOS ATIVOS
# ==============================================================================

PROJETOS = {
    # Hub Central (SSO Gateway)
    "invistto-hub": {
        "nome": "Invistto Hub",
        "tipo": "frontend",
        "porta": 5173,
        "path_prod": "/hub/",
        "descricao": "SSO Gateway Central",
        "stack": "React 19.2.0 + Vite",
        "status": "ativo",
        "plataformas": ["Web", "Desktop (Tauri)", "Mobile"],
        "conecta": ["invistto-auth"],
        "cor": "#3b82f6"
    },

    # Autenticação
    "invistto-auth": {
        "nome": "Auth API",
        "tipo": "backend",
        "porta": 3001,
        "descricao": "Autenticação Centralizada",
        "stack": "NestJS 10 + MySQL",
        "status": "ativo",
        "features": ["JWT", "SSO", "httpOnly Cookies"],
        "conecta": ["mysql-main"],
        "cor": "#ef4444"
    },

    # Admin Panel
    "admin-panel-frontend": {
        "nome": "Admin Panel",
        "tipo": "frontend",
        "porta": 5173,
        "path_prod": "/admin/",
        "descricao": "Painel Administrativo",
        "stack": "React 18.3.1 + Vite",
        "status": "ativo",
        "conecta": ["invistto-auth", "admin-panel-api"],
        "cor": "#10b981"
    },
    "admin-panel-api": {
        "nome": "Admin API",
        "tipo": "backend",
        "porta": 3002,
        "descricao": "Backend Admin",
        "stack": "NestJS 10 + Prisma",
        "status": "ativo",
        "conecta": ["mysql-main"],
        "cor": "#8b5cf6"
    },

    # Courier
    "courier-frontend": {
        "nome": "Courier Analytics",
        "tipo": "frontend",
        "porta": 3008,
        "path_prod": "/courier/",
        "descricao": "Dashboard WhatsApp",
        "stack": "React 19.2.3 + TanStack Query",
        "status": "ativo",
        "conecta": ["invistto-auth", "courier-api"],
        "cor": "#10b981"
    },
    "courier-api": {
        "nome": "Courier API",
        "tipo": "backend",
        "porta": 3333,
        "descricao": "29 Endpoints Analytics",
        "stack": "NestJS 10 + Prisma + Firebird",
        "status": "ativo",
        "conecta": ["mysql-main", "firebird"],
        "cor": "#8b5cf6"
    },

    # BI
    "invistto-bi": {
        "nome": "Invistto BI",
        "tipo": "frontend",
        "porta": 3007,
        "path_prod": "/bi/",
        "descricao": "Business Intelligence",
        "stack": "React 19.1.0 + Recharts",
        "status": "ativo",
        "plataformas": ["Web", "Mobile"],
        "conecta": ["invistto-auth", "ari"],
        "cor": "#10b981"
    },

    # ARI
    "ari": {
        "nome": "ARI Analytics",
        "tipo": "backend",
        "porta": 3010,
        "descricao": "API de BI (11 módulos)",
        "stack": "NestJS 11 + Knex.js",
        "status": "ativo",
        "modulos": ["Vendas", "Financeiro", "Clientes", "Produtos", "Insights"],
        "conecta": ["mysql-main", "servermcp"],
        "cor": "#8b5cf6"
    },

    # Zeiss
    "zeiss-frontend": {
        "nome": "Zeiss Client",
        "tipo": "frontend",
        "porta": 3006,
        "path_prod": "/zeiss/",
        "descricao": "Integração Carl Zeiss",
        "stack": "React 19.1.0 + MUI",
        "status": "ativo",
        "conecta": ["invistto-auth", "zeiss-api"],
        "cor": "#10b981"
    },
    "zeiss-api": {
        "nome": "Zeiss API",
        "tipo": "backend",
        "porta": 3005,
        "descricao": "Catálogo e Pedidos Zeiss",
        "stack": "NestJS 10 + MySQL + Firebird",
        "status": "ativo",
        "features": ["BullMQ", "Redis", "WebSocket"],
        "conecta": ["mysql-main", "firebird", "redis", "zeiss-sao-api"],
        "cor": "#8b5cf6"
    },

    # OlhoVivo Lens
    "lens-frontend": {
        "nome": "OlhoVivo Lens",
        "tipo": "frontend",
        "porta": 3009,
        "path_prod": "/lentes/",
        "descricao": "Hub Multi-Laboratório",
        "stack": "React 19.1.0 + TanStack Query",
        "status": "ativo",
        "plataformas": ["Web", "Mobile"],
        "conecta": ["invistto-auth", "lens-api"],
        "cor": "#10b981"
    },
    "lens-api": {
        "nome": "Lens API",
        "tipo": "backend",
        "porta": 3015,
        "descricao": "Consolidação de Catálogos",
        "stack": "NestJS 10 + Prisma + Firebird",
        "status": "ativo",
        "labs": ["Zeiss", "Rodenstock", "HOYA", "Essilor"],
        "conecta": ["mysql-main", "firebird"],
        "cor": "#8b5cf6"
    },

    # API Invistto
    "api-invistto": {
        "nome": "API Invistto",
        "tipo": "backend",
        "porta": 3000,
        "descricao": "CRM Pontomarket",
        "stack": "NestJS 10 + MySQL",
        "status": "ativo",
        "features": ["Rate Limiting", "AI Integration"],
        "conecta": ["mysql-main", "redis"],
        "cor": "#8b5cf6"
    },

    # ServerMCP
    "servermcp": {
        "nome": "ServerMCP",
        "tipo": "service",
        "porta": 3002,
        "descricao": "Gateway Claude Desktop",
        "stack": "Express.js + Redis",
        "status": "ativo",
        "features": ["Basic→JWT", "Circuit Breaker"],
        "conecta": ["ari", "redis"],
        "cor": "#f59e0b"
    },

    # Sales API
    "sales-api": {
        "nome": "Sales API",
        "tipo": "backend",
        "porta": 3011,
        "descricao": "Vendas Óticas",
        "stack": "NestJS 11 + Firebird",
        "status": "ativo",
        "conecta": ["firebird", "mysql-main"],
        "cor": "#8b5cf6"
    },

    # Bancos de Dados
    "mysql-main": {
        "nome": "MySQL Principal",
        "tipo": "database",
        "porta": 3305,
        "host": "painel.invistto.com",
        "descricao": "Banco centralizado",
        "tabelas": "80+ tabelas",
        "conecta": [],
        "cor": "#6366f1"
    },
    "firebird": {
        "nome": "Firebird ERPs",
        "tipo": "database",
        "porta": 3307,
        "host": "Múltiplos (1 por cliente)",
        "descricao": "Bancos legados ERP",
        "conecta": [],
        "cor": "#6366f1"
    },
    "redis": {
        "nome": "Redis Cache",
        "tipo": "database",
        "porta": 6379,
        "host": "localhost",
        "descricao": "Cache e Filas",
        "conecta": [],
        "cor": "#6366f1"
    },

    # Externo
    "zeiss-sao-api": {
        "nome": "Zeiss SAO API",
        "tipo": "external",
        "descricao": "API Externa Carl Zeiss",
        "conecta": [],
        "cor": "#94a3b8"
    }
}

# ==============================================================================
# GERAÇÃO DO HTML INTERATIVO (D3.js)
# ==============================================================================

def gerar_html_interativo():
    """Gera visualização interativa com D3.js"""

    # Preparar nodes e links para D3
    nodes = []
    links = []
    node_ids = {}

    for i, (key, proj) in enumerate(PROJETOS.items()):
        node_ids[key] = i
        nodes.append({
            "id": i,
            "name": proj["nome"],
            "key": key,
            "type": proj["tipo"],
            "port": proj.get("porta", ""),
            "desc": proj["descricao"],
            "stack": proj.get("stack", ""),
            "color": proj["cor"],
            "path": proj.get("path_prod", "")
        })

    for key, proj in PROJETOS.items():
        for target in proj.get("conecta", []):
            if target in node_ids:
                links.append({
                    "source": node_ids[key],
                    "target": node_ids[target]
                })

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ecossistema Invistto - Diagrama Interativo</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{ margin: 0; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }}
        #graph {{ width: 100vw; height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }}
        .node {{ cursor: pointer; }}
        .node circle {{ stroke: #fff; stroke-width: 2px; }}
        .node text {{ fill: white; font-size: 10px; font-weight: 500; }}
        .link {{ stroke: #475569; stroke-opacity: 0.6; stroke-width: 1.5px; }}
        .tooltip {{
            position: absolute;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 12px;
            color: white;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 280px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }}
        .tooltip h3 {{ margin: 0 0 8px 0; color: #60a5fa; font-size: 14px; }}
        .tooltip p {{ margin: 4px 0; color: #94a3b8; }}
        .tooltip .port {{ color: #10b981; font-family: monospace; }}
        .legend {{
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(15, 23, 42, 0.9);
            border-radius: 8px;
            padding: 16px;
            color: white;
        }}
        .legend-item {{ display: flex; align-items: center; gap: 8px; margin: 6px 0; }}
        .legend-dot {{ width: 12px; height: 12px; border-radius: 50%; }}
        .header {{
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
        }}
        .header h1 {{ font-size: 24px; margin: 0; }}
        .header p {{ color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; }}
        .stats {{
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 12px;
        }}
        .stat {{
            background: rgba(15, 23, 42, 0.9);
            border-radius: 8px;
            padding: 12px 16px;
            color: white;
            text-align: center;
        }}
        .stat-value {{ font-size: 24px; font-weight: bold; color: #3b82f6; }}
        .stat-label {{ font-size: 10px; color: #94a3b8; text-transform: uppercase; }}
    </style>
</head>
<body>
    <div id="graph"></div>

    <div class="header">
        <h1>🏗️ Ecossistema Invistto</h1>
        <p>Diagrama interativo - Arraste os nós para reorganizar</p>
    </div>

    <div class="stats">
        <div class="stat">
            <div class="stat-value">12</div>
            <div class="stat-label">Projetos Ativos</div>
        </div>
        <div class="stat">
            <div class="stat-value">15</div>
            <div class="stat-label">Portas em Uso</div>
        </div>
        <div class="stat">
            <div class="stat-value">3</div>
            <div class="stat-label">Bancos de Dados</div>
        </div>
    </div>

    <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background: #3b82f6"></div> Hub Central</div>
        <div class="legend-item"><div class="legend-dot" style="background: #ef4444"></div> Autenticação</div>
        <div class="legend-item"><div class="legend-dot" style="background: #10b981"></div> Frontend</div>
        <div class="legend-item"><div class="legend-dot" style="background: #8b5cf6"></div> Backend API</div>
        <div class="legend-item"><div class="legend-dot" style="background: #f59e0b"></div> Serviço</div>
        <div class="legend-item"><div class="legend-dot" style="background: #6366f1"></div> Banco de Dados</div>
        <div class="legend-item"><div class="legend-dot" style="background: #94a3b8"></div> Externo</div>
    </div>

    <div id="tooltip" class="tooltip" style="display: none;"></div>

    <script>
        const nodes = {json.dumps(nodes)};
        const links = {json.dumps(links)};

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("#graph")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Definir setas
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .append("path")
            .attr("d", "M 0,-5 L 10,0 L 0,5")
            .attr("fill", "#475569");

        // Força de simulação
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50));

        // Links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("marker-end", "url(#arrowhead)");

        // Nodes
        const node = svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Círculos dos nodes
        node.append("circle")
            .attr("r", d => {{
                if (d.type === "database") return 25;
                if (d.type === "external") return 15;
                if (d.key === "invistto-hub") return 30;
                return 20;
            }})
            .attr("fill", d => d.color);

        // Labels
        node.append("text")
            .attr("dy", d => {{
                if (d.type === "database") return 40;
                if (d.key === "invistto-hub") return 45;
                return 35;
            }})
            .attr("text-anchor", "middle")
            .text(d => d.name);

        // Portas
        node.filter(d => d.port)
            .append("text")
            .attr("dy", 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .attr("fill", "white")
            .text(d => ":" + d.port);

        // Tooltip
        const tooltip = d3.select("#tooltip");

        node.on("mouseover", function(event, d) {{
            let content = `<h3>${{d.name}}</h3>`;
            content += `<p>${{d.desc}}</p>`;
            if (d.port) content += `<p class="port">Porta: :${{d.port}}</p>`;
            if (d.stack) content += `<p>Stack: ${{d.stack}}</p>`;
            if (d.path) content += `<p>Prod: ${{d.path}}</p>`;

            tooltip.html(content)
                .style("display", "block")
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        }})
        .on("mouseout", function() {{
            tooltip.style("display", "none");
        }});

        // Atualização da simulação
        simulation.on("tick", () => {{
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${{d.x}},${{d.y}})`);
        }});

        function dragstarted(event, d) {{
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }}

        function dragged(event, d) {{
            d.fx = event.x;
            d.fy = event.y;
        }}

        function dragended(event, d) {{
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }}
    </script>
</body>
</html>'''

    return html


# ==============================================================================
# GERAÇÃO DO PNG ESTÁTICO (matplotlib)
# ==============================================================================

def gerar_png_estatico():
    """Gera imagem PNG estática usando matplotlib"""
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        import networkx as nx

        # Criar grafo
        G = nx.DiGraph()

        # Adicionar nodes
        for key, proj in PROJETOS.items():
            G.add_node(key,
                       label=proj["nome"],
                       tipo=proj["tipo"],
                       cor=proj["cor"])

        # Adicionar edges
        for key, proj in PROJETOS.items():
            for target in proj.get("conecta", []):
                if target in PROJETOS:
                    G.add_edge(key, target)

        # Layout
        pos = nx.spring_layout(G, k=2, iterations=50, seed=42)

        # Figura
        fig, ax = plt.subplots(1, 1, figsize=(20, 14))
        ax.set_facecolor('#0f172a')
        fig.patch.set_facecolor('#0f172a')

        # Cores por tipo
        cores_tipo = {
            "frontend": "#10b981",
            "backend": "#8b5cf6",
            "database": "#6366f1",
            "service": "#f59e0b",
            "external": "#94a3b8"
        }

        # Cores especiais
        cores_especiais = {
            "invistto-hub": "#3b82f6",
            "invistto-auth": "#ef4444"
        }

        node_colors = []
        for node in G.nodes():
            if node in cores_especiais:
                node_colors.append(cores_especiais[node])
            else:
                tipo = PROJETOS[node]["tipo"]
                node_colors.append(cores_tipo.get(tipo, "#94a3b8"))

        # Desenhar edges
        nx.draw_networkx_edges(G, pos, ax=ax,
                               edge_color='#475569',
                               arrows=True,
                               arrowsize=15,
                               arrowstyle='-|>',
                               alpha=0.6,
                               width=1.5)

        # Desenhar nodes
        node_sizes = []
        for node in G.nodes():
            if node == "invistto-hub":
                node_sizes.append(3000)
            elif PROJETOS[node]["tipo"] == "database":
                node_sizes.append(2500)
            elif PROJETOS[node]["tipo"] == "external":
                node_sizes.append(1000)
            else:
                node_sizes.append(2000)

        nx.draw_networkx_nodes(G, pos, ax=ax,
                               node_color=node_colors,
                               node_size=node_sizes,
                               alpha=0.9,
                               edgecolors='white',
                               linewidths=2)

        # Labels
        labels = {node: PROJETOS[node]["nome"] for node in G.nodes()}
        nx.draw_networkx_labels(G, pos, labels, ax=ax,
                                font_size=8,
                                font_color='white',
                                font_weight='bold')

        # Portas como labels secundários
        port_labels = {}
        port_pos = {}
        for node, (x, y) in pos.items():
            porta = PROJETOS[node].get("porta", "")
            if porta:
                port_labels[node] = f":{porta}"
                port_pos[node] = (x, y - 0.08)

        nx.draw_networkx_labels(G, port_pos, port_labels, ax=ax,
                                font_size=6,
                                font_color='#60a5fa',
                                font_family='monospace')

        # Título
        ax.set_title("Ecossistema Invistto - Mapa de Arquitetura",
                     fontsize=16, color='white', pad=20, fontweight='bold')

        # Legenda
        legend_items = [
            mpatches.Patch(color='#3b82f6', label='Hub Central'),
            mpatches.Patch(color='#ef4444', label='Autenticação'),
            mpatches.Patch(color='#10b981', label='Frontend'),
            mpatches.Patch(color='#8b5cf6', label='Backend API'),
            mpatches.Patch(color='#f59e0b', label='Serviço'),
            mpatches.Patch(color='#6366f1', label='Banco de Dados'),
            mpatches.Patch(color='#94a3b8', label='Externo'),
        ]
        ax.legend(handles=legend_items, loc='lower left',
                  facecolor='#1e293b', edgecolor='#475569',
                  labelcolor='white', fontsize=8)

        ax.axis('off')
        plt.tight_layout()

        output_path = "/home/robson/Documentos/projetos/codigo-fonte/DIAGRAMA-ECOSSISTEMA.png"
        plt.savefig(output_path, dpi=150, facecolor='#0f172a',
                    edgecolor='none', bbox_inches='tight')
        plt.close()

        return output_path

    except ImportError:
        print("⚠️  matplotlib/networkx não instalados. Execute:")
        print("    pip install matplotlib networkx")
        return None


# ==============================================================================
# MAIN
# ==============================================================================

def main():
    print("=" * 60)
    print("DIAGRAMA DO ECOSSISTEMA INVISTTO")
    print("=" * 60)
    print()

    # 1. Gerar HTML interativo
    html = gerar_html_interativo()
    html_path = "/home/robson/Documentos/projetos/codigo-fonte/DIAGRAMA-ECOSSISTEMA-INTERATIVO.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ HTML Interativo: {html_path}")

    # 2. Tentar gerar PNG
    png_path = gerar_png_estatico()
    if png_path:
        print(f"✅ PNG Estático: {png_path}")
    else:
        print("⚠️  PNG não gerado (dependências faltando)")

    # 3. Exportar JSON
    json_path = "/home/robson/Documentos/projetos/codigo-fonte/DIAGRAMA-ECOSSISTEMA-DATA.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(PROJETOS, f, indent=2, ensure_ascii=False)
    print(f"✅ JSON Data: {json_path}")

    print()
    print("=" * 60)
    print("RESUMO DOS PROJETOS ATIVOS")
    print("=" * 60)
    print()

    # Resumo por tipo
    tipos = {}
    for key, proj in PROJETOS.items():
        tipo = proj["tipo"]
        if tipo not in tipos:
            tipos[tipo] = []
        tipos[tipo].append(proj)

    for tipo, projs in tipos.items():
        print(f"\n📁 {tipo.upper()} ({len(projs)})")
        for p in projs:
            porta = f":{p.get('porta', '-')}" if p.get('porta') else ""
            print(f"   • {p['nome']:<20} {porta:<8} {p['descricao']}")

    print()
    print("=" * 60)
    print(f"Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    # Abrir HTML no navegador
    import webbrowser
    webbrowser.open(f"file://{html_path}")


if __name__ == "__main__":
    main()
