#!/usr/bin/env python3
"""逐块合成旁白，**合成后用 ASR 验证开头有没有被吃掉**，没过就换前缀重合。

为什么要这一层：
  CosyVoice 克隆音色会吃掉句首约两个字（2026-10-05 实证：
  「很多人以为…」→「人以为…」、「关键那一列…」→「那一列…」）。
  🔴 但**没有可靠的单点修法**：前置「嗯，」对某些句子有效、对另一些无效；
     而"数音节峰"这类代理指标本身就不准（10 个字能数出 11 段）。
  ⇒ 所以不去猜，改成**验证**：合完转写回来比对句首，没过就换前缀重试。
     最后明确报出哪几块仍然没救回来，而不是假装修好了。

验证细节：
  · 转写前给音频补 2 秒静音 —— ASR 的 VAD 对突然起始的音频本来就容易吞首词，
    补静音能把"ASR 的锅"和"音频真缺"分开（实测补了之后结果不变 ⇒ 确是音频缺）。
  · 判定：原文前 N 字中至少有 N-1 个按序出现在转写里；且转写不能以前缀词开头
    （以前缀开头说明前缀没被吃掉，会真的念出来）。
"""
import json, os, pathlib, re, subprocess, sys, urllib.request

W = pathlib.Path('/tmp/cbt')
OUT = W / 'audio'; OUT.mkdir(parents=True, exist_ok=True)
REPO = pathlib.Path(__file__).resolve().parents[2]
PREFIXES = ['', '嗯，', '那么，', '好，', '这个，']
HEAD_N = 3


def asr(mp3: pathlib.Path, url: str, key: str) -> str:
    pad = W / '_pad.mp3'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-t', '2',
                    '-i', 'anullsrc=r=24000:cl=mono', '-i', str(mp3),
                    '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1',
                    '-ar', '24000', '-ac', '1', '-b:a', '128k', str(pad)], check=True)
    body, bd = b'', '----' + os.urandom(8).hex()
    body += f'--{bd}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\n'.encode()
    body += b'Content-Type: audio/mpeg\r\n\r\n' + pad.read_bytes() + f'\r\n--{bd}--\r\n'.encode()
    req = urllib.request.Request(f'{url}/api/asr/identify?threshold=0.75', data=body,
                                 headers={'X-API-Key': key,
                                          'Content-Type': f'multipart/form-data; boundary={bd}'})
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        return json.load(op.open(req, timeout=180)).get('text') or ''
    except Exception as e:
        print(f'    ASR 失败: {type(e).__name__}', file=sys.stderr)
        return ''


def head_ok(src: str, got: str, prefix: str) -> bool:
    if not got:
        return False
    clean = re.sub(r'[，。、：；！？—…\s]', '', got)
    head = re.sub(r'[，。、：；！？—…\s]', '', src)[:HEAD_N]
    if prefix:
        pc = re.sub(r'[，。、：；！？—…\s]', '', prefix)
        if clean.startswith(pc):          # 前缀没被吃掉，会被念出来
            return False
    hit, pos = 0, 0
    for ch in head:                       # 按序匹配，允许漏一个（ASR 本身有误差）
        j = clean.find(ch, pos)
        if j >= 0:
            hit += 1; pos = j + 1
    return hit >= len(head) - 1


def main():
    narr = json.loads((W / 'narr.json').read_text(encoding='utf-8'))
    cred = subprocess.run(['ssh', '-o', 'ConnectTimeout=12', '-o', 'BatchMode=yes',
                           'root@182.43.81.12', 'grep -E "^FUNASR_(URL|KEY)=" /docker/recorder/env'],
                          capture_output=True, text=True).stdout
    url = re.search(r'FUNASR_URL=(\S+)', cred).group(1)
    key = re.search(r'FUNASR_KEY=(\S+)', cred).group(1)

    report = []
    for i, text in enumerate(narr):
        done = None
        for pre in PREFIXES:
            env = {**os.environ, 'TTS_CLONE_LEADIN': ''}
            r = subprocess.run([sys.executable, str(REPO / 'scripts/tts_clone.py')],
                               input=(pre + text).encode(), capture_output=True, env=env)
            if r.returncode != 0 or not r.stdout:
                continue
            pcm = W / f'_t{i}.pcm'; pcm.write_bytes(r.stdout)
            mp3 = OUT / f'n{i}.mp3'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', '24000',
                            '-ac', '1', '-i', str(pcm), '-b:a', '128k', str(mp3)], check=True)
            pcm.unlink(missing_ok=True)
            got = asr(mp3, url, key)
            ok = head_ok(text, got, pre)
            print(f'  {i:2d} 前缀「{pre or "无"}」{"✅" if ok else "✗"}  {got[:26]}', flush=True)
            if ok:
                done = pre; break
        report.append((i, done, text[:14]))
    print('\n=== 汇总 ===')
    bad = [r for r in report if r[1] is None]
    for i, pre, head in report:
        print(f'  {i:2d} {"仍未通过" if pre is None else ("原样" if pre == "" else "前缀「"+pre+"」")}  {head}')
    print(f'\n通过 {len(report)-len(bad)}/{len(report)}，仍未通过 {len(bad)} 块')
    (W / 'verify.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
