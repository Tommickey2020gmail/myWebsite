import os, sys, json, re, subprocess, pathlib, multiprocessing as mp
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, fp_scenes as SC

W = pathlib.Path('/tmp/fp'); FR = W / 'frames'; FR.mkdir(parents=True, exist_ok=True)
(W / 'out').mkdir(exist_ok=True)
PAD = 0.5                       # 镜尾静音
NARR = json.loads((W / 'narr.json').read_text(encoding='utf-8'))
assert len(NARR) == len(SC.SCENES), f'{len(NARR)} 旁白 vs {len(SC.SCENES)} 场景'

def dur(p):
    return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)],
                                capture_output=True, text=True).stdout)

ADUR = [dur(W / f'audio/n{i}.mp3') for i in range(len(NARR))]
DUR = [d + PAD for d in ADUR]
EDGE = [0.0]
for d in DUR: EDGE.append(EDGE[-1] + d)
NF = int(round(EDGE[-1] * lib.FPS))

def render_one(i, t):
    c = lib.Canvas2(); SC.SCENES[i](c, max(0.0, min(1.0, t))); return c.out()

def frame(n):
    ts = n / lib.FPS
    i = next((k for k in range(len(DUR)) if ts < EDGE[k + 1]), len(DUR) - 1)
    t = (ts - EDGE[i]) / DUR[i]
    # 🔴 这里原本做了 0.25s 交叉淡化，已去掉。
    #    原因：各镜自带入场动画（seg(t,0,.16)，6 秒的镜子要 1 秒才淡入完），
    #    所以下一镜 t=0 时画面几乎是空的。往空帧混合 = 每镜结尾内容淡到剩一成再亮起来，
    #    观感是闪一下，不是柔化。实测镜界前 0.40/0.20/0.08/0.01 秒四帧，内容逐级消失。
    #    调权重或缩短时长都治不了根 —— 只要混合就有这个凹口。
    #    让入场动画自己承担柔化即可；真正的连续性来自 dots 贯穿全片，不靠转场。
    render_one(i, t).save(FR / f'f{n:05d}.png')

def srt_t(s):
    h, r = divmod(s, 3600); m, s2 = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s2):02d},{int(round((s2%1)*1000)):03d}'

def subs():
    cues, idx = [], 1
    for i, text in enumerate(NARR):
        parts, buf = [], ''
        for ch in text:
            buf += ch
            if ch in '，。；：！？——' and len(buf) >= 10: parts.append(buf); buf = ''
        if buf:
            if parts and len(parts[-1]) + len(buf) <= 20: parts[-1] += buf
            else: parts.append(buf)
        tot = sum(len(p) for p in parts) or 1
        t0 = EDGE[i]
        for p in parts:
            d = ADUR[i] * len(p) / tot
            line = p if len(p) <= 18 else p[:len(p)//2] + '\n' + p[len(p)//2:]
            cues.append(f'{idx}\n{srt_t(t0)} --> {srt_t(t0+d)}\n{line}\n'); idx += 1; t0 += d
    (W/'subs.srt').write_text('\n'.join(cues), encoding='utf-8')
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(W/'subs.srt'),str(W/'raw.ass')],check=True)
    t = (W/'raw.ass').read_text(encoding='utf-8')
    t = re.sub(r'PlayResX:\s*\d+','PlayResX: 720',t); t = re.sub(r'PlayResY:\s*\d+','PlayResY: 1280',t)
    t = re.sub(r'^Style:.*$','Style: Default,Noto Sans CJK SC,38,&H00171A1F,&H00171A1F,&H00F3F8FA,&H00F3F8FA,'
               '-1,0,0,0,100,100,0,0,1,4,0,2,48,48,52,1', t, count=1, flags=re.M)
    (W/'subs.ass').write_text(t, encoding='utf-8'); print(f'字幕 {idx-1} 条')

if __name__ == '__main__':
    print(f'{len(NARR)} 镜 · {EDGE[-1]:.2f}s · {NF} 帧', flush=True)
    with mp.Pool(min(8, os.cpu_count())) as pool:
        for k,_ in enumerate(pool.imap_unordered(frame, range(NF), chunksize=12), 1):
            if k % 500 == 0: print(f'  {k}/{NF}', flush=True)
    subs()
    parts = []
    for i in range(len(NARR)):
        o = W / f'a{i}.wav'
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(W/f'audio/n{i}.mp3'),'-af','apad',
                        '-t',f'{DUR[i]:.3f}','-ar','44100','-ac','2',str(o)],check=True)
        parts.append(o)
    (W/'a.txt').write_text(''.join(f"file '{p}'\n" for p in parts))
    subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(W/'a.txt'),
                    '-c:a','aac','-b:a','128k',str(W/'audio.m4a')],check=True)
    subprocess.run(['ffmpeg','-y','-v','error','-framerate','24','-i',str(FR/'f%05d.png'),
                    '-i',str(W/'audio.m4a'),'-vf',f"subtitles={W/'subs.ass'}",
                    '-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-r','24',
                    '-c:a','copy','-movflags','+faststart',
                    '-metadata','comment=AIGC-generated-by-claude-code',
                    str(W/'out/false-positive.mp4')],check=True)
    enc = subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v',
                          '-show_entries','stream=nb_read_frames','-of','csv=p=0',str(W/'out/false-positive.mp4')],
                         capture_output=True,text=True).stdout.strip()
    print(f'编进 {enc} 帧 / 源 {NF}  {"✅" if int(enc)==NF else "🔴 丢帧"}')
