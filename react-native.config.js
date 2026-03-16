/**
 * React Native CLI config.
 * Ensures autolinking and generated entry point use the correct Android package
 * (must match android/app/build.gradle namespace and applicationId).
 */
module.exports = {
  project: {
    android: {
      packageName: 'app.until.time',
    },
  },
  assets: ['./src/assets/fonts/'],
};
