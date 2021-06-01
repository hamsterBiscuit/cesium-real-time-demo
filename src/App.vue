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
        // uri: 'public/model/j20.gltf', // 歼20
        // uri: 'public/model/BD1H.gltf', // 卫星1
        // uri: 'public/model/czld.gltf', // 雷达车
        // uri: 'public/model/DMLD.gltf', // 地面雷达
        // uri: 'public/model/GALILEO.gltf', // 卫星2
        // uri: 'public/model/GPS.gltf', // GPS
        // uri: 'public/model/ZP.gltf', // 帐篷
        // uri: 'public/model/KJ2000.glb', // 巡航机
        // uri: 'public/model/missile.glb', // 导弹
        uri: 'public/model/J15.glb', // 导弹
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
