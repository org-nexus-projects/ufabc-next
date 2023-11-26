<script setup lang="ts">
import { PaperCard } from '@/components/PaperCard';
import { defineFederatedReactComponent } from '@/utils/moduleFederation';

const Calengrade = defineFederatedReactComponent({
  loader: () => import('react/Calengrade'),
  props: {},
});
</script>
<template>
  <PaperCard class="flex flex-column flex-fill">
    <Calengrade />
  </PaperCard>
</template>
