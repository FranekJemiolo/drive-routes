"use client";

import { Button } from "./ui/button";
import { isAuthenticated, logout, login } from "../lib/auth";
import { useState, useEffect } from "react";
import { showToast } from "./ui/toast";

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const handleAuthClick = () => {
    if (authenticated) {
      logout();
      setAuthenticated(false);
      showToast("success", "Signed out successfully");
    } else {
      setShowSignInModal(true);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    setAuthenticated(true);
    setShowSignInModal(false);
    showToast("success", "Signed in successfully");
    setEmail("");
    setPassword("");
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              DriveRoutes
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="/" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Map
            </a>
            <a href="/roads" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Roads
            </a>
            {authenticated && (
              <a href="#" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                My Routes
              </a>
            )}
            <Button 
              onClick={handleAuthClick}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white ml-2"
            >
              {authenticated ? 'Sign Out' : 'Sign In'}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-slate-300 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-96 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Sign In</h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSignInModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:bg-slate-800 text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
            <p className="text-xs text-slate-500 mt-4 text-center">Demo mode - any email/password works</p>
          </div>
        </div>
      )}
    </nav>
  );
}
