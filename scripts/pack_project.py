import os
import zipfile

def make_zip():
    output_path = os.path.abspath('public/ii-touchaku-alert.zip')
    applet_dir = os.path.abspath('.')

    ignore_dirs = {
        'node_modules',
        '.git',
        '.gmp_cache',
        'dev-dist',
        '.cache',
    }

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(applet_dir):
            # filter out ignored dirs
            dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.')]

            for f in files:
                if f.endswith('.zip') or f.endswith('.log'):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, applet_dir)
                zipf.write(full_path, rel_path)

    print(f"Created {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    make_zip()
