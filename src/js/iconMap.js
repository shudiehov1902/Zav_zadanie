
export const ICON_MAP = {
  
  'lager': 'EmptyPintOfBeer.png',
  'rum': 'rum.png',
  'gin': 'gin.png',
  'whiskey': 'whiskey.png',
  'vodka': 'Alcohol.png',
  'tequila': 'Alcohol.png',
  'mezcal': 'Alcohol.png',
  'vermouth': 'redwermouth.png', 
  'campari': 'Alcohol.png',
  'bitters': 'Alcohol.png',
  'bitter': 'biter.png', 
  'liqueur': 'Alcohol.png',
  'espresso': 'Alcohol.png',
  'shandy': 'shandy.png',
  'cuba_libre': 'cuba_libre.png',

  'soda': 'SodaWater.png',
  'syrup': 'BottleOfSirup.png',
  'mint': 'MintLeavs.png',
  'lime': 'SliceOfLime.png',
  'orange': 'SliceOfOrange.png',
  'lemon': 'SliceOfLime.png', 
  'pineapple': 'SliceOfOrange.png', 
  'chili': 'ShugarCube.png', 
  'cubes': 'ShugarCube.png', 
  'foam': 'FullPintOfBeer.png',
  'white': 'SodaWater.png', 
  'beans': 'ShugarCube.png', 
  'cola': 'cola.png',
  'ice': 'ice.png',
  'tonic': 'tonic.png',
  'blueEssence': 'manasyrup.png', 
  'chiliSyrup': 'chilisyrup.png', 

  'shaker': 'Shaker.png',
};

export function getIconPath(ingredientId) {
  const iconFile = ICON_MAP[ingredientId] || 'ShugarCube.png'; 
  return `./src/assets/icons/${iconFile}`;
}

