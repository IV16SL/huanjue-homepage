import { Background, Button, Card, CodeBlock, Countdown, Drawer, Loading, Modal, Input, Progress, Time, Footer, Notification } from 'animal-island-ui'
import { MenuIcon, BookIcon, CatIcon, MailIcon, UserIcon, PhoneIcon, LockIcon, ClockIcon, AlertTriangleIcon } from 'naive-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'animal-island-ui/style'
import './App.css'
import { playDialTones } from './dialAudio'

const tiles = [
  { label: '博客', desc: '技术备忘 · 想到哪写到哪', Icon: BookIcon, href: 'https://blog.huanjue.me', color: 'app-pink', pattern: 'app-pink' },
  { label: '猫猫', desc: '五只猫的藏身处', Icon: CatIcon, href: 'https://cat.huanjue.me', color: 'purple', pattern: 'purple' },
  { label: '邮箱', desc: 'hi@huanjue.me', Icon: MailIcon, href: 'mailto:hi@huanjue.me', color: 'app-blue', pattern: 'app-blue' },
  { label: '关于', desc: '关于这个幻觉', Icon: UserIcon, href: null, color: 'app-yellow', pattern: 'app-yellow' },
]

const HANDSHAKE_FALLBACK_SECS = 22.25

// 所有 Alert 气泡的标题：文字 + 与文字同高的警告三角
const alertTitle = (
  <span className="modal-title-with-icon">
    Alert
    <AlertTriangleIcon size={28} color="currentColor" aria-hidden="true" />
  </span>
)

// 猫猫抽卡池（档案见 ~/memory/people/）
const CATS = [
  { name: '御坂', birthday: '2016-06-11', gender: '♀', status: '在职', color: '#F8A6B2', rarity: 'SSR', weight: 10, desc: 'C位 · 全员大姐头' },
  { name: '当麻', birthday: '2016-08-27', gender: '♂', status: '在职', color: '#D8D1BE', rarity: 'SR', weight: 25, desc: '全员唯一的男孩' },
  { name: '拖把', birthday: '2022-05-25', gender: '♀', status: '在职', color: '#FFFDF8', rarity: 'SR', weight: 25, desc: '年纪最小的老幺' },
  { name: '小三', birthday: '2017-07-19', gender: '♀', status: '在职', color: '#F7CD67', rarity: 'R', weight: 20, desc: '和表表同一天生日' },
  { name: '表表', birthday: '2017-07-19', gender: '♀', status: '休假', color: '#889DF0', rarity: 'R', weight: 20, desc: '休假中——抽到了也不上班' },
]

const RARITY_COLOR = { SSR: 'app-yellow', SR: 'purple', R: 'app-blue' }

const pickCat = (rand) => {
  const total = CATS.reduce((s, c) => s + c.weight, 0)
  let r = rand() * total
  for (const c of CATS) {
    r -= c.weight
    if (r <= 0) return c
  }
  return CATS[0]
}

// 按日期播种，每天同一只
const pickTodayCat = () => {
  const d = new Date()
  let h = 0
  const seed = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return pickCat(() => {
    h = (h * 1103515245 + 12345) >>> 0
    return h / 4294967296
  })
}

const POMO_MODES = [
  { key: 'focus', label: '专注', minutes: 25 },
  { key: 'short', label: '短休息', minutes: 5 },
  { key: 'long', label: '长休息', minutes: 15 },
]

