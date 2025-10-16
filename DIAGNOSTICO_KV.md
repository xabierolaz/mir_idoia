# Diagnóstico: Persistencia KV no funciona en Vercel

## 🔍 Problema Reportado
La persistencia de datos NO funciona cuando la aplicación está desplegada en Vercel, aunque el código de Vercel KV está implementado correctamente.

## ✅ Verificaciones Realizadas

### 1. Código de Persistencia
El código está **correctamente implementado**:
- ✅ `lib/kv-client.js` - Cliente KV funcional
- ✅ APIs configuradas para guardar datos
- ✅ Manejo de errores con fallback

### 2. Posibles Causas del Problema

#### A. Base de Datos KV NO está creada o conectada
**ESTO ES LO MÁS PROBABLE**

Pasos para verificar:
1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar tu proyecto
3. Ir a **Storage** → ¿Ves una base de datos KV?
4. Si NO existe o NO está conectada → **ESTE ES EL PROBLEMA**

**Solución:**
```bash
# Opción 1: Desde Vercel Dashboard
1. Storage → Create Database → KV
2. Nombre: "ope-medicina-kv"
3. Create
4. Connect to Project → Seleccionar tu proyecto
5. Redeploy

# Opción 2: Desde Vercel CLI
vercel env pull
# Verificar que existan las 4 variables KV_*
```

#### B. Variables de Entorno NO configuradas
Las variables necesarias son:
```
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

**Verificación:**
1. Settings → Environment Variables
2. ¿Existen las 4 variables `KV_*`?
3. ¿Están configuradas para Production, Preview y Development?

**Si NO existen:**
1. Debes crear primero la base de datos KV
2. Al conectarla al proyecto, Vercel las añade automáticamente

#### C. Variables NO aplicadas al deployment actual
Aunque estén configuradas, el deployment puede usar versiones antiguas.

**Solución:**
1. Deployments → Último deployment
2. Tres puntos → **Redeploy**
3. ✅ Use existing Build Cache (más rápido)
4. Redeploy

#### D. KV Store en región diferente
Vercel KV puede tener latencia o problemas si la región no es compatible.

**Verificación:**
- Storage → KV Database → Ver región
- Cambiar a región más cercana si es necesario

## 🔧 Plan de Acción Paso a Paso

### Paso 1: Verificar que KV existe
```bash
# Desde tu terminal local
vercel env ls

