"""Datos simulados de los instrumentos (pretest/postest, SUS y TAM) para 25 participantes virtuales.
Sirven para verificar el procedimiento de análisis; no corresponden a personas reales."""
import csv, numpy as np
from scipy import stats

rng = np.random.default_rng(20261116)
n = 25
pre = np.clip(rng.normal(52, 11, n), 20, 85).round()
post = np.clip(pre + rng.normal(14, 10, n), 25, 100).round()
# SUS: 10 ítems 1-5; impares positivos, pares negativos
nivel = rng.normal(0.9, 0.45, n)
sus_items = np.zeros((n, 10))
for j in range(10):
    base = 3 + nivel if j % 2 == 0 else 3 - nivel
    sus_items[:, j] = np.clip(np.round(base + rng.normal(0, 0.6, n)), 1, 5)
sus = ((sus_items[:, ::2] - 1).sum(1) + (5 - sus_items[:, 1::2]).sum(1)) * 2.5
# TAM: 4 dimensiones x 4 ítems (1-5)
dims = {'Utilidad percibida': 4.2, 'Facilidad de uso percibida': 4.0, 'Actitud hacia el uso': 4.3, 'Intención de uso': 4.1}
tam = {}
for d, m in dims.items():
    lat = rng.normal(m, 0.4, n)
    tam[d] = np.clip(np.round(lat[:, None] + rng.normal(0, 0.35, (n, 4))), 1, 5)

def alfa(items):
    k = items.shape[1]
    return k / (k - 1) * (1 - items.var(0, ddof=1).sum() / items.sum(1).var(ddof=1))

w = stats.wilcoxon(post, pre)
z = stats.norm.isf(w.pvalue / 2)
r = z / np.sqrt(n)
print(f'pretest {pre.mean():.1f} ({pre.std(ddof=1):.1f}) postest {post.mean():.1f} ({post.std(ddof=1):.1f}) aumento {100*(post.mean()-pre.mean())/pre.mean():.1f}% W={w.statistic} p={w.pvalue:.6f} r={r:.2f} mejoraron={int((post>pre).sum())}')
print(f'SUS media {sus.mean():.1f} DE {sus.std(ddof=1):.1f} mediana {np.median(sus):.1f} min {sus.min()} max {sus.max()} >=68: {int((sus>=68).sum())} alfa {alfa(np.column_stack([sus_items[:, ::2]-1, 5-sus_items[:, 1::2]])):.2f}')
for d, it in tam.items():
    s = it.mean(1)
    print(f'{d}: media {s.mean():.2f} DE {s.std(ddof=1):.2f} alfa {alfa(it):.2f}')
with open('docs/evidencias/simulacion-instrumentos.csv', 'w', newline='') as f:
    wr = csv.writer(f)
    wr.writerow(['participante', 'rango_edad', 'pretest', 'postest', 'sus'] + list(dims))
    for i in range(n):
        wr.writerow([f'P{i+1:02d}', '15-17' if i < 13 else '18-20', int(pre[i]), int(post[i]), sus[i]] + [round(tam[d][i].mean(), 2) for d in dims])