// 库里的 18 种背景预设；color 是该预设的主题色，头像/favicon 的符号取这个色
const BG_PRESETS = [
  { type: 'default', label: '奶油', color: '#C4B89E' },
  { type: 'grid', label: '网格', color: '#B4A88F' },
  { type: 'dots-dark-green', label: '深绿', color: '#5AA05A' },
  { type: 'sprinkles', label: '彩针', color: '#FF7BAC' },
  { type: 'sweet-corner', label: '甜点', color: '#E8A06C' },
  { type: 'coffee-break', label: '咖啡', color: '#C68B4E' },
  { type: 'dots-pink', label: '粉', color: '#F8A6B2' },
  { type: 'dots-purple', label: '紫', color: '#B77DEE' },
  { type: 'dots-blue', label: '蓝', color: '#889DF0' },
  { type: 'dots-yellow', label: '黄', color: '#F7CD67' },
  { type: 'dots-orange', label: '橙', color: '#E59266' },
  { type: 'dots-teal', label: '青', color: '#82D5BB' },
  { type: 'dots-green', label: '绿', color: '#8AC68A' },
  { type: 'dots-red', label: '红', color: '#FC736D' },
  { type: 'dots-lime-green', label: '柠檬绿', color: '#D1DA49' },
  { type: 'dots-yellow-green', label: '黄绿', color: '#ECDF52' },
  { type: 'dots-brown', label: '棕', color: '#9A835A' },
  { type: 'dots-warm-peach-pink', label: '蜜桃粉', color: '#E18C6F' },
]

// 步骤阈值按音频时间线对齐：拨号音 → 停顿 0.6s → 握手（V.8bis/应答音/探测/训练/协商）
const getDialSteps = (number, dialingSecs, totalSecs) => {
  const pct = (t) => Math.min(99, Math.round((t / totalSecs) * 100))
  const hs = (t) => dialingSecs + 0.6 + t // 握手文件内的时间 → 绝对时间
  return [
    { at: 0, text: `正在拨号 ${number}……` },
    { at: pct(hs(4.5)), text: '正在验证用户名和密码……' }, // 应答音结束
    { at: pct(hs(11)), text: '已在网络上注册您的计算机……' }, // 训练噪声中段
    { at: pct(hs(17)), text: '正在协商 56K 连接……' }, // 协商音
    { at: 100, text: '已连接！速度 33.6Kbps' }, // 音频播完
  ]
}

