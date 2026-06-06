import { createApp } from 'vue';
import App from './App.vue';
import '~/assets/tailwind.css';
import { VueQueryPlugin } from '@tanstack/vue-query';

createApp(App).use(VueQueryPlugin).mount('#app');
