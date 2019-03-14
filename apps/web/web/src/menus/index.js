export default [
  // Orders group
  { 
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
    permissions: 'reviews:read',
  },

  {
    title: 'Estatísticas',
    icon: 'mdi-google-analytics',
    route: '/stats',
    permissions: 'stats:read',
  },

  {
    title: 'Planejamento',
    icon: 'mdi-file-document-box-multiple',
    route: '/planning',
    permissions: 'planning:read',
  },

  {
    title: 'Meus histórico',
    icon: 'mdi-history',
    route: '/history',
    permissions: 'history:read',
  },


  {
    title: 'Configurações',
    icon: 'settings',
    route: '/settings',
  },

]