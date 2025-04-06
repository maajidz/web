'use client';

import React from 'react';
import Link from 'next/link';
import { RiMenuLine } from 'react-icons/ri';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar = () => {
  const { userId, logout } = useAuth();

  return (
    <nav className="navbar fixed w-full top-0 z-50 backdrop-blur-lg">
      <div className="w-full justify-between py-1 min-h-0">
        <div className="navbar-start">
          <Link href="/" className="text-2xl font-normal text-primary">
            Flattr.
          </Link>
        </div>
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1 text-base-content/80 space-x-1">
            <li><Link href="#how-it-works" className="btn btn-ghost btn-sm font-normal">How it Works</Link></li>
            <li><Link href="#browse" className="btn btn-ghost btn-sm font-normal">Browse</Link></li>
            <li><Link href="#pricing" className="btn btn-ghost btn-sm font-normal">Pricing</Link></li>
          </ul>
        </div>
        <div className="navbar-end space-x-3">
          <ThemeSwitcher />
          {userId ? (
            <button onClick={logout} className="btn btn-outline btn-secondary btn-sm">
              Logout
            </button>
          ) : (
            <Link href="/" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
          <button className="btn btn-sm btn-primary">Sign Up</button>
          <div className="md:hidden">
            <label htmlFor="main-drawer" className="btn btn-square btn-ghost">
              <RiMenuLine size={24} />
            </label>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 