import * as Cesium from 'cesium'

// 根据两个点 开始角度、夹角度 求取立面的扇形
export function computeCirclularFlight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fx: number,
  angle: number,
  height = 0
): number[] {
  const positionArr: number[] = []
  positionArr.push(x1)
  positionArr.push(y1)
  positionArr.push(0)

  // const radius = Cesium.Cartesian3.distance(
  //   Cesium.Cartesian3.fromDegrees(x1, y1),
  //   Cesium.Cartesian3.fromDegrees(x2, y2)
  // )

  for (let i = fx; i <= fx + angle; i++) {
    // let h = radius * Math.sin((i * Math.PI) / 180.0)
    const h = height * Math.sin((i * 2 * Math.PI) / 180.0)
    const r = Math.cos((i * Math.PI) / 180.0)

    const x = (x2 - x1) * r + x1
    const y = (y2 - y1) * r + y1

    positionArr.push(x)
    positionArr.push(y)
    positionArr.push(h)
  }

  return positionArr
}

// 根据第一个点 偏移距离 角度 求取第二个点的坐标
export function calcPoints(
  x1: number,
  y1: number,
  radius: number,
  heading: number,
  height = 0
): number[] {
  const m = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(x1, y1)
  )

  const rx = radius * Math.cos((heading * Math.PI) / 180.0)
  const ry = radius * Math.sin((heading * Math.PI) / 180.0)

  const translation = Cesium.Cartesian3.fromElements(rx, ry, 0)

  const d = Cesium.Matrix4.multiplyByPoint(
    m,
    translation,
    new Cesium.Cartesian3()
  )

  const c = Cesium.Cartographic.fromCartesian(d)

  const x2 = Cesium.Math.toDegrees(c.longitude)
  const y2 = Cesium.Math.toDegrees(c.latitude)

  return computeCirclularFlight(x1, y1, x2, y2, 0, 90, height)
}

export function calcScanPoints(
  position: Cesium.Cartesian3,
  radius: number,
  heading: number
): number[] {
  const positionArr = []
  const m = Cesium.Transforms.eastNorthUpToFixedFrame(position)
  const rx = radius * Math.cos((heading * Math.PI) / 180.0)
  const ry = radius * Math.sin((heading * Math.PI) / 180.0)

  const cartographic = Cesium.Cartographic.fromCartesian(position)
  const x1 = Cesium.Math.toDegrees(cartographic.longitude)
  const y1 = Cesium.Math.toDegrees(cartographic.latitude)
  const h1 = Cesium.Math.toDegrees(cartographic.height)
  positionArr.push(x1, y1, h1)

  const translation = Cesium.Cartesian3.fromElements(rx, ry, 0)
  const d2 = Cesium.Matrix4.multiplyByPoint(
    m,
    translation,
    new Cesium.Cartesian3()
  )
  const c2 = Cesium.Cartographic.fromCartesian(d2)

  const x2 = Cesium.Math.toDegrees(c2.longitude)
  const y2 = Cesium.Math.toDegrees(c2.latitude)
  const h2 = Cesium.Math.toDegrees(c2.height)
  positionArr.push(x2, y2, h2)

  return positionArr
}

export function createROIfromRotation(
  position: Cesium.Cartographic,
  rotation: Cesium.HeadingPitchRoll,
  length: number
): Cesium.Cartesian3 {
  // position: Cartographic - {latitude, longitude, altitude})
  // rotation: HeadingPitchRoll - {heading, pitch, roll}

  // Based on answer found here:
  // https://stackoverflow.com/questions/58021985/create-a-point-in-a-direction-in-cesiumjs

  const cartesianPosition =
    Cesium.Ellipsoid.WGS84.cartographicToCartesian(position)

  rotation.heading = rotation.heading - Cesium.Math.toRadians(90)
  const referenceFrame1 = Cesium.Quaternion.fromHeadingPitchRoll(rotation)
  // var referenceFrame1 = Cesium.Transforms.headingPitchRollQuaternion(
  //   cartesianPosition,
  //   rotation
  // )
  // const referenceFrame1 = rotation
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
