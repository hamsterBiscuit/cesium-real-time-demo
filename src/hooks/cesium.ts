import { ref, unref, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as CesiumEs from 'cesium'
// import '../../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

import { MobileList, PathRes, EffectList } from './interface'
import { loadData } from './loadData'

const Cesium = (window as any).Cesium

// The URL on your server where CesiumJS's static files are hosted.
// ;(window as any).CESIUM_BASE_URL = '../../node_modules/cesium/Build/Cesium'

export const initCesium = (): Ref<CesiumEs.Viewer> | Ref<undefined> => {
  //wmts?layer=uav_amap%3Aggdt&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=105&TileRow=13
  //wmts?tilematrix=9&layer=uav_amap%3Aggdt&style=default&tilerow=193&tilecol=421&tilematrixset=EPSG%3A4326&format=image%2Fpng&service=WMTS&version=1.0.0&request=GetTile
  // http://172.16.100.16:8055/geoserver/gwc/service/wmts?tilematrix=3&layer=uav_amap%3Aggdt&style=default&tilerow=3&tilecol=6&tilematrixset=EPSG%3A4326&format=image%2Fpng&service=WMTS&version=1.0.0&request=GetTile
  //172.16.100.16:8055/geoserver/gwc/service/wmts?layer=uav_amap%3Aggdt&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=107&TileRow=14
  // http:
  const url =
    'http://172.16.100.16:8055/geoserver/gwc/service/wmts?layer=uav_amap:ggdt&style={style}&tilematrixset={TileMatrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}'
  // var url =
  //   "http://192.168.10.55:7780/l6/{TileMatrix}/{TileCol}/{TileRow}.png";

  const shadedRelief1 = new Cesium.WebMapTileServiceImageryProvider({
    url: url, //"http://172.16.100.16:8055/geoserver/gwc/service/wmts",
    layer: 'uav_amap:ggdt',
    style: '',
    format: 'image/png',
    tileMatrixSetID: 'EPSG:3857',
    // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
    // maximumLevel: 19,
    // credit : new Cesium.Credit('U. S. Geological Survey')
  })

  const terrainLayer = new Cesium.CesiumTerrainProvider({
    url: 'http://172.16.100.12:8099/terrain/19cc337048dc11ebafd0f786c760ef9f',
    requestVertexNormals: true, // 请求照明
    requestWaterMask: true, // 请求水波纹效果
  })

  const viewer = ref<CesiumEs.Viewer>()
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
      // terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: false,
      terrainProvider: terrainLayer,
      imageryProvider: shadedRelief1,
    }) as CesiumEs.Viewer
    ;(viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      'none'

    viewer.value.clock.multiplier = 4
  })

  return viewer
}

// 设置时间
export const setStartAndEndTime = (
  viewer: CesiumEs.Viewer,
  start: string,
  end: string
): void => {
  viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(start)).clone()
  viewer.clock.stopTime = Cesium.JulianDate.fromDate(new Date(end)).clone()
}

// 设置当前时间
export const setCurrentTime = (viewer: CesiumEs.Viewer, time: string): void => {
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(time)).clone()
}

