import React from 'react';
import artacomLogoImg from '../assets/artacom-logo.png';

export default function ArtacomLogo({ className = "h-12 w-auto", dark = false }) {
  return (
    <img
      src={artacomLogoImg}
      alt="Artacom Logo"
      className={`object-contain ${className} ${dark ? 'brightness-0 invert' : ''}`}
    />
  );
}
