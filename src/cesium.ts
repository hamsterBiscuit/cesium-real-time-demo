import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import * as Cesium from 'cesium'
import '../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

// The URL on your server where CesiumJS's static files are hosted.
;(window as any).CESIUM_BASE_URL = '../node_modules/cesium/Build/Cesium'

export const initCesium = (): Ref<Cesium.Viewer> | Ref<undefined> => {
  const viewer = ref<Cesium.Viewer>()
  onMounted(() => {
    viewer.value = new Cesium.Viewer('cesiumRef', {
      animation: false, //“动画”开关
      fullscreenButton: false, //“全屏”开关
      geocoder: false, //“查询器”开关
      vrButton: false, //“分屏”展示开关
      homeButton: false, //“返回初始状态”开关
      infoBox: false, //点击后的弹框
      sceneModePicker: false, //“3D、2.5D”切换开关
      selectionIndicator: false,
      timeline: false, //"时间线"开关
      navigationHelpButton: false, //“帮助按钮”开关
      shouldAnimate: true, // Enable animations
      terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: false,
    })
    ;(viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      'none'
  })

  return viewer
}

export const clickCesium = (viewer: Ref<Cesium.Viewer>): any => {
  viewer.value.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedLabel = viewer.value.scene.pick(movement.position)
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
