"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { isAuthenticated, getUser, login, register, logout, setToken, setUser } from "../lib/auth";
import { useState, useEffect } from "react";
import { showToast } from "./ui/toast";
import { createPortal } from "react-dom";
import { RouteEditor } from "./RouteEditor";

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setMounted(true);
  }, []);

  const handleAuthClick = () => {
    if (authenticated) {
      logout();
      setAuthenticated(false);
      showToast("success", "Signed out successfully");
    } else {
      setShowSignInModal(true);
      setError("");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegisterMode) {
        const response = await register(email, username, password);
        setToken(response.token);
        setUser(response.user);
      } else {
        const response = await login(email, password);
        setToken(response.token);
        setUser(response.user);
      }
      setAuthenticated(true);
      setShowSignInModal(false);
      setEmail("");
      setPassword("");
      setUsername("");
      showToast("success", "Signed in successfully");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <Link href="/" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Map
              </Link>
              <Link href="/roads" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Roads
              </Link>
              {authenticated && (
                <Link href="/my-routes" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  My Routes
                </Link>
              )}
              {authenticated && (
                <Button
                  onClick={() => setShowRouteEditor(true)}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800 text-white"
                >
                  + Add Route
                </Button>
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
      </nav>

      {/* Sign In Modal - Portal to body */}
      {mounted && showSignInModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">{isRegisterMode ? "Register" : "Sign In"}</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="username"
                  />
                </div>
              )}
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
                  minLength={isRegisterMode ? 8 : undefined}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
                {isRegisterMode && (
                  <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {loading ? "Loading..." : (isRegisterMode ? "Register" : "Sign In")}
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
            <p className="text-xs text-slate-500 mt-4 text-center">
              {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setIsRegisterMode(!isRegisterMode); setError(""); }}
                className="text-green-400 hover:text-green-300 underline"
              >
                {isRegisterMode ? "Sign in" : "Register"}
              </button>
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Route Editor Modal - Portal to body */}
      {mounted && showRouteEditor && createPortal(
        <RouteEditor
          isOpen={showRouteEditor}
          onClose={() => setShowRouteEditor(false)}
          onRouteCreated={() => {
            // Refresh the page or update state to show new route
            window.location.reload();
          }}
        />,
        document.body
      )}
    </>
  );
}