// 左键点击事件
export const clickCesium = (viewer: Ref<CesiumEs.Viewer>): void => {
  viewer.value.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedLabel = viewer.value.scene.pick(movement.position)
    const cartesian = viewer.value.camera.pickEllipsoid(
      movement.position,
      viewer.value.scene.globe.ellipsoid
    )
    console.log(cartesian)
    const cartographic =
      viewer.value.scene.globe.ellipsoid.cartesianToCartographic(
        cartesian as CesiumEs.Cartesian3
      )
    //将弧度转为度的十进制度表示
    const longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
    const latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
    console.log([longitudeString, latitudeString])
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

// 绘制火控雷达
export const renderAimEffect = (
  viewer: CesiumEs.Viewer,
  current: EffectList,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  position: any,
  currentId: string
): void => {
  function getPosition(time: any) {
    const destEntity = viewer.entities.getById(current.destID)
    let currentPosition
    let destPosition
    if (position.getValue) {
      currentPosition = position.getValue(time)
    } else {
      currentPosition = position
    }
    if (destEntity?.position?.getValue) {
      destPosition = destEntity.position.getValue(time)
    } else {
      destPosition = destEntity?.position
    }
    return { currentPosition, destPosition }
  }
  // 画线
  viewer.entities.add({
    id: current.id + currentId,
    name: current.id,
    show: false,
    polyline: {
      positions: new Cesium.CallbackProperty((time: any) => {
        const destEntity = viewer.entities.getById(current.destID)
        const { currentPosition, destPosition } = getPosition(time)
        if (destPosition && currentPosition) {
          return [currentPosition, destPosition]
        } else {
          return []
        }
      }, false),
      width: 20.0,
      material: new Cesium.PolylineGlowMaterialProperty({
        color: Cesium.Color.RED.withAlpha(1),
        // glowPower: 0.25,
      }),
    },
    // orientation: new Cesium.CallbackProperty((e) => {
    //   let m = CesiumEs.getModelMatrix(this.originPosition, this.targetPosition)
    //   let hpr = this.getHeadingPitchRoll(m)
    //   hpr.pitch = hpr.pitch + 3.14 / 2 + 3.14
    //   return Cesium.Transforms.headingPitchRollQuaternion(
    //     this.originPosition,
    //     hpr
    //   )
    // }, false),
    // position: new Cesium.CallbackProperty((e) => {
    //   const { currentPosition, destPosition } = getPosition(e)
    //   if (destPosition && currentPosition) {
    //     return Cesium.Cartesian3.midpoint(
    //       currentPosition,
    //       destPosition,
    //       new Cesium.Cartesian3()
    //     )
    //   } else {
    //     return 0
    //   }
    // }, false),
    // cylinder: {
    //   length: new Cesium.CallbackProperty((e: any) => {
    //     const { currentPosition, destPosition } = getPosition(e)
    //     if (destPosition && currentPosition) {
    //       return Cesium.Cartesian3.distance(currentPosition, destPosition)
    //     } else {
    //       return 0
    //     }
    //   }, false),
    // topRadius: 15.0,
    // bottomRadius: 0.0,
    // material: Cesium.Color.RED.withAlpha(0.4),
    // },
  })
}

// render Entity
export const renderEntity = (
  viewer: CesiumEs.Viewer,
  current: MobileList
): void => {
  const position = Cesium.Cartesian3.fromDegrees(
    current.position[0],
    current.position[1],
    current.position[2]
  )
  const entity = viewer.entities.add({
    id: current.id,
    name: current.id,
    position: position,
    model: {
      uri: current.url,
      scale: current.scale,
      maximumScale: current.maximumScale,
      minimumPixelSize: 128,
      // color: Cesium.Color.RED,
    },
  })
  // 有时间属性
  if (current.path) {
    loadData<PathRes>(current.path).then((res) => {
      const property = new Cesium.SampledPositionProperty()
      res.path.forEach((i) => {
        const time = Cesium.JulianDate.fromDate(new Date(i.time))
        const position = Cesium.Cartesian3.fromDegrees(
          i.position[0],
          i.position[1],
          i.position[2]
        )
        property.addSample(time, position)
      })
      // entity.addProperty
      entity.position = property
      entity.orientation = new Cesium.VelocityOrientationProperty(
        property,
        Cesium.Ellipsoid.UNIT_SPHERE
      )

      // 航迹
      if (!current.id.includes('Missile')) {
        console.log(1)
        entity.availability = new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromDate(new Date(res.path[0].time)),
            stop: Cesium.JulianDate.fromDate(
              new Date(res.path[res.path.length - 1].time)
            ),
          }),
        ])
        entity.path = {
          resolution: 1,
          leadTime: 0,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            taperPower: 0.3,
            color: Cesium.Color.LIGHTBLUE.withAlpha(0.5),
          }),
          width: 10,
        }
      }

      nextTick(() => {
        if (current.effectList) {
          current.effectList.forEach((item) => {
            if (item.type === 'AimEffect') {
              renderAimEffect(viewer, item, property, current.id)
            }
          })
        }
      })
    })
  } else {
    nextTick(() => {
      if (current.effectList) {
        current.effectList.forEach((item) => {
          if (item.type === 'AimEffect') {
            renderAimEffect(viewer, item, position, current.id)
          }
        })
      }
    })
  }

  // 地面雷达
  if (
    (current.type === 1 || current.id.includes('radar')) &&
    current.effectList[0]
  ) {
    const materialData = current.effectList[0]
    // viewer.entities.add({
    //   id: materialData.id,
    //   name: materialData.type,
    //   position: Cesium.Cartesian3.fromDegrees(
    //     current.position[0],
    //     current.position[1],
    //     current.position[2]
    //   ),
    //   ellipsoid: {
    //     radii: new Cesium.Cartesian3(
    //       materialData.parabolaRadius,
    //       materialData.parabolaRadius,
    //       materialData.parabolaHeight
    //     ),
    //     material: Cesium.Color.fromCssColorString(materialData.color[0]),
    //   },
    // })

    const r = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(0)
    )
    const l = Cesium.Cartesian3.fromDegrees(
      current.position[0],
      current.position[1],
      current.position[2]
    )
    ;(viewer.entities as any).add({
      position: l,
      orientation: Cesium.Transforms.headingPitchRollQuaternion(l, r),
      rectangularSensor: new Cesium.RectangularSensorGraphics({
        radius: materialData.parabolaRadius,
        xHalfAngle: Cesium.Math.toRadians(90),
        yHalfAngle: Cesium.Math.toRadians(90),
        material: Cesium.Color.fromCssColorString(materialData.color[0]),
        lineColor: Cesium.Color.fromCssColorString(materialData.color[0]),
        showScanPlane: true,
        scanPlaneColor: Cesium.Color.fromCssColorString(
          materialData.scannerColor
        ),
        // scanPlaneMode: 'horizontal',
        scanPlaneRate: 3,
        showThroughEllipsoid: !1,
      }),
    })
  }
}
