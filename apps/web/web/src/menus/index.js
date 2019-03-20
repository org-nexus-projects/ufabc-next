export default [
  // Orders group
  { 
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
  },

  {
    title: 'Estatísticas',
    icon: 'mdi-google-analytics',
    route: '/stats',
  },

  {
    title: 'Planejamento',
    icon: 'mdi-file-document-box-multiple',
    route: '/planning',
  },

  {
    title: 'Meus histórico',
    icon: 'mdi-history',
    route: '/history',
  },

  {
    title: 'Configurações',
    icon: 'settings',
    route: '/settings',
  },

  {
    title: 'Administrativo',
    icon: 'mdi-database-edit',
    route: '/admin',
    permissions: 'admin',
  },

]