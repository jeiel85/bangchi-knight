import type { EnemyKind } from '../engine/types';

export type PixelSprite = string[];

// 16x16 Silver-haired Dark Knight (facing right)
// Palette keys:
// H=hair silver, h=hair shadow, S=skin, E=eye cyan/gold, A=armor dark, a=armor light
// C=cape dynamic, G=gold trim, B=blade bright, b=blade steel, W=white glint
export const KNIGHT_RUN_A: PixelSprite = [
  '.....HHHHH......',
  '....HHHHHHH.....',
  '...hHHSSSSHH....',
  '...hHSSESESH....',
  '....hHSSSSh.....',
  '...CCAAAAA......',
  '..CCCAGAGA..BB..',
  '..CCaAAAAa.BBW..',
  '...CAAAAAAbBB...',
  '...C.AAAAbGB....',
  '.....AAAA.G.....',
  '....AA..AA......',
  '...AA....AA.....',
  '...GG....GG.....',
  '................',
  '................',
];

export const KNIGHT_RUN_B: PixelSprite = [
  '................',
  '.....HHHHH......',
  '....HHHHHHH.....',
  '...hHHSSSSHH....',
  '...hHSSESESH....',
  '....hHSSSSh.....',
  '..CCCAAAAA......',
  '.CCCCAGAGA...BB.',
  '..CCaAAAAa..BBW.',
  '...CAAAAAA.bBB..',
  '....CAAAA.bGB...',
  '.....AA.AA.G....',
  '.....AA..AA.....',
  '....GG....GG....',
  '................',
  '................',
];

export const KNIGHT_ATTACK: PixelSprite = [
  '......HHHHH.....',
  '.....HHHHHHH....',
  '....hHHSSSSHH...',
  '....hHSSESESH...',
  '.....hHSSSSh....',
  '..CCCAAAAAA.....',
  '.CCCCAGAGAA.G...',
  '..CCaAAAAAAGBBB.',
  '...CAAAAAAbBBWW.',
  '.....AAAAA.BBB..',
  '.....AA..AA.....',
  '....AA....AA....',
  '...GG......GG...',
  '................',
  '................',
  '................',
];

export const ENEMY_SPRITES: Record<EnemyKind, PixelSprite> = {
  slime: [
    '................',
    '................',
    '................',
    '................',
    '.....PPPPPP.....',
    '...PPPPppppPP...',
    '..PPPpppppPPP...',
    '.PPPpEppppEpPP..',
    '.PPPpEppppEpPP..',
    '.PPPPppppppPPP..',
    '.PPPPPPPPPPPPP..',
    '..PPPPPPPPPPP...',
    '................',
    '................',
  ],
  skeleton: [
    '.....WWWWWW.....',
    '....WWWWWWWW....',
    '....WKKWWKKW....',
    '....WWWWWWWW....',
    '.....WKWWKW.....',
    '......WWWW......',
    '....WWWGWWWW....',
    '...W..WWWW..W...',
    '..B...WKKW...W..',
    '.B....WWWW......',
    '......W..W......',
    '.....W....W.....',
    '....WW....WW....',
    '................',
  ],
  bat: [
    '................',
    '.PP..........PP.',
    'PPPP..PPPP..PPPP',
    'PPPPPPPPPPPPPPPP',
    '.PPPPPRpPRPPPPP.',
    '..PPPPPPPPPPPP..',
    '...PP.PWWP.PP...',
    '......PPPP......',
    '.......PP.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  knight: [
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...AAARAAARAA...',
    '...AAAAAAAAAA...',
    '..CCCAAAAAA.....',
    '..CCAAAAAAAAA...',
    '.BB.AAGGGGAA....',
    'BBW.AAAAAAAA....',
    '.B..AAAAAAAA....',
    '.....AA..AA.....',
    '....AA....AA....',
    '....GG....GG....',
    '................',
    '................',
  ],
  gargoyle: [
    '.KK..........KK.',
    'KKK..KKKKKK..KKK',
    'KKKKKKRKKRKKKKKK',
    '.KKKKKKKKKKKKKK.',
    '..KK.KKKKKK.KK..',
    '.....KKGGKK.....',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '.....KK..KK.....',
    '....KK....KK....',
    '...KK......KK...',
    '................',
    '................',
    '................',
  ],
  boss: [
    '..G....GG....G..',
    '..GG..GGGG..GG..',
    '...GGGGGGGGGG...',
    '..KKKKKKKKKKKK..',
    '..KKRRKKKKRRKK..',
    '..KKKKKKKKKKKK..',
    '.CCKKKGGGGKKKCC.',
    'CCCKKKKKKKKKKCCC',
    'CC.KKKGGGGKKK.CC',
    'BB.KKKKKKKKKK...',
    'BBW.KKKKKKKK....',
    'BB..KKK..KKK....',
    '....KK....KK....',
    '...GGG....GGG...',
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
