import type { Ref } from 'vue'
import * as Cesium from 'cesium'

// 切换 model｜image
function changeEntityModel(viewer: Ref<Cesium.Viewer>, mode: 'model' | 'img') {
  viewer.value.entities.values.forEach((entity) => {
    if (entity.billboard && entity.model) {
      ;(entity.billboard as any).show = mode === 'img'
      ;(entity.model as any).show = mode === 'model'
    }
  })
}

// 镜头高度变化回调函数
export const changeCameraHeight = (viewer: Ref<Cesium.Viewer>): void => {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)
  const benchmark = 200000 // camera 基准高度
  let isHigh = true
  handler.setInputAction(() => {
    const height = viewer.value.camera.positionCartographic.height
    if (height > benchmark && !isHigh) {
      isHigh = !isHigh
      changeEntityModel(viewer, 'img')
    } else if (height < benchmark && isHigh) {
      isHigh = !isHigh
      changeEntityModel(viewer, 'model')
    }
  }, Cesium.ScreenSpaceEventType.WHEEL)
}

// 左键点击事件
export const clickCesium = (viewer: Ref<Cesium.Viewer>): void => {
  viewer.value.screenSpaceEventHandler.setInputAction((movement) => {
    // const pickedLabel = viewer.value.scene.pick(movement.position)
    const cartesian = viewer.value.camera.pickEllipsoid(
      movement.position,
      viewer.value.scene.globe.ellipsoid
    )
    console.log(cartesian)
    const cartographic =
      viewer.value.scene.globe.ellipsoid.cartesianToCartographic(
        cartesian as Cesium.Cartesian3
      )
    //将弧度转为度的十进制度表示
    const longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
    const latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
    console.log([longitudeString, latitudeString])
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}
