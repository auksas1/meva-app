# Lab 2. 6b: backend module coupling from Python imports (madge analyses TypeScript only).
# Usage from backend/:  .venv/Scripts/python.exe scripts/quality/coupling.py app
#   Ce (efferent) = how many project modules this module imports
#   Ca (afferent) = how many project modules import this module
#   I  (instability) = Ce / (Ca + Ce)
import ast
import sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1])
pkg = root.name  # "app"
modules = {}
for f in sorted(root.rglob("*.py")):
    rel = f.relative_to(root.parent).with_suffix("")
    parts = list(rel.parts)
    if parts[-1] == "__init__":
        parts = parts[:-1]
    modules[".".join(parts)] = f


def resolve(name):
    # Map an imported name to the closest project module (app.models.user.User -> app.models.user).
    while name:
        if name in modules:
            return name
        name = name.rpartition(".")[0]
    return None


graph = {}
for mod, f in modules.items():
    is_pkg = f.name == "__init__.py"
    base = mod.split(".") if is_pkg else mod.split(".")[:-1]
    deps = set()
    for node in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
        targets = []
        if isinstance(node, ast.Import):
            targets = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                prefix = ".".join(base[: len(base) - node.level + 1])
                src = f"{prefix}.{node.module}" if node.module else prefix
            else:
                src = node.module or ""
            targets = [f"{src}.{a.name}" for a in node.names] or [src]
        for t in targets:
            if t.split(".")[0] != pkg:
                continue
            r = resolve(t)
            if r and r != mod:
                deps.add(r)
    graph[mod] = sorted(deps)

# Package __init__ files without code only re-export, so they are left out.
graph = {m: d for m, d in graph.items() if modules[m].stat().st_size > 0}
ca = defaultdict(int)
for deps in graph.values():
    for d in deps:
        ca[d] += 1

rows = []
for mod, deps in graph.items():
    a, e = ca[mod], len(deps)
    rows.append((mod, a, e, e / (a + e) if a + e else 0))
rows.sort(key=lambda r: -(r[1] + r[2]))

print("| Modulis | Ca (ji naudoja) | Ce (jis naudoja) | I = Ce/(Ca+Ce) |")
print("|---|---|---|---|")
for mod, a, e, i in rows:
    print(f"| {mod} | {a} | {e} | {i:.2f} |")

edges = sum(r[2] for r in rows)
print(f"\nModuliu: {len(rows)}. Priklausomybiu (krastiniu): {edges}. Vid. Ce: {edges / len(rows):.2f}.")

print("\n| Paketas | Moduliu | Vid. Ca | Vid. Ce | Vid. I |")
print("|---|---|---|---|---|")
groups = defaultdict(list)
for mod, a, e, i in rows:
    parts = mod.split(".")
    groups[parts[1] if len(parts) > 2 else "(app saknis)"].append((a, e, i))
for g, vals in sorted(groups.items()):
    n = len(vals)
    avg = [sum(v[k] for v in vals) / n for k in range(3)]
    print(f"| {g} | {n} | {avg[0]:.1f} | {avg[1]:.1f} | {avg[2]:.2f} |")

# Cycles (depth-first search).
cycles, seen = set(), set()


def dfs(node, path):
    for d in graph.get(node, []):
        if d in path:
            cyc = path[path.index(d):]
            k = min(range(len(cyc)), key=lambda i: cyc[i])
            cycles.add(tuple(cyc[k:] + cyc[:k]))
        elif d not in seen:
            dfs(d, path + [d])
    seen.add(node)


for m in graph:
    dfs(m, [m])
print(f"\nCikliniu priklausomybiu: {len(cycles)}")
for c in sorted(cycles):
    print("  " + " -> ".join(c + (c[0],)))
