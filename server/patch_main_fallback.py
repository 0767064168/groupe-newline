from pathlib import Path
path = Path(__file__).parent.parent / 'assets' / 'js' / 'main.js'
text = path.read_text(encoding='utf-8')
normalized = text.replace('\r\n', '\n')
start = normalized.find('\n  if (!items.length) {\n')
if start == -1:
    raise ValueError('leftover if-statement not found')
end = normalized.find('\n/* Observer les éléments pour le fade-in */', start)
if end == -1:
    raise ValueError('observer marker not found')
before = normalized[:start]
after = normalized[end:]
replacement = "\n  grid.innerHTML = items.map(g => {\n" \
    "    let src = g.url || '';\n" \
    "    if (src.startsWith('../')) src = src.substring(3);\n" \
    "    const type = (g.type || '').toLowerCase();\n" \
    "    const isVideo = type === 'video' || /\\.(mp4|webm|ogg)(\\?.*)?$/.test(src.toLowerCase());\n" \
    "    const safeSrc = String(src).replace(/'/g, \\\"\\\\'\\\");\n" \
    "    return `\n" \
    "      <div class=\"gallery-item fade-in\" onclick=\"openLightbox('${safeSrc}', '${isVideo ? 'video' : 'image'}')\">\n" \
    "        ${src\n" \
    "          ? isVideo\n" \
    "            ? `<video src=\"${src}\" muted playsinline preload=\"metadata\" style=\"width:100%;height:100%;object-fit:cover;border:none\" onerror=\"this.parentElement.innerHTML='<div style=\\\"height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem\\\">🎥</div>'\"></video>`\n" \
    "            : `<img src=\"${src}\" alt=\"${g.titre}\" loading=\"lazy\" style=\"width:100%;height:100%;object-fit:cover\" onerror=\"this.parentElement.innerHTML='<div style=\\\"height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem\\\">🖼️</div>'\" />`\n" \
    "          : `<div style=\"height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:linear-gradient(135deg,var(--navy),#1a0533)\">🖼️</div>`\n" \
    "        }\n" \
    "        <div class=\"gallery-overlay\"><span>${isVideo ? '▶' : '🔍'}</span></div>\n" \
    "      </div>`;\n" \
    "  }).join('');\n"
new_content = before + replacement + after
path.write_text(new_content.replace('\n', '\r\n'), encoding='utf-8')
print('patched')
