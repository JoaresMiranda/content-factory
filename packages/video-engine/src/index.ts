import { spawn } from 'node:child_process';
import { mkdir, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { renderInputSchema } from '@content-factory/shared';
import { z } from 'zod';

export type RenderInput = z.infer<typeof renderInputSchema>;
export type RenderOutput = { videoPath: string; thumbnailPath: string; durationSeconds: number; fileSizeBytes: number };

const FONT = process.env.FONT_FILE ?? '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const MAX_BYTES = 50 * 1024 * 1024;

function run(command: string, args: string[], timeoutMs = 30 * 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout = (stdout + chunk).slice(-32_000); });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr = (stderr + chunk).slice(-8_000); });
    child.once('error', (error) => { clearTimeout(timer); reject(new Error(`Não foi possível iniciar ${command}: ${error.message}`)); });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${command} terminou com código ${code}: ${stderr.slice(-1500)}`));
    });
  });
}

const durationOf = async (path: string) => {
  const raw = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path]);
  const duration = Number(raw);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Arquivo de narração inválido.');
  return duration;
};

export function buildSceneFilter(primaryColor: string, textFile: string) {
  return `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,drawbox=x=0:y=0:w=iw:h=130:color=${primaryColor}@0.92:t=fill,drawtext=fontfile=${FONT}:text='CONTENT FACTORY':fontcolor=white:fontsize=34:x=64:y=44,drawtext=fontfile=${FONT}:textfile=${textFile}:fontcolor=white:fontsize=48:line_spacing=12:box=1:boxcolor=black@0.62:boxborderw=28:x=(w-text_w)/2:y=h-text_h-190`;
}

export async function renderVideo(rawInput: RenderInput, workDir: string): Promise<RenderOutput> {
  const input = renderInputSchema.parse(rawInput);
  const total = input.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  if (total > 180) throw new Error('A duração somada das cenas excede 180 segundos.');
  await mkdir(workDir, { recursive: true });
  const clips: string[] = [];
  let actualDuration = 0;
  try {
    for (const [index, scene] of input.scenes.entries()) {
      const audioDuration = await durationOf(scene.audioPath);
      const duration = Math.max(scene.durationSeconds, audioDuration);
      actualDuration += duration;
      if (actualDuration > 180) throw new Error('A duração final das narrações excede 180 segundos.');
      const textPath = join(workDir, `caption-${index + 1}.txt`);
      const clipPath = join(workDir, `scene-${index + 1}.mp4`);
      await writeFile(textPath, scene.narration.replace(/\s+/g, ' ').trim().replace(/(.{1,34})(?:\s+|$)/g, '$1\n'), 'utf8');
      const visualArgs = scene.visualKind === 'image' ? ['-loop', '1', '-framerate', '30'] : ['-stream_loop', '-1'];
      await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...visualArgs, '-i', scene.visualPath, '-i', scene.audioPath,
        '-t', duration.toFixed(3), '-vf', buildSceneFilter(input.primaryColor, textPath), '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', '-b:v', '1650k', '-maxrate', '1800k', '-bufsize', '3600k',
        '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', clipPath]);
      clips.push(clipPath);
    }
    const concatPath = join(workDir, 'concat.txt');
    await writeFile(concatPath, clips.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join('\n'), 'utf8');
    const videoPath = join(workDir, 'video.mp4');
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-c', 'copy', '-movflags', '+faststart', videoPath]);
    const thumbnailPath = join(workDir, 'thumbnail.jpg');
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.5', '-i', videoPath, '-frames:v', '1', '-q:v', '2', thumbnailPath]);
    const output = await stat(videoPath);
    if (output.size > MAX_BYTES) throw new Error('O vídeo ultrapassou o limite de 50 MB do armazenamento.');
    return { videoPath, thumbnailPath, durationSeconds: Math.ceil(actualDuration), fileSizeBytes: output.size };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Falha desconhecida na renderização.');
  }
}

export async function cleanRenderDirectory(path: string) { await rm(path, { recursive: true, force: true }); }
