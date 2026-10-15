module.exports = {
  preset: '@react-native/jest-preset',
  // Desktop sources import shared phone code as @until/* (see desktop/vite.config.ts).
  moduleNameMapper: {
    '^@until/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/desktop/node_modules', '<rootDir>/desktop/src-tauri'],
};
