/**
 * Тесты для модуля ограничения комментариев
 * Простые unit-тесты для проверки основной логики
 */

interface MockUserData {
  completedAppointments: number;
  totalComments: number;
}

/**
 * Симуляция функции подсчета доступных комментариев
 */
function calculateAvailableComments(userData: MockUserData) {
  const { completedAppointments, totalComments } = userData;
  const availableComments = Math.max(0, completedAppointments - totalComments);
  const canComment = availableComments > 0;
  
  return {
    availableComments,
    canComment,
    completedAppointments,
    totalComments
  };
}

/**
 * Тестовые сценарии
 */
const testCases = [
  {
    name: 'Пользователь без записей не может комментировать',
    input: { completedAppointments: 0, totalComments: 0 },
    expected: { availableComments: 0, canComment: false }
  },
  {
    name: 'Пользователь с одной записью может оставить один комментарий',
    input: { completedAppointments: 1, totalComments: 0 },
    expected: { availableComments: 1, canComment: true }
  },
  {
    name: 'Пользователь достиг лимита комментариев',
    input: { completedAppointments: 3, totalComments: 3 },
    expected: { availableComments: 0, canComment: false }
  },
  {
    name: 'Пользователь может оставить еще комментарии',
    input: { completedAppointments: 5, totalComments: 2 },
    expected: { availableComments: 3, canComment: true }
  },
  {
    name: 'Граничный случай: больше комментариев чем записей',
    input: { completedAppointments: 2, totalComments: 5 },
    expected: { availableComments: 0, canComment: false }
  }
];

/**
 * Запуск тестов
 */
function runTests() {
  console.log('🧪 Запуск тестов логики ограничения комментариев...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = calculateAvailableComments(testCase.input);
    const isCorrect = 
      result.availableComments === testCase.expected.availableComments &&
      result.canComment === testCase.expected.canComment;
    
    if (isCorrect) {
      console.log(`✅ Тест ${index + 1}: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ Тест ${index + 1}: ${testCase.name}`);
      console.log(`   Ожидалось: ${JSON.stringify(testCase.expected)}`);
      console.log(`   Получено: ${JSON.stringify({
        availableComments: result.availableComments,
        canComment: result.canComment
      })}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Результаты: ${passed} прошло, ${failed} провалилось`);
  
  if (failed === 0) {
    console.log('🎉 Все тесты прошли успешно!');
  } else {
    console.log('⚠️ Некоторые тесты провалились');
  }
}

// Экспорт для возможного использования
export { calculateAvailableComments, runTests, testCases };

// Запуск тестов при прямом вызове
if (typeof window === 'undefined') {
  runTests();
}