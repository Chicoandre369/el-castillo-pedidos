#!/usr/bin/env python3
"""
El Castillo de la Fruta - v0.3.0 - Backup
Curso 7 Google Cybersecurity: Automatización con Python

Qué hace:
- Crea un .zip con fecha/hora del proyecto (sin .git, sin __pycache__, sin backups viejos)
- Lo guarda en carpeta backups/ (que está en .gitignore, no se sube a GitHub)
- Escribe un log en backups/backup.log

Uso:
  python scripts/backup.py
  python3 scripts/backup.py   (en Linux / WSL)
"""
import zipfile, pathlib, datetime, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "backups"
OUT.mkdir(exist_ok=True)

EXCLUIR = {".git", "__pycache__", "backups", ".vscode", "node_modules"}
EXCLUIR_EXT = {".pyc"}

def debe_incluir(p: pathlib.Path):
    if any(part in EXCLUIR for part in p.parts):
        return False
    if p.suffix in EXCLUIR_EXT:
        return False
    return p.is_file()

def main():
    ahora = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M")
    zip_path = OUT / f"el-castillo_backup_{ahora}.zip"
    archivos = [p for p in ROOT.rglob("*") if debe_incluir(p)]
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in archivos:
            z.write(p, p.relative_to(ROOT))
    log = OUT / "backup.log"
    linea = f"{ahora} - Backup OK: {zip_path.name} - {len(archivos)} archivos\n"
    log.write_text(log.read_text(encoding="utf-8") + linea if log.exists() else linea, encoding="utf-8")
    print(f"✅ Backup creado: {zip_path}")
    print(f"📦 {len(archivos)} archivos")
    print("Tip: Este backup es local. No se sube a GitHub por .gitignore.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error en backup: {e}")
        sys.exit(1)
