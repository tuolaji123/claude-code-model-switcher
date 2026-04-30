import * as vscode from 'vscode';
import { ModelProviderTreeDataProvider } from './treeDataProvider';
import { SettingsManager } from './settingsManager';

export function activate(context: vscode.ExtensionContext) {
    const settingsManager = new SettingsManager();
    const treeDataProvider = new ModelProviderTreeDataProvider(settingsManager);

    // 注册 TreeView
    const treeView = vscode.window.createTreeView('claudeCodeModelSwitcher', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    // 刷新命令
    const refreshCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.refresh',
        () => treeDataProvider.refresh()
    );

    // 切换模型命令 - 点击直接切换
    const switchModelCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.switchModel',
        async (item) => {
            if (item && item.provider) {
                const provider = item.provider;
                
                // 检查是否已配置
                if (!provider.baseUrl || !provider.authToken || provider.authToken === 'your-api-key' || provider.authToken === 'your-api-key-here') {
                    const result = await vscode.window.showWarningMessage(
                        `${provider.name} 尚未配置 API Key，请先编辑配置文件`,
                        '立即编辑',
                        '取消'
                    );
                    if (result === '立即编辑') {
                        vscode.commands.executeCommand('claudeCodeModelSwitcher.editProviders');
                    }
                    return;
                }
                
                // 切换到该供应商
                await settingsManager.switchToProvider(provider);
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(
                    `✓ 已切换到: ${provider.name}\n已更新 settings.json 的 ANTHROPIC_BASE_URL 和 ANTHROPIC_AUTH_TOKEN`
                );
            }
        }
    );

    // 添加供应商 - 打开 JSON 文件
    const addProviderCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.addProvider',
        async () => {
            await settingsManager.addProvider();
            treeDataProvider.refresh();
            vscode.window.showInformationMessage('已添加新供应商，请在打开的 JSON 文件中编辑配置');
        }
    );

    // 编辑供应商 - 打开 JSON 文件
    const editProviderCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.editProvider',
        async () => {
            await settingsManager.editProviders();
        }
    );

    // 重命名供应商
    const renameProviderCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.renameProvider',
        async (item) => {
            if (!item || !item.provider) return;

            const newName = await vscode.window.showInputBox({
                prompt: '修改供应商名称',
                value: item.provider.name,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '名称不能为空';
                    }
                    return null;
                }
            });

            if (newName) {
                await settingsManager.renameProvider(item.provider.id, newName.trim());
                treeDataProvider.refresh();
            }
        }
    );

    // 删除供应商
    const deleteProviderCommand = vscode.commands.registerCommand(
        'claudeCodeModelSwitcher.deleteProvider',
        async (item) => {
            if (!item || !item.provider) return;

            const result = await vscode.window.showWarningMessage(
                `确定要删除供应商 "${item.provider.name}" 吗？`,
                { modal: true },
                '删除'
            );

            if (result === '删除') {
                await settingsManager.deleteProvider(item.provider.id);
                treeDataProvider.refresh();
                vscode.window.showInformationMessage('已删除');
            }
        }
    );

    // 注册所有命令
    context.subscriptions.push(
        treeView,
        refreshCommand,
        switchModelCommand,
        addProviderCommand,
        editProviderCommand,
        renameProviderCommand,
        deleteProviderCommand
    );

    // 首次激活时检查是否需要初始化
    settingsManager.ensureProvidersFileExists().then(() => {
        treeDataProvider.refresh();
    });
}

export function deactivate() {}
