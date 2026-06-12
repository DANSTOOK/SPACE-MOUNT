import webview
from pathlib import Path

html_file = Path(__file__).parent / 'standalone.html'
webview.create_window('Space Mount', f'file://{html_file}', width=1280, height=960)
webview.start()
