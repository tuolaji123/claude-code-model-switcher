import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Provider {
    id: string;
    name: string;
    baseUrl: string;
    authToken: string;
}

// 内置默认供应商列表（编译时写入）
const DEFAULT_PROVIDERS: Provider[] = [
    {
        id: 'claude',
        name: 'Claude 官方 (需配置)',
        baseUrl: 'https://api.anthropic.com',
        authToken: ''
    },
    {
        id: 'glm',
        name: '智谱 GLM (需配置)',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic',
        authToken: ''
    },
    {
        id: 'kimi',
        name: 'Kimi (需配置)',
        baseUrl: 'https://api.moonshot.cn/anthropic',
        authToken: ''
    },
    {
        id: 'minimax',
        name: 'MiniMax (需配置)',
        baseUrl: 'https://api.minimaxi.com/anthropic',
        authToken: ''
    },
    {
        id: 'deepseek',
        name: 'DeepSeek (需配置)',
        baseUrl: 'https://api.deepseek.com/anthropic',
        authToken: ''
    },
    {
        id: 'gac',
        name: 'GAC 中转站 (需配置)',
        baseUrl: 'https://gaccode.com/claudecode',
        authToken: ''
    },
    {
        id: 'siliconflow',
        name: '硅基流动 (需配置)',
        baseUrl: 'https://api.siliconflow.cn',
        authToken: ''
    }
];

export class SettingsManager {
    // 获取 Claude Code 全局配置目录 (~/.claude/)
    private getGlobalClaudeDir(): string {
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (!homeDir) {
            throw new Error('无法获取用户主目录');
        }
        return path.join(homeDir, '.claude');
    }

    // 获取当前工作区的 settings.json 路径
    private getSettingsPath(): string {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.claude', 'settings.json');
        }
        throw new Error('没有打开的工作区');
    }

    // 获取全局供应商配置文件路径 (~/.claude/model-providers.json)
    private getProvidersPath(): string {
        return path.join(this.getGlobalClaudeDir(), 'model-providers.json');
    }

    private ensureDirectoryExists(filePath: string): void {
        const dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }
    }

    // 读取供应商列表
    async getProviders(): Promise<Provider[]> {
        const providersPath = this.getProvidersPath();

        if (!fs.existsSync(providersPath)) {
            // 文件不存在，返回内置默认配置
            return DEFAULT_PROVIDERS;
        }

        try {
            const content = fs.readFileSync(providersPath, 'utf-8');
            const data = JSON.parse(content);
            return data.providers || DEFAULT_PROVIDERS;
        } catch {
            return DEFAULT_PROVIDERS;
        }
    }

    // 保存供应商列表
    async saveProviders(providers: Provider[]): Promise<void> {
        const providersPath = this.getProvidersPath();
        this.ensureDirectoryExists(providersPath);
        const data = {
            providers: providers,
            description: 'Claude Code 模型供应商配置'
        };
        fs.writeFileSync(providersPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // 获取供应商文件路径（用于打开编辑器）
    getProvidersFilePath(): string {
        return this.getProvidersPath();
    }

    // 确保供应商文件存在
    async ensureProvidersFileExists(): Promise<void> {
        const providersPath = this.getProvidersPath();
        if (!fs.existsSync(providersPath)) {
            // 使用默认供应商列表，但清除敏感信息
            const initialProviders = DEFAULT_PROVIDERS.map(p => ({
                ...p,
                authToken: p.authToken && p.authToken !== '' && p.authToken !== 'your-api-key' && p.authToken.length > 20
                    ? p.authToken  // 保留有效的 API Key
                    : ''  // 清空无效或占位符 key
            }));
            await this.saveProviders(initialProviders);
        }
    }

    // 读取 settings.json
    private readSettingsJson(): any {
        const settingsPath = this.getSettingsPath();
        if (!fs.existsSync(settingsPath)) {
            return {};
        }
        try {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return {};
        }
    }

    // 保存 settings.json
    private saveSettingsJson(settings: any): void {
        const settingsPath = this.getSettingsPath();
        this.ensureDirectoryExists(settingsPath);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    }

    // 切换到指定 provider
    async switchToProvider(provider: Provider): Promise<void> {
        // 更新 settings.json 的 env 字段
        const settings = this.readSettingsJson();
        if (!settings.env) {
            settings.env = {};
        }
        settings.env.ANTHROPIC_BASE_URL = provider.baseUrl;
        settings.env.ANTHROPIC_AUTH_TOKEN = provider.authToken;
        this.saveSettingsJson(settings);
    }

    // 获取当前激活的 provider（通过比对 settings.json 中的值）
    async getActiveProvider(): Promise<Provider | null> {
        const settings = this.readSettingsJson();
        const currentBaseUrl = settings.env?.ANTHROPIC_BASE_URL;
        const currentAuthToken = settings.env?.ANTHROPIC_AUTH_TOKEN;

        if (!currentBaseUrl) {
            return null;
        }

        const providers = await this.getProviders();
        // 找到匹配的 provider（baseUrl 和 authToken 都匹配）
        return providers.find(p =>
            p.baseUrl === currentBaseUrl && p.authToken === currentAuthToken
        ) || providers.find(p => p.baseUrl === currentBaseUrl) || null;
    }

    // 添加供应商（打开 JSON 文件编辑）
    async addProvider(): Promise<void> {
        await this.ensureProvidersFileExists();
        const providersPath = this.getProvidersPath();

        // 读取当前内容
        const content = fs.readFileSync(providersPath, 'utf-8');
        const data = JSON.parse(content);

        // 添加新供应商模板
        const newProvider: Provider = {
            id: `provider-${Date.now()}`,
            name: '新供应商',
            baseUrl: 'https://api.example.com/anthropic',
            authToken: 'your-api-key'
        };

        data.providers.push(newProvider);
        fs.writeFileSync(providersPath, JSON.stringify(data, null, 2), 'utf-8');

        // 打开文件让用户编辑
        const document = await vscode.workspace.openTextDocument(providersPath);
        await vscode.window.showTextDocument(document);

        // 定位到新添加的供应商位置
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const text = editor.document.getText();
            const index = text.lastIndexOf(`"id": "${newProvider.id}"`);
            if (index !== -1) {
                const position = editor.document.positionAt(index);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            }
        }
    }

    // 编辑供应商（打开 JSON 文件）
    async editProviders(): Promise<void> {
        await this.ensureProvidersFileExists();
        const providersPath = this.getProvidersPath();
        const document = await vscode.workspace.openTextDocument(providersPath);
        await vscode.window.showTextDocument(document);
    }

    // 删除供应商
    async deleteProvider(providerId: string): Promise<void> {
        const providers = await this.getProviders();
        const newProviders = providers.filter(p => p.id !== providerId);
        await this.saveProviders(newProviders);
    }

    // 重命名供应商（快速修改，不打开 JSON）
    async renameProvider(providerId: string, newName: string): Promise<void> {
        const providers = await this.getProviders();
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
            provider.name = newName;
            await this.saveProviders(providers);
        }
    }
}
