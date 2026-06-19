# Changelog AI

## Status & Sprint
- **Status**: Inicialización (sin implementación funcional)
- **Sprint goal**: Crear estructura base y formalizar el proyecto para desarrollo futuro

## Problema
Escribir changelogs/release notes de calidad consume tiempo de ingeniería y normalmente se hace mal (copiar mensajes de commit crudos) o no se hace. Los usuarios finales no entienden el impacto real de una nueva versión.

## Mercado
Equipos de producto/ingeniería de cualquier tamaño que publican releases regulares, mantenedores de proyectos open source.

## Valor profesional
Demuestra uso correcto de LLMs para tareas estructuradas (no como "chat genérico"), procesamiento de metadata de Git/PRs, y diseño de pipelines de CI.

## Diferenciación
A diferencia de "pegar commits en ChatGPT", analiza el diff real del código (no solo el mensaje de commit) para clasificar automáticamente el impacto (breaking, feature, fix, deprecación) con evidencia, y genera notas diferenciadas por audiencia (técnica vs. usuario final).

## Modelo de negocio
GitHub Action/CLI gratuita; SaaS de pago para changelogs públicos hosteados con página personalizable y notificaciones a usuarios suscritos. **Sin tecnologías de pago en el stack**.

## Stack recomendado
- **Lenguaje:** TypeScript (integración natural con la API de GitHub y Actions). Sin costo.
- **Framework:** CLI con Commander/oclif; acción de GitHub nativa. Sin costo.
- **Base de datos:** Ninguna en el core (stateless, opera sobre el historial de Git); Postgres en la versión SaaS (auto-gestionado o gratuito). Sin costo en MVP.
- **APIs:** API de GitHub (pública, sin costo para uso básico) y API de un LLM (puede usar modelos locales o gratuitos con rate limit).
- **Infraestructura:** Ejecución dentro del pipeline de CI/CD del usuario. Sin costo.
- **Testing:** Dataset de PRs históricos etiquetados manualmente para medir precisión de clasificación. Sin costo.
- **Seguridad:** No requiere credenciales de escritura más allá de comentar en el PR/crear el archivo de changelog.

## Requisitos funcionales
- Analizar PRs/commits desde el último release y clasificar cada uno por tipo de cambio.
- Detectar breaking changes a partir del diff (no solo de palabras clave en el commit).
- Generar changelog en formato estándar (Keep a Changelog) y en lenguaje orientado a usuario final.
- Integrarse en el flujo de release (se ejecuta al crear un tag/release).
- Permitir edición manual antes de publicar (no es 100% automático sin revisión).

## Requisitos no funcionales
- Tiempo de generación menor a 1 minuto para releases de hasta 200 PRs.
- Determinismo razonable: misma entrada produce clasificación consistente (temperatura baja, reglas como fallback).
- Sin dependencia de un único proveedor de LLM (abstracción intercambiable).

## Arquitectura
El CLI obtiene el rango de commits/PRs entre dos tags vía la API de Git/GitHub, extrae diffs y metadata, aplica un clasificador en dos capas: heurísticas deterministas (conventional commits, archivos tocados) como primera señal, y un LLM como capa de refinamiento para casos ambiguos对立 diff como contexto. El resultado se renderiza con plantillas configurables.

## MVP
Clasificación basada solo en heurísticas (sin LLM) + plantilla de changelog estándar, ejecutable como CLI local.

## Roadmap
- **V1:** Heurísticas + plantilla + CLI.
- **V2:** Capa LLM para casos ambiguos, GitHub Action, comentario automático en PR.
- **V3:** SaaS de changelog público hosteado con suscripción de usuarios finales.

## Complejidad
Media

## Tiempo estimado
2 semanas

## Impacto GitHub
7/10

## Valor empleabilidad
7/10
