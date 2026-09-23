import { useEffect, useState } from 'react'
import './App.css'
import StyleCard from './components/StyleCard'
import SpotifyPlayer from './components/SpotifyPlayer'
import { styleProfiles } from './data/styleProfiles'
import { generateOutfit, getOutfitId, getOutfitSummary, getStyleEmoji, getStyleLabel } from './lib/outfitGenerator'

const STORAGE_KEYS = {
  theme: 'move-theme',
  favorites: 'move-favorites',
}

const pageOrder = ['inicio', 'armario', 'estilos', 'favoritos']

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme)
  return saved ? JSON.parse(saved) : false
}

const getInitialFavorites = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.favorites)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const getAssetUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  const clean = path.replace(/^\/+/, '')
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/')
  return `${base}${clean}`
}

function App() {
  const [page, setPage] = useState('inicio')
  const [selectedStyle, setSelectedStyle] = useState('gothic')
  const [darkMode, setDarkMode] = useState(getInitialTheme)
  const [favorites, setFavorites] = useState(getInitialFavorites)
  const [currentOutfit, setCurrentOutfit] = useState({ style: 'gothic', items: [], signature: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowIntro(false), 1600)
    return () => window.clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const toastTimer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(toastTimer)
  }, [toast])

  const activeStyle = styleProfiles.find((style) => style.id === selectedStyle) || styleProfiles[0]

  const createOutfit = () => {
    setLoading(true)

    window.setTimeout(() => {
      const nextOutfit = generateOutfit(selectedStyle)

      if (!nextOutfit) {
        setCurrentOutfit({ style: selectedStyle, items: [], signature: '' })
        setToast('No hay combinaciones válidas para este estilo.')
        setLoading(false)
        return
      }

      setCurrentOutfit(nextOutfit)
      setToast('Outfit generado ✨')
      setLoading(false)
    }, 450)
  }

  const saveFavorite = () => {
    if (!currentOutfit.items.length) {
      setToast('Primero crea un outfit')
      return
    }

    const outfitId = getOutfitId(currentOutfit.items)
    const alreadySaved = favorites.some((item) => item.id === outfitId)

    if (alreadySaved) {
      setToast('Este outfit ya está guardado')
      return
    }

    setFavorites((prev) => [
      {
        ...currentOutfit,
        id: outfitId,
        summary: getOutfitSummary(currentOutfit.items),
        savedAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setToast('Outfit guardado ✨')
  }

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id))
    setToast('Outfit eliminado')
  }

  const useFavoriteOutfit = (outfit) => {
    setSelectedStyle(outfit.style)
    setCurrentOutfit(outfit)
    setPage('armario')
    setToast('Outfit restaurado')
  }

  const renderHome = () => (
    <section className="page-panel home-page">
      <div className="hero-card glass-panel">
        <div className="hero-copy">
          <span className="eyebrow">Moda consciente · Estilo inteligente</span>
          <h1>
            <span className="hero-welcome">Bienvenidas Chicas</span>
            <span className="brand-mark">MOVE</span>
          </h1>
          <p className="lead">
            Descubre tu estilo. Crea tu outfit. Muévete con propósito.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={() => setPage('armario')}>
              Explorar armario
            </button>
            <button type="button" className="ghost-btn" onClick={() => setPage('estilos')}>
              Ver estilos
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mini-frame">
            <div className="mini-pill" />
            <div className="mini-card one" />
            <div className="mini-card two" />
            <div className="mini-card three" />
          </div>
        </div>
      </div>

      <div className="about-grid">
        <div className="glass-panel info-card">
          <p className="section-kicker">¿Que es MOVE?</p>
          <h2>Move ayuda al medio ambiente y hace que la moda sea más consciente.</h2>
          <p>
            MOVE te ayuda a sacar más partido a lo que ya tienes, a reutilizar prendas, a reducir
            el desperdicio de ropa y a crear looks con más intención. Cuando combinas mejor tu
            armario, consumes menos por impulso, cuidas más tu estilo y aportas un pequeño cambio
            positivo para el planeta.
          </p>
        </div>

        <div className="glass-panel stats-card">
          <div>
            <strong>{styleProfiles.length}</strong>
            <span>estilos</span>
          </div>
          <div>
            <strong>{favorites.length}</strong>
            <span>guardados</span>
          </div>
          <div>
            <strong>4</strong>
            <span>vibes</span>
          </div>
        </div>
      </div>

      <div className="steps-panel glass-panel">
        <p className="section-kicker">¿Cómo funciona?</p>
        <div className="steps-grid">
          {[
            { number: '01', title: 'Elige tu estilo', text: 'Selecciona la estética que mejor te represente.' },
            { number: '02', title: 'Crea tu outfit', text: 'MOVE analiza tus prendas y propone una combinación coherente.' },
            { number: '03', title: 'Descubre nuevas combinaciones', text: 'Genera nuevas opciones y revisa variantes visualmente compatibles.' },
            { number: '04', title: 'Guarda tus favoritos', text: 'Guarda los looks que más te gusten y vuelve a usarlos cuando quieras.' },
          ].map((step) => (
            <div key={step.number} className="step-card">
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="spotify-feature glass-panel">
        <div className="spotify-feature-copy">
          <p className="section-kicker">Spotify</p>
          <h2>La energía perfecta para tu outfit</h2>
          <p>
            Siente la vibra de cada look con una playlist pensada para acompañar tus outfits y
            darle un toque más intenso a cada momento del día.
          </p>
        </div>
        <div className="spotify-feature-player">
          <iframe
            title="Playlist Move"
            src="https://open.spotify.com/embed/playlist/2rW5NooqyCv8lyP4eTwUvy?si=paU_RJT_RoCmCDrfXd7E6w&utm_source=whatsapp&pi=PXQg8IKOQW6b5"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )

  const renderCloset = () => (
    <section className="page-panel closet-page">
      <div className="section-head">
        <div>
          <p className="section-kicker">Armario</p>
          <h2>{activeStyle.name}</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={() => setPage('estilos')}>
          Cambiar estilo
        </button>
      </div>

      <div className="style-tabs">
        {styleProfiles.map((style) => (
          <button
            key={style.id}
            type="button"
            className={`tab-btn ${selectedStyle === style.id ? 'active' : ''}`}
            onClick={() => setSelectedStyle(style.id)}
          >
            <span>{style.icon}</span>
            {style.name}
          </button>
        ))}
      </div>

      <div className="closet-layout">
        <div className="glass-panel outfit-panel">
          <div className="outfit-header">
            <div>
              <span className="style-chip">{getStyleEmoji(selectedStyle)} {getStyleLabel(selectedStyle)}</span>
            </div>
          </div>

          <div className={`outfit-stage ${loading ? 'loading' : ''}`}>
            {loading ? (
              <div className="loader-shell">
                <div className="loader-spinner" />
                <span>Generando outfit…</span>
              </div>
            ) : currentOutfit.items.length ? (
              <div className="outfit-grid">
                {currentOutfit.items.map((item) => (
                  <div key={`${item.id}-${item.name}`} className="outfit-item">
                    <img src={getAssetUrl(item.file)} alt={item.name} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-outfit">
                <span>Tu look aparecerá aquí</span>
              </div>
            )}
          </div>

          <div className="action-row">
            <button type="button" className="primary-btn" onClick={createOutfit}>
              ✨ CREAR OUTFIT
            </button>
            <button type="button" className="secondary-btn" onClick={saveFavorite}>
              ❤️ Guardar outfit
            </button>
          </div>

        </div>

        <aside className="glass-panel style-summary">
          <p className="section-kicker">Estilo actual</p>
          <h3>{activeStyle.icon} {activeStyle.name}</h3>
          <p>{activeStyle.description}</p>

          <div className="palette-row">
            {activeStyle.palette.map((shade) => (
              <span key={shade} style={{ background: shade }} aria-label="color swatch" />
            ))}
          </div>

        </aside>
      </div>
    </section>
  )

  const renderStyles = () => (
    <section className="page-panel styles-page">
      <div className="section-head center-head">
        <div>
          <p className="section-kicker">Explora los estilos</p>
          <h2>Define la vibra de cada look</h2>
        </div>
      </div>

      <div className="styles-grid">
        {styleProfiles.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            active={selectedStyle === style.id}
            onSelect={(id) => {
              setSelectedStyle(id)
              setPage('armario')
            }}
          />
        ))}
      </div>
    </section>
  )

  const renderFavorites = () => (
    <section className="page-panel favorites-page">
      <div className="section-head">
        <div>
          <p className="section-kicker">Favoritos</p>
          <h2>Mis outfits</h2>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state glass-panel">
          <p>Aún no has guardado ningún outfit.</p>
          <button type="button" className="primary-btn" onClick={() => setPage('armario')}>
            Ir al armario
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((outfit) => (
            <article key={outfit.id} className="favorite-card glass-panel">
              <div className="favorite-visuals">
                {outfit.items.map((item) => (
                  <img key={`${outfit.id}-${item.id}`} src={getAssetUrl(item.file)} alt={item.name} />
                ))}
              </div>

              <div className="favorite-meta">
                <div className="favorite-header">
                  <span className="style-chip-small">{getStyleEmoji(outfit.style)} {getStyleLabel(outfit.style)}</span>
                  <span>{formatDate(outfit.savedAt)}</span>
                </div>
                <p>{outfit.summary}</p>
              </div>

              <div className="favorite-actions">
                <button type="button" className="secondary-btn" onClick={() => useFavoriteOutfit(outfit)}>
                  Volver a usar
                </button>
                <button type="button" className="icon-btn" onClick={() => removeFavorite(outfit.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  const pageContent = {
    inicio: renderHome(),
    armario: renderCloset(),
    estilos: renderStyles(),
    favoritos: renderFavorites(),
  }

  return (
    <>
      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-card" aria-label="MOVE">
            {['M', 'O', 'V', 'E'].map((letter, index) => (
              <span
                key={letter + index}
                className="intro-letter"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="app-shell">
        <header className="topbar glass-panel">
          <div className="brand-wrap">
            <span className="brand-name">MOVE</span>
          </div>

          <nav className="nav-bar" aria-label="Navegación principal">
            {pageOrder.map((item) => (
              <button
                key={item}
                type="button"
                className={`nav-btn ${page === item ? 'active' : ''}`}
                onClick={() => setPage(item)}
              >
                {item === 'inicio' && 'Inicio'}
                {item === 'armario' && 'Armario'}
                {item === 'estilos' && 'Estilos'}
                {item === 'favoritos' && 'Favoritos'}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="theme-toggle"
            aria-label="Cambiar tema"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="main-shell">{pageContent[page]}</main>

        <SpotifyPlayer />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export default App
