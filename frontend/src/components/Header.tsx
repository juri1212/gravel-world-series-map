import { ListIcon, MapIcon } from './Icons'

type Props = {
    onToggleMenu?: () => void
    menuOpen?: boolean
}

export default function Header({ onToggleMenu, menuOpen = false }: Props) {
    return (
        <header className="site-header">
            <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon128.png`} alt="" width={36} height={36} />
            <div className="brand-text">
                <h1 className="site-title">Gravel World Series</h1>
                <p className="site-subtitle">UCI race calendar &amp; map</p>
            </div>
            <button
                type="button"
                className="mobile-toggle"
                aria-label={menuOpen ? 'Show map' : 'Show event list'}
                aria-expanded={menuOpen}
                onClick={onToggleMenu}
            >
                {menuOpen ? <MapIcon /> : <ListIcon />}
                <span>{menuOpen ? 'Map' : 'Events'}</span>
            </button>
        </header>
    )
}
