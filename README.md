# changelog-ai

> Escribir changelogs/release notes de calidad consume tiempo de ingeniería y normalmente se hace mal (copiar mensajes de commit crudos) o no se hace. Los usuarios finales no entienden el impacto real de una nueva versión.

**changelog-ai** genera changelogs en formato [Keep a Changelog](https://keepachangelog.com/) a partir de `git log`, usando heurísticas deterministas (Conventional Commits + detección de `BREAKING CHANGE`). Sin LLM, sin GitHub API, sin dependencias de pago.

Para detalles completos del producto, consulta [PROJECT.md](PROJECT.md).

## Estado

**MVP V1 implementado.** Clasificación determinista + plantilla + CLI funcional. Validado con 22 unit tests sobre historial git real.

## Instalación

```bash
git clone https://github.com/<owner>/changelog-ai.git
cd changelog-ai
npm install
npm run build
```

## Uso

```bash
# Listar tags disponibles
node dist/cli.js tags

# Generar changelog entre dos tags
node dist/cli.js generate v0.1.0 v0.2.0

# Generar entre un tag y HEAD
node dist/cli.js generate v0.1.0 HEAD

# Escribir a archivo
node dist/cli.js generate v0.1.0 HEAD -o CHANGELOG.md

# Incluir autor y scope
node dist/cli.js generate v0.1.0 HEAD --author --scope
```

## Tipos de commit soportados

Soporta [Conventional Commits](https://www.conventionalcommits.org/) v1.0:

| Tipo       | Severidad   | Sección       |
|------------|-------------|---------------|
| `feat`     | minor       | Added         |
| `fix`      | patch       | Fixed         |
| `perf`     | minor       | Changed       |
| `refactor` | patch       | Changed       |
| `docs`     | patch       | Changed       |
| `test`     | patch       | Other         |
| `chore`    | patch       | Other         |

Marcadores de breaking change soportados:

* `feat!:` o `fix!:` (sufijo `!`)
* `<cualquiera>!:`
* Footer `BREAKING CHANGE:`

## Tests

```bash
npm test              # correr suite completa
npm run typecheck     # solo type-check
npm run build         # build a dist/
```