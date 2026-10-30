# 文件职责与安装说明

## 文件映射

| 文件 | 职责 | 使用位置 |
| --- | --- | --- |
| `extension/package.json` | 活动栏、WebviewView、主页/刷新命令及默认切换快捷键声明 | 本地 VS Code 扩展 |
| `extension/extension.js` | 侧栏显示/隐藏生命周期、调用内部桥接、切换 X 与源代码管理 | 扩展宿主 |
| `extension/media/x-browser.svg` | 活动栏入口图标 | 扩展资源 |
| `dist/moo-local.x-browser-sidebar-0.1.0.vsix` | 以上三项的本地安装包 | 通过 VS Code 安装；单装它不足以提供内部桥接 |
| `patches/native-sidebar-bridge.js` | 注册内部命令，创建原生视图，定位与显隐、子视图、移动模拟和按键转发 | 追加到指定版本的 `workbench.desktop.main.js` 同一模块作用域 |
| `patches/x-reading-preload.js` | X 域名限定的配色/字体、头像列、emoji、广告、弹窗、媒体 0.1 与两秒悬停处理 | 追加到内置浏览器预加载文件末尾 |
| `patches/main-emulation-replacements.json` | 两处最小替换：X 的移动屏幕保留，触控关闭，并声明精确指针/hover | 指定版本的 `out/main.js` |
| `examples/keybindings.mac.json` | 按 activeViewlet 分支的两条用户级 ⌘⌥X 绑定 | 合并到需要的默认/独立 Profile 的快捷键文件 |
| `scripts/patch-vscode.py` | 检查版本与锚点，默认只显示计划；显式应用时备份三个文件，提供校验恢复 | macOS 本地安装辅助工具 |
| `tests/check-sidebar.cjs` | 原生视图生命周期、自适应布局、移动配置、按键转发等模拟测试 | Node.js |
| `tests/check-sidebar-extension.cjs` | 扩展生命周期和切换命令测试 | Node.js |
| `tests/check-opacity.cjs` | 媒体控制层去重、兜底、节点复用与属性监听测试 | Node.js |
| `tests/check-hover-delay.cjs` | 两秒计时、提前移出取消、恢复/重置、广告排除测试 | Node.js |

这些是本次本地修改的代码快照；测试中部分读取实际源码片段并使用模拟 DOM/服务，不是完整浏览器端到端测试。已知视频播放错误、DOM 结构变化、未全面复验的媒体类型等限制见 README。

## 版本限制

内部桥接仅适配 VS Code **1.139.0**，commit **2242ebbb54efeeb0129e08e919e7e8d43033cd83**。`qe`、`be`、`Jl`、`oi`、`ht` 等是该版本的打包别名，不是稳定的扩展 API。其他版本必须先定位接口并移植，不能直接追加执行。

`mooMouseHover` 是这套桥接与 main 补丁约定的内部设备标记，不是 Electron 公共参数。对没有该标记的移动模拟实例保留原有行为。当前网页内的专用按键判断是 macOS ⌘⌥X；更换用户绑定时需要同时处理网页转发，不应假定任意新键会自动生效。

## 安装步骤

1. 先阅读完整 Prompt，记录原生页面行为；关闭 VS Code 前确认没有需要继续运行的调试/任务。确认本机版本和 commit 完全匹配。
2. 用 Python 3 运行只读计划：

   ```sh
   python3 scripts/patch-vscode.py
   ```

3. 检查计划后，退出 VS Code，再应用并保存输出的备份路径：

   ```sh
   python3 scripts/patch-vscode.py --apply
   ```

   脚本会备份三个文件再写入；它不是安装事务，若中途写入失败，应使用备份手动恢复。没有写入权限时停止并解决实际权限问题，不关闭系统安全机制。更新 VS Code 后不要覆盖旧备份强行套用。

4. 安装本地 VSIX，可使用 VS Code 的“从 VSIX 安装…”；或运行本机 VS Code CLI：

   ```sh
   code --install-extension dist/moo-local.x-browser-sidebar-0.1.0.vsix --force
   ```

   每个不共享扩展的现有 Profile 都需要安装，例如 `--profile "Profile 名称"`。不要直接照抄别人的配置文件名；在设置界面核实当前默认/继承关系。

5. 将 `examples/keybindings.mac.json` 的两条绑定合并到默认和所有需要的独立 Profile；保留用户其他按键，不覆盖整个现有文件。继承默认按键的 Profile 使用默认绑定。安装脚本不修改用户配置，也不自动保证未来空白 Profile 的继承。
6. 完整重启 VS Code，在左侧打开 X，按 Prompt 验收。修改预加载脚本后网页刷新即可重新加载；工作台桥接与 main 变更需要完整重启。

安装脚本是此次整理新增的辅助代码，已进行只读检查和临时目录应用/恢复测试；没有再对当前运行中的安装执行一次 `--apply`。它不会安装 VSIX、修改 Profiles 或自行重启应用。

## 回退

退出 VS Code，使用该脚本生成的备份目录：

```sh
python3 scripts/patch-vscode.py --restore /实际的备份目录
```

恢复时校验当前文件必须匹配该次补丁结果，以免覆盖后续升级或其他修改。若不匹配，先人工核对，或从官方安装包恢复 VS Code。然后卸载本地扩展、只删除这套专用快捷键并完整重启。恢复到的是该次应用前的字节；若应用前已有旧补丁，不等于恢复官方原版。

修改安装文件可能触发完整性警告；仓库不提供关闭检查的操作。

## 检查与打包

运行：

```sh
node --check extension/extension.js
node --check patches/x-reading-preload.js
node --check patches/native-sidebar-bridge.js
node tests/check-sidebar.cjs
node tests/check-sidebar-extension.cjs
node tests/check-opacity.cjs
node tests/check-hover-delay.cjs
```

VSIX 只包含扩展声明、入口和图标，不包含两个完整的 VS Code 打包程序。源码更新后必须重新生成 VSIX，不能让安装包和源码长期不一致；桥接和预加载代码仍需独立安装。
