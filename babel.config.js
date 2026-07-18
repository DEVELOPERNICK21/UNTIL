require('dotenv').config();

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {
        include: [
          'UNTIL_POSTHOG_API_KEY',
          'UNTIL_POSTHOG_HOST',
          'UNTIL_POSTHOG_DEV',
        ],
      },
    ],
  ],
};
