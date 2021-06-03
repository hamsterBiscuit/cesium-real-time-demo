<template>
  <div id="cesiumRef"></div>
</template>

<script lang="ts" setup>
  import { onMounted, watch } from 'vue'
  // import * as Cesium from 'cesium'
  import {
    initCesium,
    clickCesium,
    setStartAndEndTime,
    setCurrentTime,
    renderEntity,
  } from './hooks/cesium'
  import { useLoadSceneDeply, useLoadEntity } from './hooks/loadData'

  const Cesium = (window as any).Cesium

  const viewer = initCesium()
  const data = useLoadSceneDeply()
  watch(data, (value) => {
    if (!viewer.value) return
    if (!value) return
    setStartAndEndTime(viewer.value, value.startTime, value.endTime)
    setCurrentTime(viewer.value, value.startTime)
  })

  const entityData = useLoadEntity()
  watch(entityData, (value) => {
    if (!viewer.value) return
    if (!value) return
    value.mobileList.forEach((item) => {
      renderEntity(viewer.value, item)
    })
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        107.86403621404294,
        31.93440949179516,
        256158.7686010595
      ),
      orientation: {
        heading: Cesium.Math.toRadians(357.0625550729448),
        pitch: Cesium.Math.toRadians(-53.70659864617062),
        roll: Cesium.Math.toRadians(0.003695432978150054),
      },
    })
    viewer.value.clock.canAnimate = true
  })
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
        // uri: 'public/models/J15.glb', // 导弹
        // minimumPixelSize: 128,
      },
    })

    // viewer.value.camera.flyTo({
    //   destination: Cesium.Cartesian3.fromDegrees(
    //     126.3252296364248,
    //     51.856054618724656,
    //     100000
    //   ),
    // })
  })
</script>

<style>
  #cesiumRef {
    height: 100vh;
  }
</style>
