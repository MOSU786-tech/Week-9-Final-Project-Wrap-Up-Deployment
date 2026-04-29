// Mentor map: This is the main app shell and route map.
// Why it exists: Defines navigation and binds URLs to page components.
// Used by: src/index.jsx as the root React component.
import './App.css';
import React, { useEffect, useState } from 'react';
import { NavLink, useRoutes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CrewGalleryPage from './pages/CrewGalleryPage';
import CreateCrewmatePage from './pages/CreateCrewmatePage';
import CrewmateDetailPage from './pages/CrewmateDetailPage';
import EditCrewmatePage from './pages/EditCrewmatePage';
import ReadPosts from './pages/ReadPosts';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import PostDetailPage from './pages/PostDetailPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  // Mentor tip:
  // Keep theme state at app-shell level so every route shares one consistent UI mode.
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem('crewmates_theme_mode');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Persisting both in DOM attr and localStorage gives fast theme restore on refresh.
    document.documentElement.setAttribute('data-theme', themeMode);
    window.localStorage.setItem('crewmates_theme_mode', themeMode);
  }, [themeMode]);

  // Mentor tip:
  // useRoutes keeps route config declarative and easy to extend for future pages.
  const element = useRoutes([
    {
      path: '/',
      element: <HomePage />,
    },
    {
      path: '/crew',
      element: <CrewGalleryPage />,
    },
    {
      path: '/create',
      element: <CreateCrewmatePage />,
    },
    {
      path: '/crewmates/:id',
      element: <CrewmateDetailPage />,
    },
    {
      path: '/crewmates/:id/edit',
      element: <EditCrewmatePage />,
    },
    {
      path: '/posts',
      element: <ReadPosts />,
    },
    {
      path: '/posts/new',
      element: <CreatePost />,
    },
    {
      path: '/posts/:id',
      element: <PostDetailPage />,
    },
    {
      path: '/posts/:id/edit',
      element: <EditPost />,
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ]);

  const navClassName = ({ isActive }) =>
    isActive ? 'nav-link nav-link--active' : 'nav-link';

  return (
    <div className="app-shell">
      <div className="ambient-orb ambient-orb--one" />
      <div className="ambient-orb ambient-orb--two" />
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Week 9 Final Project</p>
          <NavLink className="brand-link" to="/">
            <h1>Crewmates HQ</h1>
          </NavLink>
          <p className="brand-copy">
            Build, track, and tune your own mission-ready crew with Supabase CRUD.
          </p>
        </div>

        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink className={navClassName} to="/">
            Home
          </NavLink>
          <NavLink className={navClassName} to="/crew">
            Crew Gallery
          </NavLink>
          <NavLink className={navClassName} to="/create">
            Create Crewmate
          </NavLink>
          <NavLink className={navClassName} to="/posts">
            Challenge Feed
          </NavLink>
          <button
            type="button"
            className="mode-toggle"
            onClick={() => setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
          >
            {themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </nav>
      </header>

      <main className="page-shell">{element}</main>
    </div>
  );
};

export default App;
