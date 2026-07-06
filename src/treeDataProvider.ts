import * as vscode from 'vscode';
import { SettingsManager, Provider } from './settingsManager';

export class ProviderTreeItem extends vscode.TreeItem {
    constructor(
        public readonly provider: Provider,
        public readonly isActive: boolean
    ) {
        super(
            provider.name,
            vscode.TreeItemCollapsibleState.None
        );

        // 检查是否已配置（有 authToken）
        const isConfigured = provider.authToken && provider.authToken.trim() !== '' && 
                            provider.authToken !== 'your-api-key' && 
                            provider.authToken !== 'your-api-key-here';

        // 模型信息
        const modelInfo = provider.model?.trim() ? `\n模型: ${provider.model}` : '';
        const smallFastModelInfo = provider.smallFastModel?.trim() ? `\n快模型: ${provider.smallFastModel}` : '';

        // 设置 tooltip
        if (isActive) {
            this.tooltip = `${provider.name} (当前使用)\n${provider.baseUrl}${modelInfo}${smallFastModelInfo}`;
        } else if (!isConfigured) {
            this.tooltip = `${provider.name} (未配置)\n${provider.baseUrl}\n⚠️ 请先编辑配置文件填写 API Key`;
        } else {
            this.tooltip = `${provider.name}\n${provider.baseUrl}${modelInfo}${smallFastModelInfo}`;
        }
        
        // 设置描述文字
        if (isActive) {
            this.description = `✓ 当前使用${provider.model?.trim() ? ' • ' + provider.model : ''}`;
        } else if (!isConfigured) {
            this.description = '⚠️ 未配置';
        } else if (provider.model?.trim()) {
            this.description = provider.model;
        } else {
            this.description = '';
        }
        
        // 设置图标
        if (isActive) {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
            this.contextValue = 'activeProvider';
        } else if (!isConfigured) {
            // 未配置 - 灰色图标
            this.iconPath = new vscode.ThemeIcon('server', new vscode.ThemeColor('disabledForeground'));
            this.contextValue = 'unconfiguredProvider';
        } else {
            this.iconPath = new vscode.ThemeIcon('server');
            this.contextValue = 'provider';
        }

        // 设置命令 - 未配置时显示提示，已配置时切换
        if (!isConfigured) {
            this.command = {
                command: 'claudeCodeModelSwitcher.editProvider',
                title: '编辑配置',
                arguments: []
            };
        } else {
            this.command = {
                command: 'claudeCodeModelSwitcher.switchModel',
                title: '切换模型',
                arguments: [this]
            };
        }
    }
}

export class ModelProviderTreeDataProvider implements vscode.TreeDataProvider<ProviderTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProviderTreeItem | undefined | null | void> = new vscode.EventEmitter<ProviderTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProviderTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private settingsManager: SettingsManager) {
        // 监听文件变化，自动刷新
        this.setupFileWatcher();
    }

    private setupFileWatcher(): void {
        const providersPath = this.settingsManager.getProvidersFilePath();
        const watcher = vscode.workspace.createFileSystemWatcher(providersPath);
        
        watcher.onDidChange(() => this.refresh());
        watcher.onDidCreate(() => this.refresh());
        
        // 监听编辑器保存事件
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.fileName === providersPath) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ProviderTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<ProviderTreeItem[]> {
        const providers = await this.settingsManager.getProviders();
        const activeProvider = await this.settingsManager.getActiveProvider();

        return providers.map(provider => {
            return new ProviderTreeItem(
                provider, 
                activeProvider?.id === provider.id
            );
        });
    }
}
