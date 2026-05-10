---
title: frp 内网穿透 RDP 准点 180 秒掉线之谜
title_en: The 180-second RDP drop on frp tunnel
description: tcpMux 接管了保活，应用层心跳却仍被 frps 当看门狗——两套保活机制相互不知情，便有了准点掉线的灵异现象。
description_en: When tcpMux took over keepalive but frps still ran its own application-layer watchdog — two liveness mechanisms unaware of each other, and a clockwork disconnection was born.
lang: zh
status: seedling
created: 2026-05-10
tags: [networking, frp, debugging, rdp, infra]
---

## 现象

用 frp 把家里的一台 Windows 机器开了 RDP 端口给外网用，怎么用怎么稳定，**唯独有一桩怪事**：连上之后，每隔正正好 180 秒，会话就断一次。不是网络抖动那种忽好忽坏，是像有人拿表卡着——3 分钟整，咔，画面冻住，重连。

像有只看不见的看门狗，每 3 分钟咬一口。

## 排查路径

按经验，"准点掉线"九成九不是网络问题，是某个超时配置。可疑名单：

- 客户端 RDP 自身的 idle timeout —— 排除，本地直连不掉
- Windows 防火墙 / NLA 重新协商 —— 排除，时间不对
- 中间路由 NAT 表项老化 —— 不像，NAT 老化通常 60s 或 300s，不是 180s
- **frp 自身的心跳/超时机制** —— 嫌疑最大

去翻 frp 源码和文档，发现两条相关的设置：

| 配置 | 默认值 | 作用 |
|------|--------|------|
| `transport.heartbeatInterval` | 30s | frpc → frps 应用层心跳发送间隔 |
| `transport.heartbeatTimeout` | 90s（旧版）/ 180s（新版） | frps 等心跳的超时上限，超时则关闭整个 proxy listener |

180 这个数字一下对上了。

## 根因

我用的镜像是 `frpc-tommy:0.65.0.1`（自定义构建），里面默认开了 `transport.tcpMux = true`。开启 tcpMux 之后，frpc 走的是基于 yamux 的多路复用通道，**保活由 mux 自己的 keepalive 帧接管，应用层不再发 heartbeat**——这是 frp 0.5x 之后的一个优化，避免双重心跳。

但是！frps 那一端的配置是另写的，仍然保留着 `transport.heartbeatTimeout = 180s` 这条**应用层**看门狗。

于是出现了一桩"两边各说各话"的局面：
- frpc：mux 层每秒都在握手，活得好好的，不发应用层心跳。
- frps：等了 180 秒一个应用层心跳没收到，认定 frpc 死了——直接把这个 proxy 的 listener 关掉。

listener 一关，TCP 连接断，RDP 自然就掉了。然后客户端立刻重连成功（因为 control 通道还活着，frpc 重新声明 proxy），用户看到的就是"准点 180 秒断一下"。

**两套保活机制各自正确，但彼此不知情，组合起来就成了灵异 bug。**

## 修复

在 frps 的配置里把这只看门狗关掉：

```toml
[common]
heartbeatTimeout = -1
```

`-1` 是 frp 的"禁用"语义。关掉之后，frps 不再用应用层心跳判断 frpc 死活，**完全交给 mux 层 keepalive 来管**。问题彻底消失，RDP 连一整天不掉。

## 教训

1. **当多层协议各自带保活时，一定要确认"谁负责、谁让位"**。tcpMux 接管保活是正确的优化，但必须把上层的看门狗也关掉，否则两边的语义不一致就是 bug 工厂。
2. **"准点掉线"这种规则性极强的故障，永远先查超时配置**，别去怀疑网络。网络坏起来从不准时。
3. 自定义镜像的默认值变了，要回到对端配置去对账。tcpMux 这种"沉默的开关"最容易出这类问题——它不会报错，只会让另一端的看门狗永远等不到那只它以为该来的心跳。

## English

### Symptom

A Windows machine at home, RDP port exposed via frp tunnel. Stable in every way except for one weird thing: **the session drops every 180 seconds, on the dot**. Not jittery — clockwork.

### Root cause

Image `frpc-tommy:0.65.0.1` enables `transport.tcpMux = true` by default. With tcpMux on, frpc relies on yamux's own keepalive frames and **stops sending the application-layer heartbeat** — this is a frp 0.5x optimization to avoid double-keepalive.

But the frps side still had `transport.heartbeatTimeout = 180s` configured — an application-layer watchdog. frps waited 180 seconds for a heartbeat that would never come, decided the client was dead, and closed the proxy listener. The client reconnected immediately, but the RDP session had already been killed.

Two correct keepalive mechanisms, unaware of each other, combining into a clockwork bug.

### Fix

```toml
[common]
heartbeatTimeout = -1
```

`-1` disables it. Let mux keepalive own liveness end-to-end. Problem solved.

### Lesson

When multiple layers each carry their own keepalive, you must explicitly decide **who owns liveness and who steps aside**. tcpMux taking over is correct — but the watchdog on the other end has to be told to stand down, or the two layers will silently disagree and one will keep killing connections that the other believes are perfectly alive.

Clockwork failures point to timeouts, not networks. Networks fail; they don't fail on a schedule.
