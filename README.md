# NEURIX Desktop

Aplicación de escritorio experimental con interfaz de esfera animada, control por voz y comandos básicos para abrir aplicaciones y servicios web.

## Requisitos
- Node.js 20 o superior

## Ejecutar
```bash
npm install
npm start
```

## Crear instalador
- macOS: `npm run dist:mac`
- Windows: `npm run dist:win`

La compilación debe ejecutarse en el sistema operativo correspondiente o mediante GitHub Actions. El reconocimiento y la síntesis de voz dependen del soporte del navegador y del sistema. Las integraciones con cuentas y el análisis de estadísticas privadas requieren APIs oficiales y autorización adicional.
