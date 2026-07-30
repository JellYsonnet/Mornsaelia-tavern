import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { VueLoaderPlugin } from 'vue-loader'
import CopyWebpackPlugin from 'copy-webpack-plugin'

export default (env: any, argv: any) => {
  const isProd = argv.mode === 'production'

  return {
    entry: './src/莫恩瑟利亚/前端/index.ts',
    output: {
      path: path.resolve(process.cwd(), 'dist/莫恩瑟利亚/前端'),
      filename: 'app.[contenthash:8].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|gif|svg|woff2?)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin({
        template: './src/莫恩瑟利亚/前端/index.html',
        filename: 'index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/莫恩瑟利亚/角色卡',
            to: path.resolve(process.cwd(), 'dist/莫恩瑟利亚/角色卡'),
          },
        ],
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      open: true,
    },
    ...(isProd ? {} : { devtool: 'source-map' }),
  }
}
