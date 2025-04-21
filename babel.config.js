module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  // Otimização para Node.js v18
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsProperties: true
  },
  plugins: [
    '@babel/plugin-transform-class-static-block'
  ]
};