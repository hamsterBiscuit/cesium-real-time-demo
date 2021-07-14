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
  const url =
    'http://172.16.100.16:8055/geoserver/gwc/service/wmts?layer=uav_amap:ggdt&style={style}&tilematrixset={TileMatrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}'
  // const url = 'http://wxdt.xsgz.com/{TileMatrix}/{TileCol}/{TileRow}.jpg'
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
      // show: false,
      // silhouetteSize: 1.0,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        0.0,
        25000.0
      ),
    },
    billboard: {
      image: current.image,
      color: Cesium.Color.PINK,
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
      scale: current.imageScale, // default: 1.0
      // rotation: current.modeloffsetHeading ? -Cesium.Math.PI_OVER_TWO : 0.0, // default: 0.0
      // rotation: -Cesium.Math.PI_OVER_TWO,
      alignedAxis: Cesium.Cartesian3.ZERO, // default
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(25000.0),
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
      const times = []
      const arr = []
      const arr2 = []
      const arr3 = []
      res.path.forEach((i, index) => {
        const time = Cesium.JulianDate.fromDate(new Date(i.time))
        const orientation = orientationProperty.getValue(time)
        const position = Cesium.Cartesian3.fromDegrees(
          i.position[0],
          i.position[1],
          i.position[2]
        )
        if (!orientation) return
        modelOrientationProperty.addSample(time, orientation)

        // test
        function createROIfromRotation(position, rotation, length) {
          // position: Cartographic - {latitude, longitude, altitude})
          // rotation: HeadingPitchRoll - {heading, pitch, roll}

          // Based on answer found here:
          // https://stackoverflow.com/questions/58021985/create-a-point-in-a-direction-in-cesiumjs

          const cartesianPosition =
            Cesium.Ellipsoid.WGS84.cartographicToCartesian(position)

          rotation.heading = rotation.heading - Cesium.Math.toRadians(90)
          const referenceFrame1 = Cesium.Transforms.headingPitchRollQuaternion(
            cartesianPosition,
            rotation
          )
          const rotationMatrix = Cesium.Matrix3.fromQuaternion(
            referenceFrame1,
            new Cesium.Matrix3()
          )
          const rotationScaled = Cesium.Matrix3.multiplyByVector(
            rotationMatrix,
            new Cesium.Cartesian3(length, 0, 0),
            new Cesium.Cartesian3()
          )
          const roiPos = Cesium.Cartesian3.add(
            cartesianPosition,
            rotationScaled,
            new Cesium.Cartesian3()
          )
          return roiPos
        }
        const trs = new Cesium.TranslationRotationScale(
          new Cesium.Cartesian3(0.0, 10.0, 0.0),
          orientation
        )
        const rotationMatrix = Cesium.Matrix3.fromQuaternion(orientation)
        const rotationScaled = Cesium.Matrix3.multiplyByVector(
          rotationMatrix,
          new Cesium.Cartesian3(0.0, 600.0, 0.0),
          new Cesium.Cartesian3()
        )
        const rotationScaled2 = Cesium.Matrix3.multiplyByVector(
          rotationMatrix,
          new Cesium.Cartesian3(0.0, -600.0, 0.0),
          new Cesium.Cartesian3()
        )
        const roiPos = Cesium.Cartesian3.add(
          position,
          rotationScaled,
          new Cesium.Cartesian3()
        )
        const roiPos2 = Cesium.Cartesian3.add(
          position,
          rotationScaled2,
          new Cesium.Cartesian3()
        )
        times.push(index)
        arr.push(roiPos)
        arr2.push(roiPos2)
        arr3.push(roiPos)
        arr3.push(roiPos2)
        // end
      })
      // 3D model
      entity.position = property
      entity.orientation = modelOrientationProperty
      if (entity.billboard) {
        entity.billboard.alignedAxis = new Cesium.VelocityVectorProperty(
          property
        )
      }
      if (current.id === 'test12') {
        const positions = []
        const spline = new Cesium.CatmullRomSpline({
          times: times,
          points: arr,
        })
        const spline2 = new Cesium.CatmullRomSpline({
          times: times,
          points: arr2.reverse(),
        })
        for (let i = 0; i <= 800; i++) {
          const c3 = spline.evaluate(i / 100)
          console.log(i / 10)
          positions.push(c3)
        }
        for (let i = 0; i <= 800; i++) {
          const c3 = spline2.evaluate(i / 100)
          positions.push(c3)
        }
        viewer.entities.add({
          polyline: {
            positions: arr,
            material: Cesium.Color.RED,
            width: 1,
          },
        })
        viewer.entities.add({
          polyline: {
            positions: arr2,
            material: Cesium.Color.BLUE,
            width: 1,
          },
        })
        viewer.entities.add({
          polygon: {
            hierarchy: positions,
            perPositionHeight: true,
            material: Cesium.Color.YELLOW.withAlpha(0.2),
            width: 1,
            // closeTop: false,
            // closeBottom: false,
          },
        })
      }

      // 航迹 暂时去掉
      // eslint-disable-next-line no-constant-condition
      if (!current.id.includes('Missile')) {
        const start = Cesium.JulianDate.fromDate(new Date(res.path[0].time))
        const stop = Cesium.JulianDate.fromDate(
          new Date(res.path[res.path.length - 1].time)
        )
        entity.availability = new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start,
            stop,
          }),
        ])
        entity.path = {
          // resolution: new Cesium.ConstantProperty(10),
          leadTime: new Cesium.ConstantProperty(0),
          trailTime: new Cesium.ConstantProperty(10),
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.1,
            // taperPower: 0.3,
            color: Cesium.Color.YELLOW,
          }),
          width: new Cesium.ConstantProperty(3),
        }
      }
      // 预警雷达
      // if (!current.id.includes('Missile')) {
      //   entity.ellipsoid = {
      //     radii: new Cesium.Cartesian3(30000.0, 30000.0, 30000.0),
      //     innerRadii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
      //     minimumClock: Cesium.Math.toRadians(-10.0),
      //     maximumClock: Cesium.Math.toRadians(10.0),
      //     minimumCone: Cesium.Math.toRadians(80.0),
      //     maximumCone: Cesium.Math.toRadians(100.0),
      //     material: Cesium.Color.AQUA.withAlpha(0.3),
      //     outline: true,
      //     outlineColor: Cesium.Color.BLACK.withAlpha(0.3),
      //     outlineWidth: 2,
      //   } as any
      // }

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
          heading += 2
          positionArr = calcPoints(
            current.position[0],
            current.position[1],
            materialData.parabolaRadius ?? 0,
            heading,
            materialData.parabolaHeight
          )
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
  }
}
