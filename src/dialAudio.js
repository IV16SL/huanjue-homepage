// 拨号音的 Web Audio 实时合成：拨号音 + 输入号码的 DTMF。
// 握手声用真实录音（public/audio/dial-up-handshake.ogg）。

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

