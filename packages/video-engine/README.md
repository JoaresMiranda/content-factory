# Video Engine

Workspace reservado ao motor FFmpeg e seus templates. A renderização permanece no worker e será desenvolvida na Sprint 06.
# Video Engine

Biblioteca Node de renderização usada pelo worker. Gera cenas verticais 1080×1920, 30 fps, H.264 e AAC; mantém cada narração sincronizada com o visual, aplica identidade visual do canal e legendas, concatena cenas e extrai a miniatura. O resultado MP4 é limitado a 50 MB para o bucket privado existente.

Depende dos executáveis `ffmpeg` e `ffprobe` no `PATH` e da fonte DejaVu Sans (o container os instala). Não deve ser chamada durante o request do Next.js.
