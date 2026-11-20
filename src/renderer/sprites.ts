import type { EnemyKind } from '../engine/types';

export type PixelSprite = string[];

// Royal Plumed Expedition Knight with Kite Shield & Broadsword (16x16)
// P=plume crimson/gold, M=steel helmet/plate, m=steel shade, B=royal cobalt, G=brass/gold, S=blade, W=white glint, K=visor dark
export const KNIGHT_MARCH_A: PixelSprite = [
  '....PPPP........',
  '...PPP..MMMM....',
  '.......MMMMMM...',
  '......MMKKKKMM..',
  '......MMMMMMMM..',
  '.....BBBBBBBB.S.',
  '....BBBGGGBBB.S.',
  '...BB.BMGGMB.WS.',
  '...B..BMGGMB.GS.',
  '......BBBBBB.G..',
  '......MM..MM....',
  '.....MM....MM...',
  '.....GG....GG...',
  '................',
];

export const KNIGHT_MARCH_B: PixelSprite = [
  '................',
  '...PPPP.........',
  '..PPP...MMMM....',
  '.......MMMMMM...',
  '......MMKKKKMM..',
  '......MMMMMMMM..',
  '.....BBBBBBBB..S',
  '....BBBGGGBBB..S',
  '....B.BMGGMB..WS',
  '......BMGGMB..GS',
  '......BB..BB..G.',
  '......MM..MM....',
  '......GG..GG....',
  '................',
];

export const KNIGHT_SWING: PixelSprite = [
  '.....PPPP.......',
  '....PPP.MMMM....',
  '.......MMMMMM...',
  '......MMKKKKMM..',
  '......MMMMMMMM..',
  '.....BBBBBBBB...',
  '....BBBGGGBBGGSS',
  '...B..BMGGMBSSWW',
  '......BMGGMB.SSS',
  '......BBBBBB....',
  '.....MM....MM...',
  '....MM......MM..',
  '....GG......GG..',
  '................',
];

// Companion sprites (12x12)
export const RANGER_SPRITE: PixelSprite = [
  '....GGGG....',
  '...GGGGGG...',
  '...GSSSSG...',
  '...GSKKSG...',
  '..GGGGGGGG.B',
  '..GGBBBBGG.B',
  '...GGGGGG..B',
  '....G..G....',
  '...GG..GG...',
  '...BB..BB...',
];

export const PYRO_SPRITE: PixelSprite = [
  '.....RR.....',
  '....RRRR....',
  '...RRRRRR...',
  '...RSSSSR...',
  '...RSKKSR.F.',
  '..RRRRRRRRG.',
  '..RROOOORRG.',
  '...RRRRRR.G.',
  '....R..R....',
  '...RR..RR...',
];

export const BANNERET_SPRITE: PixelSprite = [
  '..YY....Y...',
  '..YYYY..Y...',
  '..YYYY..Y...',
  '....GGGGY...',
  '...GSSSSY...',
  '..BBBBBBY...',
  '..BBGGBBY...',
  '...BBBBBY...',
  '....B..B....',
  '...BB..BB...',
];

export const ENEMY_SPRITES: Record<EnemyKind, PixelSprite> = {
  goblin: [
    '................',
    '....GG....GG....',
    '...GGGGGGGGGG...',
    '...GGRRGGRRGG...',
    '....GGGGGGGG....',
    '....BBBBBBBB....',
    '..S.BGGGGGGb....',
    '.SS..BBBBBB.....',
    '.....GG..GG.....',
    '....GG....GG....',
  ],
  boar: [
    '................',
    '................',
    '....BBBBBBBB....',
    '..BBBBBBBBBBBB..',
    '.WWRBBBBBBBBBBB.',
    '.WWBBBBBBBBBBBB.',
    '..BBBBBBBBBBBB..',
    '...BB..BB..BB...',
    '...KK..KK..KK...',
    '................',
  ],
  bandit: [
    '....RRRRRR......',
    '...RRRRRRRR.....',
    '...RKKRRKKR.....',
    '...KKKKKKKK.....',
    '..BBBBBBBBBB....',
    '.S.BBRRRRBB.....',
    'SS..BBBBBB......',
    '....KK..KK......',
    '...KK....KK.....',
    '................',
  ],
  scorpion: [
    '..........PP....',
    '.........PPPP...',
    '..........PP....',
    '....PPPPPPPP....',
    '..PPPPPPPPPPPP..',
    '.PP.PPRPPPRPPP..',
    'PP..PPPPPPPPPP..',
    '....PP.PP.PP....',
    '...PP..PP..PP...',
    '................',
  ],
  bogling: [
    '.....TTTTTT.....',
    '...TTTTTTTTTT...',
    '..TTTYYTTYYTTT..',
    '..TTTTTTTTTTTT..',
    '.TTTTTKKKKTTTTT.',
    '..TTTTTTTTTTTT..',
    '...TT..TT..TT...',
    '..TT...TT...TT..',
    '................',
    '................',
  ],
  golem: [
    '...CCCCCCCCCC...',
    '..CCCCCCCCCCCC..',
    '..CCBBCCCCBBCC..',
    '..CCCCCCCCCCCC..',
    '.CCCCBBBBBBCCCC.',
    '.CCCCCCCCCCCCCC.',
    '..CCCC....CCCC..',
    '..CCCC....CCCC..',
    '..BBBB....BBBB..',
    '................',
  ],
  wyvern: [
    '.RR..........RR.',
    'RRRR..RRRR..RRRR',
    'RRRRRRRRRRRRRRRR',
    '..RRRYRRYRRRRR..',
    '...RRRRRRRRRR...',
    '....RROOOORR....',
    '.....RRRRRR.....',
    '....RR....RR....',
    '................',
    '................',
  ],
  boss: [
    '..Y....YY....Y..',
    '..YY..YYYY..YY..',
    '...YYYYYYYYYY...',
    '..KKKKKKKKKKKK..',
    '..KKRRKKKKRRKK..',
    '..KKKKKKKKKKKK..',
    '.RRKKKYYYYKKKRR.',
    'RRRKKKKKKKKKKRRR',
    'SS.KKKYYYYKKK...',
    'SS..KKK..KKK....',
    '....KK....KK....',
    '...YYY....YYY...',
  ],
};

export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: PixelSprite,
  palette: Record<string, string>,
  centerX: number,
  bottomY: number,
  pixelSize: number,
  flashWhite = false
): void {
  const rows = sprite.length;
  const cols = sprite[0].length;
  const startX = Math.round(centerX - (cols * pixelSize) / 2);
  const startY = Math.round(bottomY - rows * pixelSize);

  for (let r = 0; r < rows; r++) {
    const row = sprite[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = flashWhite ? '#ffffff' : palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
    }
  }
}
