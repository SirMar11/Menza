import { db } from './index.js';
import { menuItems } from './schema.js';

const MENU = [
  { name: 'Svíčková na smetaně', description: 'Hovězí, knedlíky, brusinky', price: 125, dayOfWeek: 'monday', tags: '[]' },
  { name: 'Smažený sýr', description: 'Hermelin, tatarská omáčka, hranolky', price: 95, dayOfWeek: 'monday', tags: '["vegetarian"]' },
  { name: 'Buddha bowl', description: 'Quinoa, avokádo, cizrna', price: 110, dayOfWeek: 'monday', tags: '["vegan","bez-lepku"]' },

  { name: 'Vepřová pečeně', description: 'Dušené zelí, knedlíky', price: 115, dayOfWeek: 'tuesday', tags: '[]' },
  { name: 'Těstovinový salát', description: 'Mozzarella, cherry rajčata, bazalka', price: 90, dayOfWeek: 'tuesday', tags: '["vegetarian"]' },
  { name: 'Zeleninová polévka', description: 'Sezónní zelenina, bylinkový vývar', price: 75, dayOfWeek: 'tuesday', tags: '["vegan","bez-lepku"]' },

  { name: 'Kuřecí řízek', description: 'Bramborová kaše, okurka', price: 120, dayOfWeek: 'wednesday', tags: '[]' },
  { name: 'Rizoto s houbami', description: 'Lesní houby, parmazán', price: 100, dayOfWeek: 'wednesday', tags: '["vegetarian"]' },
  { name: 'Čočkový burger', description: 'Čočkový patty, zelenina, bez housky', price: 105, dayOfWeek: 'wednesday', tags: '["vegan","bez-lepku"]' },

  { name: 'Guláš', description: 'Hovězí guláš, chléb', price: 130, dayOfWeek: 'thursday', tags: '[]' },
  { name: 'Caprese salát', description: 'Mozzarella, rajčata, olivový olej', price: 85, dayOfWeek: 'thursday', tags: '["vegetarian","bez-lepku"]' },
  { name: 'Tofu stir-fry', description: 'Tofu, bok choy, sójová omáčka, rýže', price: 100, dayOfWeek: 'thursday', tags: '["vegan","bez-lepku"]' },

  { name: 'Rybí filé', description: 'Pečené filé, citron, vařené brambory', price: 135, dayOfWeek: 'friday', tags: '["bez-lepku"]' },
  { name: 'Sýrová quesadilla', description: 'Tortilla, čedar, paprika', price: 90, dayOfWeek: 'friday', tags: '["vegetarian"]' },
  { name: 'Ovocný salát', description: 'Sezónní ovoce, kokosový jogurt', price: 70, dayOfWeek: 'friday', tags: '["vegan","bez-lepku"]' },
];

export async function seedMenu() {
  const existing = await db.select().from(menuItems);
  if (existing.length > 0) return;
  await db.insert(menuItems).values(MENU);
  console.log(`Vloženo ${MENU.length} položek menu.`);
}
