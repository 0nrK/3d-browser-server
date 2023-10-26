module.exports = {
  apps: [
    {
      name: "app",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "development",
        CLUSTER: "eu",
      },
      env_production: {
        NODE_ENV: "production",
        CLUSTER: "eu",
      },
    },
  ],
};