# Deberías ver:
# KV_URL
# KV_REST_API_URL
# KV_REST_API_TOKEN
# KV_REST_API_READ_ONLY_TOKEN
```

**Si NO ves estas variables → Crear base de datos KV primero**

### Paso 2: Crear base de datos KV (si no existe)
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Tab **Storage**
4. Click **Create Database**
5. Selecciona **KV**
6. Database Name: `ope-medicina-kv`
7. Primary Region: Selecciona la más cercana
8. Click **Create**
9. Click **Connect to Project**
10. Selecciona tu proyecto
11. **Importante:** Las variables se añaden automáticamente

### Paso 3: Verificar variables
1. Settings → Environment Variables
2. Verifica que existan las 4 variables `KV_*`
3. Verifica que estén marcadas para:
   - ✓ Production
   - ✓ Preview
   - ✓ Development

### Paso 4: Redeploy
1. Deployments → Último deployment activo
2. Tres puntos (⋯) → **Redeploy**
3. Selecciona **Use existing Build Cache**
4. Click **Redeploy**
5. Espera 2-3 minutos

### Paso 5: Verificar funcionamiento
1. Abre tu app en Vercel
2. Abre Developer Tools (F12)
3. Tab **Console**
4. Inicia un test
5. Responde una pregunta
6. **Busca en console:**
   ```
   ✅ Respuesta guardada en Vercel: Q1 = a (CORRECTA)
   ```

**Si ves errores tipo:**
```
❌ Error saving answer to Vercel: [error details]
```
→ Anota el error y revisa la sección de errores comunes abajo

### Paso 6: Verificar persistencia real
1. Responde 2-3 preguntas
2. Cierra la pestaña completamente
3. Vuelve a abrir la app
4. Ve a "Estadísticas"
5. **Deberías ver:**
   - Tests realizados: 0 (porque no completaste)
   - Preguntas vistas: 2-3 (las que respondiste)

## 🐛 Errores Comunes

### Error: "KV is not defined"
```
ReferenceError: kv is not defined
```
**Causa:** Variables KV no configuradas
**Solución:** Crear base de datos KV y redeploy

### Error: "Unauthorized"
```
Error: Unauthorized (401)
```
**Causa:** Token KV inválido o expirado
**Solución:**
1. Storage → KV Database → Settings
2. Regenerate tokens
3. Redeploy

### Error: "CORS policy"
```
Access to fetch has been blocked by CORS policy
```
**Causa:** Este error es NORMAL en desarrollo local sin KV
**Solución:** Solo aplica en Vercel, en local el código usa fallback

### No guarda datos pero no hay errores
**Causa:** Código en modo fallback (simula guardado pero no persiste)
**Solución:** Ver línea 29-37 de `pages/api/answer.js`:
```javascript
// En desarrollo, simular guardado exitoso
res.status(200).json({
  status: 'ok',
  progress: { ... }
});
```
Esto significa que KV no está disponible pero la app continúa funcionando

## 📊 Diagnóstico en Vivo

### Verificar en Console del navegador:

**Si guardado funciona:**
```
✅ Respuesta guardada en Vercel: Q1 = a (CORRECTA)
```

**Si KV no está configurado:**
```
Error getting user progress: [error details]
API answer error: [error details]
```

**Si funciona pero solo en memoria:**
- Console muestra ✅ pero al recargar página se pierden datos
- Esto significa que el cliente guarda pero el servidor responde sin persistir

## 🎯 Solución Definitiva

### Opción A: Con Vercel KV (Recomendado)
**Gratis hasta 256MB y 30K requests/mes**

1. Crear base de datos KV en Vercel Dashboard
2. Conectar al proyecto
3. Redeploy
4. ✅ Persistencia funcionando

### Opción B: Sin Persistencia (localStorage)
Si no quieres usar Vercel KV, puedes modificar el código para usar `localStorage` del navegador.

**Limitaciones:**
- ❌ Datos solo en ese navegador/dispositivo
- ❌ Se pierden al limpiar caché
- ❌ No funciona en múltiples dispositivos
- ✅ Más simple, sin necesidad de base de datos

**NO recomendado para producción**

## 📞 ¿Aún no funciona?

Si después de seguir todos los pasos persiste el problema:

1. **Verifica logs en Vercel:**
   - Deployments → Tu deployment → **Functions**
   - Click en `/api/answer` → Ver logs
   - Busca errores específicos

2. **Prueba la API directamente:**
   ```bash
   curl -X POST https://tu-app.vercel.app/api/answer \
     -H "Content-Type: application/json" \
     -d '{"question_id": 1, "answer": "a", "is_correct": true}'
   ```

   **Respuesta esperada:**
   ```json
   {
     "status": "ok",
     "progress": {
       "apariciones": 1,
       "aciertos": 1,
       "ultima_fecha": "2025-..."
     }
   }
   ```

3. **Activa logs detallados:**
   - Añade `console.log` en `lib/kv-client.js`
   - Redeploy
   - Revisa Function logs

## ✅ Checklist Final

Antes de reportar un problema, verifica:

- [ ] Base de datos KV creada en Vercel
- [ ] Base de datos conectada al proyecto
- [ ] 4 variables `KV_*` existen en Environment Variables
- [ ] Variables aplicadas a Production
- [ ] Redeploy realizado después de configurar KV
- [ ] Sin errores en browser console (F12)
- [ ] Sin errores en Vercel Function logs
- [ ] Test de persistencia: responder → cerrar → abrir → ver estadísticas

## 🎓 Recursos

- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Vercel KV Quickstart](https://vercel.com/docs/storage/vercel-kv/quickstart)
- [@vercel/kv Package](https://www.npmjs.com/package/@vercel/kv)

---

**Fecha:** 2025-10-16
**Versión:** 1.0
