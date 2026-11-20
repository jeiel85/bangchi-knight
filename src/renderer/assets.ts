export interface PixelAssets {
  knight: HTMLImageElement;
  ranger: HTMLImageElement;
  pyro: HTMLImageElement;
  banneret: HTMLImageElement;
  enemies: HTMLImageElement;
  bosses: HTMLImageElement;
  vfx: HTMLImageElement;
  projectiles: HTMLImageElement;
  bg: Record<string, HTMLImageElement>;
  whiteFlash: {
    knight: HTMLCanvasElement | null;
    enemies: HTMLCanvasElement | null;
    bosses: HTMLCanvasElement | null;
  };
  ready: boolean;
}

function loadImage(src: string, onLoad?: (img: HTMLImageElement) => void): HTMLImageElement {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => onLoad?.(img);
  img.src = src;
  return img;
}

function makeWhiteSilhouette(img: HTMLImageElement): HTMLCanvasElement | null {
  if (typeof document === 'undefined' || !img.naturalWidth || !img.naturalHeight) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d');
  if (!g) return null;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

let cached: PixelAssets | null = null;

export function getPixelAssets(): PixelAssets {
  if (cached) return cached;

  const assets: PixelAssets = {
    knight: new Image(),
    ranger: new Image(),
    pyro: new Image(),
    banneret: new Image(),
    enemies: new Image(),
    bosses: new Image(),
    vfx: new Image(),
    projectiles: new Image(),
    bg: {},
    whiteFlash: {
      knight: null,
      enemies: null,
      bosses: null,
    },
    ready: false,
  };

  let loadedCount = 0;
  const total = 13;
  const markLoaded = () => {
    loadedCount += 1;
    if (loadedCount >= total) assets.ready = true;
  };

  assets.knight = loadImage('./assets/sprites/knight.png', (img) => {
    assets.whiteFlash.knight = makeWhiteSilhouette(img);
    markLoaded();
  });
  assets.ranger = loadImage('./assets/sprites/ranger.png', markLoaded);
  assets.pyro = loadImage('./assets/sprites/pyro.png', markLoaded);
  assets.banneret = loadImage('./assets/sprites/banneret.png', markLoaded);
  assets.enemies = loadImage('./assets/sprites/enemies.png', (img) => {
    assets.whiteFlash.enemies = makeWhiteSilhouette(img);
    markLoaded();
  });
  assets.bosses = loadImage('./assets/sprites/bosses.png', (img) => {
    assets.whiteFlash.bosses = makeWhiteSilhouette(img);
    markLoaded();
  });
  assets.vfx = loadImage('./assets/vfx/vfx-sheet.png', markLoaded);
  assets.projectiles = loadImage('./assets/vfx/projectiles-sheet.png', markLoaded);

  const zoneIds = ['dawnstep', 'amber-canyon', 'mirewood', 'frostpeak', 'cinder-citadel'];
  for (const id of zoneIds) {
    assets.bg[id] = loadImage(`./assets/bg/${id}.png`, markLoaded);
  }

  cached = assets;
  return assets;
}