function App() {
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [wasteOpen, setWasteOpen] = useState(false)
  const [navConfirm, setNavConfirm] = useState(null)
  const [briefOpen, setBriefOpen] = useState(false)
  const [portalVisible, setPortalVisible] = useState(false)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  const [leftDrawerData, setLeftDrawerData] = useState(null)
  const [rightDrawerData, setRightDrawerData] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeTip, setRouteTip] = useState('正在进入宇宙之主的领地...')

  // 拨号上网
  const [dialLoginOpen, setDialLoginOpen] = useState(false)
  const [dialNumber, setDialNumber] = useState('16300')
  const [dialUser, setDialUser] = useState('')
  const [dialPass, setDialPass] = useState('')
  const [dialNumberErr, setDialNumberErr] = useState(false)
  const [dialUserErr, setDialUserErr] = useState(false)
  const [dialPassErr, setDialPassErr] = useState(false)
  const [bgType, setBgType] = useState(() => {
    try {
      return localStorage.getItem('hj-bg-type') || 'default'
    } catch {
      return 'default'
    }
  })
  const [avatarSrc, setAvatarSrc] = useState('/avatar.svg')
  const [dialOpen, setDialOpen] = useState(false)
  const [dialPercent, setDialPercent] = useState(0)
  const [dialSteps, setDialSteps] = useState(() => getDialSteps('16300', 1.65, 24.5))
  const [helloOpen, setHelloOpen] = useState(false)
  // 抽卡
  const [gachaOpen, setGachaOpen] = useState(false)
  const [gachaCat, setGachaCat] = useState(null)
  const [gachaRevealed, setGachaRevealed] = useState(false)
  const todayCat = useMemo(pickTodayCat, [])
  // 番茄钟
  const [pomoMode, setPomoMode] = useState('focus')
  const [pomoLeft, setPomoLeft] = useState(POMO_MODES[0].minutes * 60)
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoDone, setPomoDone] = useState(() => {
    try {
      return parseInt(localStorage.getItem('hj-pomo-done') || '0', 10) || 0
    } catch {
      return 0
    }
  })
  const pomoModeRef = useRef(pomoMode)
  pomoModeRef.current = pomoMode
  const [homePage, setHomePage] = useState(0)
  const dialTimerRef = useRef(null)
  const dialDoneRef = useRef(false)
  const actxRef = useRef(null)
  const hsTimerRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setLoading(false), 1400)
    const modalTimer = window.setTimeout(() => setModalOpen(true), 1700)

    return () => {
      window.clearTimeout(loadingTimer)
      window.clearTimeout(modalTimer)
    }
  }, [])

  // 登录框打开时预加载握手音频（已按 6.35s 剪好，直接从头播）
  useEffect(() => {
    if (dialLoginOpen) {
      const hs = new Audio('/audio/dial-up-handshake.ogg')
      hs.preload = 'auto'
      hs.load()
      audioRef.current = hs
      return () => {
        const cur = audioRef.current
        if (cur === hs) {
          try { hs.pause() } catch { /* ignore */ }
          audioRef.current = null
        }
      }
    }
    return undefined
  }, [dialLoginOpen])

  // 背景切换：持久化 + 头像/favicon 的符号自动取背景主题色
  useEffect(() => {
    try {
      localStorage.setItem('hj-bg-type', bgType)
    } catch { /* ignore */ }
    const preset = BG_PRESETS.find((p) => p.type === bgType)
    if (!preset) return
    let cancelled = false
    fetch('/avatar.svg')
      .then((r) => r.text())
      .then((svg) => {
        if (cancelled) return
        const colored = svg.replace(/#ffffff/gi, preset.color)
        const url = `data:image/svg+xml,${encodeURIComponent(colored)}`
        document
          .querySelectorAll('link[rel="icon"][type="image/svg+xml"]')
          .forEach((l) => { l.href = url })
        setAvatarSrc(url)
      })
      .catch(() => { /* 取不到就用原文件 */ })
    return () => { cancelled = true }
  }, [bgType])

  // 番茄钟走表
  useEffect(() => {
    if (!pomoRunning) return undefined
    const iv = window.setInterval(() => {
      setPomoLeft((s) => {
        if (s <= 1) {
          window.clearInterval(iv)
          setPomoRunning(false)
          const isFocus = pomoModeRef.current === 'focus'
          if (isFocus) {
            setPomoDone((d) => {
              const nd = d + 1
              try {
                localStorage.setItem('hj-pomo-done', String(nd))
              } catch { /* ignore */ }
              return nd
            })
          }
          try {
            Notification.success({
              message: isFocus ? '番茄熟了！' : '休息结束！',
              description: isFocus ? '专注 25 分钟完成，起来走走吧' : '回来继续专注吧',
            })
          } catch { /* ignore */ }
          playChime()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(iv)
  }, [pomoRunning])

  const playChime = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      const ctx = new AC()
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
      const t = ctx.currentTime + 0.05
      toneBurst(ctx, ctx.destination, [880], t, 0.25, 0.3)
      toneBurst(ctx, ctx.destination, [1174.66], t + 0.3, 0.45, 0.3)
      window.setTimeout(() => ctx.close().catch(() => {}), 1600)
    } catch { /* ignore */ }
  }

  const switchPomoMode = (key) => {
    const m = POMO_MODES.find((x) => x.key === key)
    if (!m) return
    setPomoMode(key)
    setPomoRunning(false)
    setPomoLeft(m.minutes * 60)
  }

  const openGacha = () => {
    setGachaCat(pickCat(Math.random))
    setGachaRevealed(false)
    setGachaOpen(true)
  }

  // 卸载时停掉拨号音
  useEffect(() => () => {
    if (dialTimerRef.current) window.clearInterval(dialTimerRef.current)
    if (hsTimerRef.current) window.clearTimeout(hsTimerRef.current)
    const a = audioRef.current
    if (a) {
      try { a.pause() } catch { /* ignore */ }
    }
    const actx = actxRef.current
    if (actx) {
      actx.close().catch(() => { /* ignore */ })
    }
  }, [])

  // 拨号完成：停计时器 + 握手声淡出
  useEffect(() => {
    if (dialOpen && dialPercent >= 100 && !dialDoneRef.current) {
      dialDoneRef.current = true
      if (dialTimerRef.current) {
        window.clearInterval(dialTimerRef.current)
        dialTimerRef.current = null
      }
      const au = audioRef.current
      if (au) {
        const fade = window.setInterval(() => {
          if (au.volume > 0.15) {
            au.volume = Math.max(0, au.volume - 0.15)
          } else {
            window.clearInterval(fade)
            try { au.pause() } catch { /* ignore */ }
          }
        }, 120)
      }
    }
  }, [dialOpen, dialPercent])

  const handleModalConfirm = () => {
    setModalOpen(false)
    setPortalVisible(true)
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setWasteOpen(true)
  }

  const handleWasteClose = () => {
    setWasteOpen(false)
    window.location.reload()
  }

  const handleNavigation = (event, url, label, targetBlank = true) => {
    if (event) event.preventDefault()
    if (routeLoading) return

    setRouteTip(label)
    setRouteLoading(true)
    setLeftDrawerOpen(false)
    setRightDrawerOpen(false)
    setNavConfirm(null)

    window.setTimeout(() => {
      if (targetBlank) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = url
      }
      window.setTimeout(() => setRouteLoading(false), 800)
    }, 700)
  }

  const handleDrawerLinkClick = (event, url, label, targetBlank = true) => {
    handleNavigation(event, url, label, targetBlank)
  }

  const handleNavConfirm = () => {
    if (!navConfirm) return
    handleNavigation(null, navConfirm.href, navConfirm.label, navConfirm.targetBlank)
  }

  const handleNavCancel = () => {
    setNavConfirm(null)
  }

  const openDrawer = (tile) => {
    if (tile.label === '博客') {
      setNavConfirm({
        href: tile.href,
        label: '正在进入幻觉的博客...',
        targetBlank: true,
        titleText: '幻觉的博客',
      })
      return
    }

    if (tile.label === '邮箱') {
      setNavConfirm({
        href: tile.href,
        label: '正在打开邮箱...',
        targetBlank: false,
        titleText: '邮箱',
        promptText: '要给我写信吗？',
      })
      return
    }

    if (tile.label === '猫猫') {
      setNavConfirm({
        href: tile.href,
        label: '正在进入猫猫的主页...',
        targetBlank: true,
        titleText: '猫猫主页',
      })
      return
    }

    setLeftDrawerData({
      title: '幻觉',
      kind: 'about',
    })
    setRightDrawerOpen(false)
    setLeftDrawerOpen(true)
  }

  const openDialLogin = () => {
    setBriefOpen(false)
    setDialNumberErr(false)
    setDialUserErr(false)
    setDialPassErr(false)
    setDialLoginOpen(true)
  }

  const closeDial = () => {
    if (dialTimerRef.current) {
      window.clearInterval(dialTimerRef.current)
      dialTimerRef.current = null
    }
    if (hsTimerRef.current) {
      window.clearTimeout(hsTimerRef.current)
      hsTimerRef.current = null
    }
    const hs = audioRef.current
    if (hs) {
      try { hs.pause() } catch { /* ignore */ }
      audioRef.current = null
    }
    const actx = actxRef.current
    if (actx) {
      actx.close().catch(() => { /* ignore */ })
      actxRef.current = null
    }
    setDialOpen(false)
    setDialPercent(0)
  }

  const handleDialSubmit = (event) => {
    event.preventDefault()
    const number = dialNumber.replace(/[^0-9*#]/g, '')
    let ok = true
    if (!number) {
      setDialNumberErr(true)
      ok = false
    }
    if (!dialUser.trim()) {
      setDialUserErr(true)
      ok = false
    }
    if (!dialPass) {
      setDialPassErr(true)
      ok = false
    }
    if (!ok) return

    setDialLoginOpen(false)
    setDialPercent(0)
    dialDoneRef.current = false
    setDialOpen(true)

    // 预加载的握手音频（登录框关闭会置空 audioRef，这里先抓到局部变量）
    const hs = audioRef.current

    // Web Audio 实时合成拨号音 + 输入号码的 DTMF
    const AC = window.AudioContext || window.webkitAudioContext
    let dialingSecs = 0
    if (AC) {
      const actx = new AC()
      actxRef.current = actx
      if (actx.state === 'suspended') {
        actx.resume().catch(() => { /* ignore */ })
      }
      dialingSecs = playDialTones(actx, number)
    }

    // 握手音频时长：直接用 ffprobe 实测值。这个 ogg 帧结构有问题，
    // Chromium 上报的 duration 每次都不一样（17.x/21.x），不可信
    const hsSecs = HANDSHAKE_FALLBACK_SECS

    // 拨号音播完，停顿 0.6s，再起握手声（文件已按 6.35s 剪好，直接从头播）
    if (hs) {
      hsTimerRef.current = window.setTimeout(() => {
        hs.play().catch(() => { /* 自动播放被拦截就静静拨号 */ })
      }, Math.round((dialingSecs + 0.6) * 1000))
    }

    // 进度条按音频总时长驱动，100% 落在握手播完的那一刻
    const totalSecs = dialingSecs + 0.6 + hsSecs
    setDialSteps(getDialSteps(number, dialingSecs, totalSecs))
    if (dialTimerRef.current) window.clearInterval(dialTimerRef.current)
    const step = 100 / (totalSecs * 10) // 每 100ms 走一步
    dialTimerRef.current = window.setInterval(() => {
      setDialPercent((p) => Math.min(100, p + step))
    }, 100)
  }

  const dialDone = dialPercent >= 100
  const visibleDialSteps = dialSteps.filter((s) => dialPercent >= s.at)
  const dialNumberClean = dialNumber.replace(/[^0-9*#]/g, '') || '16300'
  const dialAtLines = [
    `ATDT${dialNumberClean}`,
    'CONNECT 33600',
    'login: huanjue',
    'password: ********',
    'PPP: IPCP up (10.8.0.6)',
  ].slice(0, visibleDialSteps.length)

  const handleDialDoneConfirm = () => {
    closeDial()
    setHelloOpen(true)
  }

  return (
    <>
      <Loading
        active={loading || routeLoading}
        tip={routeLoading ? routeTip : '正在进入宇宙之主的领地...'}
        fadeDuration={0.6}
        zIndex={3000}
      />

      <Modal
        open={modalOpen}
        variant="game"
        title={alertTitle}
        width={420}
        typeSpeed={90}
        typewriter
        maskClosable={false}
        footer={
          <div className="modal-footer-actions">
            <Button className="modal-cancel-btn" type="primary" onClick={handleModalCancel}>
              拒绝
            </Button>
            <Button type="primary" onClick={handleModalConfirm}>
              同意
            </Button>
          </div>
        }
        onOk={handleModalConfirm}
      >
        <div className="modal-quote">
          <p>我是<span className="modal-blue">幻觉</span>……</p>
          <p>你也是<span className="modal-blue">幻觉</span>……</p>
          <p>宇宙的一切皆是<span className="modal-blue">幻觉</span>……</p>
        </div>
      </Modal>

      <Modal
        open={wasteOpen}
        variant="game"
        title="Waste"
        width={420}
        typeSpeed={90}
        typewriter
        maskClosable={false}
        footer={
          <Button type="primary" onClick={handleWasteClose}>
            确认
          </Button>
        }
        onOk={handleWasteClose}
      >
        <div className="modal-quote">
          <p>你被<span className="modal-blue">宇宙之主</span>消灭了……</p>
        </div>
      </Modal>

      <Modal
        open={Boolean(navConfirm)}
        variant="game"
        title={alertTitle}
        width={420}
        typeSpeed={90}
        typewriter
        maskClosable={false}
        footer={
          <div className="modal-footer-actions">
            <Button className="modal-cancel-btn" type="primary" onClick={handleNavCancel}>
              取消
            </Button>
            <Button type="primary" onClick={handleNavConfirm}>
              确定
            </Button>
          </div>
        }
        onOk={handleNavConfirm}
      >
        <div className="modal-quote">
          <p>
            {navConfirm?.promptText ?? `要前往${navConfirm?.titleText ?? '目标'}吗？`}
          </p>
        </div>
      </Modal>

      <Background type={bgType} className="hj-bg-wrap">
      <div
        className={`portal-shell ${portalVisible ? 'portal-shell--ready' : ''}`}
      >
        <button
          type="button"
          className="brief-menu-btn"
          aria-label="打开 Brief 菜单"
          onClick={() => setBriefOpen(true)}
        >
          <MenuIcon size={22} color="currentColor" strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="hj-inner">
          {homePage === 0 && (
            <>
              <section className="hj-hero">
                <img className="hj-avatar" src={avatarSrc} alt="幻觉的头像" />
                <div className="hj-hero-text">
                  <h1 className="hj-name">幻觉</h1>
                  <p className="hj-tagline">宇宙之主</p>
                  <p className="hj-bio">你好，我是幻觉。这里的一切都是幻觉——除了猫，和 56K 拨号的噪音。</p>
                </div>
              </section>

              <section className="hj-countdown-card" aria-label="倒计时">
                <ClockIcon size={20} color="currentColor" aria-hidden="true" />
                <Countdown
                  className="hj-countdown"
                  prefix="距离秋天结束还有"
                  value={new Date(Date.UTC(2026, 11, 21, 20, 5, 0))}
                  format="DD天 HH:mm:ss"
                  size="middle"
                  style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
                />
              </section>

              <nav className="hj-nav" aria-label="站点导航">
                {tiles.map((tile) => {
                  const TileIcon = tile.Icon
                  return (
                    <button
                      key={tile.label}
                      type="button"
                      className="hj-tile"
                      aria-label={tile.label}
                      onClick={() => openDrawer(tile)}
                    >
                      <Card type="dashed" color={tile.color} pattern={tile.pattern} hoverable className="hj-tile-card">
                        <span className="hj-tile-icon">
                          <TileIcon size={28} color="currentColor" aria-hidden="true" />
                        </span>
                        <span className="hj-tile-label">{tile.label}</span>
                        <span className="hj-tile-desc">{tile.desc}</span>
                      </Card>
                    </button>
                  )
                })}
              </nav>

            </>
          )}

          {homePage === 1 && (
            <>
              <section className="hj-pomo" aria-label="番茄钟">
                <div className="hj-pomo-head">
                  <span className="hj-pomo-title">番茄钟</span>
                  <span className="hj-pomo-count" title="完成的专注番茄数">🍅 × {pomoDone}</span>
                </div>
                <div className="hj-pomo-modes" role="tablist" aria-label="番茄钟模式">
                  {POMO_MODES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      role="tab"
                      aria-selected={pomoMode === m.key}
                      className={`hj-pomo-mode${pomoMode === m.key ? ' active' : ''}`}
                      onClick={() => switchPomoMode(m.key)}
                    >
                      {m.label}{m.minutes}'
                    </button>
                  ))}
                </div>
                <div className="hj-pomo-time" aria-live="polite">
                  {String(Math.floor(pomoLeft / 60)).padStart(2, '0')}:{String(pomoLeft % 60).padStart(2, '0')}
                </div>
                <Progress
                  percent={Math.round((1 - pomoLeft / (POMO_MODES.find((m) => m.key === pomoMode).minutes * 60)) * 100)}
                  size="small"
                  showInfo={false}
                  aria-label="番茄进度"
                />
                <div className="hj-pomo-actions">
                  <Button type="primary" onClick={() => setPomoRunning((r) => !r)}>
                    {pomoRunning ? '暂停' : '开始'}
                  </Button>
                  <Button onClick={() => { setPomoRunning(false); switchPomoMode(pomoMode) }}>
                    重置
                  </Button>
                </div>
              </section>
            </>
          )}

          <nav className="hj-pager" aria-label="主页分页">
            <button
              type="button"
              className={`hj-pager-btn${homePage === 0 ? ' active' : ''}`}
              onClick={() => setHomePage(0)}
            >
              主页
            </button>
            <button
              type="button"
              className={`hj-pager-btn${homePage === 1 ? ' active' : ''}`}
              onClick={() => setHomePage(1)}
            >
              {pomoRunning ? (
                <span className="hj-pager-live">
                  <span className="hj-pager-dot" aria-hidden="true" />
                  {String(Math.floor(pomoLeft / 60)).padStart(2, '0')}:{String(pomoLeft % 60).padStart(2, '0')}
                </span>
              ) : (
                '番茄钟'
              )}
            </button>
          </nav>
        </div>

        <div className="portal-footer-wrap">
          <Footer text="huanjue.me" />
        </div>
      </div>
      </Background>

      {/* 拨号上网：登录表单 */}
      <Modal
        open={dialLoginOpen}
        variant="game"
        title="拨号连接"
        width={400}
        maskClosable
        onClose={() => setDialLoginOpen(false)}
        footer={null}
        typewriter={false}
      >
        <form className="hj-dial-form" onSubmit={handleDialSubmit}>
          <Input
            value={dialNumber}
            onChange={(e) => { setDialNumber(e.target.value.replace(/[^0-9*#]/g, '')); setDialNumberErr(false) }}
            placeholder="拨号号码"
            prefix={<PhoneIcon size={18} color="currentColor" aria-hidden="true" />}
            status={dialNumberErr ? 'error' : undefined}
            aria-label="拨号号码"
            inputMode="tel"
          />
          <Input
            value={dialUser}
            onChange={(e) => { setDialUser(e.target.value); setDialUserErr(false) }}
            placeholder="用户名（随便填）"
            prefix={<UserIcon size={18} color="currentColor" aria-hidden="true" />}
            status={dialUserErr ? 'error' : undefined}
            aria-label="用户名"
          />
          <Input
            type="password"
            value={dialPass}
            onChange={(e) => { setDialPass(e.target.value); setDialPassErr(false) }}
            placeholder="密码（也是随便填）"
            prefix={<LockIcon size={18} color="currentColor" aria-hidden="true" />}
            status={dialPassErr ? 'error' : undefined}
            aria-label="密码"
          />
          <p className="hj-dial-tip">账号密码随便填，反正都是幻觉</p>
          <div className="modal-footer-actions">
            <Button type="primary" onClick={() => setDialLoginOpen(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              连接
            </Button>
          </div>
        </form>
      </Modal>

      {/* 拨号上网：拨号进度 */}
      <Modal
        open={dialOpen}
        variant="game"
        title={dialDone ? '已连接' : '正在连接……'}
        width={440}
        maskClosable={false}
        footer={dialDone ? (
          <Button type="primary" onClick={handleDialDoneConfirm}>
            确定
          </Button>
        ) : null}
        typewriter={false}
      >
        <div className="hj-dial-progress">
          <Progress percent={Math.floor(dialPercent)} size="middle" showInfo aria-label="拨号进度" />
          <ul className="hj-dial-log">
            {visibleDialSteps.map((s, i) => (
              <li key={s.text} className={i === visibleDialSteps.length - 1 ? 'on' : 'done'}>
                {s.text}
              </li>
            ))}
          </ul>
          {dialAtLines.length > 0 && (
            <CodeBlock code={dialAtLines.join('\n')} copyable={false} className="hj-at-term" />
          )}
          {dialDone && (
            <p className="hj-dial-done">欢迎来到幻觉互联网！本次连接纯属幻觉。</p>
          )}
        </div>
      </Modal>

      {/* 猫猫抽卡 */}
      <Modal
        open={gachaOpen}
        variant="game"
        title="猫猫抽卡机"
        width={360}
        maskClosable
        onClose={() => setGachaOpen(false)}
        footer={
          gachaRevealed ? (
            <Button type="primary" onClick={openGacha}>
              再抽一次
            </Button>
          ) : null
        }
        onOk={() => setGachaOpen(false)}
      >
        <div className="gacha-body">
          {!gachaRevealed ? (
            <button type="button" className="gacha-card-back" onClick={() => setGachaRevealed(true)} aria-label="翻开卡片">
              <CatIcon size={56} color="currentColor" aria-hidden="true" />
              <span>点我翻开</span>
            </button>
          ) : (
            gachaCat && (
              <Card color={RARITY_COLOR[gachaCat.rarity]} className="gacha-card">
                <div className="gacha-rarity">{gachaCat.rarity}</div>
                <CatIcon size={64} aria-hidden="true" />
                <div className="gacha-name">{gachaCat.name}</div>
                <div className="gacha-meta">{gachaCat.birthday} · {gachaCat.gender} · {gachaCat.status}</div>
                <div className="gacha-desc">{gachaCat.desc}</div>
              </Card>
            )
          )}
        </div>
      </Modal>

      {/* 拨号完成后的彩蛋 */}
      <Modal
        open={helloOpen}
        variant="game"
        title={alertTitle}
        width={360}
        typeSpeed={90}
        typewriter
        maskClosable
        onClose={() => setHelloOpen(false)}
        footer={
          <Button type="primary" onClick={() => setHelloOpen(false)}>
            确定
          </Button>
        }
        onOk={() => setHelloOpen(false)}
      >
        <div className="modal-quote">
          <p>Hello World!</p>
        </div>
      </Modal>

      <Drawer
        open={rightDrawerOpen}
        title={rightDrawerData?.title ?? '幻觉的博客'}
        placement="right"
        width={360}
        maskClosable
        pushBackground
        onClose={() => {
          setRightDrawerOpen(false)
          setRightDrawerData(null)
        }}
      >
        <div className="drawer-content">
          {rightDrawerData?.kind === 'email' ? (
            <Button
              type="primary"
              onClick={(event) => handleDrawerLinkClick(event, rightDrawerData.href, '正在打开...', false)}
            >
              点击给我写信
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={(event) => handleDrawerLinkClick(event, rightDrawerData?.href, '正在进入幻觉的博客...')}
            >
              前往幻觉的博客
            </Button>
          )}
        </div>
      </Drawer>

      <Drawer
        open={leftDrawerOpen}
        title={leftDrawerData?.title ?? '幻觉'}
        placement="top"
        height={240}
        maskClosable
        pushBackground
        onClose={() => {
          setLeftDrawerOpen(false)
          setLeftDrawerData(null)
        }}
      >
        <div className="drawer-content">
          {leftDrawerData?.kind === 'cat' ? (
            <Button
              type="primary"
              onClick={(event) => handleDrawerLinkClick(event, leftDrawerData.href, '正在进入猫猫的主页...')}
            >
              前往猫猫主页
            </Button>
          ) : (
            <p>这里是幻觉的个人主页，欢迎欢迎。</p>
          )}
        </div>
      </Drawer>

      <Drawer
        open={briefOpen}
        title={null}
        placement="left"
        width={300}
        maskClosable
        pushBackground
        className="brief-drawer"
        onClose={() => setBriefOpen(false)}
      >
        <div className="brief-drawer-top">
          <button
            type="button"
            className="brief-drawer-close"
            aria-label="关闭 Brief 菜单"
            onClick={() => setBriefOpen(false)}
          >
            ×
          </button>
          <div className="brief-drawer-title-wrap">
            <span className="brief-drawer-title">Brief</span>
          </div>
        </div>
        <div className="brief-drawer-header">
          <Time className="brief-drawer-clock" />
        </div>
        <div className="brief-drawer-content">
          <div className="brief-section-label">导航</div>
          <button type="button" className="brief-menu-item" onClick={() => setBriefOpen(false)}>
            主页
          </button>
          <button type="button" className="brief-menu-item" onClick={openDialLogin}>
            拨号上网
          </button>
          <button
            type="button"
            className="brief-menu-item"
            onClick={() => {
              setBriefOpen(false)
              setLeftDrawerData({
                title: '幻觉',
                kind: 'about',
              })
              setRightDrawerOpen(false)
              setLeftDrawerOpen(true)
            }}
          >
            关于
          </button>
          <button type="button" className="brief-menu-item" onClick={() => setBriefOpen(false)}>
            友情链接
          </button>
          <div className="brief-section-label">今日猫猫</div>
          <p className="gacha-today-line">
            今日：<strong>{todayCat.name}</strong>（{todayCat.rarity}）
          </p>
          <button type="button" className="brief-menu-item" onClick={openGacha}>
            抽一只
          </button>
          <div className="brief-section-label">背景</div>
          <div className="bg-swatch-grid" role="radiogroup" aria-label="背景预设">
            {BG_PRESETS.map((p) => (
              <button
                key={p.type}
                type="button"
                role="radio"
                aria-checked={bgType === p.type}
                title={p.label}
                aria-label={`背景：${p.label}`}
                className={`bg-swatch${bgType === p.type ? ' active' : ''}`}
                style={{ backgroundColor: p.color }}
                onClick={() => setBgType(p.type)}
              />
            ))}
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default App
