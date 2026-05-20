#!/usr/bin/env python3
"""
Generate frontend architecture diagrams.

Requirements:
    pip install matplotlib networkx

Output:
    docs/images/route-tree.png   — Next.js App Router route tree
    docs/images/state-flow.png   — Auth + state management flow
"""

import os
import sys

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import networkx as nx
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install matplotlib networkx", file=sys.stderr)
    sys.exit(1)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'images')
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─── Route Tree ─────────────────────────────────────────────────────────────

def generate_route_tree():
    """Hierarchical tree of all App Router routes."""

    # (parent, child, label, group)
    # group: 'root' | 'auth' | 'public' | 'dashboard' | 'api'
    edges = [
        ('app/', '(auth)/', ''),
        ('app/', '(dashboard)/', ''),
        ('app/', 'public/', ''),
        ('app/', 'api/', ''),

        # Auth group
        ('(auth)/', 'login/', 'login'),
        ('(auth)/', 'register/', 'register'),
        ('(auth)/', 'auth/callback', 'auth callback'),

        # Public routes
        ('public/', 'intake/[slug]', 'intake form'),
        ('public/', 'memorial/[id]', 'memorial page'),
        ('public/', 'family/[token]', 'family portal'),
        ('public/', 'sign/[token]', 'e-sign link'),
        ('public/', 'preplanning/[slug]', 'preplanning'),

        # Dashboard
        ('(dashboard)/', 'dashboard', 'home'),
        ('(dashboard)/', 'cases/', 'cases list'),
        ('cases/', 'cases/new', 'new case'),
        ('cases/', 'cases/[id]', 'case detail'),
        ('cases/[id]', 'cases/[id]/first-call', 'first call'),
        ('cases/[id]', 'cases/[id]/tasks', 'tasks'),
        ('cases/[id]', 'cases/[id]/follow-ups', 'follow-ups'),
        ('cases/[id]', 'cases/[id]/documents', 'documents'),
        ('cases/[id]', 'cases/[id]/signatures', 'signatures'),
        ('cases/[id]', 'cases/[id]/payments', 'payments'),
        ('cases/[id]', 'cases/[id]/obituary', 'obituary'),
        ('cases/[id]', 'cases/[id]/death-cert', 'death cert'),
        ('cases/[id]', 'cases/[id]/cremation', 'cremation auth'),
        ('cases/[id]', 'cases/[id]/cemetery', 'cemetery'),
        ('cases/[id]', 'cases/[id]/merchandise', 'merchandise'),
        ('cases/[id]', 'cases/[id]/vendors', 'vendors'),
        ('(dashboard)/', 'calendar/', 'calendar'),
        ('(dashboard)/', 'vendors/', 'vendors list'),
        ('(dashboard)/', 'price-list/', 'price list'),
        ('(dashboard)/', 'settings/', 'settings hub'),
        ('settings/', 'settings/branding', 'branding'),
        ('settings/', 'settings/staff', 'staff mgmt'),
        ('settings/', 'settings/templates', 'templates'),

        # API routes
        ('api/', 'api/auth/session', 'session'),
    ]

    group_colors = {
        'app/': '#FFFFFF',
        '(auth)/': '#4A90E2',
        '(dashboard)/': '#7ED321',
        'public/': '#F5A623',
        'api/': '#9B59B6',
        'cases/': '#5BA35B',
        'cases/[id]': '#3D7A3D',
        'settings/': '#5BA35B',
    }
    default_color = '#CCCCCC'

    G = nx.DiGraph()
    for parent, child, _ in edges:
        G.add_edge(parent, child)

    # Hierarchical layout using graphviz dot if available, else spring
    try:
        pos = nx.nx_agraph.graphviz_layout(G, prog='dot')
    except Exception:
        pos = nx.spring_layout(G, seed=42, k=3)

    color_map = [group_colors.get(n, default_color) for n in G.nodes()]

    fig, ax = plt.subplots(figsize=(22, 14))
    nx.draw_networkx(
        G, pos, ax=ax,
        node_color=color_map,
        node_size=2200,
        font_size=6.5,
        font_weight='bold',
        arrows=True,
        arrowsize=12,
        edge_color='#aaaaaa',
        width=1.0,
    )
    ax.set_title('Kelova Frontend — Next.js App Router Route Tree', fontsize=14, fontweight='bold', pad=16)
    ax.axis('off')
    fig.tight_layout()

    out = os.path.join(OUTPUT_DIR, 'route-tree.png')
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  ✓ {out}")


# ─── State Flow ──────────────────────────────────────────────────────────────

def generate_state_flow():
    """Auth + state management flow: login → Cognito → session → Zustand → TanStack Query."""

    steps = [
        ('/login page', '#4A90E2'),
        ('Cognito\nOAuth redirect', '#4A90E2'),
        ('/auth/callback\n(token exchange)', '#4A90E2'),
        ('/api/auth/session\n(set httpOnly cookie)', '#9B59B6'),
        ('AuthInitializer\n(fetch /auth/me)', '#7ED321'),
        ('Zustand store\n(user metadata)', '#F5A623'),
        ('TanStack Query\n(server state cache)', '#E74C3C'),
        ('Dashboard\n(protected routes)', '#7ED321'),
    ]

    fig, ax = plt.subplots(figsize=(20, 5))
    ax.set_xlim(0, len(steps) + 0.5)
    ax.set_ylim(-1, 3)
    ax.axis('off')

    box_w, box_h, gap = 1.6, 0.9, 0.2

    for i, (label, color) in enumerate(steps):
        x = i * (box_w + gap) + 0.2
        rect = mpatches.FancyBboxPatch(
            (x, 0.8), box_w, box_h,
            boxstyle='round,pad=0.1',
            facecolor=color, edgecolor='#444', linewidth=1.2, alpha=0.85,
        )
        ax.add_patch(rect)
        ax.text(x + box_w / 2, 0.8 + box_h / 2, label,
                ha='center', va='center', fontsize=7.5, fontweight='bold', color='white')
        if i < len(steps) - 1:
            arrow_x = x + box_w + 0.02
            ax.annotate('', xy=(arrow_x + gap - 0.02, 1.25), xytext=(arrow_x, 1.25),
                        arrowprops=dict(arrowstyle='->', color='#555', lw=1.5))

    # Dev bypass annotation
    ax.annotate(
        'DEV_AUTH_BYPASS=true\nskips Cognito steps →\njumps straight to AuthInitializer',
        xy=(0.2 + box_w, 1.5), xytext=(0.2 + box_w, 2.4),
        fontsize=7.5, color='#666',
        arrowprops=dict(arrowstyle='->', color='#aaa'),
        bbox=dict(boxstyle='round', facecolor='#FFFBCC', edgecolor='#D6B656'),
    )

    ax.set_title('Kelova Frontend — Auth & State Flow', fontsize=13, fontweight='bold', pad=10)
    fig.tight_layout()

    out = os.path.join(OUTPUT_DIR, 'state-flow.png')
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  ✓ {out}")


if __name__ == '__main__':
    print("Generating frontend diagrams...")
    generate_route_tree()
    generate_state_flow()
    print("Done.")
