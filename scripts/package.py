"""Create explicitly scoped release archives without copying workspace files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import sys

root = Path(__file__).resolve().parent.parent
destination = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / 'artifacts'
destination.mkdir(exist_ok=True)
source_entries = ['index.html', 'legacy-simulator.html', 'counteroffensive', 'styles.css', 'upgrade.css', 'campaign.css', 'campaign-core.js', 'campaign.js', 'frontline.css', 'content.js', 'engine.js', 'room.js', 'director.js', 'experience.js', 'tactics.js', 'world.js', 'frontline-view.js', 'frontline.js', 'app.js',
                  'assets', 'docs', 'scripts', 'tests', '.github', '.gitignore', '.nojekyll',
                  'README.md', 'LICENSE', 'package.json']

for kind, base, entries in [('source', root, source_entries), ('web', root / 'dist', None)]:
    version=json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    archive = destination / f'StraitFront-{version}-{kind}.zip'
    if archive.exists():
        raise SystemExit(f'Refusing to overwrite existing release: {archive}')
    files = []
    for entry in (entries if entries is not None else [p.name for p in base.iterdir()]):
        p = base / entry
        files.extend([p] if p.is_file() else sorted(f for f in p.rglob('*') if f.is_file() and not set(f.relative_to(base).parts[:-1]) & {'dist', 'qa', 'node_modules', '.git', '__pycache__'}))
    with ZipFile(archive, 'x', ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(base).as_posix())
    with ZipFile(archive) as z:
        assert z.testzip() is None
        names = z.namelist()
        assert 'index.html' in names and 'legacy-simulator.html' in names
        assert 'counteroffensive/index.html' in names and 'counteroffensive/world-core.js' in names
        assert 'counteroffensive/tactical-tools.js' in names and 'counteroffensive/battle-motion.js' in names
        assert 'counteroffensive/assets/field-cel/mech-walk-atlas.png' in names
        assert 'counteroffensive/assets/field-cel/garrison-flags-atlas.png' in names
        assert sum(n.startswith('counteroffensive/assets/event-posters/') and n.endswith('.png') for n in names) == 34
        if kind == 'source':
            assert '.github/workflows/pages.yml' in names
            assert 'tests/engine.test.cjs' in names
            assert not any(n.startswith(('qa/', 'dist/', '.git/')) for n in names)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    print(f'{archive}\n{len(files)} files, {archive.stat().st_size} bytes\nSHA256 {digest}')
