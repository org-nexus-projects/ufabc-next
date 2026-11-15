import { useAsyncState } from '@vueuse/core';
import type { UseAsyncStateOptions } from '@vueuse/core';
import { computed, onMounted, onUnmounted } from 'vue';
import { storage } from 'wxt/storage';
import type { StorageItemKey } from 'wxt/storage';

export function useStorage<T>(
	key: StorageItemKey,
	initialValue?: T,
	opts?: UseAsyncStateOptions<true, T | null>,
) {
	const { state, isReady, isLoading, error } = useAsyncState(
		async () => await storage.getItem<T>(key),
		initialValue ?? null,
		opts,
	);

	// Listen for changes
	let unwatch: (() => void) | undefined;
	onMounted(() => {
		unwatch = storage.watch<T>(key, (newValue) => {
			state.value = newValue ?? initialValue ?? null;
		});
	});
	onUnmounted(() => {
		unwatch?.();
	});

	return {
		error,
		isLoading,
		isReady,
		// Use a writable computed ref to write updates to storage
		state: computed({
			get() {
				return state.value;
			},
			set(newValue) {
				void storage.setItem(key, newValue);
				state.value = newValue;
			},
		}),
	};
}
