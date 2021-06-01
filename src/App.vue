<template>
  <div id="cesiumRef"></div>
</template>

<script lang="ts" setup>
  import { onMounted, nextTick } from 'vue'
  import * as Cesium from 'cesium'
  import { initCesium, clickCesium } from './cesium'

  const viewer = initCesium()
  onMounted(() => {
    if (!viewer.value) return
    clickCesium(viewer)
    const j20 = viewer.value.entities.add({
      name: 'j20',
      position: Cesium.Cartesian3.fromDegrees(
        126.3252296364248,
        51.856054618724656,
        10000
      ),
      model: {
        uri: 'public/model/j20.gltf',
        minimumPixelSize: 128,
      },
    })

    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        126.3252296364248,
        51.856054618724656,
        100000
      ),
    })
  })
</script>

<style>
  #cesiumRef {
    height: 100vh;
  }
</style>
