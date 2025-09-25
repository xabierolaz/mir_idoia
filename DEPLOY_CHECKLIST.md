# Checklist de Deployment a Vercel

## Pasos para Deploy

### 1. Preparar el Código (YA COMPLETADO ✅)
- [x] Código Next.js compatible
- [x] API routes en formato correcto
- [x] Manejo de errores robusto
- [x] Sin dependencias de sistema

### 2. Subir a GitHub
```bash
git init
git add .
git commit -m "App OPE Medicina Preventiva para Vercel"
git remote add origin [tu-repo-url]
git push -u origin main
```

### 3. Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Importa el repositorio de GitHub
4. Configuración (dejar todo por defecto):
   - Framework Preset: Next.js (auto-detectado)
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next (por defecto)
5. Click "Deploy"

### 4. (Opcional) Configurar Vercel KV

Para persistencia entre dispositivos:

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en "Storage" → "Create Database"
3. Selecciona "KV" → "Continue"
4. Nombre: `ope-medicina-kv`
5. Click "Create"
6. Se conectará automáticamente

### 5. Variables de Entorno

No se requieren para funcionalidad básica.

Si usas Vercel KV, se configuran automáticamente:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 6. Verificar Deploy

Una vez desplegado:
1. Abre la URL de tu app
2. Verifica que carga correctamente
3. Prueba:
   - Iniciar un test
   - Responder algunas preguntas
   - Navegar entre preguntas
   - Finalizar test
   - Ver resultados

## Posibles Problemas y Soluciones

### Si la app no carga:
- Verifica los logs en Vercel Dashboard → Functions

### Si no se guardan las respuestas:
- Normal si no configuraste Vercel KV
- La app funciona en modo local sin problema

### Si las preguntas no cargan:
- Verifica que `data/questions.json` existe
- Check build logs para errores de importación

## URLs Importantes

- App desplegada: `https://[tu-proyecto].vercel.app`
- Dashboard: `https://vercel.com/dashboard`
- Logs: Dashboard → Project → Functions → Logs

## Comandos Útiles

```bash
# Para desarrollo local
npm run dev

# Para verificar build antes de deploy
npm run build
npm start
```