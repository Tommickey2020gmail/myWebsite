#!/usr/bin/env python3
"""用自定义声纹（CosyVoice v2）合成一段语音，输出 24kHz 单声道 16bit 裸 PCM 到 stdout。

为什么要单独开个 Python：
  🔴 自定义音色只能走 cosyvoice-v2，而它是 **WebSocket 流式**接口，不是 REST。
     打 multimodal-generation / audio/tts/generation 两个 REST 端点都返回
     `url error, please check url`（这个报错很误导，实际含义是"这个模型不在这条路径上"）。
     Node 侧没有现成的协议实现，直接复用官方 Python SDK 最稳。
  🔴 qwen3-tts-flash 不认自定义音色，会报
     `Invalid voice specified, the requested voice does not exist or is not licensed`。

输出选 PCM 而不是 MP3，是为了和 gen-audio.mjs 里已有的 ali 分支（ALI_RATE=24000）
完全对齐——各块拼接后在最后统一编码一次，省掉逐块 mp3 的拼接杂音。

用法：  echo -n "文本" | python3 tts_clone.py > chunk.pcm
环境：  DASHSCOPE_API_KEY（必需）  ALI_CLONE_VOICE（必需，形如 cosyvoice-v2-xxx-<hash>）
        ALI_CLONE_MODEL（可选，默认 cosyvoice-v2）
"""
import os
import sys

import dashscope
from dashscope.audio.tts_v2 import AudioFormat, SpeechSynthesizer


def main() -> int:
    key = os.environ.get('DASHSCOPE_API_KEY')
    voice = os.environ.get('ALI_CLONE_VOICE')
    if not key:
        print('tts_clone: DASHSCOPE_API_KEY 未设置', file=sys.stderr); return 2
    if not voice:
        print('tts_clone: ALI_CLONE_VOICE 未设置（形如 cosyvoice-v2-xxx-<hash>）', file=sys.stderr); return 2

    text = sys.stdin.buffer.read().decode('utf-8').strip()
    if not text:
        print('tts_clone: stdin 为空', file=sys.stderr); return 2

    dashscope.api_key = key
    syn = SpeechSynthesizer(model=os.environ.get('ALI_CLONE_MODEL', 'cosyvoice-v2'),
                            voice=voice,
                            format=AudioFormat.PCM_24000HZ_MONO_16BIT)
    audio = syn.call(text)
    if not audio:
        # SDK 失败时返回 None 而不抛异常 —— 不显式检查就会写出 0 字节、
        # 一路拼接到最后才发现整段静音。
        print(f'tts_clone: 返回空音频（requestId={syn.get_last_request_id()}）', file=sys.stderr)
        return 1
    sys.stdout.buffer.write(audio)
    return 0


if __name__ == '__main__':
    sys.exit(main())
