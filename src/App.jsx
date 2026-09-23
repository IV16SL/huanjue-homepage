import { Button, Card, Drawer, Loading, Modal, Time } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import 'animal-island-ui/style'
import './App.css'

const tiles = [
  { label: '博客', href: 'https://blog.huanjue.me', color: 'app-pink', pattern: 'app-pink' },
  { label: '猫猫', href: 'https://cat.huanjue.me', color: 'purple', pattern: 'purple' },
  { label: '邮箱', href: 'mailto:hi@huanjue.me', color: 'app-blue', pattern: 'app-blue' },
  { label: '关于', href: 'https://blog.huanjue.me/about', color: 'app-yellow', pattern: 'app-yellow' },
]

function App() {
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [portalVisible, setPortalVisible] = useState(false)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  const [leftDrawerData, setLeftDrawerData] = useState(null)
  const [rightDrawerData, setRightDrawerData] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeTip, setRouteTip] = useState('正在进入宇宙之主的领域...')

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setLoading(false), 1400)
    const modalTimer = window.setTimeout(() => setModalOpen(true), 1700)

    return () => {
      window.clearTimeout(loadingTimer)
      window.clearTimeout(modalTimer)
    }
  }, [])

  const handleModalConfirm = () => {
    setModalOpen(false)
    setPortalVisible(true)
  }

  const handleDrawerLinkClick = (event, url, label, targetBlank = true) => {
    event.preventDefault()
    if (routeLoading) return

    setRouteTip(label)
    setRouteLoading(true)
    setLeftDrawerOpen(false)
    setRightDrawerOpen(false)

    window.setTimeout(() => {
      if (targetBlank) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = url
      }
      window.setTimeout(() => setRouteLoading(false), 800)
    }, 700)
  }

  const openDrawer = (tile) => {
    if (tile.label === '博客') {
      setRightDrawerData({
        title: '幻觉的博客',
        href: tile.href,
      })
      setLeftDrawerOpen(false)
      setRightDrawerOpen(true)
      return
    }

    if (tile.label === '邮箱') {
      setRightDrawerData({
        title: '邮箱',
        href: tile.href,
        kind: 'email',
      })
      setLeftDrawerOpen(false)
      setRightDrawerOpen(true)
      return
    }

    if (tile.label === '猫猫') {
      setLeftDrawerData({
        title: '猫猫',
        href: tile.href,
        kind: 'cat',
      })
    } else {
      setLeftDrawerData({
        title: '幻觉',
        kind: 'about',
      })
    }

    setRightDrawerOpen(false)
    setLeftDrawerOpen(true)
  }

  return (
    <>
      <Loading
        active={loading || routeLoading}
        tip={routeLoading ? routeTip : '正在进入幻觉世界...'}
        fadeDuration={0.6}
        zIndex={3000}
      />

      <Modal
        open={modalOpen}
        variant="game"
        width={420}
        typeSpeed={70}
        typewriter
        maskClosable={false}
        footer={
          <Button type="primary" onClick={handleModalConfirm}>
            确定
          </Button>
        }
        onOk={handleModalConfirm}
      >
        <div className="modal-quote">
          <p>我是<span className="modal-blue">幻觉</span>……</p>
          <p>你也是<span className="modal-blue">幻觉</span>……</p>
          <p>宇宙的一切皆是<span className="modal-blue">幻觉</span>……</p>
        </div>
      </Modal>

      <div
        className={`portal-shell ${portalVisible ? 'portal-shell--ready' : ''}`}
      >
        <Time className="portal-clock" />

        <div className="portal-panel">
          {tiles.map((tile, index) => {
            const isDrawerTile = tile.label === '博客' || tile.label === '关于' || tile.label === '猫猫' || tile.label === '邮箱'

            if (isDrawerTile) {
              return (
                <button
                  key={tile.label}
                  type="button"
                  className="portal-link portal-link--button"
                  aria-label={tile.label}
                  onClick={() => openDrawer(tile)}
                  style={{ animationDelay: `${index * 160}ms` }}
                >
                  <Card type="dashed" color={tile.color} pattern={tile.pattern} hoverable className="portal-card">
                    <span>{tile.label}</span>
                  </Card>
                </button>
              )
            }

            return (
              <a
                key={tile.label}
                className="portal-link"
                href={tile.href}
                target={tile.href.startsWith('http') ? '_blank' : undefined}
                rel={tile.href.startsWith('http') ? 'noreferrer' : undefined}
                aria-label={tile.label}
                style={{ animationDelay: `${index * 160}ms` }}
              >
                <Card type="dashed" color={tile.color} pattern={tile.pattern} hoverable className="portal-card">
                  <span>{tile.label}</span>
                </Card>
              </a>
            )
          })}
        </div>

        <div className="portal-footer-wrap">
          <Card type="dashed" color="app-blue" pattern="app-blue" className="portal-footer-card">
            @2026 huanjue.me
          </Card>
        </div>
      </div>

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
        placement="left"
        width={360}
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
    </>
  )
}

export default App
