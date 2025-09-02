import { authStore } from '@ufabc-next/stores';
import create from 'vue-zustand';

const useAuth = create(authStore);

export default useAuth;
