---
title: Joy Prompt 探索
---

<script setup>
import { onMounted, onUnmounted } from "vue";
import PromptGallery from "./.vitepress/components/PromptGallery.vue";

onMounted(() => {
  document.body.classList.add("market-page");
});
onUnmounted(() => {
  document.body.classList.remove("market-page");
});
</script>

<h1 class="market-hide-title">Joy Prompt Catalog</h1>

<PromptGallery />
