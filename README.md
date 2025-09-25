# OPE Medicina Preventiva - Next.js

Sistema de estudio moderno para OPE Medicina Preventiva con 1512 preguntas, algoritmo de repetición espaciada y sincronización en la nube.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 2. Configurar variables de entorno
```bash
cp .env.local.example .env.local
# Editar .env.local con las credenciales de Vercel KV
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
# o
yarn dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📦 Deploy en Vercel

### Opción A: Deploy con CLI
```bash
npm i -g vercel
vercel
```

### Opción B: Deploy desde GitHub
1. Push a GitHub
2. Importar en Vercel Dashboard
3. Configurar Vercel KV
4. Deploy automático

## 🏗️ Estructura del Proyecto

```
ope-medicina-next/
├── pages/
│   ├── index.js          # Página principal
│   ├── _app.js           # App wrapper
│   └── api/              # API Routes
│       ├── init.js       # Cargar progreso
│       ├── questions.js  # Obtener preguntas
│       ├── answer.js     # Guardar respuesta
│       └── complete-test.js # Finalizar test
├── components/
│   ├── HomeScreen.js     # Pantalla inicio
│   ├── QuizScreen.js     # Pantalla test
│   └── ResultsScreen.js  # Pantalla resultados
├── lib/
│   ├── kv-client.js      # Cliente Vercel KV
│   └── quiz-logic.js     # Lógica del quiz
├── public/
│   └── questions.json    # 1512 preguntas
└── styles/
    └── globals.css       # Estilos globales
```

## 🔧 Configuración de Vercel KV

1. En Vercel Dashboard → Storage → Create Database → KV
2. Las variables de entorno se añaden automáticamente
3. Redeploy después de crear la base de datos

## 💡 Características

- ✅ **Responsive**: Funciona en móvil, tablet y PC
- ✅ **Sincronización**: Progreso compartido entre dispositivos
- ✅ **Algoritmo inteligente**: Preguntas falladas aparecen más
- ✅ **Sin autenticación**: Uso personal directo
- ✅ **Estadísticas**: Seguimiento detallado del progreso
- ✅ **Offline**: Funciona sin conexión (sin sincronización)

## 🛠️ Desarrollo

### Scripts disponibles
```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build de producción
npm run start    # Ejecutar build de producción
npm run lint     # Linting del código
```

### Variables de entorno
- `KV_URL`: URL de Vercel KV
- `KV_REST_API_URL`: API URL de KV
- `KV_REST_API_TOKEN`: Token de escritura
- `KV_REST_API_READ_ONLY_TOKEN`: Token de lectura

## 📊 API Routes

### GET /api/init
Obtiene progreso y estadísticas del usuario

### GET /api/questions
Devuelve 100 preguntas seleccionadas con algoritmo de peso

### POST /api/answer
Guarda respuesta individual
```json
{
  "question_id": 123,
  "answer": "b",
  "is_correct": true
}
```

### POST /api/complete-test
Guarda resultado completo del test
```json
{
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T11:00:00Z",
  "score": 85,
  "correct": 85,
  "total": 100
}
```

## 🐛 Solución de Problemas

### Las preguntas no cargan
- Verificar que `public/questions.json` existe
- Revisar la consola del navegador

### Progreso no se guarda
- Verificar variables de entorno KV
- Comprobar conexión a internet

### Error 500 en API
- Revisar logs en Vercel Dashboard
- Verificar configuración de KV

## 📝 Licencia

Uso personal - Sistema de estudio para OPE