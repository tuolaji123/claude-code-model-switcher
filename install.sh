#!/bin/bash

# Claude Code 模型切换器 - 安装脚本

echo "==================================="
echo "Claude Code 模型切换器 - 安装脚本"
echo "==================================="
echo ""

cd "$(dirname "$0")/claude-code-model-switcher"

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 已安装: $(node -v)"

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未检测到 npm"
    exit 1
fi

echo "✓ npm 已安装: $(npm -v)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装完成"
echo ""

# 编译 TypeScript
echo "🔨 编译插件..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✓ 编译完成"
echo ""

# 打包成 .vsix
echo "📦 打包插件..."
npx vsce package --no-dependencies

if [ $? -ne 0 ]; then
    echo "⚠️  打包失败，尝试安装 vsce..."
    npm install -g @vscode/vsce
    
    npx vsce package --no-dependencies
    if [ $? -ne 0 ]; then
        echo "❌ 打包失败，请手动运行 'npx vsce package'"
        exit 1
    fi
fi

echo "✓ 打包完成"
echo ""

# 查找生成的 .vsix 文件
VSIX_FILE=$(ls *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ 未找到生成的 .vsix 文件"
    exit 1
fi

echo "==================================="
echo "✅ 安装包已生成: $VSIX_FILE"
echo "==================================="
echo ""
echo "安装方式："
echo "1. 在 VS Code 中按 Ctrl+Shift+P (Cmd+Shift+P on Mac)"
echo "2. 输入 'install from vsix' 并选择"
echo "3. 选择文件: claude-code-model-switcher/$VSIX_FILE"
echo ""
echo "或者直接运行:"
echo "  code --install-extension claude-code-model-switcher/$VSIX_FILE"
echo ""
