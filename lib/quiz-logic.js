export function getQuestionWeight(question, progress) {
  const qKey = `q:${question.id}`;
  const qProgress = progress[qKey] || {};
  
  const apariciones = qProgress.apariciones || 0;
  const aciertos = qProgress.aciertos || 0;
  
  // Si nunca se ha mostrado, peso máximo
  if (apariciones === 0) {
    return 10.0;
  }
  
  // Calcular tasa de acierto
  const tasaAcierto = aciertos / apariciones;
  
  // Peso inversamente proporcional a la tasa de acierto
  // Más fallos = más peso = más probabilidad de aparecer
  let peso = 1.0 + (1.0 - tasaAcierto) * 9.0;
  
  // Ajustar por número de apariciones (menos apariciones = más peso)
  if (apariciones < 3) {
    peso *= 1.5;
  } else if (apariciones < 5) {
    peso *= 1.2;
  }
  
  return peso;
}

export function selectWeightedQuestions(allQuestions, progress, numQuestions = 100) {
  const distribution = {
    'examenes_navarra_pais_vasco': 40,
    'mir_medicina_preventiva': 20,
    'renave_declaracion': 15,
    'leyes': 10,
    'plan_salud_navarra': 5,
    'otros': 10
  };
  
  const selectedQuestions = [];
  
  for (const [category, count] of Object.entries(distribution)) {
    // Filtrar preguntas de la categoría
    let categoryQuestions;
    
    if (category === 'otros') {
      // Preguntas sin categoría o de otras categorías
      categoryQuestions = allQuestions.filter(q => 
        !Object.keys(distribution).includes(q.categoria) || 
        q.categoria === '' || 
        q.categoria === 'otros'
      );
    } else {
      categoryQuestions = allQuestions.filter(q => q.categoria === category);
    }
    
    if (categoryQuestions.length === 0) {
      console.log(`No hay preguntas para la categoría: ${category}`);
      continue;
    }
    
    // Calcular pesos para repetición espaciada
    const weights = categoryQuestions.map(q => getQuestionWeight(q, progress));
    
    // Seleccionar preguntas con peso
    const numToSelect = Math.min(count, categoryQuestions.length);
    
    if (numToSelect > 0) {
      const selected = [];
      const availableIndices = Array.from({ length: categoryQuestions.length }, (_, i) => i);
      
      for (let i = 0; i < numToSelect; i++) {
        if (availableIndices.length === 0) break;
        
        // Normalizar pesos para los índices disponibles
        const availableWeights = availableIndices.map(idx => weights[idx]);
        const totalWeight = availableWeights.reduce((sum, w) => sum + w, 0);
        
        let selectedIdx;
        if (totalWeight === 0) {
          // Si todos los pesos son 0, selección aleatoria
          selectedIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        } else {
          // Selección ponderada
          let random = Math.random() * totalWeight;
          selectedIdx = -1;
          
          for (let j = 0; j < availableIndices.length; j++) {
            random -= availableWeights[j];
            if (random <= 0) {
              selectedIdx = availableIndices[j];
              break;
            }
          }
          
          if (selectedIdx === -1) {
            selectedIdx = availableIndices[availableIndices.length - 1];
          }
        }
        
        selected.push(categoryQuestions[selectedIdx]);
        availableIndices.splice(availableIndices.indexOf(selectedIdx), 1);
      }
      
      selectedQuestions.push(...selected);
    }
  }
  
  // Si no se alcanzaron las preguntas necesarias, completar con adicionales
  if (selectedQuestions.length < numQuestions) {
    const remaining = numQuestions - selectedQuestions.length;
    const selectedIds = new Set(selectedQuestions.map(q => q.id));
    const availableQuestions = allQuestions.filter(q => !selectedIds.has(q.id));
    
    if (availableQuestions.length > 0) {
      // Calcular pesos y seleccionar
      const weights = availableQuestions.map(q => getQuestionWeight(q, progress));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      if (totalWeight > 0) {
        const additional = [];
        const availableIndices = Array.from({ length: availableQuestions.length }, (_, i) => i);
        
        for (let i = 0; i < Math.min(remaining, availableQuestions.length); i++) {
          const availableWeights = availableIndices.map(idx => weights[idx]);
          const currentTotalWeight = availableWeights.reduce((sum, w) => sum + w, 0);
          
          let random = Math.random() * currentTotalWeight;
          let selectedIdx = -1;
          
          for (let j = 0; j < availableIndices.length; j++) {
            random -= availableWeights[j];
            if (random <= 0) {
              selectedIdx = availableIndices[j];
              break;
            }
          }
          
          if (selectedIdx === -1) {
            selectedIdx = availableIndices[availableIndices.length - 1];
          }
          
          additional.push(availableQuestions[selectedIdx]);
          availableIndices.splice(availableIndices.indexOf(selectedIdx), 1);
        }
        
        selectedQuestions.push(...additional);
      }
    }
  }
  
  // Mezclar las preguntas
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }
  
  return selectedQuestions.slice(0, numQuestions);
}