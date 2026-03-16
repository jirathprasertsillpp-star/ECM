import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from '../AI/ChatWidget';
import VisualEffects from '../common/VisualEffects';

export default function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        const el = document.getElementById('main-content-scroll');
        if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location]);

    return (
        <div className="app-shell" style={{ '--sidebar-width': mobileOpen ? '0px' : isCollapsed ? '100px' : '280px' }}>
            <VisualEffects />
            
            {/* Sidebar Component */}
            <div className={`sidebar-container md:block ${mobileOpen ? 'block fixed inset-0 z-50' : 'hidden'}`}>
                <Sidebar 
                    mobileOpen={mobileOpen} 
                    setMobileOpen={setMobileOpen} 
                    isCollapsed={isCollapsed} 
                    setIsCollapsed={setIsCollapsed} 
                />
            </div>

            {/* Main Area */}
            <div className="flex flex-col h-screen flex-1 overflow-hidden relative">
                <Header onMenuClick={() => setMobileOpen(true)} />
                
                <main id="main-content-scroll" className="main-content flex-1 overflow-y-auto page-enter">
                    <div className="max-w-[1400px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Floating Chat Widget */}
            <ChatWidget />
        </div>
    );
}
