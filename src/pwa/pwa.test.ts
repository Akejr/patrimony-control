import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Unit tests for PWA configuration (Req. 7.1, 7.2).
 *
 * These tests validate the static PWA configuration WITHOUT requiring a build:
 * - vite.config.ts is read as text and inspected for the VitePWA manifest and
 *   workbox/service-worker settings.
 * - index.html is read as text and inspected for the iOS meta tags.
 * - The icon assets are checked for existence in public/.
 */

const root = process.cwd();
const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8');

describe('Req 7.1 — Manifest e ícones do PWA', () => {
  it('declara name e short_name', () => {
    expect(viteConfig).toMatch(/name:\s*['"]Patrimony Control['"]/);
    expect(viteConfig).toMatch(/short_name:\s*['"]Patrimony['"]/);
  });

  it('usa display standalone (instalável como app)', () => {
    expect(viteConfig).toMatch(/display:\s*['"]standalone['"]/);
  });

  it('define theme_color e background_color brancos (#ffffff)', () => {
    expect(viteConfig).toMatch(/theme_color:\s*['"]#ffffff['"]/);
    expect(viteConfig).toMatch(/background_color:\s*['"]#ffffff['"]/);
  });

  it('inclui ícones nos tamanhos 192x192 e 512x512', () => {
    expect(viteConfig).toMatch(/sizes:\s*['"]192x192['"]/);
    expect(viteConfig).toMatch(/sizes:\s*['"]512x512['"]/);
  });

  it('inclui apple-touch-icon 180x180', () => {
    expect(viteConfig).toMatch(/sizes:\s*['"]180x180['"]/);
    expect(viteConfig).toMatch(/apple-touch-icon-180x180\.png/);
  });

  it('referencia os arquivos de ícone principais', () => {
    expect(viteConfig).toMatch(/pwa-192x192\.png/);
    expect(viteConfig).toMatch(/pwa-512x512\.png/);
  });

  it('possui os arquivos PNG de ícone em public/', () => {
    expect(existsSync(resolve(root, 'public/pwa-192x192.png'))).toBe(true);
    expect(existsSync(resolve(root, 'public/pwa-512x512.png'))).toBe(true);
    expect(
      existsSync(resolve(root, 'public/apple-touch-icon-180x180.png')),
    ).toBe(true);
  });
});

describe('Req 7.2 — Service worker e carregamento offline', () => {
  it('configura o registro do service worker (registerType)', () => {
    expect(viteConfig).toMatch(/registerType:\s*['"][^'"]+['"]/);
  });

  it('injeta o registro do service worker (injectRegister)', () => {
    expect(viteConfig).toMatch(/injectRegister:\s*['"][^'"]+['"]/);
  });

  it('configura precache do app shell via workbox globPatterns', () => {
    expect(viteConfig).toMatch(/workbox:\s*\{/);
    expect(viteConfig).toMatch(/globPatterns:\s*\[/);
  });
});

describe('Req 7.1/7.2 — Metatags iOS no index.html', () => {
  it('declara apple-mobile-web-app-capable com content "yes"', () => {
    expect(indexHtml).toMatch(
      /<meta\s+name=["']apple-mobile-web-app-capable["']\s+content=["']yes["']/,
    );
  });

  it('possui viewport com viewport-fit=cover', () => {
    expect(indexHtml).toMatch(/name=["']viewport["']/);
    expect(indexHtml).toMatch(/viewport-fit=cover/);
  });

  it('declara theme-color', () => {
    expect(indexHtml).toMatch(/<meta\s+name=["']theme-color["']/);
  });

  it('possui link de apple-touch-icon', () => {
    expect(indexHtml).toMatch(/rel=["']apple-touch-icon["']/);
  });
});
