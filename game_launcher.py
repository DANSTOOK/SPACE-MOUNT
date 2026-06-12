import os
from pathlib import Path

html_file = Path(__file__).parent / 'standalone.html'
os.startfile(str(html_file))
