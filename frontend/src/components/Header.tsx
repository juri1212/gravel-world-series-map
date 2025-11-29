import React from 'react';

type Props = {
    onToggleMenu?: () => void
    menuOpen?: boolean
}

const Header: React.FC<Props> = ({ onToggleMenu, menuOpen = false }) => {
    return (
        <header className="site-header">
            <div className="header-inner">
                <h1 className="site-title">Gravel World Series {menuOpen ? 'Events' : 'Map'}</h1>
                <button
                    className={`mobile-menu ${menuOpen ? 'open' : ''}`}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    onClick={() => onToggleMenu && onToggleMenu()}
                    aria-expanded={menuOpen}
                >
                    <span className="bar bar-1" aria-hidden />
                    <span className="bar bar-2" aria-hidden />
                    <span className="bar bar-3" aria-hidden />
                </button>
            </div>
        </header>
    );
};

export default Header;
