// 拨号音 + 握手声的 Web Audio 实时合成。
// 握手部分按对真实录音的频谱实测分段排布（V.8bis 音调 → 2100Hz 应答音 →
// 探测音 → 训练噪声 → 协商音 → 终段噪声），听感接近，不逐比特还原。

export const DTMF_FREQS = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  '*': [941, 1209], 0: [941, 1336], '#': [941, 1477],
}

export function toneBurst(ctx, dest, freqs, t, dur, vol = 0.28) {
  freqs.forEach((f) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
    g.gain.setValueAtTime(vol, t + Math.max(0.015, dur - 0.04))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(dest)
    o.start(t)
    o.stop(t + dur + 0.05)
  })
}

// 拨号音(0.7s) + 输入号码的 DTMF；返回整段时长（秒）
export function playDialTones(ctx, number) {
  const dest = ctx.destination
  const t0 = ctx.currentTime + 0.05
  toneBurst(ctx, dest, [350, 440], t0, 0.7)
  let t = t0 + 0.7 + 0.1
  const clean = number.replace(/[^0-9*#]/g, '')
  for (const ch of clean) {
    const f = DTMF_FREQS[ch]
    if (!f) continue
    toneBurst(ctx, dest, f, t, 0.12)
    t += 0.12 + 0.05
  }
  return t - t0
}

function noiseBurst(ctx, dest, nodes, t, dur, freq, q, vol) {
  const len = Math.floor(ctx.sampleRate * 2)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.3)
  g.gain.setValueAtTime(vol, t + Math.max(0.3, dur - 0.3))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp)
  bp.connect(g)
  g.connect(dest)
  src.start(t)
  src.stop(t + dur + 0.05)
  nodes.push(src)
  return t + dur + 0.1
}

// 合成整段握手声（约 17s）；返回 { duration, master, stop }
export function playHandshake(ctx) {
  const t0 = ctx.currentTime + 0.05
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, t0)
  master.gain.exponentialRampToValueAtTime(0.5, t0 + 0.1)
  master.connect(ctx.destination)
  const nodes = [master]
  let t = t0

  const tone = (freq, dur, vol = 0.28, gap = 0.08) => {
    toneBurst(ctx, master, [freq], t, dur, vol)
    t += dur + gap
  }

  // 1) V.8bis 音调序列（实测：2225 / 1900 / 1184 / 1648 / 1842 / 975 Hz）
  ;[2225, 1900, 1184, 1648, 1842, 975].forEach((f) => tone(f, 0.32, 0.25))
  t += 0.4
  // 2) 2100Hz 应答音
  tone(2100, 2.0, 0.3, 0.15)
  // 3) 探测音（实测：1700 / 2400 / 675 / 2400 / 1200 Hz）
  ;[1700, 2400, 675, 2400, 1200].forEach((f, i) => tone(f, i === 4 ? 0.4 : 0.28, 0.28))
  // 4) 训练噪声 6.5s（带通白噪声）
  t = noiseBurst(ctx, master, nodes, t, 6.5, 1200, 0.5, 0.35)
  // 5) 协商音（实测：430 / 500 / 1330 Hz）
  ;[430, 500, 1330].forEach((f) => tone(f, 0.4, 0.25))
  // 6) 终段噪声 2s，稍响
  t = noiseBurst(ctx, master, nodes, t, 2.0, 1400, 0.6, 0.5)

  const duration = t - t0
  master.gain.setValueAtTime(0.5, t)
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
  return {
    duration,
    master,
    stop() {
      nodes.forEach((n) => {
        try {
          if (n.stop) n.stop()
          else n.disconnect()
        } catch { /* ignore */ }
      })
    },
  }
}
