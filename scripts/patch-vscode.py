#!/usr/bin/env python3
"""Version-pinned patch installer. Defaults to a read-only plan."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / 'patches/main-emulation-replacements.json').read_text())

def digest(data):
    return hashlib.sha256(data).hexdigest()

def append_fragment(original, fragment, marker):
    if original.count(marker) > 1:
        raise RuntimeError('Multiple patch markers; inspect installation first: ' + marker)
    return original.split(marker)[0].rstrip() + '\n' + fragment

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, default=Path('/Applications/Visual Studio Code.app'))
    parser.add_argument('--apply', action='store_true', help='Write patches after preflight and backup')
    parser.add_argument('--restore', type=Path, help='Restore a backup created by this script')
    parser.add_argument('--backup-root', type=Path, default=Path.home() / '.local/share/vscode-x-sidebar-backups')
    args = parser.parse_args()
    app = args.app.resolve()
    if args.restore:
        if args.apply:
            parser.error('--restore and --apply are mutually exclusive')
        manifest = json.loads((args.restore / 'manifest.json').read_text())
        if manifest['app'] != str(app):
            raise RuntimeError('Backup belongs to another app')
        for entry in manifest['files']:
            path = app / entry['relative']
            if digest(path.read_bytes()) != entry['patched_sha256']:
                raise RuntimeError('Installed file changed since patch; refusing overwrite: ' + str(path))
            if digest((args.restore / entry['backup']).read_bytes()) != entry['original_sha256']:
                raise RuntimeError('Backup checksum mismatch')
        for entry in manifest['files']:
            (app / entry['relative']).write_bytes((args.restore / entry['backup']).read_bytes())
        print('Restored. Fully restart VS Code.')
        return
    resources = app / 'Contents/Resources/app'
    package = json.loads((resources / 'package.json').read_text())
    product = json.loads((resources / 'product.json').read_text())
    if package['version'] != SPEC['version'] or product.get('commit') != SPEC['commit']:
        raise RuntimeError('Unsupported VS Code version/commit; port the patch first')
    relative = [
        'Contents/Resources/app/out/main.js',
        'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js',
        'Contents/Resources/app/out/vs/platform/browserView/electron-browser/preload-browserView.js',
    ]
    originals = [(app / name).read_bytes() for name in relative]
    main_text, workbench, preload = [data.decode('utf-8') for data in originals]
    for entry in SPEC['replacements']:
        before, after = entry['before'], entry['after']
        if main_text.count(after) == 1 and main_text.count(before) == 0:
            continue
        if main_text.count(before) != 1 or after in main_text:
            raise RuntimeError('Main-process patch anchor mismatch; no files written')
        main_text = main_text.replace(before, after)
    if 'updateNetworkFilter(){' not in main_text:
        raise RuntimeError('Native session method missing; restore the original installation first')
    # These aliases belong to the pinned workbench build, not public extension APIs.
    for alias in ['qe.registerCommand', 'var be=', 'Jl', 'oi', 'ht.vscodeWindowId']:
        if alias not in workbench:
            raise RuntimeError('Workbench alias absent: ' + alias)
    workbench = append_fragment(workbench, (ROOT / 'patches/native-sidebar-bridge.js').read_text(), '/* moo-x-native-sidebar-bridge-v1;')
    preload = append_fragment(preload, (ROOT / 'patches/x-reading-preload.js').read_text(), '/* moo-x-reading-mode-v2:')
    patched = [text.encode('utf-8') for text in [main_text, workbench, preload]]
    for name, old, new in zip(relative, originals, patched):
        print(('UNCHANGED ' if old == new else 'UPDATE ') + str(app / name))
    if not args.apply:
        print('Read-only plan. Quit VS Code, then add --apply to write; install the VSIX separately.')
        return
    backup = args.backup_root / datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup.mkdir(parents=True, exist_ok=False)
    records = []
    for index, (name, old, new) in enumerate(zip(relative, originals, patched)):
        filename = str(index) + '.original'
        (backup / filename).write_bytes(old)
        records.append({'relative': name, 'backup': filename, 'original_sha256': digest(old), 'patched_sha256': digest(new)})
    (backup / 'manifest.json').write_text(json.dumps({'app': str(app), 'files': records}, indent=2) + '\n')
    # If a write fails, the complete backup above remains available for manual recovery.
    for name, data in zip(relative, patched):
        (app / name).write_bytes(data)
    print('Applied. Backup: ' + str(backup))
    print('Install the VSIX and merge desired keybindings, then fully restart VS Code.')

if __name__ == '__main__':
    main()
