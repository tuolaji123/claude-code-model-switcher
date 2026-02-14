# Claude Code 模型切换器

为 Claude Code CLI 快速切换不同模型服务商的 VS Code 插件。

## 工作原理

插件通过编辑 JSON 文件来管理供应商配置，切换时自动更新 `settings.json` 的 `env` 字段。

### 涉及文件

| 文件 | 位置 | 用途 |
|-----|------|------|
| `model-providers.json` | `.claude/model-providers.json` | 供应商列表配置（可视化编辑）|
| `settings.json` | `.claude/settings.json` | Claude Code 配置（自动更新）|

### model-providers.json 格式

```json
{
  "providers": [
    {
      "id": "glm",
      "name": "智谱 GLM",
      "baseUrl": "https://open.bigmodel.cn/api/anthropic",
      "authToken": "your-api-key-here"
    },
    {
      "id": "custom",
      "name": "自定义供应商",
      "baseUrl": "https://api.example.com/v1",
      "authToken": "your-api-key"
    }
  ]
}
```

### settings.json 自动更新

切换模型时，插件自动修改：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here"
  }
}
```

## 使用方法

### 1. 添加供应商

点击面板顶部的 `+` 按钮：
- 自动创建并打开 `model-providers.json`
- 在 JSON 中直接添加供应商配置
- 保存后列表自动刷新

### 2. 编辑供应商

- 点击面板顶部的 `编辑配置文件` 按钮
- 或直接打开 `.claude/model-providers.json`
- 修改 `baseUrl` 和 `authToken`
- 保存后自动生效

### 3. 切换模型

**直接点击**列表中的供应商即可切换：
- ✓ 如果已配置 → 自动更新 `settings.json`
- ⚠️ 如果未配置 → 提示先编辑配置文件

当前使用的供应商显示 **✓ 当前使用** 标记。

### 4. 重命名/删除

右键点击供应商：
- 🔤 **重命名**：快速修改显示名称
- 🗑️ **删除**：从列表移除

## 支持的供应商

任何兼容 Anthropic API 格式的服务商：

| 服务商 | Base URL 示例 |
|-------|--------------|
| 智谱 GLM | `https://open.bigmodel.cn/api/anthropic` |
| 其他 | 填写对应的 API 地址 |

## 注意事项

1. **项目级配置**：配置保存在当前项目的 `.claude/` 目录下
2. **API Key 安全**：`model-providers.json` 包含敏感信息，建议添加到 `.gitignore`
3. **实时刷新**：编辑 JSON 保存后，面板自动刷新
4. **重启生效**：切换模型后需要重启 Claude Code
