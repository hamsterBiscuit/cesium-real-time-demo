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
    let h = height * Math.sin((i * Math.PI) / 180.0)
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
  const rx = radius.Math.cos((heading * Math.PI) / 180.0)
  const ry = radius.Math.sin((heading * Math.PI) / 180.0)

  const cartographic = new Cesium.Cartographic.fromCartesian(position)

  const translation = Cesium.Cartesian3.fromElements(rx, ry, cartographic.height)
  const d = Cesium.Matrix4.multiplyByPoint(m, translation, new Cesium.Cartesian3)

  // const c = Cesium.Cartographic.fromCartesian(d)
}
