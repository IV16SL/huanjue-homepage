import { Button, Card, Countdown, Drawer, Loading, Modal, Table, Time, Title, Footer } from 'animal-island-ui'
import { MenuIcon } from 'naive-icons'
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
  const getCurrentPath = () => window.location.pathname || '/'

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
  const [currentPath, setCurrentPath] = useState(getCurrentPath())

  const navigateToPath = (path) => {
    const nextPath = path.startsWith('/') ? path : `/${path}`
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setCurrentPath(nextPath)
  }

  const isEarthSeasonsPage = currentPath === '/earthseasons'

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setLoading(false), 1400)
    const modalTimer = window.setTimeout(() => setModalOpen(true), 1700)
    const handleLocationChange = () => setCurrentPath(getCurrentPath())

    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.clearTimeout(loadingTimer)
      window.clearTimeout(modalTimer)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

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
        title="Alert"
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
        title="Alert"
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

        <Title className="portal-title" variant="layer" color="app-blue">
          {isEarthSeasonsPage ? '地球四季' : '幻觉的主页'}
        </Title>

        {!isEarthSeasonsPage && (
          <div className="portal-countdown-wrap">
            <Countdown
              className="portal-countdown"
              prefix="距离秋天结束还有"
              value={new Date(Date.UTC(2026, 11, 21, 20, 5, 0))}
              format="DD天 HH:mm:ss"
              size="middle"
            />
          </div>
        )}

        {!isEarthSeasonsPage && (
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
        )}

        {isEarthSeasonsPage && (
          <div className="earth-seasons-table-wrap">
            <Table
              className="earth-seasons-table"
              columns={[
                { title: 'Phenomenon', dataIndex: 'phenomenon', width: '30%' },
                { title: 'Date', dataIndex: 'date', width: '35%' },
                { title: 'Time', dataIndex: 'time', width: '35%' },
              ]}
              dataSource={[
                { phenomenon: 'Perihelion', date: 'Jan 4', time: '01:15' },
                { phenomenon: 'Equinox', date: 'Mar 20', time: '22:46' },
                { phenomenon: 'Solstice', date: 'Jun 21', time: '16:24' },
                { phenomenon: 'Aphelion', date: 'Jul 7', time: '01:30' },
                { phenomenon: 'Equinox', date: 'Sept 23', time: '08:05' },
                { phenomenon: 'Solstice', date: 'Dec 22', time: '04:05' },
              ]}
              rowKey={(record) => `${record.phenomenon}-${record.date}`}
              pagination={false}
              striped={true}
            />
          </div>
        )}

        <div className="portal-footer-wrap">
          <Footer text="huanjue.me" />
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
        {!isEarthSeasonsPage && (
          <div className="brief-drawer-header">
            <Time className="brief-drawer-clock" />
          </div>
        )}
        <div className="brief-drawer-content">
          <button type="button" className="brief-menu-item" onClick={() => {
            setBriefOpen(false)
            navigateToPath('/')
          }}>
            主页
          </button>
          <button type="button" className="brief-menu-item" onClick={() => {
            setBriefOpen(false)
            navigateToPath('/earthseasons')
          }}>
            地球四季
          </button>
          <button type="button" className="brief-menu-item" onClick={() => setBriefOpen(false)}>
            太阳系
          </button>
          <button type="button" className="brief-menu-item" onClick={() => setBriefOpen(false)}>
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
        </div>
      </Drawer>
    </>
  )
}

export default App
