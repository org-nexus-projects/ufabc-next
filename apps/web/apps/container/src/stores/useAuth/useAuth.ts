import { authStore } from 'stores';
import create from 'vue-zustand';

const useAuth = create(authStore);

export default useAuth;
