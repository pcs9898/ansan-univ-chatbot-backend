module.exports = {
  apps: [
    {
      name: 'ansan-univ-chatbot-backend',
      script: './dist/main.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
