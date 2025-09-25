#!/usr/bin/env node
/**
 * Script de verificación pre-deploy
 * Ejecutar con: node verificar.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando proyecto OPE Medicina Next.js...\n');

let errors = 0;
let warnings = 0;

// Verificar archivos críticos
const criticalFiles = [
  'package.json',
  'next.config.js',
  'pages/index.js',
  'pages/_app.js',
  'pages/api/init.js',
  'pages/api/questions.js',
  'pages/api/answer.js',
  'pages/api/complete-test.js',
  'data/questions.json',
  'styles/globals.css'
];

console.log('📁 Verificando archivos críticos:');
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
    errors++;
  }
});

// Verificar el archivo de preguntas
console.log('\n📊 Verificando datos:');
try {
  const questionsPath = path.join(__dirname, 'data/questions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  console.log(`  ✅ questions.json válido`);
  console.log(`  ✅ ${questionsData.length} preguntas cargadas`);
  
  // Verificar estructura de primera pregunta
  if (questionsData.length > 0) {
    const firstQuestion = questionsData[0];
    const requiredFields = ['id', 'pregunta', 'opciones', 'correcta', 'categoria'];
    const hasAllFields = requiredFields.every(field => field in firstQuestion);
    
    if (hasAllFields) {
      console.log(`  ✅ Estructura de preguntas correcta`);
    } else {
      console.log(`  ⚠️  Estructura de preguntas incompleta`);
      warnings++;
    }
  }
} catch (error) {
  console.log(`  ❌ Error al leer questions.json: ${error.message}`);
  errors++;
}

// Verificar package.json
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['next', 'react', 'react-dom', '@vercel/kv'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - NO ENCONTRADO en dependencies`);
      errors++;
    }
  });
} catch (error) {
  console.log(`  ❌ Error al leer package.json: ${error.message}`);
  errors++;
}

// Verificar node_modules
console.log('\n🔧 Verificando instalación:');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules existe');
  console.log('  ℹ️  Si hay problemas, ejecuta: npm install');
} else {
  console.log('  ⚠️  node_modules NO existe');
  console.log('  📌 Ejecuta: npm install');
  warnings++;
}

// Verificar .env.local
console.log('\n🔐 Variables de entorno:');
if (fs.existsSync('.env.local')) {
  console.log('  ✅ .env.local existe');
} else {
  console.log('  ℹ️  .env.local NO existe (normal si es primera vez)');
  console.log('  📌 Se configurará automáticamente en Vercel');
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN:');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ ¡TODO PERFECTO! El proyecto está listo para deploy.');
  console.log('\n🚀 Próximos pasos:');
  console.log('  1. git init');
  console.log('  2. git add .');
  console.log('  3. git commit -m "Initial commit"');
  console.log('  4. Subir a GitHub');
  console.log('  5. Deploy en Vercel');
} else {
  console.log(`⚠️  Encontrados: ${errors} errores, ${warnings} advertencias`);
  
  if (errors > 0) {
    console.log('\n❌ Corrige los errores antes de continuar.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Puedes continuar, pero revisa las advertencias.');
  }
}

console.log('\n💡 Para más detalles, consulta:');
console.log('  - REVISION_COMPLETA.md');
console.log('  - DEPLOY_INSTRUCTIONS.md');
console.log('  - IMPORTANTE_GITHUB_ACLARACION.md');