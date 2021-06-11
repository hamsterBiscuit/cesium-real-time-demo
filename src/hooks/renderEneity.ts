import * as Cesium from 'cesium'
import { calcScanPoints } from './radar'
import { EffectList } from './interface'
import { PolylineTrailLinkMaterialProperty } from '../material/trailLink'

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
  const currentEntity = viewer.entities.getById(currentId)
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
        // const velocityResult = new Cesium.Cartesian3()
        const velocity = Cesium.Cartesian3.subtract(
          currentPosition,
          destPosition as Cesium.Cartesian3,
          new Cesium.Cartesian3()
        )
        Cesium.Cartesian3.normalize(velocity, velocity)

        const rotationMatrix =
          Cesium.Transforms.rotationMatrixFromPositionVelocity(
            currentPosition,
            velocity
          )
        const rot90 = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90))
        Cesium.Matrix3.multiply(rotationMatrix, rot90, rotationMatrix)
        return Cesium.Quaternion.fromRotationMatrix(rotationMatrix)
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
      bottomRadius: 1000.0,
      material: Cesium.Color.RED.withAlpha(0.5),
    },
  })
}

// 预警机雷达扇片
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
          return undefined
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
      material: materialData.scannerColor
        ? Cesium.Color.fromCssColorString(materialData.scannerColor)
        : Cesium.Color.fromCssColorString('rgba(255,255,0,0.2)'),
    },
  })
}

// 预警机雷达
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
    outlineColor: materialData.outlineColor
      ? Cesium.Color.fromCssColorString(materialData.outlineColor)
      : Cesium.Color.fromCssColorString(materialData.color),
  } as any

  renderRadarScanner(viewer, entity, materialData, 0)
  renderRadarScanner(viewer, entity, materialData, 120)
  renderRadarScanner(viewer, entity, materialData, 240)
}

// 流动线
export function renderDynnamicLine(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  current: EffectList
): void {
  let destEntity = viewer.entities.getById(current.destID)
  function getPosition(time: any) {
    if (!destEntity) {
      destEntity = viewer.entities.getById(current.destID)
    }
    let currentPosition
    let destPosition
    if (entity?.position?.getValue) {
      currentPosition = entity.position.getValue(time)
    } else {
      currentPosition = entity.position
    }
    if (destEntity?.position?.getValue) {
      destPosition = destEntity.position.getValue(time)
    } else {
      destPosition = destEntity?.position
    }
    return { currentPosition, destPosition }
  }

  const currentEntity = viewer.entities.add({
    id: '' + entity.id + current.id,
    name: current.id,
    show: false,
    polyline: {
      positions: new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
        if (!currentEntity.show) {
          return Cesium.Cartesian3.fromDegreesArrayHeights(
            current.positions.flat()
          )
        }
        const { currentPosition, destPosition } = getPosition(time)
        if (currentPosition && destPosition) {
          const currentDegrees = Cesium.Cartographic.fromCartesian(
            currentPosition as Cesium.Cartesian3
          )
          const destDegrees = Cesium.Cartographic.fromCartesian(
            destPosition as Cesium.Cartesian3
          )
          return [currentPosition, destPosition]
        } else {
          return Cesium.Cartesian3.fromDegreesArrayHeights(
            current.positions.flat()
          )
        }
      }, false),
      width: 2,
      material: new PolylineTrailLinkMaterialProperty(Cesium.Color.WHITE, 1000),
    },
  })
}

export function fire(viewer: Cesium.Viewer): void {
  const staticPosition = Cesium.Cartesian3.fromDegrees(
    107.222932,
    33.394693,
    1327.797604
  )
  const entity44 = viewer.entities.add({
    position: staticPosition,
  })

  function computeModelMatrix(entity: Cesium.Entity) {
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      entity.position._value
    )
    console.log(modelMatrix)
    return modelMatrix
  }

  function computeEmitterModelMatrix() {
    const hpr = Cesium.HeadingPitchRoll.fromDegrees(0, 0, 0)
    const trs = new Cesium.TranslationRotationScale()
    trs.translation = Cesium.Cartesian3.fromElements(2.5, 4, 1)
    trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr)
    const result = Cesium.Matrix4.fromTranslationRotationScale(trs)
    return result
  }

  viewer.scene.primitives.add(
    new Cesium.ParticleSystem({
      image: 'img/smoke.png',
      startColor: Cesium.Color.RED.withAlpha(0.7),
      endColor: Cesium.Color.YELLOW.withAlpha(0.0),
      startScale: 0,
      endScale: 4,
      //设定粒子寿命可能持续时间的最小限值(以秒为单位)，在此限值之上将随机选择粒子的实际寿命。
      minimumSpeed: 1,
      maximumSpeed: 2,
      particleLife: 2.0,
      imageSize: new Cesium.Cartesian2(55, 55),
      // Particles per second.
      // emissionRate: 4,
      speed: 100.0,
      lifetime: 2.0,
      //cesium内置的发射器，圆形发射器，因此参数是一个半径值
      //还有锥形发射器，new Cesium.ConeEmitter(Cesium.Math.toRadians(45.0))
      //长方形发射器，new Cesium.BoxEmitter(new Cesium.Cartesian3(1.0, 1.0, 1.0))
      //半球发射器，new Cesium.SphereEmitter(0.5)
      emissionRate: 2,
      emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(1.0, 1.0, 1.0)), // new Cesium.CircleEmitter(0.1),
      //将粒子系统从模型转换为世界坐标的4x4变换矩阵
      modelMatrix: computeModelMatrix(entity44),
      //在粒子系统局部坐标系中变换粒子系统发射器的4x4变换矩阵
      emitterModelMatrix: computeEmitterModelMatrix(),
    })
  )
}
