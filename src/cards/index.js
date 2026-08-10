import { registerCard } from '../core/cards/registry.js';
import profileCard from './profile/index.js';
import languagesCard from './languages/index.js';
import reposCard from './repos/index.js';
import statsCard from './stats/index.js';

// Register all core SVG card plugins
registerCard(profileCard);
registerCard(languagesCard);
registerCard(reposCard);
registerCard(statsCard);

export {
  profileCard,
  languagesCard,
  reposCard,
  statsCard,
};
