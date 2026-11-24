# NEURIX Desktop

Aplicación de escritorio experimental con interfaz de esfera animada, control por voz y comandos básicos para abrir aplicaciones y servicios web.

## Requisitos
- Node.js 20 o superior

## Ejecutar
```bash
npm install
npm start
```

## Configurar Fish Audio
1. Abre NEURIX y entra en **Ajustes**.
2. Pega tu API key nueva de Fish Audio en el campo correspondiente y pulsa **Guardar clave cifrada**.
3. La aplicación usa el Voice ID configurado en el proyecto y el modelo `s2.1-pro-free`.
4. La API key se cifra con el almacenamiento seguro del sistema y se guarda localmente; no se añade al repositorio ni se expone al renderer.
5. Si Fish Audio no está configurado o falla, NEURIX usa la voz del sistema como alternativa.

**Seguridad:** si una API key se compartió anteriormente en un chat o repositorio, revócala y crea otra antes de introducirla en NEURIX.

## Crear instalador
- macOS: `npm run dist:mac`
- Windows: `npm run dist:win`

La compilación debe ejecutarse en el sistema operativo correspondiente o mediante GitHub Actions. El reconocimiento de voz depende de la compatibilidad del sistema. Las integraciones con cuentas y el análisis de estadísticas privadas requieren APIs oficiales y autorización adicional.
