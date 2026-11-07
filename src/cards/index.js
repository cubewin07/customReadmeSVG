import { registerCard } from '../core/cards/registry.js';
import profileCard from './profile/index.js';
import languagesCard from './languages/index.js';
import reposCard from './repos/index.js';
import statsCard from './stats/index.js';
import developerCard from './developer/index.js';
import signatureCard from './plates/signature.js';
import stackCard from './plates/stack.js';
import traceCard from './plates/trace.js';

// Register all core SVG card plugins
registerCard(profileCard);
registerCard(languagesCard);
registerCard(reposCard);
registerCard(statsCard);
registerCard(developerCard);
registerCard(signatureCard);
registerCard(stackCard);
registerCard(traceCard);

export {
  profileCard,
  languagesCard,
  reposCard,
  statsCard,
  developerCard,
  signatureCard,
  stackCard,
  traceCard,
};

