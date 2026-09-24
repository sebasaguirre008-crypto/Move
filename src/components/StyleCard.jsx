export default function StyleCard({ style, active, onSelect }) {
  return (
    <button
      type="button"
      className={`style-card ${active ? 'active' : ''}`}
      onClick={() => onSelect(style.id)}
    >
      <div className="style-card-art" style={{ background: `linear-gradient(135deg, ${style.palette[0]} 0%, ${style.palette[1]} 40%, ${style.palette[2]} 100%)` }} />
      <div className="style-card-content">
        <div className="style-card-header">
          <span className="style-icon">{style.icon}</span>
          <span className="style-name">{style.name}</span>
        </div>
        <p>{style.description}</p>
        <div className="style-mini-palette">
          {style.palette.map((swatch) => (
            <span key={swatch} style={{ background: swatch }} aria-label="swatch" />
          ))}
        </div>
        <span className="style-action">Explorar estilo</span>
      </div>
    </button>
  )
}
