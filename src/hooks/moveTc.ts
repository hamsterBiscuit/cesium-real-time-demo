import * as Cesium from 'cesium'
import { EffectList } from './interface'

const effectMap = new Map()

function offsetToLongLat(start, offset) {
  var er = 6378137

  var lat = parseFloat(start[1])

  var lon = parseFloat(start[0])

  var dn = parseFloat(offset[1])

  var de = parseFloat(offset[0])

  const dLat = dn / er

  var pi = Math.PI

  var dLon = de / (er * Math.cos((pi * lat) / 180))

  return [lon + (dLon * 180) / pi, lat + (dLat * 180) / pi]
}

export function toggleEntities(key: string, isShow: boolean): void {
  const entities = effectMap.get(key)
  entities.forEach((item: Cesium.Entity) => {
    item.show = isShow
  })
}

export function moveTc(
  sourEntity: Cesium.Entity,
  tarEntity: Cesium.Entity,
  current: EffectList,
  viewer: Cesium.Viewer
): void {
  const key = current.id + sourEntity.id
  const entities: Cesium.Entity[] = []
  effectMap.set(key, entities)
  const colors = Cesium.Color.RED
  for (let k = 0; k < 36; k += 3) {
    Cesium.when(k).then((k: number) => {
      const entity = viewer.entities.add({
        show: false,
        polygon: {
          hierarchy: new Cesium.CallbackProperty((time, result) => {
            let position = tarEntity?.position?.getValue(time)
            let sourPos = sourEntity?.position?.getValue(time, result)
            if (tarEntity?.position?.getValue) {
              position = tarEntity?.position?.getValue(time)
            } else {
              position = tarEntity?.position
            }
            if (sourEntity?.position?.getValue) {
              sourPos = sourEntity?.position?.getValue(time)
            } else {
              sourPos = sourEntity?.position
            }
            if (!Cesium.defined(tarEntity)) {
              return new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights([0, 0, 0])
              )
            }
            if (!Cesium.defined(position)) {
              return new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights([0, 0, 0])
              )
            }
            if (!Cesium.defined(sourEntity)) {
              return new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights([0, 0, 0])
              )
            }
            if (!Cesium.defined(sourPos)) {
              return new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights([0, 0, 0])
              )
            }

            const cartographic =
              viewer.scene.globe.ellipsoid.cartesianToCartographic(position)
            const ecLat = Cesium.Math.toDegrees(cartographic.latitude)

            const ecLong = Cesium.Math.toDegrees(cartographic.longitude)
            const alt = cartographic.height
            const cartographic1 =
              viewer.scene.globe.ellipsoid.cartesianToCartographic(sourPos)
            const sourLon = Cesium.Math.toDegrees(cartographic1.longitude)
            const sourLat = Cesium.Math.toDegrees(cartographic1.latitude)
            const souralt = cartographic1.height

            const r = 1000 //半径
            //模拟光照效果的若干多边形
            const points = []
            for (let i = 0; i < 360; i += 30) {
              const coord = offsetToLongLat(
                [ecLong, ecLat],
                [
                  Math.cos((Math.PI * i) / 180) * r,
                  Math.sin((Math.PI * i) / 180) * r,
                ]
              )
              points.push(coord[0])
              points.push(coord[1])
              points.push(alt)
            }

            const array = [
              sourLon,
              sourLat,
              souralt,
              points[k],
              points[k + 1],
              points[k + 2],
            ]
            if (k + 3 == points.length) {
              array.push(points[0])
              array.push(points[1])
              array.push(points[2])
            } else {
              array.push(points[k + 3])
              array.push(points[k + 4])
              array.push(points[k + 5])
            }
            return new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArrayHeights(array)
            )
            // return new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights([
            //   107.86403621404294, 31.93440949179516, 256158.7686010595,
            //   107.81403621404294, 31.93440949179516, 256158.7686010595,
            //   107.84403621404294, 31.93440949179516, 256158.7686010595,
            // ]))
          }, false),
          perPositionHeight: true,
          outline: false,
          material: colors,
        },
      })
      entities.push(entity)
    })
  }
  // debugger
}
