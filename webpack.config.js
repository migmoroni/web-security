const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const engine = env.engine || 'blink';
  const isGecko = engine === 'gecko';
  
  return {
    entry: {
      popup: './src/popup/index.tsx',
      background: './src/background/index.ts',
      content: './src/content/index.ts',
      warning: './src/warning/index.tsx',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    output: {
      filename: '[name]/index.js',
      path: path.resolve(__dirname, `dist/build/${engine}`),
      clean: false, // Desabilitar limpeza automática para evitar problemas de permissão
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup/popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        template: './public/popup/warning.html',
        filename: 'popup/warning.html',
        chunks: ['warning'],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            globOptions: {
              ignore: [
                '**/.*', 
                '**/popup/warning.html',
                '**/manifest-blink.json',
                '**/manifest-gecko.json',
                '**/manifest-chrome.json',
                '**/manifest-firefox.json',
                '**/manifest.json'
              ],
            },
          },
          // Copiar o manifest específico do engine como manifest.json
          {
            from: isGecko ? 'public/manifest-gecko.json' : 'public/manifest-blink.json',
            to: 'manifest.json',
          },
        ],
      }),
    ],
    optimization: {
      minimize: false, // Desabilitar minificação temporariamente para debug
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  };
};
