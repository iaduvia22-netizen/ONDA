# 📔 DEV_LOG: RR-ONDA Development Tracking

## [2026-01-13] - Sesión de Arquitectura y Visualización

**Responsable:** Senior Architect Agent

### Tareas Completadas:

- [x] Reemplazo de mapa estático por **Globo 3D Interactivo (Cobe)**.
- [x] Integración de **Marcadores de Noticias** dinámicos en el globo basados en coordenadas reales.
- [x] Implementación de **Mapa Vectorial de Colombia (SVG)** con lógica de resaltado por regiones basada en palabras clave.
- [x] Refactorización del **Layout del Dashboard** a un sistema de celdas más robusto (2 filas principales).
- [x] Creación del **BLUEPRINT.md** como fuente de verdad técnica.

### Decisiones Técnicas:

- **Server Actions:** Se movió el fetch de noticias a una Server Action para proteger la `NEWSDATA_API_KEY`.
- **Visualización:** Se decidió usar `useMemo` para el análisis de regiones en el mapa de Colombia para evitar re-calculos innecesarios en el renderizado.
- **Build Fixing:** Se eliminó la dependencia de `Avatar` de Shadcn que no estaba instalada, optando por un componente `div` estilizado para evitar bloqueos en el build.

### Próximos Pasos (Roadmap):

1.  Implementar persistencia real de artículos guardados (Database).
2.  Refinar el sistema de Onboarding para nuevos usuarios.
3.  Conectar el análisis de viralidad con la inferencia en tiempo real de Ollama.
