import { useMemo, useState } from 'react'

export default function SpotifyPlayer() {
  const [minimized, setMinimized] = useState(false)

  const playlistUrl = useMemo(
    () => 'https://open.spotify.com/embed/playlist/2rW5NooqyCv8lyP4eTwUvy?si=paU_RJT_RoCmCDrfXd7E6w&utm_source=whatsapp&pi=PXQg8IKOQW6b5',
    [],
  )

  return (
    <div className={`spotify-player ${minimized ? 'minimized' : ''}`}>
      <div className="spotify-header">
        <div className="spotify-title-wrap">
          <span className="spotify-dot" />
          <span>Spotify</span>
        </div>
        <button type="button" onClick={() => setMinimized((value) => !value)}>
          {minimized ? 'Abrir' : 'Minimizar'}
        </button>
      </div>

      {!minimized && (
        <div className="spotify-embed-wrap">
          <iframe
            title="Spotify playlist"
            src={playlistUrl}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}
