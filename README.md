# Claude Code 模型切换器

VS Code 插件，用于快速切换 Claude Code CLI 的模型服务商。

## 项目结构

```
.
├── claude-code-model-switcher/     # VS Code 插件目录
│   ├── src/                        # TypeScript 源代码
│   ├── resources/                  # 资源文件
│   ├── package.json               # 插件配置
│   └── README.md                  # 插件说明
├── install.sh                      # 安装脚本
└── README.md                       # 本文件
```

## 快速安装

```bash
./install.sh
# 或者手动：
code --install-extension claude-code-model-switcher/claude-code-model-switcher-1.0.0.vsix
```

## 工作原理

插件管理两个文件：

| 文件 | 用途 | 修改方式 |
|-----|------|---------|
| `.claude/model-providers.json` | 供应商列表（baseUrl, authToken）| **可视化编辑** |
| `.claude/settings.json` | Claude Code 配置（env 字段）| **自动更新** |

### model-providers.json 示例

```json
{
  "providers": [
    {
      "id": "glm",
      "name": "智谱 GLM",
      "baseUrl": "https://open.bigmodel.cn/api/anthropic",
      "authToken": "your-api-key"
    }
  ]
}
```

## 使用流程

1. **添加供应商**：点击 `+` → 打开 JSON → 编辑保存
2. **切换模型**：**直接点击**供应商名称 → 自动更新 settings.json
3. **编辑配置**：点击 `编辑配置文件` 或直接修改 JSON

## 交互设计

- ✅ **添加/编辑**：打开 JSON 文件可视化编辑
- ✅ **切换**：一键点击切换，无需弹窗
- ✅ **实时刷新**：保存 JSON 后面板自动更新
