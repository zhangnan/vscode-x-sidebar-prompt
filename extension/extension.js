'use strict';
const vscode = require('vscode');
const BRIDGE = '_mooXBrowser.nativeSidebar';
function activate(context) {
  const output = vscode.window.createOutputChannel('X 浏览器侧栏');
  let view;
  let generation = 0;
  let disposed = false;
  const call = async (action) => {
    if (disposed) return;
    try { return await vscode.commands.executeCommand(BRIDGE, action); }
    catch (error) {
      output.appendLine(`${action}: ${error.message}`);
      if (view?.visible) {
        await view.webview.postMessage({type:'error', message:'浏览器适配尚未载入。请执行“开发人员: 重新加载窗口”；VS Code 更新后可能需要重新安装适配补丁。'});
      }
    }
  };
  context.subscriptions.push(output, vscode.window.registerWebviewViewProvider('mooXBrowser.view', {
    resolveWebviewView(current) {
      view = current;
      const currentGeneration = ++generation;
      current.webview.options = {enableScripts:true, localResourceRoots:[]};
      current.webview.html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'nonce-mooXSidebarBootstrap\';"><style>body{margin:16px;color:var(--vscode-descriptionForeground);background:var(--vscode-sideBar-background);font:12px var(--vscode-font-family);line-height:1.7}</style></head><body><p id="status">正在打开 X…</p><script nonce="mooXSidebarBootstrap">window.addEventListener("message",e=>{if(e.data?.type==="error")document.getElementById("status").textContent=e.data.message;});</script></body></html>';
      const update = () => { if (currentGeneration === generation) void call(current.visible ? 'show' : 'hide'); };
      context.subscriptions.push(current.onDidChangeVisibility(update), current.onDidDispose(() => {
        if (currentGeneration !== generation) return;
        view = undefined; void call('hide');
      }));
      update();
    }
  }, {webviewOptions:{retainContextWhenHidden:true}}));
  context.subscriptions.push(vscode.commands.registerCommand('mooXBrowser.open', () => vscode.commands.executeCommand('workbench.view.extension.mooXBrowser')));
  context.subscriptions.push(vscode.commands.registerCommand('mooXBrowser.toggle', () => vscode.commands.executeCommand(view?.visible ? 'workbench.view.scm' : 'workbench.view.extension.mooXBrowser')));
  for (const action of ['back','home','reload']) context.subscriptions.push(vscode.commands.registerCommand('mooXBrowser.'+action, () => call(action)));
  context.subscriptions.push({dispose(){disposed=true; void vscode.commands.executeCommand(BRIDGE,'destroy').then(undefined,()=>{});}});
}
module.exports = {activate};
