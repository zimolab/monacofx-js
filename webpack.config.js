const path = require("path")
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    mode: "development",

    entry: path.resolve(__dirname, "src/index.js"),
    output: {
        // 输出文件夹
        //path: path.resolve(__dirname, "dist"),
        path: "D:\\MyProjects\\MonacoEditorFx2\\core-library\\src\\main\\resources\\dist",
        filename: "monacofx.bundle.js",
        // 清理输出文件夹
        clean: true
    },

    module: {
        rules: [
            // ts文件的解析规则
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/
            },
            // css
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            // font
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
            // images
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },

    plugins: [
        new MonacoWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: "./src/index.html"
        })
    ],

    resolve: {
        // 需要打包的文件后缀
        extensions: [".tsx", ".ts", ".js"]
    }
}