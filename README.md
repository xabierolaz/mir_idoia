# OPE Medicina Preventiva - Sistema de Estudio

Sistema completo de estudio para las Oposiciones de Medicina Preventiva y Salud Pública con 1512 preguntas y todas las funcionalidades de la aplicación original.

## 🎯 Funcionalidades Implementadas

### ✅ Funcionalidades Críticas
- **Sistema de temporizador**: Configurable con pausar/reanudar
- **Pausar/reanudar test**: Guarda el estado completo
- **Feedback inmediato**: Muestra correcto/incorrecto al responder
- **Historial completo**: Todos los tests con detalles

### ✅ Análisis y Visualización
- **Gráficos estadísticos**: Con Recharts (evolución, categorías, tiempos)
- **Sistema de revisión**: Revisar respuestas con filtros
- **Exportación CSV**: Descargar historial

### ✅ Configuración y UX
- **Configuración avanzada**: Preguntas (25-150), timer, feedback
- **Menú navegación**: Header responsive 
- **Sección Acerca de**: Info completa

## 🚀 Deploy en Vercel - Paso a Paso

### 1. Preparación Local (IMPORTANTE)

```bash
# Generar package-lock.json (CRÍTICO)
npm install

# Verificar build local
npm run build

# Probar aplicación
npm run start
```

### 2. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [tu-repo-url]
git push -u origin main
```

### 3. Configurar Vercel

1. **Crear cuenta** en [vercel.com](https://vercel.com)

2. **Crear base de datos KV**:
   - Dashboard → Storage → Create Database
   - Elegir "KV" 
   - Nombrar (ej: "ope-medicina-kv")
   - Create

3. **Importar proyecto**:
   - New Project → Import Git Repository
   - Seleccionar tu repo
   - Framework: Next.js (auto-detectado)

4. **Variables de entorno**:
   - Las de KV se añaden automáticamente
   - Agregar manualmente:
     ```
     NEXT_PUBLIC_APP_URL=https://[tu-app].vercel.app
     ```

5. **Deploy**:
   - Click "Deploy"
   - Esperar ~2-3 minutos

### 4. Verificación Post-Deploy

- Visitar tu URL
- Probar crear un test
- Verificar que se guarde el progreso

## 🛠️ Desarrollo Local

### Requisitos
- Node.js >= 18.17.0
- npm o yarn

### Instalación

```bash
# Clonar
git clone [tu-repo]
cd ope-medicina-next

# Instalar
npm install

# Variables de entorno
cp .env.local.example .env.local
# Editar .env.local con credenciales KV
```

`.env.local`:
```
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run start    # Ejecutar build
npm run lint     # Verificar código
```

## 📁 Estructura Completa

```
ope-medicina-next/
├── components/
│   ├── AboutScreen.js       # Acerca de
│   ├── Header.js           # Navegación
│   ├── HistoryScreen.js    # Historial
│   ├── HomeScreen.js       # Inicio
│   ├── QuizScreen.js       # Test
│   ├── ResultsScreen.js    # Resultados
│   ├── ReviewScreen.js     # Revisión
│   ├── SettingsScreen.js   # Config
│   ├── StatsScreen.js      # Estadísticas
│   └── Timer.js           # Temporizador
├── lib/
│   ├── kv-client.js       # Persistencia KV
│   └── quiz-logic.js      # Algoritmo preguntas
├── pages/
│   ├── api/
│   │   ├── answer.js      # Guardar respuesta
│   │   ├── complete-test.js # Completar test
│   │   ├── init.js        # Inicialización
│   │   └── questions.js   # Obtener preguntas
│   ├── _app.js           # App wrapper
│   └── index.js          # Página principal
├── data/
│   └── questions.json    # 1512 preguntas
├── styles/
│   └── globals.css       # Estilos
├── .gitignore
├── next.config.js        # Config Next.js
├── package.json          # Dependencias
└── README.md            # Este archivo
```

## 💾 Datos Persistidos

Vercel KV almacena:
- **Progreso por pregunta**: Aciertos/fallos
- **Estadísticas**: Tests, promedio, etc.
- **Historial**: Todos los tests
- **Configuración**: Preferencias usuario
- **Estado test**: Para pausar/reanudar

## 🔧 Solución de Problemas

### Build falla en Vercel
- Verificar que subiste `package-lock.json`
- Revisar versión Node.js >= 18.17.0

### KV no funciona
- Verificar variables en Settings → Environment Variables
- Re-deploy después de crear KV

### CORS errors
- Solo en desarrollo local
- En producción usa tu dominio

### Preguntas no cargan
- Verificar `/data/questions.json` existe
- 1512 preguntas, ~881KB

## 📱 Características

- **Responsive**: Mobile-first design
- **PWA ready**: Funciona offline (sin sync)
- **Algoritmo inteligente**: Repetición espaciada
- **Sin login**: Uso personal directo
- **Export/Import**: CSV para backup

## 🚨 Importante para Deploy

1. **SIEMPRE** ejecutar `npm install` antes de subir
2. El `package-lock.json` es CRÍTICO
3. Variables KV se configuran ANTES del deploy
4. CORS está configurado para producción

---

💪 ¡Éxito en las oposiciones!

📧 Soporte: [crear issue en GitHub]