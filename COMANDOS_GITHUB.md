# Comandos para Subir a GitHub

## Tu repositorio: git@github.com:xabierolaz/mir_idoia.git

### Ejecuta estos comandos en orden:

```bash
# 1. Navegar a la carpeta del proyecto
cd /mnt/d/IDOIA/ope-medicina-next
# O en Windows: cd D:\IDOIA\ope-medicina-next

# 2. Inicializar git (si no lo has hecho)
git init

# 3. Agregar todos los archivos
git add .

# 4. Crear el primer commit
git commit -m "Initial commit - OPE Medicina Preventiva Next.js App"

# 5. Conectar con tu repositorio
git remote add origin git@github.com:xabierolaz/mir_idoia.git

# 6. Cambiar a rama main
git branch -M main

# 7. Subir el código
git push -u origin main
```

## Si te da error de permisos SSH:

Usa HTTPS en su lugar:
```bash
git remote remove origin
git remote add origin https://github.com/xabierolaz/mir_idoia.git
git push -u origin main
```

## ¡Siguiente paso: Vercel!

Una vez subido el código:

1. Ve a https://vercel.com
2. Click "Add New..." → "Project"
3. Busca "mir_idoia"
4. Click "Import"
5. Todo se detectará automáticamente
6. Click "Deploy"

¡En 2-3 minutos tendrás tu app online! 🚀