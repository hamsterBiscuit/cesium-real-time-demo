<template>
  <div id="cesiumRef"></div>
  <div class="controll">
    <ElButton type="primary" size="small" @click="play">开始</ElButton>
    <ElButton type="primary" size="small" @click="pause">暂停</ElButton>
    <ElButton type="primary" size="small" @click="restart">重置</ElButton>
    <ElButton type="primary" size="small" @click="fastForward">快进5s</ElButton>
    <ElButton type="primary" size="small" @click="back">后退5s</ElButton>
    <ElButton type="primary" size="small" @click="resetCamera">
      视角重置
    </ElButton>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, watch } from 'vue'
  import { ElButton } from 'element-plus'
  import * as Cesium from 'cesium'
  import {
    initCesium,
    setStartAndEndTime,
    setCurrentTime,
    renderEntity,
  } from './hooks/cesium'
  import { changeCameraHeight, clickCesium } from './hooks/cesiumEvent'
  import { useLoadSceneDeply, useLoadEntity } from './hooks/loadData'
  // import { fire } from './hooks/renderEneity'

  const viewer = initCesium()
  const data = useLoadSceneDeply()
  watch(data, (value) => {
    if (!viewer.value) return
    if (!value) return
    setStartAndEndTime(viewer.value, value.startTime, value.endTime)
    setCurrentTime(viewer.value, value.startTime)
    // 事件
    // 控制 entity 掩藏显示
    setInterval(() => {
      value.eventCommands.forEach((item) => {
        item.method?.forEach((i) => {
          // 火控雷达效果
          if (
            i.parameters?.strEffectID?.includes('aim') &&
            typeof i.parameters.visible === 'boolean'
          ) {
            const time = Cesium.JulianDate.fromDate(new Date(item.currentTime))
            const currentTime = viewer.value.clock.currentTime.clone()
            // 对比时间
            if (Cesium.JulianDate.equalsEpsilon(time, currentTime, 1)) {
              const entity = viewer.value.entities.getById(
                i.parameters?.strEffectID + i.parameters?.strEntityID
              )
              const key = i.parameters?.strEffectID + i.parameters?.strEntityID
              // 扫描雷达
              const scanEntity = viewer.value.entities.getById(
                i.parameters?.strEntityID
              )
              if (entity) {
                entity.show = i.parameters?.visible
              }

              if (!scanEntity || !scanEntity.ellipsoid) return
              // scanEntity.ellipsoid.show = new Cesium.ConstantProperty(
              //   !i.parameters?.visible
              // )
            }
          }
          if (i.parameters?.strEffectID?.includes('dynnamicLineEffect')) {
            const time = Cesium.JulianDate.fromDate(new Date(item.currentTime))
            const currentTime = viewer.value.clock.currentTime.clone()
            // 对比时间
            if (Cesium.JulianDate.equalsEpsilon(time, currentTime, 1)) {
              const entity = viewer.value.entities.getById(
                i.parameters?.strEntityID + i.parameters?.strEffectID
              )
              if (entity) {
                entity.show = i.parameters?.visible
              }
            }
          }
        })
      })
    }, 250)
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
  })
  onMounted(() => {
    if (!viewer.value) return
    clickCesium(viewer)
    changeCameraHeight(viewer)
    // fire(viewer.value)
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
  })

  const play = () => {
    if (!viewer.value) return
    viewer.value.clock.shouldAnimate = true
  }
  const pause = () => {
    if (!viewer.value) return
    viewer.value.clock.shouldAnimate = false
  }
  const restart = () => {
    if (!viewer.value || !data.value) return
    setCurrentTime(viewer.value, data.value.startTime)
    viewer.value.clock.shouldAnimate = false
  }
  const fastForward = () => {
    if (!viewer.value) return
    const current = viewer.value.clock.currentTime.clone()
    const result = new Cesium.JulianDate()
    Cesium.JulianDate.addSeconds(current, 5, result)
    setCurrentTime(viewer.value, result.toString())
  }
  const back = () => {
    if (!viewer.value) return
    const current = viewer.value.clock.currentTime.clone()
    const result = new Cesium.JulianDate()
    Cesium.JulianDate.addSeconds(current, -5, result)
    setCurrentTime(viewer.value, result.toString())
  }
  const resetCamera = () => {
    if (!viewer.value) return
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
  }
</script>

<style>
  #cesiumRef {
    height: 100vh;
  }

  .controll {
    position: absolute;
    left: 10rem;
    right: 10rem;
    bottom: 10rem;
    height: 3rem;
    line-height: 3rem;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0 0.25rem;
    text-align: center;
  }
</style>
