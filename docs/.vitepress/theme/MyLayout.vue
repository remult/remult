<script setup>
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-features-after>
      <div style="max-width: 1152px; margin: 0 auto; padding-top: 64px">
        <div
          style="
            position: relative;
            overflow: hidden;
            width: 100%;
            padding-top: 56.25%;
          "
        >
          <iframe
            src="https://www.youtube.com/embed/rEoScmSVNUE"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            style="
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              width: 100%;
              height: 100%;
            "
          ></iframe>
        </div>
      </div>
    </template>
  </Layout>
</template>
