
const loadQuickLinks = () => import('quick-links').then(module => module.default);
export const quick_links = loadQuickLinks