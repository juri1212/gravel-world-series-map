import React from 'react';

type Props = {
    onOpenMenu?: () => void
}

const Header: React.FC<Props> = ({ onOpenMenu }) => {
    return (
        <header className="site-header">
            <div className="header-inner">
                <h1 className="site-title">Gravel World Series Map</h1>
                <button className="mobile-menu" aria-label="Open menu" onClick={() => onOpenMenu && onOpenMenu()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
