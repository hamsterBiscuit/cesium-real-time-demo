import { ref, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as Cesium from 'cesium'
// import xx from 'cesium/Source/'
import {
  renderAimEffect,
  renderEarlyWarningAircraftRadar,
  renderDynnamicLine,
} from './renderEntity'
import { calcPoints } from './radar'
import '../../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

import { MobileList, PathRes } from './interface'
import { loadData } from './loadData'

export const initCesium = (): Ref<Cesium.Viewer> | Ref<undefined> => {
  //wmts?layer=uav_amap%3Aggdt&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=105&TileRow=13
  //wmts?tilematrix=9&layer=uav_amap%3Aggdt&style=default&tilerow=193&tilecol=421&tilematrixset=EPSG%3A4326&format=image%2Fpng&service=WMTS&version=1.0.0&request=GetTile
  // http://172.16.100.16:8055/geoserver/gwc/service/wmts?tilematrix=3&layer=uav_amap%3Aggdt&style=default&tilerow=3&tilecol=6&tilematrixset=EPSG%3A4326&format=image%2Fpng&service=WMTS&version=1.0.0&request=GetTile
  //172.16.100.16:8055/geoserver/gwc/service/wmts?layer=uav_amap%3Aggdt&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=107&TileRow=14
  // http:
  // const url =
  //   'http://172.16.100.16:8055/geoserver/gwc/service/wmts?layer=uav_amap:ggdt&style={style}&tilematrixset={TileMatrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}'
  const url = 'http://wxdt.xsgz.com/{TileMatrix}/{TileCol}/{TileRow}.jpg'
  // const url = 'http://city.xsgz.com/{TileMatrix}/{TileCol}/{TileRow}.png'
  const shadedRelief1 = new Cesium.WebMapTileServiceImageryProvider({
    url: url, //"http://172.16.100.16:8055/geoserver/gwc/service/wmts",
    layer: 'uav_amap:ggdt',
    style: '',
    format: 'image/png',
    tileMatrixSetID: 'EPSG:3857',
  })

  const terrainLayer = new Cesium.CesiumTerrainProvider({
    url: 'http://172.16.100.12:8099/terrain/19cc337048dc11ebafd0f786c760ef9f',
    // url: 'http://192.168.10.62:8999/terrain/1111',
    requestVertexNormals: true, // 请求照明
    requestWaterMask: true, // 请求水波纹效果
  })

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
      shouldAnimate: false, // Enable animations
      // terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: false,
      terrainProvider: terrainLayer,
      imageryProvider: shadedRelief1,
    }) as Cesium.Viewer
    ;(viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      'none'

    viewer.value.clock.multiplier = 1
  })

  return viewer
}

// 设置时间
export const setStartAndEndTime = (
  viewer: Cesium.Viewer,
  start: string,
  end: string
): void => {
  viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(start)).clone()
  viewer.clock.stopTime = Cesium.JulianDate.fromDate(new Date(end)).clone()
}

// 设置当前时间
export const setCurrentTime = (viewer: Cesium.Viewer, time: string): void => {
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(time)).clone()
}

// render Entity
export const renderEntity = (
  viewer: Cesium.Viewer,
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
      minimumPixelSize: 64,
      show: false,
    },
    billboard: {
      image: current.image,
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
      scale: current.imageScale, // default: 1.0
      rotation: current.modeloffsetHeading ? -Cesium.Math.PI_OVER_TWO : 0.0, // default: 0.0
      alignedAxis: Cesium.Cartesian3.ZERO, // default
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

      // 原始方向数据
      const orientationProperty = new Cesium.VelocityOrientationProperty(
        property
      )
      // 模型
      const modelOrientationProperty = new Cesium.SampledProperty(
        Cesium.Quaternion
      )
      res.path.forEach((i) => {
        const time = Cesium.JulianDate.fromDate(new Date(i.time))
        const orientation = orientationProperty.getValue(time)
        if (!orientation) return

        modelOrientationProperty.addSample(time, orientation)
      })
      // 3D model
      entity.position = property
      entity.orientation = modelOrientationProperty

      // 航迹 暂时去掉
      // eslint-disable-next-line no-constant-condition
      // if (!current.id.includes('Missile') && false) {
      //   entity.availability = new Cesium.TimeIntervalCollection([
      //     new Cesium.TimeInterval({
      //       start: Cesium.JulianDate.fromDate(new Date(res.path[0].time)),
      //       stop: Cesium.JulianDate.fromDate(
      //         new Date(res.path[res.path.length - 1].time)
      //       ),
      //     }),
      //   ])
      //   entity.path = {
      //     resolution: new Cesium.ConstantProperty(1),
      //     leadTime: new Cesium.ConstantProperty(0),
      //     material: new Cesium.PolylineGlowMaterialProperty({
      //       glowPower: 0.3,
      //       taperPower: 0.3,
      //       color: Cesium.Color.LIGHTBLUE.withAlpha(0.5),
      //     }),
      //     width: new Cesium.ConstantProperty(10),
      //   }
      // }
      // 预警雷达
      if (!current.id.includes('Missile')) {
        entity.ellipsoid = {
          radii: new Cesium.Cartesian3(30000.0, 30000.0, 30000.0),
          innerRadii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
          minimumClock: Cesium.Math.toRadians(-10.0),
          maximumClock: Cesium.Math.toRadians(10.0),
          minimumCone: Cesium.Math.toRadians(80.0),
          maximumCone: Cesium.Math.toRadians(100.0),
          material: Cesium.Color.AQUA.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.3),
          outlineWidth: 2,
        } as any
      }

      current.effectList?.forEach((i) => {
        if (i.id.includes('Radar')) {
          // 雷达-预警机
          renderEarlyWarningAircraftRadar(viewer, entity, i)
        }
      })
      nextTick(() => {
        if (current.effectList) {
          current.effectList.forEach((item) => {
            if (item.type === 'AimEffect') {
              // 导弹
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

  current.effectList?.forEach((i) => {
    if (i.id.includes('dynnamicLineEffect')) {
      renderDynnamicLine(viewer, entity, i)
    }
  })

  // 地面雷达
  if (
    (current.type === 1 || current.id.includes('radar')) &&
    current.effectList[0]
  ) {
    const materialData = current.effectList[0]

    let heading = 0

    let positionArr = calcPoints(
      current.position[0],
      current.position[1],
      materialData.parabolaRadius ?? 0,
      heading,
      materialData.parabolaHeight
    )
    viewer.entities.add({
      wall: {
        positions: new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.fromDegreesArrayHeights(positionArr)
        }, false),
        material: Cesium.Color.fromCssColorString(materialData.scannerColor),
      },
    })
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        current.position[0],
        current.position[1],
        current.position[2]
      ),
      ellipsoid: {
        radii: new Cesium.Cartesian3(
          materialData.parabolaRadius,
          materialData.parabolaRadius,
          materialData.parabolaHeight
        ),
        maximumCone: Cesium.Math.toRadians(90),
        material: Cesium.Color.fromCssColorString(materialData.color[1]),
        outline: false,
        outlineColor: Cesium.Color.AQUAMARINE.withAlpha(0.5),
        outlineWidth: 1,
      },
    })

    // 执行动画效果
    viewer.clock.onTick.addEventListener(() => {
      heading += 10
      positionArr = calcPoints(
        current.position[0],
        current.position[1],
        materialData.parabolaRadius ?? 0,
        heading,
        materialData.parabolaHeight
      )
    })
  }
}
