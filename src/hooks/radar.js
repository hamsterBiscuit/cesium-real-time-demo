import * as Cesium from 'cesium'

// 根据两个点 开始角度、夹角度 求取立面的扇形
export function computeCirclularFlight(x1, y1, x2, y2, fx, angle, height = 0) {
  let positionArr = []
  positionArr.push(x1)
  positionArr.push(y1)
  positionArr.push(0)

  var radius = Cesium.Cartesian3.distance(
    Cesium.Cartesian3.fromDegrees(x1, y1),
    Cesium.Cartesian3.fromDegrees(x2, y2)
  )

  for (let i = fx; i <= fx + angle; i++) {
    // let h = radius * Math.sin((i * Math.PI) / 180.0)
    let h = height * Math.sin((i * 2 * Math.PI) / 180.0)
    let r = Math.cos((i * Math.PI) / 180.0)

    let x = (x2 - x1) * r + x1
    let y = (y2 - y1) * r + y1

    positionArr.push(x)
    positionArr.push(y)
    positionArr.push(h)
  }

  return positionArr
}

// 根据第一个点 偏移距离 角度 求取第二个点的坐标
export function calcPoints(x1, y1, radius, heading, height = 0) {
  var m = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(x1, y1)
  )

  var rx = radius * Math.cos((heading * Math.PI) / 180.0)
  var ry = radius * Math.sin((heading * Math.PI) / 180.0)

  var translation = Cesium.Cartesian3.fromElements(rx, ry, 0)

  var d = Cesium.Matrix4.multiplyByPoint(
    m,
    translation,
    new Cesium.Cartesian3()
  )

  var c = Cesium.Cartographic.fromCartesian(d)

  var x2 = Cesium.Math.toDegrees(c.longitude)
  var y2 = Cesium.Math.toDegrees(c.latitude)

  return computeCirclularFlight(x1, y1, x2, y2, 0, 90, height)
}

export function calcScanPoints(position, radius, heading, height) {
  const positionArr = []
  const m = Cesium.Transforms.eastNorthUpToFixedFrame(position)
  const rx = radius * Math.cos((heading * Math.PI) / 180.0)
  const ry = radius * Math.sin((heading * Math.PI) / 180.0)

  const cartographic = new Cesium.Cartographic.fromCartesian(position)
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

  const translation2 = Cesium.Cartesian3.fromElements(rx, ry, 0)
  const d3 = Cesium.Matrix4.multiplyByPoint(
    m,
    translation2,
    new Cesium.Cartesian3()
  )
  const c3 = Cesium.Cartographic.fromCartesian(d3)

  const x3 = Cesium.Math.toDegrees(c3.longitude)
  const y3 = Cesium.Math.toDegrees(c3.latitude)
  const h3 = Cesium.Math.toDegrees(c3.height)
  // positionArr.push(x3, y3, h3)
  return positionArr
}
