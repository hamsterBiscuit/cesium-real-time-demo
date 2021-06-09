import { ref, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as Cesium from 'cesium'
import { renderAimEffect } from './renderEneity'
import { calcPoints, calcScanPoints } from './radar'
import { PolylineTrailLinkMaterialProperty } from '../material/trailLink'
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
  // var url =
  //   "http://192.168.10.55:7780/l6/{TileMatrix}/{TileCol}/{TileRow}.png";

  const shadedRelief1 = new Cesium.WebMapTileServiceImageryProvider({
    url: url, //"http://172.16.100.16:8055/geoserver/gwc/service/wmts",
    layer: 'uav_amap:ggdt',
    style: '',
    format: 'image/png',
    tileMatrixSetID: 'EPSG:3857',
  })

  const terrainLayer = new Cesium.CesiumTerrainProvider({
    url: 'http://172.16.100.12:8099/terrain/19cc337048dc11ebafd0f786c760ef9f',
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
      // pixelOffset: new Cesium.Cartesian2(0, -50), // default: (0, 0)
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
      // verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
      scale: current.imageScale, // default: 1.0
      // color: Cesium.Color.LIME, // default: WHITE
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
      property.setInterpolationOptions({
        interpolationDegree: 1,
        interpolationAlgorithm: Cesium.LinearApproximation,
      })

      // 原始方向数据
      const orientationProperty = new Cesium.VelocityOrientationProperty(
        property
      )
      // 预警雷达
      const newOrientationProperty = new Cesium.SampledProperty(
        Cesium.Quaternion
      )
      // 模型
      const modelOrientationProperty = new Cesium.SampledProperty(
        Cesium.Quaternion
      )
      res.path.forEach((i) => {
        const time = Cesium.JulianDate.fromDate(new Date(i.time))
        const orientation = orientationProperty.getValue(time)
        if (!orientation) return
        const o = Cesium.HeadingPitchRoll.fromQuaternion(orientation)
        // o.heading += Cesium.Math.PI_OVER_TWO
        // const matrix4 = Cesium.Matrix4.fro

        const q = Cesium.Quaternion.fromHeadingPitchRoll(o)
        newOrientationProperty.addSample(time, orientation)
        modelOrientationProperty.addSample(time, orientation)
        // modelOrientationProperty.addSample(time, q)
      })
      // 火控雷达数据
      const newWedgeOrientationProperty = new Cesium.SampledProperty(
        Cesium.Quaternion
      )
      res.path.forEach((i, index) => {
        const time = Cesium.JulianDate.fromDate(new Date(i.time))
        const orientation = orientationProperty.getValue(time)
        if (!orientation) return
        const o = Cesium.HeadingPitchRoll.fromQuaternion(orientation)
        if (index % 2) {
          o.heading += Cesium.Math.toRadians(10.0)
        } else {
          o.heading += Cesium.Math.toRadians(-10.0)
        }
        o.pitch += Cesium.Math.toRadians(90.0)

        const q = Cesium.Quaternion.fromHeadingPitchRoll(o)
        newWedgeOrientationProperty.addSample(time, q)
      })

      newOrientationProperty.setInterpolationOptions({
        interpolationDegree: 1,
        interpolationAlgorithm: Cesium.LinearApproximation,
      })
      modelOrientationProperty.setInterpolationOptions({
        interpolationDegree: 1,
        interpolationAlgorithm: Cesium.LinearApproximation,
      })
      newWedgeOrientationProperty.setInterpolationOptions({
        interpolationDegree: 1,
        interpolationAlgorithm: Cesium.LinearApproximation,
      })
      // 3D model
      entity.position = property
      entity.orientation = modelOrientationProperty

      // 航迹 暂时去掉
      // eslint-disable-next-line no-constant-condition
      if (!current.id.includes('Missile') && false) {
        entity.availability = new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromDate(new Date(res.path[0].time)),
            stop: Cesium.JulianDate.fromDate(
              new Date(res.path[res.path.length - 1].time)
            ),
          }),
        ])
        entity.path = {
          resolution: new Cesium.ConstantProperty(1),
          leadTime: new Cesium.ConstantProperty(0),
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            taperPower: 0.3,
            color: Cesium.Color.LIGHTBLUE.withAlpha(0.5),
          }),
          width: new Cesium.ConstantProperty(10),
        }
      }
      // 预警雷达
      if (!current.id.includes('Missile')) {
        viewer.entities.add({
          id: current.id + 'Scan',
          name: 'Wedge',
          position: property,
          orientation: newOrientationProperty,
          ellipsoid: {
            radii: new Cesium.Cartesian3(30000.0, 30000.0, 30000.0),
            innerRadii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
            minimumClock: Cesium.Math.toRadians(-10.0),
            maximumClock: Cesium.Math.toRadians(10.0),
            minimumCone: Cesium.Math.toRadians(80.0),
            maximumCone: Cesium.Math.toRadians(100.0),
            material: Cesium.Color.AQUA.withAlpha(0.3),
            outline: true,
          },
        })
      }

      // 雷达-预警机
      if (
        current.effectList?.[0]?.id.includes('Radar') &&
        current.effectList[0]
      ) {
        const materialData = current.effectList[0]
        // 圆柱
        viewer.entities.add({
          position: property,
          cylinder: {
            length: materialData.radarHeight,
            topRadius: materialData.bottomRadius,
            bottomRadius: materialData.bottomRadius,
            material: Cesium.Color.fromCssColorString(materialData.color),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(
              materialData.outlineColor
            ),
          },
        })

        let heading = 0
        viewer.entities.add({
          wall: {
            positions: new Cesium.CallbackProperty((time: any) => {
              const position = property.getValue(time)
              heading += 8
              const result = calcScanPoints(
                position,
                materialData.bottomRadius || 0,
                heading,
                materialData.radarHeight || 0
              )
              return Cesium.Cartesian3.fromDegreesArrayHeights(result)
            }, false),
            maximumHeights: [3000, 6000],
            minimumHeights: [3000, 0],
            material: Cesium.Color.fromCssColorString(
              materialData.scannerColor
            ),
          },
        })
        let heading2 = 120
        viewer.entities.add({
          wall: {
            positions: new Cesium.CallbackProperty((time: any) => {
              const position = property.getValue(time)
              heading2 += 8
              const result = calcScanPoints(
                position,
                materialData.bottomRadius ?? 0,
                heading2,
                materialData.radarHeight ?? 0
              )
              return Cesium.Cartesian3.fromDegreesArrayHeights(result)
            }, false),
            maximumHeights: [3000, 6000],
            minimumHeights: [3000, 0],
            material: Cesium.Color.fromCssColorString(
              materialData.scannerColor
            ),
          },
        })
        let heading3 = 240
        viewer.entities.add({
          wall: {
            positions: new Cesium.CallbackProperty((time: any) => {
              const position = property.getValue(time)
              heading3 += 8
              const result = calcScanPoints(
                position,
                materialData.bottomRadius ?? 0,
                heading3,
                materialData.radarHeight ?? 0
              )
              return Cesium.Cartesian3.fromDegreesArrayHeights(result)
            }, false),
            maximumHeights: [3000, 6000],
            minimumHeights: [3000, 0],
            material: Cesium.Color.fromCssColorString(
              materialData.scannerColor
            ),
          },
        })
      }
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

    const entity = viewer.entities.add({
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
    // Add a polyline tube
    viewer.entities.add({
      name: 'PolylineTrail',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          108.15890229003162, 33.73081694953842, 0, 109.097528, 34.1095, 0,
          108.949322, 34.130466, 0.0,
        ]),
        width: 2,
        material: new PolylineTrailLinkMaterialProperty(
          Cesium.Color.WHITE,
          1000
        ),
      },
    })
  }
}

