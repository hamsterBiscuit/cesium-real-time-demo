import * as Cesium from 'cesium'
import { calcScanPoints } from './radar'
import { EffectList } from './interface'

// 绘制火控雷达
export const renderAimEffect = (
  viewer: Cesium.Viewer,
  current: EffectList,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  position: any,
  currentId: string
): void => {
  let destEntity = viewer.entities.getById(current.destID)
  function getPosition(time: any) {
    if (!destEntity) {
      destEntity = viewer.entities.getById(current.destID)
    }
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
  // 画线 火控雷达
  viewer.entities.add({
    id: current.id + currentId,
    name: current.id,
    show: false,
    position: new Cesium.CallbackProperty((time: any) => {
      const { currentPosition, destPosition } = getPosition(time)
      if (destPosition && currentPosition) {
        return Cesium.Cartesian3.midpoint(
          destPosition as Cesium.Cartesian3,
          currentPosition,
          new Cesium.Cartesian3()
        )
      } else {
        return new Cesium.Cartesian3()
      }
    }, false),
    orientation: new Cesium.CallbackProperty((time: any) => {
      const { currentPosition, destPosition } = getPosition(time)
      if (destPosition && currentPosition) {
        const velocityResult = new Cesium.Cartesian3()
        const velocity = Cesium.Cartesian3.subtract(
          destPosition as Cesium.Cartesian3,
          currentPosition,
          velocityResult
        )
        const value = Cesium.Cartesian3.normalize(velocity, velocityResult)

        const rotationScratch =
          Cesium.Transforms.rotationMatrixFromPositionVelocity(
            currentPosition,
            value
          )
        const quaternion = Cesium.Quaternion.fromRotationMatrix(rotationScratch)
        const hpr = Cesium.HeadingPitchRoll.fromQuaternion(quaternion)
        hpr.pitch = hpr.pitch + Cesium.Math.toRadians(90)
        return Cesium.Quaternion.fromHeadingPitchRoll(hpr)
      } else {
        return new Cesium.Quaternion()
      }
    }, false),
    cylinder: {
      length: new Cesium.CallbackProperty((time: any) => {
        const { currentPosition, destPosition } = getPosition(time)
        if (destPosition && currentPosition) {
          return Cesium.Cartesian3.distance(
            destPosition as Cesium.Cartesian3,
            currentPosition
          )
        } else {
          return 0
        }
      }, false),
      topRadius: 0.0,
      bottomRadius: 3000.0,
      material: Cesium.Color.RED.withAlpha(0.5),
    },
  })
}

function renderRadarScanner(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  materialData: EffectList,
  heading: number
) {
  viewer.entities.add({
    wall: {
      positions: new Cesium.CallbackProperty((time: any) => {
        const position = entity.position?.getValue(time)
        if (!position) {
          return new Cesium.Cartesian3()
        }
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
      material: Cesium.Color.fromCssColorString(materialData.scannerColor),
    },
  })
}

export function renderEarlyWarningAircraftRadar(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  materialData: EffectList
): void {
  entity.cylinder = {
    length: materialData.radarHeight,
    topRadius: materialData.bottomRadius,
    bottomRadius: materialData.bottomRadius,
    material: Cesium.Color.fromCssColorString(materialData.color),
    outline: true,
    outlineColor: Cesium.Color.fromCssColorString(materialData.outlineColor),
  } as any

  renderRadarScanner(viewer, entity, materialData, 0)
  renderRadarScanner(viewer, entity, materialData, 120)
  renderRadarScanner(viewer, entity, materialData, 240)
}