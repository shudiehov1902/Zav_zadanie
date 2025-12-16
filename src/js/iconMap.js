// Маппинг ID ингредиентов к файлам иконок
export const ICON_MAP = {
  // Алкоголь
  'lager': 'EmptyPintOfBeer.png',
  'rum': 'rum.png',
  'gin': 'gin.png',
  'whiskey': 'Alcohol.png',
  'vodka': 'Alcohol.png',
  'tequila': 'Alcohol.png',
  'mezcal': 'Alcohol.png',
  'vermouth': 'Alcohol.png',
  'campari': 'Alcohol.png',
  'bitters': 'Alcohol.png',
  'liqueur': 'Alcohol.png',
  'espresso': 'Alcohol.png',
  'shandy': 'shandy.png',
    'cuba_libre': 'cuba_libre.png',
  
  // Ингредиенты
  'soda': 'SodaWater.png',
  'syrup': 'BottleOfSirup.png',
  'mint': 'MintLeavs.png',
  'lime': 'SliceOfLime.png',
  'orange': 'SliceOfOrange.png',
  'lemon': 'SliceOfLime.png', // используем лайм как замену
  'pineapple': 'SliceOfOrange.png', // временно
  'chili': 'ShugarCube.png', // временно
  'cubes': 'ShugarCube.png', // лед
  'foam': 'FullPintOfBeer.png',
  'white': 'SodaWater.png', // яичный белок временно
  'beans': 'ShugarCube.png', // кофейные зерна временно
  'cola': 'cola.png',
  'ice': 'ice.png',
    'tonic': 'tonic.png',
  
  // Посуда



  'shaker': 'Shaker.png',
};

export function getIconPath(ingredientId) {
  const iconFile = ICON_MAP[ingredientId] || 'ShugarCube.png'; // fallback
  return `./src/assets/icons/${iconFile}`;
}


