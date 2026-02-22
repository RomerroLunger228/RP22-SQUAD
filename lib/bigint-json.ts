// Глобальная настройка для сериализации BigInt
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// Добавляем метод toJSON для BigInt
BigInt.prototype.toJSON = function() {
  return this.toString();
};

export {};