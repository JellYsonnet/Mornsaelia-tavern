import { createApp } from 'vue';
import App from './界面.vue';

$(() => {
  const app = createApp(App);
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