// 第一人称
// export const firstCamera = (viewer: Cesium.Viewer, entityId) => {
//   viewer.scene.postUpdate.addEventListener((__, time) => {
//     entityList.forEach((entity, index) => {
//       const orientation = entity.orientation.getValue(time)
//       const headingPitchRoll = new Cesium.HeadingPitchRoll()
//       Cesium.HeadingPitchRoll.fromQuaternion(orientation, headingPitchRoll)
//       const position = entity.position.getValue(time)
//       const degrees = cartesianToDegrees(position)
//       entity.label.text = `${
//         entity.name
//       }\nlongitude:${degrees.longitude.toFixed(
//         4
//       )}\nlatitude:${degrees.latitude.toFixed(4)}`
//       if (index === 0) {
//         const transform = Cesium.Matrix4.fromRotationTranslation(
//           Cesium.Matrix3.fromQuaternion(orientation),
//           position
//         )
//         const comput = new Cesium.Cartesian3()
//         Cesium.Cartesian3.add(
//           position,
//           new Cesium.Cartesian3(0.0, 0, 0),
//           comput
//         )
//         const hpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(transform)
//         viewer.camera.setView({
//           destination: comput,
//           orientation: {
//             heading: hpr.heading + Cesium.Math.toRadians(90.0),
//             roll: hpr.roll,
//             pitch: hpr.pitch,
//           },
//         })
//       }
//     })
//   })
// }
