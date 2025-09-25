# Instrucciones de Deploy - OPE Medicina Next.js

## 📋 Pre-requisitos
- Cuenta de GitHub ✓
- Cuenta de Vercel ✓
- Node.js instalado (para desarrollo local)

## 🚀 Pasos de Deploy

### 1. Preparar el código

```bash
# En la carpeta ope-medicina-next
cd ope-medicina-next

# Inicializar Git
git init
git add .
git commit -m "Initial commit - OPE Medicina Next.js"
```

### 2. Subir a GitHub

```bash
# Crear nuevo repositorio en GitHub (privado recomendado)
# Nombre sugerido: ope-medicina-next

# Conectar y subir
git remote add origin https://github.com/TU_USUARIO/ope-medicina-next.git
git branch -M main
git push -u origin main
```

### 3. Deploy en Vercel

#### En el Dashboard de Vercel:

1. **Click en "Add New..." → "Project"**
2. **"Import Git Repository"**
3. **Seleccionar `ope-medicina-next`**
4. **Configuración del proyecto:**
   - Framework Preset: `Next.js` (detectado automáticamente)
   - Root Directory: `./` (dejar por defecto)
   - Build Command: `next build` (por defecto)
   - Output Directory: `.next` (por defecto)
   - Install Command: `npm install` (por defecto)

5. **NO añadir variables de entorno todavía**
6. **Click "Deploy"**

### 4. Configurar Base de Datos (Vercel KV)

#### Después del primer deploy:

1. **En tu proyecto → pestaña "Storage"**
2. **Click "Create Database"**
3. **Seleccionar "KV"**
4. **Configuración:**
   - Database Name: `ope-medicina-kv`
   - Primary Region: Seleccionar la más cercana
   - Environment: `Production`
5. **Click "Create"**

**IMPORTANTE**: Vercel añadirá automáticamente estas variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 5. Redeploy con Variables de Entorno

1. **Ir a "Deployments"**
2. **En el último deployment → 3 puntos → "Redeploy"**
3. **"Redeploy with existing Build Cache"**

### 6. ¡Listo! 🎉

Tu app estará en: `https://ope-medicina-next.vercel.app`

## 🧪 Verificación

1. **Acceder a la URL**
2. **Verificar que carga la página**
3. **Hacer un test de prueba**
4. **Refrescar y verificar que el progreso persiste**
5. **Probar en móvil**

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear archivo de variables locales
cp .env.local.example .env.local
# Editar .env.local con las credenciales de Vercel KV

# Ejecutar en desarrollo
npm run dev
```

## 📝 Comandos Útiles de Vercel

```bash
# Ver deployments
vercel ls

# Ver logs
vercel logs

# Ver variables de entorno
vercel env ls

# Deploy manual
vercel --prod
```

## ❓ Solución de Problemas

### Error: "Module not found"
```bash
# Limpiar caché y reinstalar
rm -rf node_modules .next
npm install
npm run build
```

### KV no funciona
1. Verificar en Settings → Environment Variables
2. Las variables KV_* deben estar presentes
3. Redeploy después de crear KV

### Build falla
1. Revisar logs del build en Vercel
2. Ejecutar localmente: `npm run build`
3. Verificar versión de Node.js

## 🔄 Actualizaciones

Para actualizar la app:

```bash
# Hacer cambios
git add .
git commit -m "Update: descripción"
git push

# Vercel desplegará automáticamente
```

## 💡 Tips

1. **Preview Deployments**: Cada PR crea un preview
2. **Dominios personalizados**: Settings → Domains
3. **Analytics**: Habilitar en proyecto (gratis)
4. **Monitoreo**: Revisar Functions → Logs

## 🎯 Siguiente Paso

1. Hacer el primer test
2. Verificar sincronización entre dispositivos
3. Personalizar si es necesario
4. ¡Estudiar para la OPE! 📚