module.exports = {
  "sourceMaps": true,
  "presets": [
    "@babel/preset-env"
  ],
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-transform-object-assign"],
    ["@babel/plugin-transform-react-jsx", { "pragma": "h" }],
    ["@babel/plugin-proposal-class-properties"]
  ]
};
